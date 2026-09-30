import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const requiredScope='https://www.googleapis.com/auth/youtube.force-ssl';
function html(title:string,message:string,ok=false){return new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:Arial;background:#111;color:#eee;padding:24px"><main style="max-width:600px;margin:auto"><h2 style="color:${ok?'#73df73':'#ff8e8e'}">${title}</h2><p>${message}</p><p>JANTA BOL Live Control par wapas jaakar status refresh karein.</p></main></body>`,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}
async function hash(v:string){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));return [...h].map(x=>x.toString(16).padStart(2,'0')).join('')}
function bytesFromB64(v:string){const b=atob(v);return Uint8Array.from(b,c=>c.charCodeAt(0))}
function b64(v:Uint8Array){let s='';for(const x of v)s+=String.fromCharCode(x);return btoa(s)}
async function encryptToken(token:string,keyB64:string){const raw=bytesFromB64(keyB64);if(raw.length!==32)throw new Error('ENC_KEY_INVALID');const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(token)));return{ciphertext:b64(cipher),iv:b64(iv)}}

Deno.serve(async(req:Request)=>{
  const deploymentEnv=(Deno.env.get("JB_DEPLOYMENT_ENV")??"").toLowerCase();
  const credentialEnv=(Deno.env.get("JB_GOOGLE_CREDENTIAL_ENV")??"").toLowerCase();
  if(!["development","test","production"].includes(deploymentEnv)||credentialEnv!==deploymentEnv){
    return html('OAuth Environment Error','Google OAuth credential environment does not match this deployment.');
  }
  if(req.method!=='GET')return html('OAuth Error','Invalid callback method.');
  const sbUrl=Deno.env.get('SUPABASE_URL')??'', serviceKey=Deno.env.get('JB_SUPABASE_SERVICE_ROLE_KEY')??'';
  const clientId=Deno.env.get('JB_GOOGLE_CLIENT_ID')??'', clientSecret=Deno.env.get('JB_GOOGLE_CLIENT_SECRET')??'', expected=Deno.env.get('JB_YOUTUBE_EXPECTED_CHANNEL_ID')??'', encKey=Deno.env.get('JB_OAUTH_TOKEN_ENC_KEY_B64')??'';
  if(!sbUrl||!serviceKey)return html('OAuth Error','Server configuration unavailable.');
  const service=createClient(sbUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const u=new URL(req.url),state=u.searchParams.get('state')??'',code=u.searchParams.get('code')??'',oauthError=u.searchParams.get('error')??'';
  if(!state)return html('OAuth State Invalid','Missing OAuth state.');
  const consumed=await service.rpc('jb_youtube_oauth_state_consume_internal',{p_state_hash:await hash(state)});const ownerId=String(consumed.data??'');
  if(consumed.error||!ownerId)return html('OAuth State Invalid','State expired, reused, or mismatched. Start Connect again from JANTA BOL.');

  const current=await service.from('youtube_integration').select('connection_state,verified_channel_id').eq('provider','youtube').maybeSingle();
  const healthy=current.data?.connection_state==='CONNECTED'&&!!current.data?.verified_channel_id;
  async function fail(stateName:string,codeName:string,msg:string){const patch:Record<string,unknown>={reauth_in_progress:false,candidate_safe_error_code:codeName,updated_at:new Date().toISOString()};if(!healthy){patch.connection_state=stateName;patch.safe_error_code=codeName;if(stateName==='REAUTH_REQUIRED')patch.reauth_required_at=new Date().toISOString()}await service.from('youtube_integration').update(patch).eq('provider','youtube');await service.from('audit_logs').insert({actor_user_id:ownerId,action:'youtube_oauth_failed',record_type:'youtube_integration',record_id:'youtube',metadata:{safe_error_code:codeName}});return html('YouTube Connection Not Changed',msg)}

  if(oauthError)return await fail(healthy?'CONNECTED':'DISCONNECTED','OAUTH_'+oauthError.toUpperCase().replace(/[^A-Z0-9_]/g,'_'),'Google authorization complete nahi hua. Existing healthy connection ko replace nahi kiya gaya.');
  if(!clientId||!clientSecret||!expected||!encKey)return await fail('CONFIG_ERROR','YOUTUBE_CONFIG_REQUIRED','Required server-only YouTube configuration missing hai.');
  if(!code)return await fail('REAUTH_REQUIRED','OAUTH_CODE_MISSING','Authorization code missing hai.');

  const callback=`${sbUrl}/functions/v1/jb-youtube-oauth-callback`;
  const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:callback,grant_type:'authorization_code'})});
  if(!tokenRes.ok)return await fail('REAUTH_REQUIRED','TOKEN_EXCHANGE_FAILED','Google token exchange verify nahi hua.');
  const token=await tokenRes.json();const access=String(token.access_token??''),refresh=String(token.refresh_token??''),scope=String(token.scope??'').split(/\s+/).filter(Boolean);
  if(!access)return await fail('REAUTH_REQUIRED','ACCESS_TOKEN_MISSING','Google access token missing hai.');
  if(!scope.includes(requiredScope))return await fail('SCOPE_MISSING','YOUTUBE_SCOPE_MISSING','Required minimum YouTube scope verify nahi hua.');

  await service.from('youtube_integration').update({connection_state:healthy?'CONNECTED':'VERIFYING',expected_channel_id:expected,reauth_in_progress:true,updated_at:new Date().toISOString()}).eq('provider','youtube');
  const ch=await fetch('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true',{headers:{Authorization:`Bearer ${access}`}});
  if(!ch.ok)return await fail('REAUTH_REQUIRED','CHANNEL_LOOKUP_FAILED','Authorized YouTube channel verify nahi ho saka.');
  const chData=await ch.json();const item=Array.isArray(chData.items)?chData.items[0]:null;const channelId=String(item?.id??''),channelName=String(item?.snippet?.title??'');
  if(!channelId||channelId!==expected)return await fail('WRONG_CHANNEL','WRONG_CHANNEL','Authorized Google account expected JANTA BOL YouTube Channel ID se match nahi karta.');
  if(!refresh)return await fail('REAUTH_REQUIRED','REFRESH_TOKEN_MISSING','Offline refresh credential receive nahi hua. Connect/Reconnect ko fresh consent ke saath dobara run karein.');

  let enc;try{enc=await encryptToken(refresh,encKey)}catch{return await fail('CONFIG_ERROR','ENC_KEY_INVALID','OAuth encryption configuration invalid hai.');}
  const activated=await service.rpc('jb_youtube_activate_secret_internal',{p_ciphertext:enc.ciphertext,p_iv_b64:enc.iv,p_key_version:1});
  if(activated.error||!activated.data)return await fail('CONFIG_ERROR','SECRET_ACTIVATION_FAILED','Verified credential securely activate nahi ho saka.');

  await service.from('youtube_integration').update({expected_channel_id:expected,verified_channel_id:channelId,verified_channel_name:channelName,connection_state:'CONNECTED',granted_scopes:scope,connected_at:new Date().toISOString(),last_verified_at:new Date().toISOString(),last_refresh_status:'NOT_YET_REFRESHED',reauth_required_at:null,safe_error_code:null,reauth_in_progress:false,candidate_safe_error_code:null,updated_at:new Date().toISOString()}).eq('provider','youtube');
  await service.from('audit_logs').insert({actor_user_id:ownerId,action:'youtube_oauth_connected',record_type:'youtube_integration',record_id:'youtube',metadata:{verified_channel_id:channelId,scope_count:scope.length}});
  return html('YouTube Connected','Expected JANTA BOL YouTube Channel ID verify ho gaya aur refresh credential encrypted server-side activate ho gaya.',true);
});