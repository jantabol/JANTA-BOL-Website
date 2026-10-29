// Deno Edge supplies its runtime APIs natively; avoid an optional JSR bundle dependency.
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * P4-T079: Owner-authorized health verification of the ALREADY CONNECTED
 * JANTA BOL YouTube OAuth credential. Does NOT create/end a LIVE stream,
 * upload a video, change an article, or return any Google token.
 *
 * Deploy as NEW additive function, not a replacement for existing Live API.
 * Zero privilege from the supplied request body. Only Owner + fresh AAL2 +
 * server-verified active session may trigger Google credential refresh.
 */
const allowedOrigins = new Set(["https://jantabol.in", "https://www.jantabol.in"]);
function reply(req: Request, payload: Record<string, unknown>, code = 200) {
  const origin = req.headers.get("origin") ?? "";
  const allow = allowedOrigins.has(origin) ? origin : "";
  return new Response(JSON.stringify(payload), {
    status: code,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin",
      ...(allow ? { "Access-Control-Allow-Origin": allow } : {}),
      "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
function jwtPayload(token: string): Record<string, unknown> {
  try {
    const part = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
  } catch { return {}; }
}
function b64bytes(v: string): Uint8Array {
  return Uint8Array.from(atob(v), (ch) => ch.charCodeAt(0));
}
function bytesToB64(v: Uint8Array): string {
  let str = ""; for (const n of v) str += String.fromCharCode(n);
  return btoa(str);
}
async function decryptRefresh(ciphertext: string, iv: string, secretB64: string) {
  const raw = b64bytes(secretB64);
  if (raw.length !== 32) throw new Error("ENC_KEY_INVALID");
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64bytes(iv) }, key, b64bytes(ciphertext));
  return new TextDecoder().decode(decrypted);
}
async function encryptRefresh(plain: string, secretB64: string) {
  const raw = b64bytes(secretB64);
  if (raw.length !== 32) throw new Error("ENC_KEY_INVALID");
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  return { ciphertext: bytesToB64(ciphertext), iv_b64: bytesToB64(iv) };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return reply(req, { ok: false, error: "ORIGIN_NOT_ALLOWED" }, 403);
  if (req.method === "OPTIONS") return reply(req, { ok: true });
  if (req.method !== "POST") return reply(req, { ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).length !== 1 || input.action !== "refresh_verify") {
    return reply(req, { ok: false, error: "ACTION_NOT_ALLOWED" }, 400);
  }
  const deployment = (Deno.env.get("JB_DEPLOYMENT_ENV") ?? "").toLowerCase();
  const credentialEnv = (Deno.env.get("JB_GOOGLE_CREDENTIAL_ENV") ?? "").toLowerCase();
  if (deployment !== "production" || credentialEnv !== "production") {
    return reply(req, { ok: false, error: "OAUTH_ENVIRONMENT_MISMATCH" }, 503);
  }
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const googleId = Deno.env.get("JB_GOOGLE_CLIENT_ID") ?? "";
  const googleSecret = Deno.env.get("JB_GOOGLE_CLIENT_SECRET") ?? "";
  const tokenEncKey = Deno.env.get("JB_OAUTH_TOKEN_ENC_KEY_B64") ?? "";
  const expected = Deno.env.get("JB_YOUTUBE_EXPECTED_CHANNEL_ID") ?? "";
  if (!url || !publicKey || !serviceKey || !googleId || !googleSecret || !expected || !tokenEncKey) {
    return reply(req, { ok: false, error: "YOUTUBE_SERVER_CONFIG_REQUIRED" }, 503);
  }
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return reply(req, { ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
  const jwt = auth.slice(7);
  const userClient = createClient(url, publicKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authenticated = await userClient.auth.getUser(jwt);
  if (authenticated.error || !authenticated.data.user) {
    return reply(req, { ok: false, error: "INVALID_FOUNDER_SESSION" }, 401);
  }
  const claims = jwtPayload(jwt);
  const sid = String(claims.session_id ?? "");
  if (!sid || claims.aal !== "aal2") return reply(req, { ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const role = await service.rpc("jb_live_actor_context_internal", {
    p_user_id: authenticated.data.user.id,
    p_session_id: sid,
  });
  const owner = Array.isArray(role.data) ? role.data[0] : role.data;
  if (role.error || owner?.session_active !== true || owner?.app_role !== "owner") {
    return reply(req, { ok: false, error: "OWNER_AAL2_REQUIRED" }, 403);
  }

  const stateResult = await service.from("youtube_integration")
    .select("connection_state,control_auth_state,credential_incident_state,expected_channel_id,verified_channel_id,verified_channel_name,granted_scopes,last_verified_at,last_refresh_status")
    .eq("provider", "youtube").maybeSingle();
  const state = stateResult.data;
  if (stateResult.error || !state || state.connection_state !== "CONNECTED" ||
      state.control_auth_state !== "OK" || state.credential_incident_state !== "CLEAR" ||
      state.expected_channel_id !== expected || state.verified_channel_id !== expected ||
      !Array.isArray(state.granted_scopes) ||
      !state.granted_scopes.includes("https://www.googleapis.com/auth/youtube.force-ssl")) {
    return reply(req, { ok: false, error: "YOUTUBE_CONNECTION_GUARD_FAILED" }, 409);
  }
  // No request can supply another channel id, credential or generation id.
  const encrypted = await service.rpc("jb_youtube_active_secret_internal");
  const secret = Array.isArray(encrypted.data) ? encrypted.data[0] : encrypted.data;
  if (encrypted.error || !secret?.refresh_token_ciphertext || !secret?.iv_b64) {
    return reply(req, { ok: false, error: "YOUTUBE_ACTIVE_CREDENTIAL_MISSING" }, 503);
  }
  let refresh: string;
  try {
    refresh = await decryptRefresh(String(secret.refresh_token_ciphertext), String(secret.iv_b64), tokenEncKey);
  } catch {
    return reply(req, { ok: false, error: "YOUTUBE_SECRET_DECRYPT_FAILED" }, 503);
  }
  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleId, client_secret: googleSecret, refresh_token: refresh, grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(12000),
    });
  } catch { return reply(req, { ok: false, error: "GOOGLE_REFRESH_NETWORK_UNKNOWN" }, 503); }
  const google = await response.json().catch(() => ({}));
  if (!response.ok || typeof google?.access_token !== "string" || !google.access_token) {
    // Failed probe leaves the existing LIVE connection and stored credential
    // unchanged. Do not accidentally revoke an active broadcast or rotate keys.
    const safe = google?.error === "invalid_grant" ? "GOOGLE_REAUTH_REQUIRED" : "GOOGLE_REFRESH_FAILED";
    return reply(req, { ok: false, error: safe }, 503);
  }

  let channelRes: Response;
  try {
    channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
      method: "GET",
      headers: { Authorization: `Bearer ${google.access_token}` },
      signal: AbortSignal.timeout(12000),
    });
  } catch { return reply(req, { ok: false, error: "GOOGLE_CHANNEL_NETWORK_UNKNOWN" }, 503); }
  const channels = await channelRes.json().catch(() => ({}));
  if (!channelRes.ok) return reply(req, { ok: false, error: "GOOGLE_CHANNEL_VERIFY_FAILED" }, 503);
  const id = String(channels?.items?.[0]?.id ?? "");
  if (!id || id !== expected) return reply(req, { ok: false, error: "WRONG_YOUTUBE_CHANNEL" }, 409);

  // Google may rotate the refresh token: store only encrypted server-side.
  if (typeof google.refresh_token === "string" && google.refresh_token) {
    let sealed;
    try { sealed = await encryptRefresh(google.refresh_token, tokenEncKey); }
    catch { return reply(req, { ok: false, error: "YOUTUBE_REFRESH_ROTATION_FAILED" }, 503); }
    const activated = await service.rpc("jb_youtube_activate_secret_internal", {
      p_ciphertext: sealed.ciphertext, p_iv_b64: sealed.iv_b64, p_key_version: 1,
    });
    if (activated.error || !activated.data) {
      return reply(req, { ok: false, error: "YOUTUBE_REFRESH_ROTATION_FAILED" }, 503);
    }
  }
  const checkedAt = new Date().toISOString();
  const updated = await service.from("youtube_integration")
    .update({
      last_refresh_status: "OK",
      last_verified_at: checkedAt,
      safe_error_code: null,
      updated_at: checkedAt,
    })
    .eq("provider", "youtube").eq("verified_channel_id", expected)
    .eq("connection_state", "CONNECTED").select("provider,connection_state,last_verified_at,last_refresh_status")
    .maybeSingle();
  if (updated.error || !updated.data || updated.data.last_refresh_status !== "OK") {
    return reply(req, { ok: false, error: "YOUTUBE_REFRESH_STATE_WRITE_FAILED" }, 503);
  }
  const audit = await service.from("audit_logs").insert({
    actor_user_id: authenticated.data.user.id,
    action: "youtube_oauth_refresh_verified",
    record_type: "youtube_integration",
    record_id: "youtube",
    metadata: { provider: "youtube", channel_match: true, health_scope: "refresh_and_channels_mine" },
  });
  if (audit.error) return reply(req, { ok: false, error: "YOUTUBE_REFRESH_AUDIT_FAILED" }, 503);
  return reply(req, {
    ok: true,
    status: "YOUTUBE_REFRESH_VERIFIED",
    connection_state: updated.data.connection_state,
    channel_match: true,
    last_refresh_status: "OK",
    checked_at: checkedAt,
    note: "Refresh and Google channels.mine verified; no stream/video/article was changed.",
  });
});
