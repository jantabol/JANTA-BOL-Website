import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

type JsonRecord=Record<string,unknown>;

function json(body:JsonRecord,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function jwtPayload(token:string):Record<string,unknown>{
  try{
    const part=token.split(".")[1]??"";
    const normalized=part.replace(/-/g,"+").replace(/_/g,"/");
    const padded=normalized.padEnd(Math.ceil(normalized.length/4)*4,"=");
    return JSON.parse(atob(padded));
  }catch{return {};}
}
function validUuid(v:unknown){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v??""));
}
function clean(v:unknown,max:number){
  return String(v??"").trim().slice(0,max);
}
function recentMfa(claims:Record<string,unknown>,maxAgeSeconds=600){
  if(String(claims.aal??"")!=="aal2")return false;
  const now=Math.floor(Date.now()/1000);
  const amr=Array.isArray(claims.amr)?claims.amr as Array<Record<string,unknown>>:[];
  const ts=amr
    .filter(x=>["totp","phone"].includes(String(x.method??""))&&/^[0-9]+$/.test(String(x.timestamp??"")))
    .map(x=>Number(x.timestamp)).filter(Number.isFinite).sort((a,b)=>b-a)[0];
  if(!ts)return false;
  const age=now-ts;
  return age>=-60&&age<=maxAgeSeconds;
}
function safeError(e:unknown){
  const m=String((e as {message?:unknown})?.message??"TEAM_REQUEST_FAILED");
  const known=[
    "OWNER_REQUIRED","OWNER_RECENT_MFA_REQUIRED","TEAM_ACCOUNT_NOT_FOUND",
    "TEAM_ACCOUNT_NOT_PENDING","TEAM_AUTH_USER_REQUIRED","TEAM_ACCOUNT_NOT_ACTIVE",
    "TEAM_ACCOUNT_NOT_SUSPENDED","TEAM_ACCOUNT_DEPARTED","TEAM_ACCOUNT_ALREADY_DEPARTED",
    "OWNER_ROLE_RESERVED","INVALID_TEAM_ROLE","REASON_REQUIRED","REPORTER_PROFILE_REQUIRED",
    "TEAM_SESSION_NOT_FOUND","TEAM_USER_ALREADY_EXISTS"
  ];
  return known.find(x=>m.includes(x))??"TEAM_REQUEST_FAILED";
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")??"";
  const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
  const serviceRoleKey=Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY")??"";
  if(!supabaseUrl||!anonKey||!serviceRoleKey)return json({ok:false,error:"SERVER_CONFIG_ERROR"},500);

  const authHeader=req.headers.get("Authorization")??"";
  if(!authHeader.startsWith("Bearer "))return json({ok:false,error:"AUTH_REQUIRED"},401);
  const token=authHeader.slice(7);

  const userClient=createClient(supabaseUrl,anonKey,{
    global:{headers:{Authorization:authHeader}},
    auth:{persistSession:false,autoRefreshToken:false}
  });
  const service=createClient(supabaseUrl,serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false}
  });

  try{
    const {data:userData,error:userError}=await userClient.auth.getUser(token);
    if(userError||!userData?.user)return json({ok:false,error:"INVALID_SESSION"},401);

    const claims=jwtPayload(token);
    const sessionId=String(claims.session_id??"");
    if(!validUuid(sessionId))return json({ok:false,error:"INVALID_SESSION"},401);

    const ctx=await service.rpc("jb_team_actor_context_internal",{
      p_user_id:userData.user.id,p_session_id:sessionId
    });
    if(ctx.error)return json({ok:false,error:"SECURITY_CHECK_UNAVAILABLE"},503);
    const context=Array.isArray(ctx.data)?ctx.data[0]:ctx.data;
    if(!context?.session_active)return json({ok:false,error:"INVALID_SESSION"},401);
    if(String(context?.app_role??"")!=="owner")return json({ok:false,error:"OWNER_REQUIRED"},403);
    if(String(claims.aal??"")!=="aal2")return json({ok:false,error:"OWNER_AAL2_REQUIRED"},403);

    const body=await req.json().catch(()=>({}));
    const action=String(body?.action??"");
    const payload=(body?.payload&&typeof body.payload==="object")?body.payload as JsonRecord:{};
    const mutating=new Set(["invite","activate","suspend","reactivate","change_role","set_public_name","depart","revoke_session"]);
    if(mutating.has(action)&&!recentMfa(claims,600)){
      return json({ok:false,error:"OWNER_RECENT_MFA_REQUIRED"},403);
    }

    if(action==="list"){
      const a=await service.from("team_accounts").select(
        "id,user_id,reporter_id,display_name,contact,invite_email,assigned_role,status,invited_at,activated_at,suspended_at,departed_at,updated_at"
      ).order("updated_at",{ascending:false});
      if(a.error)throw a.error;
      const accounts=a.data??[];
      const reporterIds=[...new Set(accounts.map(x=>String(x.reporter_id??"")).filter(Boolean))];
      let reporters:Array<Record<string,unknown>>=[];
      if(reporterIds.length){
        const r=await service.from("reporters").select(
          "id,active,live_permission,public_name_enabled"
        ).in("id",reporterIds);
        if(r.error)throw r.error;
        reporters=r.data??[];
      }
      const byId=new Map(reporters.map(r=>[String(r.id),r]));
      return json({ok:true,accounts:accounts.map(a=>{
        const r=byId.get(String(a.reporter_id??""))??{};
        return {
          team_account_id:a.id,user_id:a.user_id,reporter_id:a.reporter_id,
          display_name:a.display_name,contact:a.contact,invite_email:a.invite_email,
          assigned_role:a.assigned_role,status:a.status,
          public_name_enabled:Boolean(r.public_name_enabled),
          reporter_active:Boolean(r.active),live_permission:Boolean(r.live_permission),
          invited_at:a.invited_at,activated_at:a.activated_at,suspended_at:a.suspended_at,
          departed_at:a.departed_at,updated_at:a.updated_at
        };
      })});
    }

    if(action==="history"){
      const id=String(payload.team_account_id??"");
      if(!validUuid(id))return json({ok:false,error:"INVALID_TEAM_ACCOUNT_ID"},400);
      const h=await service.from("team_account_history").select(
        "id,action,old_status,new_status,old_role,new_role,reason,metadata,created_at"
      ).eq("team_account_id",id).order("created_at",{ascending:false}).order("id",{ascending:false});
      if(h.error)throw h.error;
      return json({ok:true,history:(h.data??[]).map(x=>({
        history_id:x.id,action:x.action,old_status:x.old_status,new_status:x.new_status,
        old_role:x.old_role,new_role:x.new_role,reason:x.reason,metadata:x.metadata,created_at:x.created_at
      }))});
    }

    if(action==="sessions"){
      const id=String(payload.team_account_id??"");
      if(!validUuid(id))return json({ok:false,error:"INVALID_TEAM_ACCOUNT_ID"},400);
      const s=await service.rpc("jb_team_list_sessions_internal",{
        p_owner_user_id:userData.user.id,p_team_account_id:id
      });
      if(s.error)throw s.error;
      return json({ok:true,sessions:s.data??[]});
    }

    if(action==="invite"){
      const displayName=clean(payload.display_name,120);
      const email=clean(payload.email,320).toLowerCase();
      const contact=clean(payload.contact,240);
      const role=clean(payload.role,20).toLowerCase();
      if(!displayName)return json({ok:false,error:"DISPLAY_NAME_REQUIRED"},400);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({ok:false,error:"VALID_EMAIL_REQUIRED"},400);
      if(!["reporter","editor","admin"].includes(role))return json({ok:false,error:"INVALID_TEAM_ROLE"},400);

      const invited=await service.auth.admin.inviteUserByEmail(email);
      if(invited.error||!invited.data?.user?.id){
        const m=String(invited.error?.message??"").toLowerCase();
        if(m.includes("already")||m.includes("registered"))return json({ok:false,error:"AUTH_USER_ALREADY_EXISTS"},409);
        return json({ok:false,error:"INVITE_PROVIDER_FAILED"},502);
      }
      const invitedUserId=String(invited.data.user.id);
      try{
        const created=await service.rpc("jb_team_create_pending_internal",{
          p_owner_user_id:userData.user.id,p_user_id:invitedUserId,
          p_display_name:displayName,p_contact:contact||null,p_role:role,p_invite_email:email
        });
        if(created.error)throw created.error;
        return json({ok:true,account:created.data,invite_status:"SENT"});
      }catch(e){
        try{await service.auth.admin.deleteUser(invitedUserId);}catch{}
        throw e;
      }
    }

    const id=String(payload.team_account_id??"");
    if(!validUuid(id))return json({ok:false,error:"INVALID_TEAM_ACCOUNT_ID"},400);

    if(action==="activate"){
      const x=await service.rpc("jb_team_activate_internal",{p_owner_user_id:userData.user.id,p_team_account_id:id});
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }
    if(action==="suspend"){
      const reason=clean(payload.reason,500);
      if(!reason)return json({ok:false,error:"REASON_REQUIRED"},400);
      const x=await service.rpc("jb_team_suspend_internal",{p_owner_user_id:userData.user.id,p_team_account_id:id,p_reason:reason});
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }
    if(action==="reactivate"){
      const x=await service.rpc("jb_team_reactivate_internal",{p_owner_user_id:userData.user.id,p_team_account_id:id});
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }
    if(action==="change_role"){
      const role=clean(payload.role,20).toLowerCase();
      if(!["reporter","editor","admin"].includes(role))return json({ok:false,error:"INVALID_TEAM_ROLE"},400);
      const reason=clean(payload.reason,500)||"ROLE_CHANGED";
      const x=await service.rpc("jb_team_change_role_internal",{
        p_owner_user_id:userData.user.id,p_team_account_id:id,p_new_role:role,p_reason:reason
      });
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }
    if(action==="set_public_name"){
      const x=await service.rpc("jb_team_set_public_name_internal",{
        p_owner_user_id:userData.user.id,p_team_account_id:id,p_enabled:payload.enabled===true
      });
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }
    if(action==="depart"){
      const reason=clean(payload.reason,500);
      if(!reason)return json({ok:false,error:"REASON_REQUIRED"},400);
      const x=await service.rpc("jb_team_depart_internal",{p_owner_user_id:userData.user.id,p_team_account_id:id,p_reason:reason});
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }
    if(action==="revoke_session"){
      const targetSession=String(payload.session_id??"");
      if(!validUuid(targetSession))return json({ok:false,error:"INVALID_SESSION_ID"},400);
      const reason=clean(payload.reason,500)||"LOST_DEVICE";
      const x=await service.rpc("jb_team_revoke_session_internal",{
        p_owner_user_id:userData.user.id,p_team_account_id:id,p_session_id:targetSession,p_reason:reason
      });
      if(x.error)throw x.error; return json({ok:true,result:x.data});
    }

    return json({ok:false,error:"UNKNOWN_ACTION"},400);
  }catch(e){
    const code=safeError(e);
    console.error("jb-team-api",code);
    return json({ok:false,error:code},code==="TEAM_REQUEST_FAILED"?500:409);
  }
});