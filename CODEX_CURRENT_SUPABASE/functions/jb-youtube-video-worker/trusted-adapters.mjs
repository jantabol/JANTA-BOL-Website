/*
 * P4-T079 DRAFT / NOT DEPLOYED: server-only integration ports for
 * review-only worker.mjs. No public route or cron entrypoint.
 * No production table migrations; approvals must come from trusted,
 * separately reviewed server-only records, NEVER request body.
 */
const ARTICLE=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const CHANNEL=/^UC[A-Za-z0-9_-]{22}$/;
const MAX=50*1024*1024;
const HOLD=(code)=>{const e=new Error(code);e.code=code;throw e};
const single=(v)=>Array.isArray(v)?v[0]:v;
function parsedJwt(token){
 try{
  const seg=token.split('.')[1];
  if(!seg)HOLD('MFA_SESSION_MISSING');
  const base64=seg.replace(/-/g,'+').replace(/_/g,'/');
  return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length/4)*4,'=')));
 }catch{HOLD('MFA_SESSION_MISSING')}
}
function response(data,code){if(data?.error)HOLD(code);return data?.data}
function requireValid(cfg){
 if(!cfg||typeof cfg!=='object'||!cfg.service||!cfg.userClient||
    typeof cfg.userClient.auth?.getUser!=='function'||
    typeof cfg.service.rpc!=='function'||typeof cfg.service.from!=='function'||
    typeof cfg.jwt!=='string'||!CHANNEL.test(cfg.expectedChannelId||''))
  HOLD('TRUSTED_SERVER_CONFIG_REQUIRED');
 // Only a server-owned, independently auditable approval registry may assert
 // media origin/rights and Founder decision; this is not a browser setting.
 if(typeof cfg.approvals?.lookup!=='function'||typeof cfg.credentialIssuer!=='function')
  HOLD('PROTECTED_APPROVAL_OR_CREDENTIAL_ADAPTER_REQUIRED');
}
function createOwnerAndIntentPorts(cfg){
 requireValid(cfg);
 async function authorize({articleId,requiredRole,requiredAal}){
  if(!ARTICLE.test(articleId||'')||requiredRole!=='owner'||requiredAal!=='aal2')
   HOLD('OWNER_AAL2_REQUIRED');
  // auth.getUser validates *this* JWT; the session_id JWT claim is used
  // only after getUser and cross-check against active server-side session.
  const user=response(await cfg.userClient.auth.getUser(cfg.jwt),'AUTH_SESSION_UNVERIFIED')?.user;
  if(!user?.id)HOLD('AUTH_SESSION_UNVERIFIED');
  const claims=parsedJwt(cfg.jwt);
  if(claims.sub!==user.id||claims.aal!=='aal2'||
     typeof claims.session_id!=='string'||!ARTICLE.test(claims.session_id))
   HOLD('OWNER_AAL2_REQUIRED');
  const actor=single(response(await cfg.service.rpc('jb_live_actor_context_internal',{
    p_user_id:user.id,p_session_id:claims.session_id
  }),'OWNER_CONTEXT_FAILED'));
  if(actor?.session_active!==true||actor?.app_role!=='owner')
   HOLD('OWNER_AAL2_REQUIRED');
  const yt=response(await cfg.service.from('youtube_integration').select(
   'connection_state,control_auth_state,credential_incident_state,expected_channel_id,verified_channel_id,last_refresh_status,granted_scopes'
  ).eq('provider','youtube').maybeSingle(),'YOUTUBE_HEALTH_READ_FAILED');
  const match=!!yt&&yt.connection_state==='CONNECTED'&&
   yt.control_auth_state==='OK'&&yt.credential_incident_state==='CLEAR'&&
   yt.expected_channel_id===cfg.expectedChannelId&&
   yt.verified_channel_id===cfg.expectedChannelId&&
   yt.last_refresh_status==='OK'&&Array.isArray(yt.granted_scopes)&&
   yt.granted_scopes.includes('https://www.googleapis.com/auth/youtube.force-ssl');
  if(!match)HOLD('YOUTUBE_CHANNEL_NOT_READY');
  return Object.freeze({owner:true,aal:'aal2',sessionActive:true,articleId,channelMatch:true});
 }
 async function loadApprovedIntent({articleId}){
  if(!ARTICLE.test(articleId||''))HOLD('ARTICLE_ID_INVALID');
  const [articleResult,settingsResult,distributionResult,ytResult]=await Promise.all([
   cfg.service.from('articles').select('id,version,status,deleted_at').eq('id',articleId).maybeSingle(),
   cfg.service.from('social_settings').select('global_enabled').eq('id',true).maybeSingle(),
   cfg.service.from('social_distribution').select('enabled,youtube,provider_mode').eq('article_id',articleId).maybeSingle(),
   cfg.service.from('youtube_integration').select(
    'connection_state,control_auth_state,credential_incident_state,expected_channel_id,verified_channel_id,last_refresh_status'
   ).eq('provider','youtube').maybeSingle()
  ]);
  const a=response(articleResult,'ARTICLE_READ_FAILED');
  const global=response(settingsResult,'SOCIAL_SETTINGS_READ_FAILED');
  const social=response(distributionResult,'SOCIAL_DISTRIBUTION_READ_FAILED');
  const yt=response(ytResult,'YOUTUBE_HEALTH_READ_FAILED');
  if(!a||a.id!==articleId||a.status!=='published'||a.deleted_at||
    !Number.isSafeInteger(a.version)||a.version<1)
   HOLD('PUBLISHED_ARTICLE_NOT_READY');
  if(global?.global_enabled!==true||social?.enabled!==true||social?.youtube!==true||
    social?.provider_mode!=='API')HOLD('FOUNDER_YOUTUBE_SELECTION_REQUIRED');
  if(!yt||yt.connection_state!=='CONNECTED'||yt.control_auth_state!=='OK'||
    yt.credential_incident_state!=='CLEAR'||yt.last_refresh_status!=='OK'||
    yt.expected_channel_id!==cfg.expectedChannelId||
    yt.verified_channel_id!==cfg.expectedChannelId)HOLD('YOUTUBE_CHANNEL_NOT_READY');
  // Resolver must read an immutable server-only approval record from trusted
  // storage. A caller-supplied "approved": true is NEVER considered authority.
  const proof=await cfg.approvals.lookup({articleId,articleVersion:a.version,channelId:cfg.expectedChannelId});
  if(!proof||proof.serverVerified!==true||proof.articleId!==articleId||
    proof.articleVersion!==a.version||proof.channelId!==cfg.expectedChannelId||
    !HASH.test(proof.founderApprovalHash||'')||!HASH.test(proof.rightsProofHash||'')||
    proof.media?.ownerApproved!==true||proof.media?.rightsVerified!==true||
    proof.video?.approved!==true||proof.video?.privacy!=='private')
   HOLD('FOUNDER_MEDIA_PROOF_DUE');
  return {
   articleId,articleStatus:a.status,articleDeleted:false,articleVersion:a.version,
   globalEnabled:true,perNewsEnabled:true,youtubeSelected:true,providerMode:'API',
   oauthConnected:true,refreshVerified:true,controlAuthOk:true,credentialIncidentClear:true,
   channelMatch:true,channelId:cfg.expectedChannelId,
   founderApprovalHash:proof.founderApprovalHash,rightsProofHash:proof.rightsProofHash,
   media:proof.media,video:proof.video
  };
 }
 async function readPrivateOriginal({bucket,path}){
  if(bucket!=='private-editorial'||typeof path!=='string'||
    !/^youtube-news\/[a-f0-9-]{36}\/[A-Za-z0-9_-]+[.]mp4$/.test(path))
   HOLD('PRIVATE_MEDIA_SOURCE_DENIED');
  const store=cfg.service.storage?.from?.('private-editorial');
  if(typeof store?.download!=='function')HOLD('PRIVATE_MEDIA_STORAGE_UNAVAILABLE');
  const result=await store.download(path);
  if(result?.error||!result?.data||typeof result.data.arrayBuffer!=='function')
   HOLD('PRIVATE_MEDIA_READ_FAILED');
  const data=await result.data.arrayBuffer();
  if(data.byteLength<1||data.byteLength>MAX)HOLD('PRIVATE_MEDIA_SIZE_DENIED');
  return new Uint8Array(data);
 }
 async function getAccessToken(){
  // Google access token is returned only to server-side worker, never reply.
  // credentialIssuer MUST verify channels.mine and refresh token rotation
  // safety using original OAuth channel and server-only secrets.
  const result=await cfg.credentialIssuer({channelId:cfg.expectedChannelId});
  if(!result||result.channelVerified!==true||result.scopeVerified!==true||
     typeof result.accessToken!=='string'||result.accessToken.length<10)
   HOLD('GOOGLE_ACCESS_TOKEN_UNVERIFIED');
  return result.accessToken;
 }
 return Object.freeze({authorize,loadApprovedIntent,readPrivateOriginal,getAccessToken});
}
function createLedgerPorts({service}){
 if(!service||typeof service.rpc!=='function')HOLD('SERVICE_ROLE_LEDGER_REQUIRED');
 const call=async(name,params)=>{
  const r=await service.rpc(name,params);
  if(r?.error)HOLD('LEDGER_RPC_NOT_DEPLOYED_OR_DENIED');
  return single(r?.data);
 };
 return Object.freeze({
  async reserve(i){
   if(!i||!ARTICLE.test(i.articleId||'')||!HASH.test(i.idempotencyKey||''))
    HOLD('LEDGER_INTENT_INVALID');
   const result=await call('jb_t079_video_reserve_internal',{
    p_article_id:i.articleId,p_article_version:i.articleVersion,
    p_channel_id:i.channelId,p_media_sha256:i.mediaSha256,p_source_path:i.sourcePath,
    p_media_size_bytes:i.mediaSizeBytes,
    p_founder_approval_hash:i.founderApprovalHash,p_rights_proof_hash:i.rightsProofHash
   });
   if(!result?.out_job_id)HOLD('LEDGER_RESERVE_NO_RECEIPT');
   return {created:result.out_created===true,jobId:result.out_job_id,state:result.out_state,
    durable:true,idempotencyKey:i.idempotencyKey};
  },
  async begin({jobId,leaseId}){
   return await call('jb_t079_video_begin_internal',{p_job_id:jobId,p_lease_id:leaseId})===true;
  },
  async transition({jobId,leaseId,from,to,sessionCiphertext,sessionIvB64,videoId}){
   return await call('jb_t079_video_transition_internal',{
    p_job_id:jobId,p_lease_id:leaseId,p_from:from,p_to:to,
    p_session_ciphertext:sessionCiphertext??null,
    p_session_iv_b64:sessionIvB64??null,p_video_id:videoId??null
   })===true;
  },
  async get({jobId}){
   // Separate service-role ONLY RPC is required; never query private table
   // through public PostgREST and never silently manufacture a job record.
   const d=await call('jb_t079_video_get_internal',{p_job_id:jobId});
   if(!d||d.job_id!==jobId)HOLD('LEDGER_JOB_NOT_FOUND');
   return {
    jobId:d.job_id,articleId:d.article_id,articleVersion:Number(d.article_version),
    channelId:d.channel_id,mediaSha256:d.media_sha256,sourceBucket:d.source_bucket,
    sourcePath:d.source_path,mediaSizeBytes:Number(d.media_size_bytes),
    state:d.state,attemptCount:d.attempt_count,leaseId:d.lease_id,
    providerVideoId:d.provider_video_id,sessionCiphertext:d.provider_session_ciphertext,
    sessionIvB64:d.provider_session_iv_b64
   };
  }
 });
}
function createSealedSessionPorts({keyBytes}){
 if(!(keyBytes instanceof Uint8Array)||keyBytes.length!==32)
  HOLD('UPLOAD_SESSION_KEY_REQUIRED');
 const toB64=(bytes)=>btoa(String.fromCharCode(...bytes));
 const fromB64=(str)=>Uint8Array.from(atob(str),ch=>ch.charCodeAt(0));
 let keyPromise=crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt','decrypt']);
 const encoder=new TextEncoder(),decoder=new TextDecoder();
 const aad=(jobId)=>{if(!ARTICLE.test(jobId||''))HOLD('UPLOAD_SESSION_JOB_INVALID');return encoder.encode('T079:YOUTUBE:'+jobId)};
 async function sealSession({sessionUrl,jobId}){
  if(typeof sessionUrl!=='string'||!/^https:\/\/(www.googleapis.com|upload.youtube.com)\/upload\/youtube\//.test(sessionUrl))
   HOLD('UNTRUSTED_GOOGLE_UPLOAD_SESSION');
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=new Uint8Array(await crypto.subtle.encrypt({
   name:'AES-GCM',iv,additionalData:aad(jobId)
  },await keyPromise,encoder.encode(sessionUrl)));
  return {ciphertext:toB64(cipher),ivB64:toB64(iv)};
 }
 async function openSession({ciphertext,ivB64,jobId}){
  if(typeof ciphertext!=='string'||typeof ivB64!=='string')HOLD('UPLOAD_SESSION_MISSING');
  try{
   const iv=fromB64(ivB64),cipher=fromB64(ciphertext);
   if(iv.length!==12||cipher.length<17)HOLD('UPLOAD_SESSION_CIPHERTEXT_INVALID');
   return decoder.decode(await crypto.subtle.decrypt({
    name:'AES-GCM',iv,additionalData:aad(jobId)
   },await keyPromise,cipher));
  }catch{HOLD('UPLOAD_SESSION_DECRYPT_DENIED')}
 }
 return Object.freeze({sealSession,openSession});
}
export {createOwnerAndIntentPorts,createLedgerPorts,createSealedSessionPorts};
