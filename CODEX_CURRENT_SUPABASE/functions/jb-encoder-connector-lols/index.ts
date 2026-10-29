import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ok:false,error:"METHOD_NOT_ALLOWED"}),{status:405,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});

  const serviceRoleKey = Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!serviceRoleKey || auth !== "Bearer " + serviceRoleKey) {
    return new Response(JSON.stringify({ok:false,error:"FORBIDDEN"}),{status:403,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }

  const body = await req.json().catch(()=>({}));
  if (String(body?.action ?? "") !== "build_launch") {
    return new Response(JSON.stringify({ok:false,error:"INVALID_ACTION"}),{status:400,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }

  const addr = String(body?.rtmps_address ?? "").trim().replace(/\/+$/, "");
  const streamName = String(body?.stream_name ?? "").trim().replace(/^\/+/, "");
  if (!addr.startsWith("rtmps://") || !streamName || streamName.length > 1000) {
    return new Response(JSON.stringify({ok:false,error:"INVALID_INGEST"}),{status:400,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }

  const q = new URLSearchParams();
  q.append("conn[][url]", addr + "/" + streamName);
  q.append("conn[][name]", "JANTA BOL Live");
  q.append("conn[][overwrite]", "on");
  q.append("conn[][active]", "off");
  q.append("conn[][mode]", "av");
  q.append("enc[vid][res]", "1280x720");
  q.append("enc[vid][fps]", "30");
  q.append("enc[aud][channels]", "2");

  const configUri = "larix://set/v1?" + q.toString();
  const fallback = encodeURIComponent("https://play.google.com/store/apps/details?id=gg.lols.irl");
  const intentUrl = "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=gg.lols.irl;S.browser_fallback_url=" + fallback + ";end";

  return new Response(JSON.stringify({
    ok:true,
    launch_mode:"CLIPBOARD_THEN_OPEN",
    clipboard_text:configUri,
    launch_url:intentUrl,
    title:"JANTA BOL → LOLS IRL",
    button_text:"Setup copy karke LOLS IRL kholo",
    help_text:"JANTA BOL secure Live setup clipboard me copy karega. LOLS IRL me Settings → Import from IRL Pro/Larix → Paste → Import karein. Imported destination safety ke liye OFF rahegi; review karke enable karein."
  }),{
    status:200,
    headers:{"Content-Type":"application/json","Cache-Control":"no-store, no-cache, must-revalidate, max-age=0","Pragma":"no-cache","X-Content-Type-Options":"nosniff"}
  });
});