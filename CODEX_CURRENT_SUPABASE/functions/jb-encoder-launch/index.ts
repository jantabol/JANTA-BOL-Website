import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const baseHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function textResponse(message: string, status = 400) {
  return new Response(message, {
    status,
    headers: { ...baseHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function sha256hex(v: string) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)));
  return [...h].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function isAndroidIntentCapable(req: Request) {
  const ua = String(req.headers.get("user-agent") ?? "").toLowerCase();
  // Android WebView commonly renders an unsupported intent URL, including its
  // credential-bearing query, when no matching encoder handler is installed.
  // Never issue the provider ingest redirect from a WebView.
  return ua.includes("android") && !ua.includes("; wv)") && !ua.includes(" version/4.0 chrome/");
}

function safeLaunchUrl(url: string, launchScheme: string) {
  const u = String(url || "").trim();
  if (!u || u.length > 12000) return false;
  if (u.startsWith("intent://")) return true;
  const scheme = String(launchScheme || "").trim().toLowerCase();
  return !!scheme && u.toLowerCase().startsWith(scheme + "://");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") return textResponse("Invalid request.", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) return textResponse("Camera service abhi available nahi hai.", 500);

  const u = new URL(req.url);
  const token = String(u.searchParams.get("t") ?? "");
  if (token.length < 32) return textResponse("Camera link invalid hai. Reporter screen se fresh Live Shuru Karein dabayein.", 400);

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hash = await sha256hex(token);
  const consumed = await service.rpc("jb_live_consume_handoff_internal", { p_token_hash: hash });
  if (consumed.error || !consumed.data) {
    const m = String(consumed.error?.message ?? "HANDOFF_INVALID");
    if (m.includes("EXPIRED")) return textResponse("Camera link expire ho gaya. Reporter screen se dobara Live Shuru Karein dabayein.", 410);
    if (m.includes("USED")) return textResponse("Camera link use ho chuka hai. Reporter screen se dobara Live Shuru Karein dabayein.", 410);
    if (m.includes("ENCODER_CONNECTOR")) return textResponse("Live camera app abhi available nahi hai. Admin se streaming app switch karwayein.", 409);
    return textResponse("Camera permission ab valid nahi hai. Reporter screen se fresh request karein.", 403);
  }

  const c = consumed.data as Record<string, unknown>;
  const generationId = String(c.generation_id ?? "");
  const sessionId = String(c.session_id ?? "");
  const connectorKey = String(c.connector_key ?? "");
  const connectorKind = String(c.connector_kind ?? "");
  const launchScheme = String(c.launch_scheme ?? "");
  const androidPackage = String(c.android_package ?? "");
  const installUrl = String(c.install_url ?? "");
  const handlerSlug = String(c.handler_slug ?? "");

  if (!generationId || !sessionId || !connectorKey) return textResponse("Live setup abhi taiyar nahi hai.", 409);

  let p: Response;
  try {
    p = await fetch(supabaseUrl + "/functions/v1/jb-youtube-provider", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + serviceRoleKey,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "get_encoder_ingest", generation_id: generationId }),
    });
  } catch {
    return textResponse("Live server se connection nahi hua. Dobara koshish karein.", 503);
  }

  const pd = await p.json().catch(() => ({}));
  if (!p.ok || pd?.ok !== true) return textResponse("Camera setup abhi taiyar nahi hai. Thodi der baad dobara koshish karein.", 409);

  const addr = String(pd?.rtmps_address ?? "").trim().replace(/\/+$/, "");
  const streamName = String(pd?.stream_name ?? "").trim().replace(/^\/+/, "");
  if (!addr.startsWith("rtmps://") || !streamName) return textResponse("Secure Live setup available nahi hai.", 409);
  const ingestUrl = `${addr}/${streamName}`;

  let launchUrl = "";

  if (connectorKind === "BUILTIN_LARIX_GROVE") {
    const q = new URLSearchParams();
    q.append("conn[][url]", ingestUrl);
    q.append("conn[][name]", "JANTA BOL Live");
    q.append("conn[][overwrite]", "on");
    q.append("conn[][active]", "on");
    q.append("conn[][mode]", "av");
    q.append("enc[vid][res]", "1280x720");
    q.append("enc[vid][fps]", "30");
    q.append("enc[aud][channels]", "2");

    const fallback = encodeURIComponent(installUrl || "https://play.google.com/store/apps/details?id=com.wmspanel.larix_broadcaster");
    launchUrl =
      "intent://set/v1?" + q.toString() +
      "#Intent;scheme=" + encodeURIComponent(launchScheme || "larix") +
      ";package=" + encodeURIComponent(androidPackage || "com.wmspanel.larix_broadcaster") +
      ";S.browser_fallback_url=" + fallback + ";end";
  } else if (connectorKind === "EDGE_HOOK") {
    if (!/^jb-encoder-connector-[a-z0-9-]{2,80}$/.test(handlerSlug)) {
      return textResponse("Streaming app connector invalid hai.", 500);
    }
    let hookResp: Response;
    try {
      hookResp = await fetch(supabaseUrl + "/functions/v1/" + handlerSlug, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + serviceRoleKey,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "build_launch",
          connector_key: connectorKey,
          session_id: sessionId,
          generation_id: generationId,
          profile_name: "JANTA BOL Live",
          rtmps_address: addr,
          stream_name: streamName,
          ingest_url: ingestUrl,
        }),
      });
    } catch {
      return textResponse("Streaming app connector se connection nahi hua.", 503);
    }
    const hd = await hookResp.json().catch(() => ({}));
    if (!hookResp.ok || hd?.ok !== true) return textResponse("Streaming app connector abhi ready nahi hai.", 409);

    const launchMode = String(hd?.launch_mode ?? "REDIRECT");
    if (launchMode === "CLIPBOARD_THEN_OPEN") {
      const clipboardText = String(hd?.clipboard_text ?? "");
      const appIntent = String(hd?.launch_url ?? "");
      const title = String(hd?.title ?? "JANTA BOL Live setup").slice(0, 80);
      const buttonText = String(hd?.button_text ?? "Setup copy karke app kholo").slice(0, 80);
      const helpText = String(hd?.help_text ?? "Setup copy hone ke baad streaming app me Import option me Paste karein.").slice(0, 240);

      if (!clipboardText.startsWith("larix://set/v1?") || clipboardText.length > 12000) {
        return textResponse("Streaming app setup invalid hai.", 500);
      }
      if (!appIntent.startsWith("intent://") || appIntent.length > 3000) {
        return textResponse("Streaming app launch invalid hai.", 500);
      }

      await service.from("audit_logs").insert({
        actor_user_id: c.reporter_id || null,
        action: "encoder_connector_interactive_setup_issued",
        record_type: "live_session",
        record_id: sessionId,
        metadata: { connector_key: connectorKey, connector_kind: connectorKind, generation_id: generationId, launch_mode: launchMode },
      });

      const origin = req.headers.get("origin") ?? "";
      const allowedOrigin =
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin === "https://jantabol.in" ||
        origin === "https://www.jantabol.in"
          ? origin
          : "";

      const headers: Record<string,string> = {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Vary": "Origin",
      };
      if (allowedOrigin) headers["Access-Control-Allow-Origin"] = allowedOrigin;

      return new Response(JSON.stringify({
        ok: true,
        connector_key: connectorKey,
        connector_display_name: String(c.connector_display_name ?? ""),
        launch_mode: launchMode,
        clipboard_text: clipboardText,
        launch_url: appIntent,
        title,
        button_text: buttonText,
        help_text: helpText,
      }), { status: 200, headers });
    }

    launchUrl = String(hd?.launch_url ?? "");
  } else {
    return textResponse("Streaming app connector supported nahi hai.", 409);
  }

  if (!safeLaunchUrl(launchUrl, launchScheme)) return textResponse("Streaming app launch link unsafe/invalid hai.", 500);
  if (!isAndroidIntentCapable(req)) {
    await service.from("audit_logs").insert({
      actor_user_id: c.reporter_id || null,
      action: "encoder_launch_blocked_unsafe_client",
      record_type: "live_session",
      record_id: sessionId,
      metadata: { connector_key: connectorKey, connector_kind: connectorKind, generation_id: generationId },
    });
    return textResponse("Is browser se secure Live camera launch supported nahi hai. JANTA BOL Live app/compatible encoder se open karein.", 409);
  }

  await service.from("audit_logs").insert({
    actor_user_id: c.reporter_id || null,
    action: "encoder_connector_launch_redirected",
    record_type: "live_session",
    record_id: sessionId,
    metadata: { connector_key: connectorKey, connector_kind: connectorKind, generation_id: generationId },
  });

  return new Response(null, {
    status: 302,
    headers: {
      ...baseHeaders,
      "Location": launchUrl,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
});