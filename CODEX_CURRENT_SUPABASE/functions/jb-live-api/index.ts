import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Actor = {
  userId: string;
  email: string;
  role: string;
  aal: string;
  sessionId: string;
  reporterProfileId: string | null;
  reporterActive: boolean;
};

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function jwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1] ?? "";
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function textValue(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256hex(value: string) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return [...h].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function validUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? ""));
}

function safeError(error: unknown) {
  const code = String((error as { code?: unknown })?.code ?? "");
  if (code === "23505") return "DUPLICATE_OPERATION";
  return "LIVE_REQUEST_FAILED";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ ok: false, error: "SERVER_CONFIG_ERROR" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "AUTH_REQUIRED" }, 401);
  const token = authHeader.slice(7);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function actor(): Promise<Actor> {
    const { data, error } = await userClient.auth.getUser(token);
    if (error || !data?.user) throw new Error("INVALID_SESSION");

    const claims = jwtPayload(token);
    const sessionId = String(claims.session_id ?? "");
    const aal = String(claims.aal ?? "");
    if (!sessionId) throw new Error("INVALID_SESSION");

    const { data: rows, error: ctxError } = await service.rpc("jb_live_actor_context_internal", {
      p_user_id: data.user.id,
      p_session_id: sessionId,
    });
    if (ctxError) throw new Error("SECURITY_CHECK_UNAVAILABLE");
    const ctx = Array.isArray(rows) ? rows[0] : rows;
    if (!ctx?.session_active) throw new Error("INVALID_SESSION");
    if (!ctx?.app_role) throw new Error("ROLE_REQUIRED");

    return {
      userId: data.user.id,
      email: data.user.email ?? "",
      role: String(ctx.app_role),
      aal,
      sessionId,
      reporterProfileId: ctx.reporter_profile_id ? String(ctx.reporter_profile_id) : null,
      reporterActive: ctx.reporter_active !== false,
    };
  }

  async function ensureReporterProfile(a: Actor, userMeta: Record<string, unknown>) {
    if (a.reporterProfileId) return a.reporterProfileId;
    const label = textValue(userMeta.full_name ?? userMeta.name ?? a.email.split("@")[0] ?? "Reporter", 120) || "Reporter";
    const { data, error } = await service
      .from("reporters")
      .insert({ user_id: a.userId, name: label, active: true })
      .select("id")
      .single();
    if (!error && data?.id) return String(data.id);
    if (String(error?.code ?? "") === "23505") {
      const retry = await service.from("reporters").select("id,active").eq("user_id", a.userId).maybeSingle();
      if (retry.error || !retry.data?.id) throw new Error("REPORTER_PROFILE_ERROR");
      if (retry.data.active === false) throw new Error("REPORTER_DISABLED");
      return String(retry.data.id);
    }
    throw new Error("REPORTER_PROFILE_ERROR");
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const payload = (body?.payload && typeof body.payload === "object") ? body.payload as JsonRecord : {};
    const a = await actor();

    if (action === "context") {
      return json({ ok: true, role: a.role, aal: a.aal, reporter_active: a.reporterActive });
    }

    if (action === "reporter_submit_request") {
      if (a.role !== "reporter") return json({ ok: false, error: "REPORTER_REQUIRED" }, 403);
      if (!a.reporterActive) return json({ ok: false, error: "REPORTER_DISABLED" }, 403);

      const { data: userData } = await userClient.auth.getUser(token);
      await ensureReporterProfile(a, (userData?.user?.user_metadata ?? {}) as Record<string, unknown>);

      const headline = textValue(payload.headline, 240);
      const location = textValue(payload.location, 240);
      const description = textValue(payload.description, 2000);
      const expectedDuration = Number(payload.expected_duration_minutes ?? 0);
      const clientActionId = String(payload.client_action_id ?? "");

      if (!headline || !location || !description) return json({ ok: false, error: "REQUIRED_FIELDS_MISSING" }, 400);
      if (!Number.isInteger(expectedDuration) || expectedDuration < 1 || expectedDuration > 1440) {
        return json({ ok: false, error: "INVALID_DURATION" }, 400);
      }
      if (!validUuid(clientActionId)) return json({ ok: false, error: "INVALID_ACTION_ID" }, 400);
      if (payload.location_confirmed !== true) return json({ ok: false, error: "LOCATION_CONFIRMATION_REQUIRED" }, 400);

      const requestRow = {
        reporter_id: a.userId,
        headline,
        location,
        description,
        expected_duration_minutes: expectedDuration,
        client_action_id: clientActionId,
        request_status: "PENDING",
      };

      const created = await service.from("live_requests").insert(requestRow).select(
        "request_id,headline,location,description,expected_duration_minutes,request_status,state_version,requested_at"
      ).single();

      let request = created.data;
      if (created.error) {
        if (String(created.error.code ?? "") !== "23505") throw created.error;
        const existing = await service.from("live_requests").select(
          "request_id,headline,location,description,expected_duration_minutes,request_status,state_version,requested_at"
        ).eq("reporter_id", a.userId).eq("client_action_id", clientActionId).maybeSingle();
        if (existing.error || !existing.data) throw created.error;
        request = existing.data;
      } else if (request) {
        await service.from("audit_logs").insert({
          actor_user_id: a.userId,
          action: "live_request_submitted",
          record_type: "live_request",
          record_id: String(request.request_id),
          metadata: { expected_duration_minutes: expectedDuration },
        });
      }

      return json({ ok: true, request });
    }

    if (action === "reporter_my_requests") {
      if (a.role !== "reporter") return json({ ok: false, error: "REPORTER_REQUIRED" }, 403);
      if (!a.reporterActive) return json({ ok: false, error: "REPORTER_DISABLED" }, 403);

      const requests = await service.from("live_requests").select(
        "request_id,headline,location,description,expected_duration_minutes,request_status,state_version,requested_at,approved_at,rejected_at,rejection_reason,cancelled_at"
      ).eq("reporter_id", a.userId).order("requested_at", { ascending: false }).limit(50);
      if (requests.error) throw requests.error;

      const ids = (requests.data ?? []).map((x) => x.request_id);
      let sessionRows: Array<Record<string, unknown>> = [];
      if (ids.length) {
        const sessions = await service.from("live_sessions").select(
          "id,request_id,article_id,session_status,public_status,ready_at,started_at,interrupted_at,technical_end_at"
        ).in("request_id", ids);
        if (sessions.error) throw sessions.error;
        sessionRows = sessions.data ?? [];
      }
      const sessionsByRequest = new Map(sessionRows.map((s) => [String(s.request_id), s]));
      return json({ ok: true, requests: (requests.data ?? []).map((r) => ({ ...r, session: sessionsByRequest.get(String(r.request_id)) ?? null })) });
    }

    if (action === "reporter_cancel_request") {
      if (a.role !== "reporter") return json({ ok: false, error: "REPORTER_REQUIRED" }, 403);
      if (!a.reporterActive) return json({ ok: false, error: "REPORTER_DISABLED" }, 403);
      const requestId = String(payload.request_id ?? "");
      const expectedVersion = Number(payload.state_version ?? 0);
      if (!validUuid(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
        return json({ ok: false, error: "INVALID_REQUEST" }, 400);
      }

      const current = await service.from("live_requests").select("request_id,request_status,state_version")
        .eq("request_id", requestId).eq("reporter_id", a.userId).maybeSingle();
      if (current.error) throw current.error;
      if (!current.data) return json({ ok: false, error: "REQUEST_NOT_FOUND" }, 404);
      if (current.data.request_status !== "PENDING") return json({ ok: false, error: "REQUEST_NOT_PENDING" }, 409);

      const changed = await service.from("live_requests").update({
        request_status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        state_version: expectedVersion + 1,
      }).eq("request_id", requestId).eq("reporter_id", a.userId)
        .eq("request_status", "PENDING").eq("state_version", expectedVersion)
        .select("request_id,request_status,state_version,cancelled_at").maybeSingle();
      if (changed.error) throw changed.error;
      if (!changed.data) return json({ ok: false, error: "REQUEST_STATE_CHANGED" }, 409);

      await service.from("audit_logs").insert({
        actor_user_id: a.userId,
        action: "live_request_cancelled",
        record_type: "live_request",
        record_id: requestId,
        metadata: {},
      });
      return json({ ok: true, request: changed.data });
    }

    // Phase 3B advanced operations.
    if (action === "reporter_expected_end") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const sessionId=String(payload.session_id??""), expectedEnd=String(payload.expected_end_at??"");
      if(!validUuid(sessionId)||!expectedEnd) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_reporter_expected_end_internal",{p_actor:a.userId,p_session:sessionId,p_expected_end:expectedEnd});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_add_update") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const sessionId=String(payload.session_id??""), type=textValue(payload.type,20).toUpperCase();
      if(!validUuid(sessionId)) return json({ok:false,error:"INVALID_SESSION_ID"},400);
      const x=await service.rpc("jb_live_contribution_write_internal",{p_actor:a.userId,p_session:sessionId,p_type:type,p_text:payload.text??null,p_media:payload.media_reference??null});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_correct_update") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const id=String(payload.contribution_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(id)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_contribution_correct_internal",{p_actor:a.userId,p_contribution:id,p_text:payload.text??null,p_media:payload.media_reference??null,p_reason:reason});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_correct_live_metadata") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const sessionId=String(payload.session_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(sessionId)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_metadata_correct_internal",{
        p_actor:a.userId,
        p_session:sessionId,
        p_headline:payload.headline==null?null:textValue(payload.headline,300),
        p_location:payload.location==null?null:textValue(payload.location,300),
        p_reason:reason
      });
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_hide_update") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const id=String(payload.contribution_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(id)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_contribution_hide_internal",{p_actor:a.userId,p_contribution:id,p_reason:reason,p_permanent:false});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_final_report_save") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const sessionId=String(payload.session_id??""); if(!validUuid(sessionId)) return json({ok:false,error:"INVALID_SESSION_ID"},400);
      const x=await service.rpc("jb_live_final_report_save_v2_internal",{p_actor:a.userId,p_session:sessionId,p_headline:textValue(payload.headline,300),p_body:String(payload.body??""),p_location:payload.location??null,p_media:payload.media??[],p_verified_facts:payload.verified_facts??[],p_event_at:payload.event_at??null,p_byline:null});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_final_report_submit" || action === "reporter_final_report_publish") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const sessionId=String(payload.session_id??""); if(!validUuid(sessionId)) return json({ok:false,error:"INVALID_SESSION_ID"},400);
      const op=action.endsWith("_publish")?"PUBLISH":"SUBMIT";
      const x=await service.rpc("jb_live_final_report_transition_internal",{p_actor:a.userId,p_session:sessionId,p_action:op});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "reporter_final_report_correction_request") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ ok:false, error:"REPORTER_REQUIRED" },403);
      const sessionId=String(payload.session_id??""), requestText=textValue(payload.request_text,2000);
      if(!validUuid(sessionId)||!requestText) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_final_report_correction_request_internal",{p_actor:a.userId,p_session:sessionId,p_text:requestText});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_3b_control") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""), control=textValue(payload.control,80);
      if(!validUuid(sessionId)||!control) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_admin_controls_internal",{p_actor:a.userId,p_session:sessionId,p_action:control,p_value:payload.value==null?null:String(payload.value),p_reason:payload.reason==null?null:textValue(payload.reason,240)});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_correct_live_metadata") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(sessionId)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_metadata_correct_internal",{
        p_actor:a.userId,
        p_session:sessionId,
        p_headline:payload.headline==null?null:textValue(payload.headline,300),
        p_location:payload.location==null?null:textValue(payload.location,300),
        p_reason:reason
      });
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_replace_reporter") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""), reporterId=String(payload.reporter_user_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(sessionId)||!validUuid(reporterId)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_replace_reporter_internal",{p_actor:a.userId,p_session:sessionId,p_new_reporter:reporterId,p_reason:reason});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_force_stop") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(sessionId)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_advanced_end_internal",{p_actor:a.userId,p_session:sessionId,p_kind:"FORCE_STOP",p_reason:reason});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_final_report_save" || action === "admin_final_report_finalize" || action === "admin_final_report_publish") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""); if(!validUuid(sessionId)) return json({ok:false,error:"INVALID_SESSION_ID"},400);
      if(action.endsWith("_save")){
        const x=await service.rpc("jb_live_final_report_save_v2_internal",{p_actor:a.userId,p_session:sessionId,p_headline:textValue(payload.headline,300),p_body:String(payload.body??""),p_location:payload.location??null,p_media:payload.media??[],p_verified_facts:payload.verified_facts??[],p_event_at:payload.event_at??null,p_byline:payload.byline??null});
        if(x.error) throw x.error; return json({ok:true,result:x.data});
      }
      const op=action.endsWith("_publish")?"PUBLISH":"FINALIZE";
      const x=await service.rpc("jb_live_final_report_transition_internal",{p_actor:a.userId,p_session:sessionId,p_action:op});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_grant_final_report_publish") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""), reporterId=String(payload.reporter_user_id??"");
      if(!validUuid(sessionId)||!validUuid(reporterId)) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_grant_capability_internal",{p_actor_user_id:a.userId,p_session_id:sessionId,p_target_user_id:reporterId,p_capability:"FINAL_REPORT_PUBLISH",p_expires_at:null});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_correct_update" || action === "admin_delete_update") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const id=String(payload.contribution_id??""), reason=textValue(payload.reason,240);
      if(!validUuid(id)||!reason) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=action.endsWith("_delete_update")
        ? await service.rpc("jb_live_contribution_hide_internal",{p_actor:a.userId,p_contribution:id,p_reason:reason,p_permanent:true})
        : await service.rpc("jb_live_contribution_correct_internal",{p_actor:a.userId,p_contribution:id,p_text:payload.text??null,p_media:payload.media_reference??null,p_reason:reason});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_feed_register" || action === "admin_feed_confirm" || action === "admin_feed_switch") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""); if(!validUuid(sessionId)) return json({ok:false,error:"INVALID_SESSION_ID"},400);
      let x;
      if(action.endsWith("_register")){
        const controller=String(payload.controller_user_id??""); if(!validUuid(controller)) return json({ok:false,error:"INVALID_CONTROLLER"},400);
        x=await service.rpc("jb_live_register_feed_source_internal",{p_actor:a.userId,p_session:sessionId,p_type:textValue(payload.source_type,30),p_controller:controller,p_generation:payload.provider_generation_id??null});
      } else {
        const sourceId=String(payload.source_id??""); if(!validUuid(sourceId)) return json({ok:false,error:"INVALID_SOURCE"},400);
        x=action.endsWith("_confirm")
          ? await service.rpc("jb_live_confirm_feed_source_internal",{p_actor:a.userId,p_session:sessionId,p_source:sourceId})
          : await service.rpc("jb_live_switch_feed_internal",{p_actor:a.userId,p_session:sessionId,p_source:sourceId});
      }
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_3b_overview") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessions=await service.from("live_sessions").select("id,article_id,headline,assigned_reporter_id,session_status,public_status,is_priority,expected_end_at,public_reporter_name_visible,live_updates_public_visible,replay_public_visible,active_feed_source_id,advanced_end_kind,advanced_end_reason,advanced_ended_at").order("created_at",{ascending:false}).limit(100);
      if(sessions.error) throw sessions.error;
      const ids=(sessions.data??[]).map((x:any)=>x.id);
      const [members,sources,reports]=ids.length?await Promise.all([
        service.from("live_session_members").select("membership_id,session_id,user_id,status,grant_version,member_role,is_current_primary,replaced_at,replaced_by,replacement_membership_id").in("session_id",ids),
        service.from("live_feed_sources").select("source_id,session_id,source_type,controller_user_id,source_status,provider_confirmed_at,activated_at,deactivated_at").in("session_id",ids),
        service.from("live_final_reports").select("final_report_id,session_id,article_id,report_status,headline,submitted_at,finalized_at,published_at,state_version").in("session_id",ids)
      ]):[{data:[]},{data:[]},{data:[]}];
      return json({ok:true,sessions:sessions.data??[],members:members.data??[],sources:sources.data??[],final_reports:reports.data??[]});
    }

    if (action === "reporter_3b_session") {
      if (a.role !== "reporter" || !a.reporterActive) return json({ok:false,error:"REPORTER_REQUIRED"},403);
      const sessionId=String(payload.session_id??""); if(!validUuid(sessionId)) return json({ok:false,error:"INVALID_SESSION_ID"},400);
      const membership=await service.from("live_session_members").select("session_id,user_id,status,grant_version,member_role,is_current_primary").eq("session_id",sessionId).eq("user_id",a.userId).maybeSingle();
      if(membership.error||!membership.data) return json({ok:false,error:"SESSION_MEMBERSHIP_REQUIRED"},403);
      const [session,caps,report,updates,sources]=await Promise.all([
        service.from("live_sessions").select("id,article_id,headline,session_status,public_status,expected_end_at,public_reporter_name_visible,live_updates_public_visible,replay_public_visible,active_feed_source_id").eq("id",sessionId).single(),
        service.from("live_session_capabilities").select("capability,status,grant_version,expires_at").eq("session_id",sessionId).eq("user_id",a.userId),
        service.from("live_final_reports").select("final_report_id,report_status,headline,body,final_location,media,state_version,finalized_at,published_at").eq("session_id",sessionId).maybeSingle(),
        service.from("live_contributions").select("contribution_id,contribution_type,current_text,media_reference,public_visibility,created_at,updated_at").eq("session_id",sessionId).eq("reporter_user_id",a.userId).order("created_at",{ascending:false}).limit(100),
        service.from("live_feed_sources").select("source_id,source_type,source_status,provider_confirmed_at,activated_at").eq("session_id",sessionId).eq("controller_user_id",a.userId)
      ]);
      if(session.error) throw session.error;
      return json({ok:true,session:session.data,membership:membership.data,capabilities:caps.data??[],final_report:report.data??null,updates:updates.data??[],sources:sources.data??[]});
    }

    if (action === "admin_add_live_member") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);
      const sessionId=String(payload.session_id??""), userId=String(payload.user_id??""), memberRole=textValue(payload.member_role,30);
      if(!validUuid(sessionId)||!validUuid(userId)||!memberRole) return json({ok:false,error:"INVALID_REQUEST"},400);
      const x=await service.rpc("jb_live_add_member_internal",{p_actor:a.userId,p_session:sessionId,p_user:userId,p_member_role:memberRole});
      if(x.error) throw x.error; return json({ok:true,result:x.data});
    }

    if (action === "admin_encoder_overview") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const settings = await service.from("live_encoder_engine_settings").select(
        "active_connector_key,fallback_connector_key,auto_fallback_enabled,config_version,updated_at,updated_by"
      ).eq("singleton_id", true).maybeSingle();
      if (settings.error) throw settings.error;
      const connectors = await service.from("live_encoder_connectors").select(
        "connector_key,display_name,connector_kind,platform,operational_state,switch_enabled,launch_scheme,android_package,install_url,supports_rtmps,supports_auto_config,founder_note,updated_at"
      ).order("display_name", { ascending: true });
      if (connectors.error) throw connectors.error;
      const history = await service.from("live_encoder_switch_history").select(
        "switch_id,target_slot,old_connector_key,new_connector_key,reason,config_version,created_at"
      ).order("created_at", { ascending: false }).limit(12);
      if (history.error) throw history.error;
      return json({ ok: true, engine: settings.data ?? null, connectors: connectors.data ?? [], switch_history: history.data ?? [] });
    }

    if (action === "admin_encoder_switch") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const connectorKey = textValue(payload.connector_key, 64);
      const targetSlot = textValue(payload.target_slot ?? "ACTIVE", 16).toUpperCase();
      const reason = textValue(payload.reason, 240);
      if (!connectorKey || !reason || !["ACTIVE","FALLBACK"].includes(targetSlot)) return json({ ok:false, error:"INVALID_REQUEST" },400);
      const changed = await service.rpc("jb_live_encoder_switch_internal", {
        p_actor: a.userId, p_target_slot: targetSlot, p_connector_key: connectorKey, p_reason: reason
      });
      if (changed.error) {
        const m=String(changed.error.message ?? "");
        if(m.includes("NOT_SWITCHABLE")||m.includes("NOT_FOUND")||m.includes("FALLBACK_EQUALS_ACTIVE")) return json({ok:false,error:m.includes("FALLBACK_EQUALS_ACTIVE")?"ENCODER_FALLBACK_EQUALS_ACTIVE":"ENCODER_CONNECTOR_NOT_SWITCHABLE"},409);
        throw changed.error;
      }
      return json({ ok:true, result:changed.data });
    }

    if (action === "admin_encoder_connector_state") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const connectorKey=textValue(payload.connector_key,64), state=textValue(payload.state,20).toUpperCase(), reason=textValue(payload.reason,240);
      if(!connectorKey||!reason||!["READY","LIMITED","PILOT","DISABLED","RETIRED"].includes(state)) return json({ok:false,error:"INVALID_REQUEST"},400);
      const changed=await service.rpc("jb_live_encoder_connector_state_internal",{p_actor:a.userId,p_connector_key:connectorKey,p_state:state,p_reason:reason});
      if(changed.error) throw changed.error;
      return json({ok:true,result:changed.data});
    }

    if (action === "reporter_prepare_camera") {
      if (a.role !== "reporter") return json({ ok: false, error: "REPORTER_REQUIRED" }, 403);
      if (!a.reporterActive) return json({ ok: false, error: "REPORTER_DISABLED" }, 403);
      const sessionId = String(payload.session_id ?? "");
      if (!validUuid(sessionId)) return json({ ok: false, error: "INVALID_SESSION_ID" }, 400);
      const raw = b64url(crypto.getRandomValues(new Uint8Array(32)));
      const tokenHash = await sha256hex(raw);
      const created = await service.rpc("jb_live_create_handoff_internal", {
        p_user_id: a.userId,
        p_session_id: sessionId,
        p_token_hash: tokenHash,
        p_ttl_seconds: 90,
      });
      if (created.error || !created.data) {
        const m = String(created.error?.message ?? "");
        if (m.includes("NOT_CAMERA_ELIGIBLE") || m.includes("PROVIDER_NOT_READY")) return json({ ok: false, error: "LIVE_CAMERA_NOT_READY" }, 409);
        if (m.includes("PERMISSION") || m.includes("ASSIGNED") || m.includes("STALE")) return json({ ok: false, error: "LIVE_CAMERA_NOT_AUTHORIZED" }, 403);
        throw created.error ?? new Error("HANDOFF_CREATE_FAILED");
      }
      return json({
        ok: true,
        handoff: {
          handoff_url: supabaseUrl + "/functions/v1/jb-encoder-launch?t=" + encodeURIComponent(raw),
          expires_at: created.data.expires_at,
          session_id: created.data.session_id,
          generation_id: created.data.generation_id,
          connector_key: created.data.connector_key,
          connector_display_name: created.data.connector_display_name,
          connector_state: created.data.connector_state,
          connector_slot: created.data.connector_slot,
          connector_delivery_mode: created.data.connector_delivery_mode,
        },
      });
    }

    if (action === "reporter_end_live") {
      if (a.role !== "reporter") return json({ ok: false, error: "REPORTER_REQUIRED" }, 403);
      if (!a.reporterActive) return json({ ok: false, error: "REPORTER_DISABLED" }, 403);
      const sessionId = String(payload.session_id ?? "");
      if (!validUuid(sessionId)) return json({ ok: false, error: "INVALID_SESSION_ID" }, 400);
      const ended = await service.rpc("jb_live_request_end_internal", {
        p_actor_user_id: a.userId,
        p_session_id: sessionId,
      });
      if (ended.error || !ended.data) {
        const m = String(ended.error?.message ?? "");
        if (m.includes("ASSIGNED") || m.includes("PERMISSION") || m.includes("AUTHORIZED")) return json({ ok: false, error: "LIVE_END_NOT_AUTHORIZED" }, 403);
        if (m.includes("NOT_FOUND")) return json({ ok: false, error: "LIVE_SESSION_NOT_FOUND" }, 404);
        throw ended.error ?? new Error("LIVE_END_FAILED");
      }
      return json({ ok: true, end: ended.data });
    }

    if (action === "admin_pending") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const pending = await service.from("live_requests").select(
        "request_id,reporter_id,headline,location,description,expected_duration_minutes,request_status,state_version,requested_at"
      ).eq("request_status", "PENDING").order("requested_at", { ascending: true }).limit(100);
      if (pending.error) throw pending.error;
      const reporterIds = [...new Set((pending.data ?? []).map((x) => String(x.reporter_id)))];
      let profiles: Array<Record<string, unknown>> = [];
      if (reporterIds.length) {
        const p = await service.from("reporters").select("user_id,name,active").in("user_id", reporterIds);
        if (p.error) throw p.error;
        profiles = p.data ?? [];
      }
      const byUser = new Map(profiles.map((p) => [String(p.user_id), p]));
      return json({ ok: true, requests: (pending.data ?? []).map((r) => ({
        ...r,
        reporter_name: String(byUser.get(String(r.reporter_id))?.name ?? "Reporter"),
        reporter_active: byUser.get(String(r.reporter_id))?.active !== false,
      })) });
    }

    if (action === "admin_overview") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const sessions = await service.from("live_sessions").select(
        "id,request_id,article_id,assigned_reporter_id,headline,session_status,public_status,current_provider_generation,ready_at,started_at,interrupted_at,ended_at,technical_end_at,end_requested_at,end_request_source,created_at,state_version"
      ).not("request_id", "is", null).order("created_at", { ascending: false }).limit(100);
      if (sessions.error) throw sessions.error;
      const rows = sessions.data ?? [];
      const reporterIds = [...new Set(rows.map((x) => String(x.assigned_reporter_id ?? "")).filter(Boolean))];
      const sessionIds = rows.map((x) => String(x.id));
      const generationIds = rows.map((x) => String(x.current_provider_generation ?? "")).filter(Boolean);
      let profiles: Array<Record<string, unknown>> = [];
      let memberships: Array<Record<string, unknown>> = [];
      let generations: Array<Record<string, unknown>> = [];
      if (reporterIds.length) {
        const p = await service.from("reporters").select("user_id,name,active").in("user_id", reporterIds);
        if (p.error) throw p.error;
        profiles = p.data ?? [];
      }
      if (sessionIds.length) {
        const m = await service.from("live_session_members").select("session_id,user_id,status,grant_version,revoked_at,revocation_reason").in("session_id", sessionIds).eq("permission", "BROADCAST");
        if (m.error) throw m.error;
        memberships = m.data ?? [];
      }
      if (generationIds.length) {
        const g = await service.from("live_provider_generations").select(
          "generation_id,provider_state,credential_status,provider_broadcast_lifecycle,provider_stream_status,provider_health_status,provider_last_safe_error_code,generation_number,is_current"
        ).in("generation_id", generationIds);
        if (g.error) throw g.error;
        generations = g.data ?? [];
      }
      const byUser = new Map(profiles.map((p) => [String(p.user_id), p]));
      const bySession = new Map(memberships.map((m) => [String(m.session_id), m]));
      const byGeneration = new Map(generations.map((g) => [String(g.generation_id), g]));
      return json({ ok: true, sessions: rows.map((s) => ({
        ...s,
        reporter_name: String(byUser.get(String(s.assigned_reporter_id))?.name ?? "Reporter"),
        reporter_active: byUser.get(String(s.assigned_reporter_id))?.active !== false,
        membership: bySession.get(String(s.id)) ?? null,
        provider: byGeneration.get(String(s.current_provider_generation)) ?? null,
      })) });
    }

    if (action === "admin_approve_request") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const requestId = String(payload.request_id ?? "");
      const expectedVersion = Number(payload.state_version ?? 0);
      const clientActionId = String(payload.client_action_id ?? "");
      if (!validUuid(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1 || !validUuid(clientActionId)) {
        return json({ ok: false, error: "INVALID_REQUEST" }, 400);
      }
      const result = await service.rpc("jb_live_approve_request_internal", {
        p_owner_user_id: a.userId,
        p_request_id: requestId,
        p_expected_state_version: expectedVersion,
      });
      if (result.error) {
        const m = String(result.error.message ?? "");
        if (m.includes("REQUEST_NOT_FOUND")) return json({ ok: false, error: "REQUEST_NOT_FOUND" }, 404);
        if (m.includes("REQUEST_NOT_PENDING") || m.includes("REQUEST_STATE_CHANGED")) return json({ ok: false, error: "REQUEST_STATE_CHANGED" }, 409);
        if (m.includes("REPORTER_DISABLED")) return json({ ok: false, error: "REPORTER_DISABLED" }, 409);
        throw result.error;
      }
      await service.from("audit_logs").insert({
        actor_user_id: a.userId,
        action: "live_request_approval_action",
        record_type: "live_request",
        record_id: requestId,
        metadata: {
          client_action_id: clientActionId,
          state_version: expectedVersion,
          idempotent: Boolean((result.data as Record<string, unknown>)?.idempotent),
        },
      });
      return json({ ok: true, approval: result.data, client_action_id: clientActionId });
    }

    if (action === "admin_reject_request") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const requestId = String(payload.request_id ?? "");
      const expectedVersion = Number(payload.state_version ?? 0);
      const reason = textValue(payload.reason, 500);
      if (!validUuid(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1 || !reason) {
        return json({ ok: false, error: "INVALID_REQUEST" }, 400);
      }
      const result = await service.rpc("jb_live_reject_request_internal", {
        p_owner_user_id: a.userId,
        p_request_id: requestId,
        p_expected_state_version: expectedVersion,
        p_reason: reason,
      });
      if (result.error) {
        const m = String(result.error.message ?? "");
        if (m.includes("REQUEST_NOT_FOUND")) return json({ ok: false, error: "REQUEST_NOT_FOUND" }, 404);
        if (m.includes("REQUEST_NOT_PENDING") || m.includes("REQUEST_STATE_CHANGED")) return json({ ok: false, error: "REQUEST_STATE_CHANGED" }, 409);
        throw result.error;
      }
      return json({ ok: true, rejection: result.data });
    }

    if (action === "admin_end_live") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const sessionId = String(payload.session_id ?? "");
      if (!validUuid(sessionId)) return json({ ok: false, error: "INVALID_SESSION_ID" }, 400);
      const ended = await service.rpc("jb_live_request_end_internal", {
        p_actor_user_id: a.userId,
        p_session_id: sessionId,
      });
      if (ended.error || !ended.data) {
        const m = String(ended.error?.message ?? "");
        if (m.includes("NOT_FOUND")) return json({ ok: false, error: "LIVE_SESSION_NOT_FOUND" }, 404);
        throw ended.error ?? new Error("LIVE_END_FAILED");
      }
      return json({ ok: true, end: ended.data });
    }

    if (action === "admin_revoke_live_permission") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const sessionId = String(payload.session_id ?? "");
      const reason = textValue(payload.reason ?? "SUPER_ADMIN_REVOKE", 240) || "SUPER_ADMIN_REVOKE";
      if (!validUuid(sessionId)) return json({ ok: false, error: "INVALID_SESSION_ID" }, 400);

      // Capture the server-trusted current Reporter before revoking the 3A membership.
      // The legacy revoke RPC does not return reporter_user_id, so relying on its
      // response would silently skip the Phase 3B capability/source revocation.
      const target = await service.from("live_sessions")
        .select("assigned_reporter_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (target.error) throw target.error;
      const targetUserId = String(target.data?.assigned_reporter_id ?? "");
      if (!validUuid(targetUserId)) return json({ ok: false, error: "LIVE_SESSION_NOT_FOUND" }, 404);

      const revoked = await service.rpc("jb_live_revoke_permission_internal", {
        p_owner_user_id: a.userId,
        p_session_id: sessionId,
        p_reason: reason,
      });
      if (revoked.error || !revoked.data) {
        const m = String(revoked.error?.message ?? "");
        if (m.includes("NOT_FOUND")) return json({ ok: false, error: "LIVE_SESSION_NOT_FOUND" }, 404);
        throw revoked.error ?? new Error("LIVE_REVOKE_FAILED");
      }

      const capRevoked = await service.rpc("jb_live_revoke_capabilities_internal", {
        p_actor_user_id: a.userId,
        p_session_id: sessionId,
        p_target_user_id: targetUserId,
        p_reason: reason,
      });
      if (capRevoked.error) throw capRevoked.error;

      return json({ ok: true, revocation: revoked.data, capabilities: capRevoked.data });
    }

    if (action === "admin_suspend_reporter") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const reporterUserId = String(payload.reporter_user_id ?? "");
      const reason = textValue(payload.reason ?? "REPORTER_ACCOUNT_SUSPENDED", 240) || "REPORTER_ACCOUNT_SUSPENDED";
      if (!validUuid(reporterUserId)) return json({ ok: false, error: "INVALID_REPORTER_USER_ID" }, 400);
      const suspended = await service.rpc("jb_live_suspend_reporter_internal", {
        p_owner_user_id: a.userId,
        p_reporter_user_id: reporterUserId,
        p_reason: reason,
      });
      if (suspended.error || !suspended.data) {
        const m = String(suspended.error?.message ?? "");
        if (m.includes("REPORTER_ROLE_REQUIRED")) return json({ ok: false, error: "REPORTER_ROLE_REQUIRED" }, 409);
        throw suspended.error ?? new Error("REPORTER_SUSPEND_FAILED");
      }
      const capRevoked=await service.rpc("jb_live_revoke_reporter_capabilities_internal",{p_actor_user_id:a.userId,p_target_user_id:reporterUserId,p_reason:reason});
      if(capRevoked.error) throw capRevoked.error;
      return json({ ok: true, suspension: suspended.data, capabilities: capRevoked.data });
    }

    if (action === "admin_regrant_live_permission") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const sessionId = String(payload.session_id ?? "");
      if (!validUuid(sessionId)) return json({ ok: false, error: "INVALID_SESSION_ID" }, 400);
      const regrant = await service.rpc("jb_live_regrant_permission_internal", {
        p_owner_user_id: a.userId,
        p_session_id: sessionId,
      });
      if (regrant.error || !regrant.data) {
        const m = String(regrant.error?.message ?? "");
        if (m.includes("REPORTER_NOT_ACTIVE")) return json({ ok: false, error: "REPORTER_NOT_ACTIVE" }, 409);
        if (m.includes("NOT_REGRANTABLE")) return json({ ok: false, error: "LIVE_MEMBERSHIP_NOT_REGRANTABLE" }, 409);
        if (m.includes("NOT_FOUND")) return json({ ok: false, error: "LIVE_SESSION_NOT_FOUND" }, 404);
        throw regrant.error ?? new Error("LIVE_REGRANT_FAILED");
      }
      const capSync = await service.rpc("jb_live_sync_default_capabilities_internal", {
        p_owner_user_id: a.userId,
        p_session_id: sessionId,
      });
      if (capSync.error) throw capSync.error;
      return json({ ok: true, regrant: regrant.data, capabilities: capSync.data });
    }

    if (action === "notifications_list") {
      let notesQuery = service.from("live_notifications").select(
        "id,domain,notification_type,priority,title,safe_message,record_type,record_id,created_at,read_at,lifecycle_state,action_required,acknowledged_at,resolved_at,action_path,delivery_state,delivery_attempts,last_delivery_error_code,next_retry_at,reminder_count,last_reminded_at,due_at"
      ).eq("recipient_user_id", a.userId);
      const requestedState = typeof payload.lifecycle_state === "string" ? payload.lifecycle_state : "";
      const requestedDomain = typeof payload.domain === "string" ? payload.domain : "";
      if (requestedState) notesQuery = notesQuery.eq("lifecycle_state", requestedState);
      if (requestedDomain) notesQuery = notesQuery.eq("domain", requestedDomain);
      const notes = await notesQuery
        .order("action_required", { ascending: false })
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(50);
      if (notes.error) throw notes.error;
      return json({ ok: true, notifications: notes.data ?? [] });
    }

    if (action === "notification_mark_read") {
      const notificationId = Number(payload.notification_id ?? 0);
      if (!Number.isInteger(notificationId) || notificationId < 1) return json({ ok: false, error: "INVALID_NOTIFICATION_ID" }, 400);
      const marked = await service.rpc("jb_notification_mark_read_internal", {
        p_user_id: a.userId,
        p_notification_id: notificationId,
      });
      if (marked.error) throw marked.error;
      if (marked.data !== true) return json({ ok: false, error: "NOTIFICATION_NOT_FOUND" }, 404);
      return json({ ok: true });
    }

    if (action === "notification_acknowledge") {
      const notificationId = Number(payload.notification_id ?? 0);
      if (!Number.isInteger(notificationId) || notificationId < 1) return json({ ok: false, error: "INVALID_NOTIFICATION_ID" }, 400);
      const x = await service.rpc("jb_notification_acknowledge_internal", { p_user_id: a.userId, p_notification_id: notificationId });
      if (x.error) throw x.error;
      if (x.data !== true) return json({ ok: false, error: "NOTIFICATION_NOT_ACTIONABLE" }, 409);
      return json({ ok: true });
    }

    if (action === "notification_config_set") {
      if (a.role !== "owner") return json({ ok: false, error: "OWNER_REQUIRED" }, 403);
      const key = textValue(payload.config_key, 80);
      if (!key || typeof payload.enabled !== "boolean") return json({ ok: false, error: "INVALID_NOTIFICATION_CONFIG" }, 400);
      const x = await service.rpc("jb_notification_config_set_internal", { p_actor: a.userId, p_key: key, p_enabled: payload.enabled });
      if (x.error) return json({ ok: false, error: String(x.error.message || "NOTIFICATION_CONFIG_FAILED").slice(0,120) }, 409);
      return json({ ok: true });
    }

    if (action === "notification_resolve") {
      const notificationId = Number(payload.notification_id ?? 0);
      if (!Number.isInteger(notificationId) || notificationId < 1) return json({ ok: false, error: "INVALID_NOTIFICATION_ID" }, 400);
      const resolved = await service.rpc("jb_notification_resolve_internal", {
        p_user_id: a.userId,
        p_notification_id: notificationId,
      });
      if (resolved.error) throw resolved.error;
      if (resolved.data !== true) return json({ ok: false, error: "NOTIFICATION_NOT_FOUND" }, 404);
      return json({ ok: true });
    }

    if (action === "admin_break_glass_provider_stop") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const sessionId = String(payload.session_id ?? "");
      const reason = textValue(payload.reason ?? "AUTOMATED_PROVIDER_TERMINATION_FAILED", 240) || "AUTOMATED_PROVIDER_TERMINATION_FAILED";
      if (!validUuid(sessionId)) return json({ ok: false, error: "INVALID_SESSION_ID" }, 400);

      const session = await service.from("live_sessions")
        .select("id,current_provider_generation,public_status,session_status")
        .eq("id", sessionId).maybeSingle();
      if (session.error || !session.data?.current_provider_generation) return json({ ok: false, error: "SESSION_OR_GENERATION_NOT_FOUND" }, 404);
      const generationId = String(session.data.current_provider_generation);

      const failed = await service.from("live_operations")
        .select("operation_id,operation_type,operation_state,attempt_count,last_safe_error_code")
        .eq("session_id", sessionId).eq("generation_id", generationId)
        .in("operation_type", ["RETIRE_STREAM","COMPLETE_LIVE"])
        .eq("operation_state", "FAILED_NEEDS_ATTENTION")
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (failed.error || !failed.data) return json({ ok: false, error: "BREAK_GLASS_NOT_ALLOWED_AUTOMATION_NOT_FAILED" }, 409);

      await service.from("audit_logs").insert({
        actor_user_id: a.userId, action: "break_glass_provider_stop_requested",
        record_type: "live_session", record_id: sessionId,
        metadata: { reason, generation_id: generationId, failed_operation_id: failed.data.operation_id }
      });

      let providerResp: Response;
      try {
        providerResp = await fetch(supabaseUrl + "/functions/v1/jb-youtube-provider", {
          method: "POST",
          headers: { Authorization: "Bearer " + serviceRoleKey, apikey: serviceRoleKey, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "retire_stream", generation_id: generationId })
        });
      } catch {
        await service.from("audit_logs").insert({
          actor_user_id: a.userId, action: "break_glass_provider_stop_failed",
          record_type: "live_session", record_id: sessionId,
          metadata: { reason, generation_id: generationId, safe_error_code: "PROVIDER_UNREACHABLE" }
        });
        return json({ ok: false, error: "PROVIDER_UNREACHABLE" }, 503);
      }
      const providerData = await providerResp.json().catch(() => ({}));
      if (!providerResp.ok || providerData?.ok !== true) {
        const safeCode = textValue(providerData?.error ?? "PROVIDER_STOP_FAILED", 120) || "PROVIDER_STOP_FAILED";
        await service.from("audit_logs").insert({
          actor_user_id: a.userId, action: "break_glass_provider_stop_failed",
          record_type: "live_session", record_id: sessionId,
          metadata: { reason, generation_id: generationId, safe_error_code: safeCode }
        });
        return json({ ok: false, error: safeCode }, 502);
      }

      await service.from("audit_logs").insert({
        actor_user_id: a.userId, action: "break_glass_provider_stop_succeeded",
        record_type: "live_session", record_id: sessionId,
        metadata: { reason, generation_id: generationId, failed_operation_id: failed.data.operation_id }
      });
      return json({ ok: true, state: "PROVIDER_RETIRED", session_id: sessionId });
    }

    if (action === "admin_youtube_mark_compromised") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const contained = await service.rpc("jb_youtube_mark_compromised_internal", { p_owner_user_id: a.userId });
      if (contained.error || contained.data !== true) throw contained.error ?? new Error("TOKEN_COMPROMISE_CONTAINMENT_FAILED");
      return json({ ok: true, state: "REAUTH_REQUIRED", incident: "COMPROMISE_SUSPECTED" });
    }

    if (action === "youtube_status") {
      if (a.role !== "owner" || a.aal !== "aal2") return json({ ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
      const status = await service.from("youtube_integration").select(
        "provider,expected_channel_id,verified_channel_id,verified_channel_name,connection_state,control_auth_state,control_auth_degraded_at,admin_warning,credential_incident_state,credential_incident_at,granted_scopes,connected_at,last_verified_at,last_refresh_status,reauth_required_at,safe_error_code,reauth_in_progress,candidate_started_at,candidate_safe_error_code,updated_at"
      ).eq("provider", "youtube").maybeSingle();
      if (status.error) throw status.error;
      return json({ ok: true, youtube: status.data ?? { provider: "youtube", connection_state: "DISCONNECTED" } });
    }

    return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNEXPECTED_ERROR";
    if (["INVALID_SESSION"].includes(message)) return json({ ok: false, error: message }, 401);
    if (["ROLE_REQUIRED", "REPORTER_DISABLED"].includes(message)) return json({ ok: false, error: message }, 403);
    console.error("jb-live-api", safeError(error));
    return json({ ok: false, error: safeError(error) }, 500);
  }
});