import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function b64url(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function sha256hex(v:string){const h=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));return[...h].map(x=>x.toString(16).padStart(2,"0")).join("")}
function fail(msg:string,status=400){return new Response("<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><title>JANTA BOL Live Camera</title><body style='font-family:Arial;background:#111;color:#eee;padding:24px'><h2>Live Camera not opened</h2><p>"+msg+"</p><p>Reporter Live screen par wapas jaakar fresh Open Live Camera request karein.</p></body>",{status,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer"}})}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return fail("Invalid handoff method.",405);
  const url=Deno.env.get("SUPABASE_URL")??"",serviceKey=Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY")??"";
  if(!url||!serviceKey)return fail("Server configuration unavailable.",500);
  const token=new URL(req.url).searchParams.get("t")??"";
  if(token.length<32)return fail("Handoff token invalid or missing.",400);
  const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const hash=await sha256hex(token);
  const consumed=await service.rpc("jb_live_consume_handoff_internal",{p_token_hash:hash});
  if(consumed.error||!consumed.data){
    const m=String(consumed.error?.message??"HANDOFF_INVALID");
    if(m.includes("EXPIRED"))return fail("This camera handoff expired.",410);
    if(m.includes("USED"))return fail("This camera handoff was already used.",410);
    if(m.includes("REVOKED")||m.includes("GRANT")||m.includes("PERMISSION"))return fail("Live permission is no longer active.",403);
    return fail("Camera handoff is no longer valid.",403);
  }
  const generationId=String((consumed.data as any).generation_id??"");
  let p:Response;
  try{
    p=await fetch(url+"/functions/v1/jb-youtube-provider",{method:"POST",headers:{Authorization:"Bearer "+serviceKey,apikey:serviceKey,"Content-Type":"application/json"},body:JSON.stringify({action:"get_encoder_ingest",generation_id:generationId})});
  }catch{return fail("Provider ingest configuration temporarily unavailable.",503)}
  const data=await p.json().catch(()=>({}));
  if(!p.ok||data?.ok!==true)return fail("Provider ingest configuration could not be prepared.",503);
  const base=String(data.rtmps_address??"").replace(/\/$/,""),stream=String(data.stream_name??"");
  if(!/^rtmps:\/\//i.test(base)||!stream)return fail("Secure RTMPS configuration unavailable.",503);
  const full=base+"/"+stream;
  const q=new URLSearchParams();
  q.append("conn[][url]",full);
  q.append("conn[][name]","JANTA BOL Live");
  q.append("conn[][overwrite]","on");
  q.append("conn[][active]","on");
  q.append("conn[][mode]","av");
  q.append("enc[vid][res]","1280x720");
  q.append("enc[vid][fps]","30");
  q.append("enc[aud][channels]","2");
  const grove="larix://set/v1?"+q.toString();
  return new Response(null,{status:302,headers:{Location:grove,"Cache-Control":"no-store, no-cache, must-revalidate","Pragma":"no-cache","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
});