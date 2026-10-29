/*
 * T079 review-only Google access credential issuer for existing JANTA BOL
 * YouTube channel. NO deployed endpoint. No Google video uploads in this file.
 * Google refresh-secret stays encrypted server-side, never in response/client.
 * Uses same active secret and same exact channels.mine check as existing
 * jb-youtube-oauth-health; rejects unsafe refresh token rotation.
 */
const fail=(code)=>{const e=new Error(code);e.code=code;throw e};
const channelPattern=/^UC[A-Za-z0-9_-]{22}$/;
const scope='https://www.googleapis.com/auth/youtube.force-ssl';
function decode64(b64){
 if(typeof b64!=='string'||!b64)fail('OAUTH_SECRET_MISSING');
 try{return Uint8Array.from(atob(b64),x=>x.charCodeAt(0))}
 catch{fail('OAUTH_SECRET_ENCODING_INVALID')}
}
async function decrypt(ciphertext,iv,keyB64){
 const keyRaw=decode64(keyB64), ivBytes=decode64(iv), bytes=decode64(ciphertext);
 if(keyRaw.length!==32||ivBytes.length!==12||bytes.length<17)
  fail('OAUTH_SECRET_ENCRYPTION_INVALID');
 try{
  const key=await crypto.subtle.importKey('raw',keyRaw,'AES-GCM',false,['decrypt']);
  return new TextDecoder().decode(await crypto.subtle.decrypt({
   name:'AES-GCM',iv:ivBytes
  },key,bytes));
 }catch{fail('OAUTH_SECRET_DECRYPT_DENIED')}
}
function issuerConfig(c){
 if(!c||typeof c!=='object'||typeof c.service?.rpc!=='function'||
  typeof c.service.from!=='function'||typeof c.fetchGoogle!=='function'||
  !channelPattern.test(c.expectedChannelId||'')||
  typeof c.clientId!=='string'||c.clientId.length<6||
  typeof c.clientSecret!=='string'||c.clientSecret.length<6||
  typeof c.tokenKeyB64!=='string')
  fail('OAUTH_ISSUER_CONFIG_REQUIRED');
 if(!['development','test','production'].includes(c.deploymentEnv)||
   c.deploymentEnv!==c.googleCredentialEnv)
  fail('OAUTH_ENVIRONMENT_MISMATCH');
 if(decode64(c.tokenKeyB64).length!==32)fail('OAUTH_SECRET_ENCRYPTION_INVALID');
}
function createReadOnlyCredentialIssuer(config){
 issuerConfig(config);
 return async function getPrivateToken({channelId}){
  if(channelId!==config.expectedChannelId)fail('WRONG_YOUTUBE_CHANNEL');
  const db=await config.service.from('youtube_integration')
   .select('connection_state,control_auth_state,credential_incident_state,expected_channel_id,verified_channel_id,last_refresh_status,granted_scopes')
   .eq('provider','youtube').maybeSingle();
  const state=db?.data;
  if(db?.error||!state||state.connection_state!=='CONNECTED'||
   state.control_auth_state!=='OK'||state.credential_incident_state!=='CLEAR'||
   state.expected_channel_id!==channelId||state.verified_channel_id!==channelId||
   state.last_refresh_status!=='OK'||!Array.isArray(state.granted_scopes)||
   !state.granted_scopes.includes(scope))
   fail('YOUTUBE_CHANNEL_NOT_READY');
  const active=await config.service.rpc('jb_youtube_active_secret_internal');
  const secret=Array.isArray(active?.data)?active.data[0]:active?.data;
  if(active?.error||!secret?.refresh_token_ciphertext||!secret?.iv_b64)
   fail('YOUTUBE_ACTIVE_CREDENTIAL_MISSING');
  // Never print, throw raw Google errors or pass decryption key to Google.
  const refresh=await decrypt(secret.refresh_token_ciphertext,secret.iv_b64,config.tokenKeyB64);
  let result;
  try {
   result=await config.fetchGoogle('https://oauth2.googleapis.com/token',{
    method:'POST',redirect:'manual',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({
     client_id:config.clientId,client_secret:config.clientSecret,
     refresh_token:refresh,grant_type:'refresh_token'
    }),signal:AbortSignal.timeout(12000)
   });
  }catch{fail('GOOGLE_REFRESH_NETWORK_UNKNOWN')}
  const obj=await result?.json().catch(()=>null);
  if(result?.status!==200||!obj||typeof obj.access_token!=='string'||
    obj.access_token.length<10||String(obj.token_type||'').toLowerCase()!=='bearer')
   fail('GOOGLE_REFRESH_DENIED');
  if(typeof obj.refresh_token==='string'&&obj.refresh_token){
   // Never discard a rotated credential; existing rotation+audit handler must
   // independently persist the rotated token before this worker can proceed.
   fail('GOOGLE_REFRESH_ROTATION_REQUIRES_OWNER_GATE');
  }
  if(obj.scope && !obj.scope.split(' ').includes(scope))
   fail('GOOGLE_UPLOAD_SCOPE_NOT_GRANTED');
  let channelRes;
  try{
   channelRes=await config.fetchGoogle(
    'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',{
     method:'GET',redirect:'manual',
     headers:{Authorization:`Bearer ${obj.access_token}`},
     signal:AbortSignal.timeout(12000)
    });
  }catch{fail('GOOGLE_CHANNEL_NETWORK_UNKNOWN')}
  const found=await channelRes?.json().catch(()=>null);
  const ids=Array.isArray(found?.items)?found.items.map(x=>x?.id):[];
  if(channelRes?.status!==200||ids.length!==1||ids[0]!==channelId)
   fail('GOOGLE_CHANNEL_ID_NOT_VERIFIED');
  return Object.freeze({
   channelVerified:true,scopeVerified:true,accessToken:obj.access_token
  });
 }
}
export {createReadOnlyCredentialIssuer};
