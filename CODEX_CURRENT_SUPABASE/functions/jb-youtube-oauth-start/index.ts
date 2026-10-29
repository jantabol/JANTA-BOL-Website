import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
function payload(token:string){try{const p=(token.split('.')[1]||'').replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'=')))}catch{return {}}}
function b64url(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sha256hex(value:string){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return [...h].map(x=>x.toString(16).padStart(2,'0')).join('')}

Deno.serve(async(req:Request)=>{
  const deploymentEnv=(Deno.env.get("JB_DEPLOYMENT_ENV")??"").toLowerCase();
  const credentialEnv=(Deno.env.get("JB_GOOGLE_CREDENTIAL_ENV")??"").toLowerCase();
  if(!["development","test","production"].includes(deploymentEnv)||credentialEnv!==deploymentEnv){
    return json({ok:false,error:"OAUTH_ENVIRONMENT_MISMATCH"},503);
  }
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const url=Deno.env.get('SUPABASE_URL')??'', anon=Deno.env.get('SUPABASE_ANON_KEY')??'', serviceKey=Deno.env.get('JB_SUPABASE_SERVICE_ROLE_KEY')??'';
  const clientId=Deno.env.get('JB_GOOGLE_CLIENT_ID')??'', clientSecret=Deno.env.get('JB_GOOGLE_CLIENT_SECRET')??'', expectedChannel=Deno.env.get('JB_YOUTUBE_EXPECTED_CHANNEL_ID')??'', encKey=Deno.env.get('JB_OAUTH_TOKEN_ENC_KEY_B64')??'';
  if(!url||!anon||!serviceKey)return json({ok:false,error:'SERVER_CONFIG_ERROR'},500);
  if(!clientId||!clientSecret||!expectedChannel||!encKey)return json({ok:false,error:'YOUTUBE_CONFIG_REQUIRED'},503);
  const auth=req.headers.get('Authorization')??'';if(!auth.startsWith('Bearer '))return json({ok:false,error:'AUTH_REQUIRED'},401);const token=auth.slice(7);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const u=await userClient.auth.getUser(token);if(u.error||!u.data.user)return json({ok:false,error:'INVALID_SESSION'},401);
  const claims=payload(token), sessionId=String(claims.session_id??''), aal=String(claims.aal??'');
  if(!sessionId||aal!=='aal2')return json({ok:false,error:'OWNER_AAL2_REQUIRED'},403);
  const ctx=await service.rpc('jb_live_actor_context_internal',{p_user_id:u.data.user.id,p_session_id:sessionId});
  const c=Array.isArray(ctx.data)?ctx.data[0]:ctx.data;if(ctx.error||!c?.session_active||c.app_role!=='owner')return json({ok:false,error:'OWNER_AAL2_REQUIRED'},403);

  const state=b64url(crypto.getRandomValues(new Uint8Array(32))), hash=await sha256hex(state);
  const saved=await service.rpc('jb_youtube_oauth_state_create_internal',{p_state_hash:hash,p_owner_user_id:u.data.user.id,p_ttl_seconds:600});
  if(saved.error)return json({ok:false,error:'OAUTH_STATE_CREATE_FAILED'},500);

  const current=await service.from('youtube_integration').select('connection_state').eq('provider','youtube').maybeSingle();
  const patch:Record<string,unknown>={expected_channel_id:expectedChannel,reauth_in_progress:true,candidate_started_at:new Date().toISOString(),candidate_safe_error_code:null,updated_at:new Date().toISOString()};
  if(current.data?.connection_state!=='CONNECTED')patch.connection_state='CONNECTING';
  await service.from('youtube_integration').update(patch).eq('provider','youtube');

  const callback=`${url}/functions/v1/jb-youtube-oauth-callback`;
  const q=new URLSearchParams({client_id:clientId,redirect_uri:callback,response_type:'code',scope:'https://www.googleapis.com/auth/youtube.force-ssl',access_type:'offline',prompt:'consent',include_granted_scopes:'true',state});
  await service.from('audit_logs').insert({actor_user_id:u.data.user.id,action:'youtube_oauth_started',record_type:'youtube_integration',record_id:'youtube',metadata:{client_id_len:clientId.length,client_id_prefix:clientId.slice(0,18),client_id_suffix:clientId.slice(-28),client_id_trimmed_equal:clientId===clientId.trim(),client_id_format_ok:/^\\d+-[A-Za-z0-9_-]+\\.apps\\.googleusercontent\\.com$/.test(clientId),client_id_sha256:await sha256hex(clientId)}});
  return json({ok:true,authorization_url:`https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`});
});