import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error: "AUTH_REQUIRED" }, 401);
    }

    const { factorId, recoveryKey } = await req.json();
    if (typeof factorId !== "string" || !factorId.trim()) {
      return json({ ok: false, error: "FACTOR_ID_REQUIRED" }, 400);
    }
    if (typeof recoveryKey !== "string" || !recoveryKey.trim()) {
      return json({ ok: false, error: "RECOVERY_KEY_REQUIRED" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ ok: false, error: "SERVER_CONFIG_ERROR" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return json({ ok: false, error: "INVALID_SESSION" }, 401);
    }

    const { data: verificationRaw, error: verificationError } = await userClient.rpc(
      "jb_verify_owner_recovery_key",
      { p_recovery_key: recoveryKey.trim() },
    );

    if (verificationError) {
      return json({ ok: false, error: "RECOVERY_VERIFY_FAILED" }, 403);
    }

    const verification = Array.isArray(verificationRaw)
      ? verificationRaw[0]
      : verificationRaw;

    if (!verification?.success) {
      return json({
        ok: false,
        error: verification?.locked_until ? "RECOVERY_COOLDOWN" : "INVALID_RECOVERY_KEY",
        remaining_attempts: verification?.remaining_attempts ?? null,
        locked_until: verification?.locked_until ?? null,
      }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Explicitly revoke every active session first. We do not rely only on
    // MFA-factor deletion side effects for #118 session invalidation.
    const { error: signOutError } = await adminClient.auth.admin.signOut(
      token,
      "global",
    );

    if (signOutError) {
      return json({
        ok: false,
        error: "SESSIONS_REVOKE_FAILED",
        detail: signOutError.message,
      }, 500);
    }

    const { data: deleteData, error: deleteError } =
      await adminClient.auth.admin.mfa.deleteFactor({
        id: factorId.trim(),
        userId: user.id,
      });

    if (deleteError) {
      return json({
        ok: false,
        error: "MFA_DELETE_FAILED",
        detail: deleteError.message,
        sessions_revoked: true,
      }, 400);
    }

    return json({
      ok: true,
      factor_id: deleteData?.id ?? factorId.trim(),
      sessions_revoked: true,
    });
  } catch (error) {
    return json({
      ok: false,
      error: "UNEXPECTED_ERROR",
      detail: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
