/*
 * P4-T079 — REVIEW-ONLY server-side YouTube upload worker orchestrator.
 * NO index.ts, no deployed Edge endpoint, no cron, no production DB migration.
 * The injected ports MUST be implemented and independently reviewed as
 * trusted server-only Owner/AAL2, existing Supabase storage and ledger adapters.
 * An uploaded PRIVATE video remains NOT_POSTED, never a public news/social post.
 */
import {
 mediaDescriptor, metadata, initiate, querySession, uploadChunk,
 verifyPrivateVideo, validateSessionUrl
} from '../jb-youtube-video-transport/protocol.mjs';

const ARTICLE_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const VIDEO_JOB=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const CHANNEL=/^UC[A-Za-z0-9_-]{22}$/;
const HASH=/^[a-f0-9]{64}$/;
const MIME='video/mp4';
const CHUNK=4*1024*1024;
const safeState=(state)=>Object.freeze({state,posted:false,public_video_created:false});
const fail=(code)=>{const e=new Error(code);e.code=code;throw e};
const asBytes=(raw)=>{
 if(!(raw instanceof Uint8Array)||raw.byteLength===0)fail('STORAGE_BYTES_INVALID');
 return raw;
};
async function digest(bytes){
 const b=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
}
const checkPorts=(ports)=>{
 if(!ports||typeof ports!=='object'||Array.isArray(ports))fail('WORKER_PORTS_REQUIRED');
 for(const key of ['authorize','loadApprovedIntent','readPrivateOriginal','getAccessToken','sealSession','openSession']){
  if(typeof ports[key]!=='function')fail('WORKER_PORT_MISSING');
 }
 if(typeof ports.fetchGoogle!=='function'||!ports.ledger||typeof ports.ledger!=='object')
  fail('WORKER_PORT_MISSING');
 for(const key of ['reserve','begin','get','transition']){
  if(typeof ports.ledger[key]!=='function')fail('WORKER_LEDGER_PORT_MISSING');
 }
};
async function authorized(ports,articleId){
 // No bearer/session/role is trusted from an API caller. Adapter MUST use
 // auth.getUser + authenticated session id + Owner AAL2 on the server.
 const proof=await ports.authorize({articleId,requiredRole:'owner',requiredAal:'aal2'});
 if(proof?.owner!==true||proof?.aal!=='aal2'||proof?.sessionActive!==true||
    proof?.articleId!==articleId||proof?.channelMatch!==true)
  fail('OWNER_AAL2_PROOF_REQUIRED');
 return proof;
}
function assertIntent(intent,articleId){
 if(!intent||typeof intent!=='object'||Array.isArray(intent)||
    intent.articleId!==articleId||!ARTICLE_ID.test(articleId))
  fail('APPROVED_INTENT_INVALID');
 if(intent.articleStatus!=='published'||intent.articleDeleted===true||
    !Number.isSafeInteger(intent.articleVersion)||intent.articleVersion<1)
  fail('ARTICLE_REVISION_NOT_APPROVED');
 if(intent.globalEnabled!==true||intent.perNewsEnabled!==true||
    intent.youtubeSelected!==true||intent.providerMode!=='API')
  fail('YOUTUBE_NOT_SELECTED_FOR_ARTICLE');
 if(intent.oauthConnected!==true||intent.refreshVerified!==true||
    intent.controlAuthOk!==true||intent.credentialIncidentClear!==true||
    intent.channelMatch!==true||!CHANNEL.test(intent.channelId))
  fail('CHANNEL_HEALTH_NOT_READY');
 if(!HASH.test(intent.founderApprovalHash||'')||!HASH.test(intent.rightsProofHash||''))
  fail('FOUNDER_RIGHTS_EVIDENCE_REQUIRED');
 const source=mediaDescriptor(intent.media);
 if(source.sourcePath.split('/')[1]!==articleId)fail('CROSS_ARTICLE_MEDIA_DENIED');
 // Approvals, immutable article version and media metadata MUST be loaded
 // from independent server-side records, never from request body.
 const video=metadata(intent.video);
 return {source,video};
}
async function readAndVerify(ports,intent,source){
 // Only the injected service_role-capable server storage adapter may download
 // this exact private-editorial object. No remote URL or signed browser link.
 const raw=asBytes(await ports.readPrivateOriginal({
  bucket:'private-editorial',path:source.sourcePath}));
 if(raw.byteLength!==source.byteLength)fail('MEDIA_SIZE_MISMATCH');
 if(await digest(raw)!==source.sha256)fail('MEDIA_SHA256_MISMATCH');
 return raw;
}
async function keyOf(intent,source){
 const parts=['T079-v1',intent.articleId,String(intent.articleVersion),
  intent.channelId,source.sha256];
 return digest(new TextEncoder().encode(parts.join('\n')));
}
function ledgerRow(row,intent,source,jobId=null){
 if(!row||typeof row!=='object')fail('LEDGER_READ_INVALID');
 if(jobId&&row.jobId!==jobId)fail('LEDGER_JOB_ID_MISMATCH');
 if(row.articleId!==intent.articleId||row.articleVersion!==intent.articleVersion||
  row.channelId!==intent.channelId||row.mediaSha256!==source.sha256||
  row.sourcePath!==source.sourcePath||row.sourceBucket!=='private-editorial'||
  row.mediaSizeBytes!==source.byteLength)fail('LEDGER_FROZEN_INTENT_MISMATCH');
}
async function safeTransition(ports,params){
 try{return await ports.ledger.transition(params)===true}
 catch{return false}
}
async function token(ports){
 const credential=await ports.getAccessToken();
 if(typeof credential!=='string'||credential.length<10)fail('GOOGLE_SERVER_TOKEN_UNAVAILABLE');
 return credential;
}
async function startPrivateUpload({ports,articleId}){
 checkPorts(ports);
 if(typeof articleId!=='string'||!ARTICLE_ID.test(articleId))fail('ARTICLE_ID_INVALID');
 await authorized(ports,articleId);
 const intent=await ports.loadApprovedIntent({articleId});
 const {source}=assertIntent(intent,articleId);
 // Perform integrity check before reserving a durable intent or making Google
 // calls. Any byte mutation/size mismatch rejects without a Google request.
 await readAndVerify(ports,intent,source);
 const accessToken=await token(ports);
 const key=await keyOf(intent,source);
 const reserved=await ports.ledger.reserve({
  articleId:intent.articleId,articleVersion:intent.articleVersion,
  channelId:intent.channelId,mediaSha256:source.sha256,
  sourceBucket:source.sourceBucket,sourcePath:source.sourcePath,
  mediaSizeBytes:source.byteLength,
  founderApprovalHash:intent.founderApprovalHash,
  rightsProofHash:intent.rightsProofHash,
  idempotencyKey:key
 });
 // Existing jobs MUST NEVER silently restart videos.insert, even if
 // marked UNKNOWN, expired, FAILED or already verified.
 if(reserved?.created!==true)return safeState('DUPLICATE_OR_EXISTING_JOB_HOLD');
 const jobId=reserved.jobId;
 if(typeof jobId!=='string'||!VIDEO_JOB.test(jobId)||reserved.state!=='RESERVED'||
    reserved.durable!==true||reserved.idempotencyKey!==key)
  fail('DURABLE_RESERVATION_NOT_PROVED');
 const leaseId=crypto.randomUUID();
 const claimed=await ports.ledger.begin({jobId,leaseId});
 if(claimed!==true)return safeState('RESERVATION_LEASE_NOT_GRANTED');
 const proof={provider:'youtube',status:'RESERVED',durable:true,exclusive_lease:true,
  idempotency_key:key,unknown_outcome:false};
 const started=await initiate({fetcher:ports.fetchGoogle,accessToken,ledger:proof,
  media:intent.media,info:intent.video});
 if(started.state!=='SESSION_OPEN'){
  const closed=await safeTransition(ports,{
   jobId,leaseId,from:'INITIATING',to:'UNKNOWN'});
  return safeState(closed?'GOOGLE_INITIATION_UNKNOWN_HOLD':'INITIATION_RECORD_UNKNOWN_HOLD');
 }
 // Persist Google one-time resumable session location encrypted BEFORE
 // any bytes are uploaded. Never expose raw session URL in result/logs.
 let sealed;
 try{
  sealed=await ports.sealSession({sessionUrl:started.sessionUrl,jobId});
  if(typeof sealed?.ciphertext!=='string'||sealed.ciphertext.length<20||
     typeof sealed.ivB64!=='string'||sealed.ivB64.length<12)
    throw Error('SEAL_FAILED');
 }catch{
  await safeTransition(ports,{jobId,leaseId,from:'INITIATING',to:'UNKNOWN'});
  return safeState('SESSION_ENCRYPTION_UNKNOWN_HOLD');
 }
 const stored=await safeTransition(ports,{
  jobId,leaseId,from:'INITIATING',to:'SESSION_OPEN',
  sessionCiphertext:sealed.ciphertext,sessionIvB64:sealed.ivB64
 });
 if(!stored)return safeState('SESSION_PERSIST_UNKNOWN_HOLD');
 return Object.freeze({state:'SESSION_OPEN',jobId,posted:false,public_video_created:false});
}
async function validJob({ports,jobId}){
 checkPorts(ports);
 if(typeof jobId!=='string'||!VIDEO_JOB.test(jobId))fail('JOB_ID_INVALID');
 const row=await ports.ledger.get({jobId});
 if(!row||typeof row.articleId!=='string'||!ARTICLE_ID.test(row.articleId))
  fail('JOB_NOT_FOUND');
 await authorized(ports,row.articleId);
 const intent=await ports.loadApprovedIntent({articleId:row.articleId});
 const {source}=assertIntent(intent,row.articleId);
 ledgerRow(row,intent,source,jobId);
 // Proof owner must still control exactly same immutable revision+media.
 if(!row.leaseId||!VIDEO_JOB.test(row.leaseId)||row.attemptCount!==1)
  fail('UPLOAD_LEASE_NOT_BOUND');
 return {row,intent,source};
}
async function confirmedReceipt({ports,row,intent,accessToken}){
 const checked=await verifyPrivateVideo({
  fetcher:ports.fetchGoogle,accessToken,
  videoId:row.providerVideoId,expectedChannelId:intent.channelId
 });
 if(checked.state!=='PRIVATE_VIDEO_VERIFIED')return safeState('RECEIPT_VERIFICATION_HOLD');
 const done=await safeTransition(ports,{
  jobId:row.jobId,leaseId:row.leaseId,
  from:'RECEIPT_PENDING',to:'PRIVATE_VERIFIED'
 });
 if(!done)return safeState('PRIVATE_RECEIPT_CAS_HOLD');
 return Object.freeze({
  state:'PRIVATE_VERIFIED',jobId:row.jobId,
  providerVideoId:row.providerVideoId,privacy:'private',
  posted:false,public_video_created:false
 });
}
async function recordReceipt({ports,row,intent,accessToken,origin,videoId}){
 if(typeof videoId!=='string'||videoId.length!==11)
  return safeState('GOOGLE_RECEIPT_UNKNOWN_HOLD');
 const ok=await safeTransition(ports,{
  jobId:row.jobId,leaseId:row.leaseId,from:origin,
  to:'RECEIPT_PENDING',videoId
 });
 if(!ok)return safeState('RECEIPT_PERSIST_UNKNOWN_HOLD');
 return confirmedReceipt({ports,row:{...row,providerVideoId:videoId},intent,accessToken});
}
async function resumeOneChunk({ports,jobId}){
 const {row,intent,source}=await validJob({ports,jobId});
 if(row.state==='PRIVATE_VERIFIED')return safeState('PRIVATE_ALREADY_VERIFIED');
 if(row.state==='RECEIPT_PENDING'){
  if(typeof row.providerVideoId!=='string')return safeState('RECEIPT_PENDING_ID_MISSING');
  return confirmedReceipt({ports,row,intent,accessToken:await token(ports)});
 }
 // UNKNOWN can only query exact original provider session; never send bytes
 // or restart with a fresh videos.insert. Human reconciliation may approve
 // UNKNOWN->RECEIPT_PENDING, only if a valid same-session ID is confirmed.
 if(!['SESSION_OPEN','UPLOADING','UNKNOWN'].includes(row.state))
  return safeState('JOB_NOT_RESUMABLE_HOLD');
 if(!row.sessionCiphertext||!row.sessionIvB64)
  return safeState('SESSION_NOT_DURABLE_HOLD');
 let sessionUrl;
 try{sessionUrl=validateSessionUrl(await ports.openSession({
  ciphertext:row.sessionCiphertext,ivB64:row.sessionIvB64,jobId}));}
 catch{return safeState('SESSION_DECRYPTION_HOLD')}
 const accessToken=await token(ports);
 const status=await querySession({
  fetcher:ports.fetchGoogle,accessToken,sessionUrl,totalBytes:source.byteLength
 });
 if(status.state==='UPLOAD_RESPONSE_PENDING_CHANNEL_VERIFY'){
  return recordReceipt({ports,row,intent,accessToken,origin:row.state,videoId:status.videoId});
 }
 if(row.state==='UNKNOWN')return safeState('UNKNOWN_RECONCILIATION_REQUIRED');
 if(status.state!=='INCOMPLETE'){
  // Never blindly retry Google on an uncertain status. If a request may have
  // succeeded, quarantine the same durable job, not create a second one.
  if(status.state==='UNKNOWN_RECONCILE_ONLY'){
   const ok=await safeTransition(ports,{jobId,leaseId:row.leaseId,from:row.state,to:'UNKNOWN'});
   return safeState(ok?'QUERY_UNCERTAIN_UNKNOWN_HOLD':'QUERY_UNCERTAIN_CAS_HOLD');
  }
  return safeState('UPLOAD_STATUS_REVIEW_HOLD');
 }
 // Full original private content digest rechecked at EVERY invocation, not
 // just on initial reservation; mismatched or replaced bytes stop upload.
 const bytes=await readAndVerify(ports,intent,source);
 if(status.nextByte>=bytes.length)return safeState('GOOGLE_RANGE_CONFLICT_HOLD');
 const length=Math.min(CHUNK,bytes.length-status.nextByte);
 const chunk=bytes.slice(status.nextByte,status.nextByte+length);
 if(row.state==='SESSION_OPEN'){
  const ok=await safeTransition(ports,{jobId,leaseId:row.leaseId,from:'SESSION_OPEN',to:'UPLOADING'});
  if(!ok)return safeState('UPLOAD_LEASE_LOST_HOLD');
 }
 const delivered=await uploadChunk({
  fetcher:ports.fetchGoogle,accessToken,sessionUrl,totalBytes:source.byteLength,
  startByte:status.nextByte,bytes:chunk
 });
 if(delivered.state==='UPLOAD_RESPONSE_PENDING_CHANNEL_VERIFY')
  return recordReceipt({ports,row,intent,accessToken,origin:'UPLOADING',videoId:delivered.videoId});
 if(delivered.state==='INCOMPLETE'){
  const ok=await safeTransition(ports,{jobId,leaseId:row.leaseId,from:'UPLOADING',to:'SESSION_OPEN'});
  return safeState(ok?'CHUNK_ACKNOWLEDGED':'CHUNK_ACK_CAS_HOLD');
 }
 if(delivered.state==='UNKNOWN_RECONCILE_ONLY'){
  const ok=await safeTransition(ports,{jobId,leaseId:row.leaseId,from:'UPLOADING',to:'UNKNOWN'});
  return safeState(ok?'CHUNK_UNKNOWN_QUARANTINED':'CHUNK_UNKNOWN_CAS_HOLD');
 }
 return safeState('UPLOAD_DELIVERY_REVIEW_HOLD');
}
export {startPrivateUpload,resumeOneChunk};
