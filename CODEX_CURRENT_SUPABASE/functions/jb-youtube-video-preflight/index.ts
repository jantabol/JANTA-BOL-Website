import { createClient } from "npm:@supabase/supabase-js@2";

/** P4-T079 YouTube news-video distribution — additive READ-ONLY preflight.
 * NO video uploading, no social status Posted, no OAuth/token reads or writes.
 * An upload worker must be separately code-reviewed, deployed and E2E approved.
 */
const allowedOrigins = new Set(["https://jantabol.in", "https://www.jantabol.in"]);
const channelIdPattern = /^UC[A-Za-z0-9_-]{22}$/;
const articleIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function reply(req: Request, payload: Record<string,unknown>, status=200) {
 const origin=req.headers.get("origin")||"";
 return new Response(JSON.stringify(payload),{status,headers:{
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0",
  "X-Content-Type-Options":"nosniff","Vary":"Origin",
  ...(allowedOrigins.has(origin)?{"Access-Control-Allow-Origin":origin}:{}),
  "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
 }});
}
function jwtData(jwt: string): Record<string,unknown> {
 try {
  const p=(jwt.split(".")[1]||"").replace(/-/g,"+").replace(/_/g,"/");
  return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,"=")));
 }catch{return {}}
}
function unknown(code: string, status=409){return {code,status};}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&!allowedOrigins.has(origin))return reply(req,{ok:false,code:"ORIGIN_DENIED"},403);
 if(req.method==="OPTIONS")return reply(req,{ok:true});
 if(req.method!=="POST")return reply(req,{ok:false,code:"METHOD_DENIED"},405);
 const body=await req.json().catch(()=>null);
 if(!body||typeof body!=="object"||Array.isArray(body)||
  Object.keys(body).some(k=>!["action","article_id"].includes(k))||
  body.action!=="article_preflight"||typeof body.article_id!=="string"||
  !articleIdPattern.test(body.article_id))
   return reply(req,{ok:false,code:"PREFLIGHT_BAD_REQUEST"},400);
 const mode=(Deno.env.get("JB_DEPLOYMENT_ENV")||"").toLowerCase();
 const credentialMode=(Deno.env.get("JB_GOOGLE_CREDENTIAL_ENV")||"").toLowerCase();
 if(!["development","test","production"].includes(mode)||mode!==credentialMode)
  return reply(req,{ok:false,code:"OAUTH_ENVIRONMENT_MISMATCH"},503);
 const url=Deno.env.get("SUPABASE_URL")||"";
 const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
 const serviceKey=Deno.env.get("JB_SUPABASE_SERVICE_ROLE_KEY")||"";
 const expected=Deno.env.get("JB_YOUTUBE_EXPECTED_CHANNEL_ID")||"";
 if(!url||!anon||!serviceKey||!channelIdPattern.test(expected))
  return reply(req,{ok:false,code:"SERVER_CONFIG_REQUIRED"},503);
 const bearer=req.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer "))return reply(req,{ok:false,code:"OWNER_AAL2_REQUIRED"},403);
 const jwt=bearer.slice(7),claim=jwtData(jwt);
 if(claim.aal!=="aal2"||typeof claim.session_id!=="string")
  return reply(req,{ok:false,code:"OWNER_AAL2_REQUIRED"},403);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:bearer}},
  auth:{persistSession:false,autoRefreshToken:false}});
 const user=await userClient.auth.getUser(jwt);
 if(user.error||!user.data.user)return reply(req,{ok:false,code:"INVALID_SESSION"},401);
 const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const context=await service.rpc("jb_live_actor_context_internal",{
  p_user_id:user.data.user.id,p_session_id:claim.session_id});
 const actor=Array.isArray(context.data)?context.data[0]:context.data;
 if(context.error||actor?.session_active!==true||actor?.app_role!=="owner")
  return reply(req,{ok:false,code:"OWNER_AAL2_REQUIRED"},403);
 // CHECK ONLY — never call insert/update/upsert/delete/rpc mutation.
 const [yt,global,article,social]=await Promise.all([
  service.from("youtube_integration").select("connection_state,control_auth_state,credential_incident_state,expected_channel_id,verified_channel_id,last_refresh_status,granted_scopes").eq("provider","youtube").maybeSingle(),
  service.from("social_settings").select("global_enabled").eq("id",true).maybeSingle(),
  service.from("articles").select("id,status,deleted_at,video_url").eq("id",body.article_id).maybeSingle(),
  service.from("social_distribution").select("article_id,enabled,youtube,provider_mode").eq("article_id",body.article_id).maybeSingle(),
 ]);
 if(yt.error||global.error||article.error||social.error)
  return reply(req,{ok:false,code:"PROVIDER_CATALOG_READ_UNKNOWN"},503);
 const blockers=[];
 const y=yt.data,a=article.data,s=social.data;
 if(!y||y.connection_state!=="CONNECTED"||y.control_auth_state!=="OK"||
  y.credential_incident_state!=="CLEAR"||y.expected_channel_id!==expected||
  y.verified_channel_id!==expected||y.last_refresh_status!=="OK"||
  !Array.isArray(y.granted_scopes)||
  !y.granted_scopes.includes("https://www.googleapis.com/auth/youtube.force-ssl"))
  blockers.push("YOUTUBE_CHANNEL_NOT_READY");
 if(global.data?.global_enabled!==true)blockers.push("SOCIAL_GLOBAL_OFF");
 if(!a||a.status!=="published"||a.deleted_at)blockers.push("ARTICLE_NOT_PUBLISHED");
 if(!s||s.enabled!==true||s.youtube!==true||s.provider_mode!=="API")
  blockers.push("YOUTUBE_PER_ARTICLE_NOT_API_SELECTED");
 // A video_url is NOT a verified playable, owned, correctly licensed
 // media object. Never trust arbitrary URLs or fetch them from the Edge
 // without a separate allowlisted storage provenance and Founder approval.
 if(!a||typeof a.video_url!=="string"||!a.video_url.trim())
  blockers.push("NO_VIDEO_FILE");
 else blockers.push("VIDEO_MEDIA_PROVENANCE_UNVERIFIED");
 // This is an intentionally independent release gate, not an ignored flag.
 blockers.push("DURABLE_UPLOAD_LEDGER_NOT_APPROVED");
 blockers.push("REAL_PROVIDER_UPLOAD_E6_NOT_RUN");
 return reply(req,{
  ok:true,article_id:body.article_id,provider:"youtube",channel_match:!!y&&
   y.expected_channel_id===expected&&y.verified_channel_id===expected,
  state:"NOT_READY_DUE",blockers,
  uploaded:false,posted:false,public_video_created:false,
  note:"Read-only preflight. No video/media/provider API calls were made."
 });
});
