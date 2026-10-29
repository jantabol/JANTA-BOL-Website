/**
 * JANTA BOL B7 / ADS-015 — ISOLATED DURABLE MEDIA COMMAND CONTRACT.
 * REVIEW ONLY, NOT DEPLOYED. There is NO HTTP endpoint or service key here.
 *
 * An authorized command gateway stages the ORIGINAL to a private create-only
 * bucket before calling enqueueB7MediaCommand. A SEPARATE private worker uses
 * processB7MediaCommand with a DB-backed durable queue/lease adapter.
 * Never put a bearer JWT, file bytes, URL or privileged key in the queue.
 * Existing private image/video processing and canonical Creative ledgers
 * remain the ONLY media evidence/approval authority; this is not another SOT.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const MAX_BYTES=8388608;
const kinds=Object.freeze({
 image:{bucket:'jb-ad-originals-private',mime:{
  'image/png':'png','image/jpeg':['jpg','jpeg'],'image/webp':'webp'}},
 video:{bucket:'jb-ad-video-originals-private',mime:{'video/mp4':'mp4'}}
});
const fail=code=>{throw Error('B7_QUEUE_'+code)};
const digest=async value=>{
 const ab=new ArrayBuffer(value.byteLength);
 new Uint8Array(ab).set(value);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',ab)),
  x=>x.toString(16).padStart(2,'0')).join('');
};
function validateSource(entry){
 if(!entry||!UUID.test(entry.creativeId)||!UUID.test(entry.assetId)||
    !UUID.test(entry.idempotencyKey)||!kinds[entry.kind]||
    !HASH.test(entry.sha256||'')||!Number.isSafeInteger(entry.bytes)||
    entry.bytes<16||entry.bytes>MAX_BYTES)fail('INVALID_COMMAND');
 const def=kinds[entry.kind],exts=def.mime[entry.mime];
 if(!exts||entry.bucket!==def.bucket)fail('WRONG_PRIVATE_SOURCE_BUCKET');
 const ext=String(entry.path||'').split('.').pop();
 if(!((Array.isArray(exts)?exts:[exts]).includes(ext))||
    entry.path!==('staged/'+entry.assetId+'/'+entry.sha256+'.'+ext))
  fail('PRIVATE_PATH_OR_MIME_MISMATCH');
}
function draft(row,id,kind){
 if(!row||row.id!==id||!UUID.test(row.campaign_id)||row.approved!==false||
    row.creative_type!==kind||!Number.isSafeInteger(row.version)||row.version<1||
    row.latest_version!==row.version||
    !['requested','verified','approved','payment_pending','paid','scheduled','live','paused','hidden'].includes(row.campaign_status))
  fail('CANONICAL_PENDING_DRAFT_REQUIRED');
 return row;
}
async function matchingSource(job,store){
 if(await store.checkPrivate(job.bucket)!==true)fail('SOURCE_BUCKET_NOT_PRIVATE');
 let source;
 try{source=await store.readPrivate(job.bucket,job.path)}catch{fail('SOURCE_READ_DENIED')}
 if(!(source instanceof Uint8Array)||source.length!==job.bytes||
    await digest(source)!==job.sha256)fail('SOURCE_SHA256_MISMATCH');
 return source;
}
function sameJob(row,record){
 return row&&row.idempotency_key===record.idempotency_key&&
 row.creative_id===record.creative_id&&
 row.creative_version===record.creative_version&&
 row.campaign_id===record.campaign_id&&
 row.owner_user_id===record.owner_user_id&&
 row.owner_session_id===record.owner_session_id&&
 row.source_asset_id===record.source_asset_id&&
 row.source_bucket===record.source_bucket&&
 row.source_path===record.source_path&&
 row.source_sha256===record.source_sha256&&
 row.source_bytes===record.source_bytes&&
 row.source_mime===record.source_mime&&row.kind===record.kind&&
 ['pending','leased','completed','retry','failed'].includes(row.status);
}
/**
 * Gateway MUST authenticate JWT through existing live Owner+AAL2 authority.
 * authenticate is injected by TRUSTED server only; client owner_id ignored.
 * insertOnce + readJob must use atomic database idempotency and durable readback.
 */
export async function enqueueB7MediaCommand(command,adapters){
 validateSource(command);
 if(!adapters||typeof adapters.authenticate!=='function'||
    typeof adapters.getDraft!=='function'||typeof adapters.insertOnce!=='function'||
    typeof adapters.readJob!=='function'||!adapters.store)
  fail('TRUSTED_GATEWAY_ADAPTER_REQUIRED');
 let identity;
 try{identity=await adapters.authenticate(command.token)}catch{}
 if(!UUID.test(identity?.ownerId||'')||!UUID.test(identity?.sessionId||'')||
    identity.active!==true||identity.aal!=='aal2')
  fail('ACTIVE_OWNER_AAL2_REQUIRED');
 const first=draft(await adapters.getDraft(command.creativeId),
   command.creativeId,command.kind);
 // Source must have been staged privately BEFORE queuing; no bytes or JWT
 // are stored in the durable command payload.
 await matchingSource(command,adapters.store);
 const again=draft(await adapters.getDraft(command.creativeId),
  command.creativeId,command.kind);
 if(again.version!==first.version||again.campaign_id!==first.campaign_id)
  fail('CREATIVE_CHANGED_DURING_PREFLIGHT');
 const still=await adapters.authenticate(command.token).catch(()=>null);
 if(still?.active!==true||still.aal!=='aal2'||
    still.ownerId!==identity.ownerId||still.sessionId!==identity.sessionId)
  fail('OWNER_SESSION_REVOKED');
 const row={
  idempotency_key:command.idempotencyKey,
  owner_user_id:identity.ownerId,owner_session_id:identity.sessionId,
  campaign_id:first.campaign_id,creative_id:first.id,
  creative_version:first.version,kind:command.kind,
  source_asset_id:command.assetId,source_bucket:command.bucket,
  source_path:command.path,source_sha256:command.sha256,
  source_bytes:command.bytes,source_mime:command.mime
 };
 let jobId;
 try{jobId=await adapters.insertOnce(row)}catch{fail('DURABLE_INSERT_FAILED')}
 if(!UUID.test(jobId||''))fail('DURABLE_INSERT_FAILED');
 const saved=await adapters.readJob(jobId);
 if(!sameJob(saved,row)||saved.id!==jobId)
  fail('DURABLE_COMMAND_READBACK_FAILED');
 return Object.freeze({jobId,status:'PRIVATE_MEDIA_COMMAND_QUEUED',
  approved:false,publishable:false,requires:[
   'ISOLATED_WORKER','VERIFIED_PRIVATE_RECEIPT','OWNER_EXPLICIT_APPROVAL',
   'E3_E5_E7']});
}
function asSource(job){
 return {creativeId:job.creative_id,assetId:job.source_asset_id,
  idempotencyKey:job.idempotency_key,kind:job.kind,
  sha256:job.source_sha256,bytes:job.source_bytes,
  bucket:job.source_bucket,path:job.source_path,mime:job.source_mime};
}
/**
 * One lease execution only, never a while(true) scheduler or HTTP endpoint.
 * claimNext is a durable atomic DB lease. A completed receipt must have
 * independently verified readback from the existing private media ledger.
 * processMedia is a trusted isolated-worker adapter to existing sanitizers.
 * No long-lived Owner token or service_role key is passed in the job.
 */
export async function processB7MediaCommand(worker){
 if(!worker||typeof worker.claimNext!=='function'||
    typeof worker.reauthorize!=='function'||typeof worker.getDraft!=='function'||
    typeof worker.processMedia!=='function'||typeof worker.complete!=='function'||
    typeof worker.recordFailure!=='function'||typeof worker.reconcile!=='function'||
    !worker.store)fail('TRUSTED_ISOLATED_WORKER_REQUIRED');
 const job=await worker.claimNext();
 if(job===null)return null;
 if(!UUID.test(job?.id||'')||!UUID.test(job?.lease_id||'')||
    !UUID.test(job.owner_user_id||'')||!UUID.test(job.owner_session_id||'')||
    !UUID.test(job.campaign_id||'')||
    !Number.isSafeInteger(job.creative_version)||job.creative_version<1||
    job.status!=='leased')fail('UNVERIFIED_DURABLE_LEASE');
 validateSource(asSource(job));
 let processed=false,bytes,assetId=null;
 const approved=async()=>await worker.reauthorize({
  ownerId:job.owner_user_id,sessionId:job.owner_session_id
 })===true;
 const check=async()=>{
  if(!await approved())fail('OWNER_REVOKED_OR_NOT_AAL2');
  const cr=draft(await worker.getDraft(job.creative_id),job.creative_id,job.kind);
  if(cr.version!==job.creative_version||cr.campaign_id!==job.campaign_id)
   fail('STALE_CANONICAL_CREATIVE');
 };
 try{
  await check();
  bytes=await matchingSource(asSource(job),worker.store);
  // Sanitizers MUST upload with create-only writes, verify SHA readback,
  // append immutable private ledger receipt and durable orphan on failures.
  const receipt=await worker.processMedia({job,bytes,assertAuthority:check});
  processed=true;
  if(!receipt||!UUID.test(receipt.assetId||'')||
     receipt.creativeId!==job.creative_id||
     receipt.creativeVersion!==job.creative_version||
     receipt.receiptVerified!==true||
     receipt.approved!==false||receipt.publishable!==false)
    fail('PRIVATE_RECEIPT_UNVERIFIED');
  assetId=receipt.assetId;
  await check();
  if(await worker.complete(job.id,job.lease_id,assetId)!==true)
   fail('DURABLE_LEASE_COMPLETION_FAILED');
  return Object.freeze({jobId:job.id,assetId,state:'PRIVATE_EVIDENCE_READY',
   approved:false,publishable:false});
 }catch(e){
  // A processor may already have written private objects before throwing.
  // Preserve reconciliation rather than guessing no side effects happened.
  const code=String(e?.message||'WORKER_ERROR').replace(/[^A-Z0-9_]/g,'_').slice(0,85);
  let persisted=false;
  try{persisted=(await worker.reconcile(job.id,job.lease_id,code,assetId))===true}
  catch{}
  if(!persisted)fail('RECONCILIATION_NOT_DURABLE');
  throw Error('B7_QUEUE_PROCESS_UNVERIFIED');
 }finally{if(bytes instanceof Uint8Array)bytes.fill(0);}
}
