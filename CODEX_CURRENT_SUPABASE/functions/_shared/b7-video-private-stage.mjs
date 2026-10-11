/**
 * B7 ADS-011/015 — isolated VIDEO+POSTER private quarantine.
 * REVIEW ONLY: not an HTTP endpoint or deployment. Never exposes URLs,
 * never approves creatives, and never places unreviewed media in public.
 *
 * Dependencies must come from a separate privileged worker, NOT Owner UI.
 * The owner credential must be rechecked after real codec processing before
 * recording evidence, and the canonical Creative latest version must match.
 */
import {randomUUID,createHash} from 'node:crypto';
import {sanitizeB7PrivateVideo} from './b7-video-sanitize.mjs';

export const B7_VIDEO_BUCKET='jb-ad-videos-private';
export const B7_POSTER_BUCKET='jb-ad-video-posters-private';
const fail=s=>{throw Error('B7_VIDEO_STAGE_'+s)};
const digest=b=>createHash('sha256').update(b).digest('hex');
const uuid=s=>typeof s==='string'&&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const permitted=['requested','verified','approved','payment_pending','paid','live','paused','hidden','scheduled'];
function draft(row,id){
 if(!row||row.id!==id||!uuid(row.campaign_id)||
    row.creative_type!=='video'||row.approved!==false||
    !Number.isInteger(row.version)||row.version<1||
    row.version!==row.latest_version||
    !permitted.includes(row.campaign_status))
  fail('CANONICAL_VIDEO_DRAFT_REQUIRED');
 return row;
}
async function orphan(sink,id,paths,reason){
 let ok=false;
 try{ok=(await sink({assetId:id,objects:paths,reason,status:'RECONCILIATION_REQUIRED'}))===true}
 catch{}
 if(!ok)fail('DURABLE_ORPHAN_AUDIT_REQUIRED');
}
export async function stageB7PrivateVideo(input,dep){
 const {token,creativeId,source,name,mime,policy}=input||{};
 if(!dep||typeof dep.authorize!=='function'||typeof dep.getDraft!=='function'||
    typeof dep.store?.checkPrivate!=='function'||
    typeof dep.store?.createOnly!=='function'||
    typeof dep.store?.readPrivate!=='function'||
    typeof dep.recordReceipt!=='function'||typeof dep.readReceipt!=='function'||
    typeof dep.appendOrphan!=='function'||!uuid(creativeId)||
    !(source instanceof Uint8Array))
  fail('UNTRUSTED_DEPENDENCY_OR_SOURCE');
 const id=(dep.allocateId||randomUUID)();
 if(!uuid(id))fail('INVALID_ASSET_ID');
 let owner=null;try{owner=await dep.authorize(token)}catch{}
 if(!uuid(owner))fail('OWNER_AAL2_REQUIRED');
 const before=draft(await dep.getDraft(creativeId),creativeId);
 for(const bucket of [B7_VIDEO_BUCKET,B7_POSTER_BUCKET])
  if(await dep.store.checkPrivate(bucket)!==true)fail('PRIVATE_BUCKET_UNAVAILABLE');
 const sanitized=await sanitizeB7PrivateVideo({source,name,mime,policy});
 if(!sanitized||sanitized.canApprove!==false||sanitized.canPublish!==false||
    sanitized.status!=='PRIVATE_VIDEO_AND_POSTER_NOT_STORED_NOT_APPROVED'||
    !(sanitized.privateCleanMp4 instanceof Uint8Array)||
    !(sanitized.privatePosterPng instanceof Uint8Array)||
    sanitized.sourceSha256!==digest(source)||
    sanitized.videoSha256!==digest(sanitized.privateCleanMp4)||
    sanitized.posterSha256!==digest(sanitized.privatePosterPng))
  fail('SERVER_CODEC_EVIDENCE_MISMATCH');
 // No approved public bucket or URL exists at this stage.
 const paths=[
  {bucket:B7_VIDEO_BUCKET,path:'staged/'+id+'/'+sanitized.videoSha256+'.mp4',
   bytes:sanitized.privateCleanMp4,mime:'video/mp4',sha256:sanitized.videoSha256},
  {bucket:B7_POSTER_BUCKET,path:'staged/'+id+'/'+sanitized.posterSha256+'.png',
   bytes:sanitized.privatePosterPng,mime:'image/png',sha256:sanitized.posterSha256}
 ];
 const written=[];
 const storageVerify=async()=>{
  for(const f of paths){
   if(await dep.store.createOnly(f.bucket,f.path,f.bytes,f.mime)!==true)
    fail('IMMUTABLE_CREATE_ONLY_FAILED');
   written.push({bucket:f.bucket,path:f.path});
   const copied=await dep.store.readPrivate(f.bucket,f.path);
   if(!(copied instanceof Uint8Array)||copied.length!==f.bytes.length||
      digest(copied)!==f.sha256)fail('PRIVATE_READBACK_HASH_MISMATCH');
  }
 };
 try{await storageVerify()}
 catch{
  if(written.length)await orphan(dep.appendOrphan,id,written,'PRIVATE_STORAGE_FAILED');
  fail('PRIVATE_STORAGE_UNVERIFIED');
 }
 try{
  if(await dep.authorize(token)!==owner)
   fail('OWNER_REVOKED_AFTER_UPLOAD');
  const after=draft(await dep.getDraft(creativeId),creativeId);
  if(after.campaign_id!==before.campaign_id||
     after.version!==before.version)fail('STALE_VIDEO_CREATIVE');
  const record={
   asset_id:id,creative_id:creativeId,campaign_id:after.campaign_id,
   creative_version:after.version,owner_user_id:owner,
   original_sha256:sanitized.sourceSha256,
   source_bytes:source.length,
   video_bucket:B7_VIDEO_BUCKET,video_path:paths[0].path,
   video_sha256:paths[0].sha256,video_bytes:paths[0].bytes.length,
   poster_bucket:B7_POSTER_BUCKET,poster_path:paths[1].path,
   poster_sha256:paths[1].sha256,poster_bytes:paths[1].bytes.length,
   width:sanitized.derived.width,height:sanitized.derived.height,
   duration_seconds:sanitized.derived.durationSeconds,
   storage_readback_verified_at:new Date().toISOString()
  };
  if(await dep.recordReceipt(record)!==true)fail('PRIVATE_RECEIPT_INSERT_FAILED');
  const saved=await dep.readReceipt(id);
  if(!saved||saved.asset_id!==id||saved.creative_id!==creativeId||
     saved.campaign_id!==before.campaign_id||
     saved.creative_version!==before.version||
     saved.owner_user_id!==owner||
     saved.video_path!==record.video_path||
     saved.video_sha256!==record.video_sha256||
     saved.poster_path!==record.poster_path||
     saved.poster_sha256!==record.poster_sha256||
     saved.approval_state!=='private_quarantined')
   fail('PRIVATE_RECEIPT_READBACK_UNVERIFIED');
  return Object.freeze({
   assetId:id,creativeId,version:before.version,
   status:'PRIVATE_VIDEO_POSTER_EVIDENCE_NOT_APPROVED',
   approved:false,publishable:false,
   pending:['REAL_OWNER_E5','PUBLIC_CLEAN_ASSET_APPROVAL',
    'DURABLE_WORKER_DEPLOYMENT','ANDROID_E3','PRODUCTION_E7']
  });
 }catch{
  await orphan(dep.appendOrphan,id,written,'RECEIPT_OR_OWNER_STATE_FAILED');
  fail('PRIVATE_EVIDENCE_UNVERIFIED');
 }
}
/** Separate privileged Supabase client; no bucket creation or public URLs. */
export function b7VideoPrivateStore(client){
 if(!client?.storage?.getBucket||!client?.storage?.from)
  fail('ISOLATED_SERVER_CLIENT_REQUIRED');
 const allowed=new Map([[B7_VIDEO_BUCKET,{mime:'video/mp4',max:8388608}],
  [B7_POSTER_BUCKET,{mime:'image/png',max:2097152}]]);
 const guard=(bucket,path)=>{
  if(!allowed.has(bucket))fail('BUCKET_NOT_ALLOWED');
  if(path!==undefined&&!/^staged\/[a-f0-9-]{36}\/[a-f0-9]{64}\.(?:mp4|png)$/.test(path))
   fail('PRIVATE_PATH_NOT_CANONICAL');
  if(path!==undefined&&!(path.endsWith('.mp4')=== (bucket===B7_VIDEO_BUCKET)))
   fail('PRIVATE_PATH_MEDIA_MISMATCH');
 };
 const out={
  async checkPrivate(bucket){
   guard(bucket);
   try{
    const {data,error}=await client.storage.getBucket(bucket);
    return !error&&data?.id===bucket&&data.public===false&&
      Number(data.file_size_limit)>=allowed.get(bucket).max;
   }catch{return false}
  },
  async createOnly(bucket,path,bytes,mime){
   guard(bucket,path);
   const cap=allowed.get(bucket);
   if(!await out.checkPrivate(bucket)||!(bytes instanceof Uint8Array)||
      bytes.length<32||bytes.length>cap.max||mime!==cap.mime)return false;
   // Storage API upload is an immutable create, never an overwrite.
   const body=new Uint8Array(bytes);
   const {error}=await client.storage.from(bucket).upload(path,
    new Blob([body],{type:mime}),{
      contentType:mime,cacheControl:'0',upsert:false});
   return !error;
  },
  async readPrivate(bucket,path){
   guard(bucket,path);
   if(!await out.checkPrivate(bucket))fail('BUCKET_VISIBILITY_CHANGED');
   const {data,error}=await client.storage.from(bucket).download(path);
   if(error||!data||data.size>allowed.get(bucket).max)
    fail('PRIVATE_DOWNLOAD_DENIED');
   return new Uint8Array(await data.arrayBuffer());
  }
 };
 return Object.freeze(out);
}
