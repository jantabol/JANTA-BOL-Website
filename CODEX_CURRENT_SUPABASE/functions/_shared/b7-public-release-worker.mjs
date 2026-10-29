/**
 * B7 ADS-010/011 PUBLIC RENDITION HANDOFF -- REVIEW ONLY, UNDEPLOYED.
 *
 * This is NOT an HTTP endpoint, not Owner authentication, not creative
 * approval and not a new public ad selection authority. Only already
 * sanitized bytes from existing immutable PRIVATE receipts may be copied.
 * The source/original object is NEVER copied into public Storage.
 *
 * Explicit Owner intent is required before *any* publicly readable write.
 * A failed approval cannot claim success: the published candidate files
 * remain forensic ORPHANS requiring audited reconciliation.
 */
import {createHash} from 'node:crypto';
export const CLEAN_PUBLIC_BUCKET='jb-ad-clean-public';
const err=code=>{throw Error('B7_RELEASE_'+code)};
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x);
const sha=x=>createHash('sha256').update(x).digest('hex');
const eligiblePendingCampaignStates=Object.freeze([
 'requested','verified','approved','payment_pending','paid',
 'scheduled','live','paused','hidden'
]);
const canon=(r,creativeId)=>{
 // All unknown, unrecognized, expired, cancelled and rejected states deny
 // copying an ad asset to the publicly readable candidate bucket.
 // A missing campaign_status from the trusted DB join is NEVER consent.
 if(!r||r.id!==creativeId||!uuid(r.campaign_id)||
 !['image','video'].includes(r.creative_type)||r.approved!==false||
 !Number.isInteger(r.version)||r.version<1||r.latest_version!==r.version||
 !eligiblePendingCampaignStates.includes(r.campaign_status))
  err('NOT_LATEST_PENDING_CREATIVE');
 return r;
};
const mime=(kind)=>kind==='video'?'video/mp4':'image/png';
const extension=kind=>kind==='video'?'mp4':'png';
function files(receipt,creative){
 if(receipt?.creative_id!==creative.id||
    receipt.campaign_id!==creative.campaign_id||
    receipt.creative_version!==creative.version||
    receipt.approval_state!=='private_quarantined'||!uuid(receipt.asset_id))
  err('CANONICAL_PRIVATE_RECEIPT_MISMATCH');
 const video=creative.creative_type==='video';
 const items=video?[
  {bucket:'jb-ad-videos-private',path:receipt.video_path,hash:receipt.video_sha256,
   kind:'video',max:8388608},
  {bucket:'jb-ad-video-posters-private',path:receipt.poster_path,hash:receipt.poster_sha256,
   kind:'poster',max:2097152}
 ]:[
  {bucket:'jb-ad-previews-private',path:receipt.derivative_path,hash:receipt.derivative_sha256,
   kind:'image',max:8388608}
 ];
 const assetId=receipt.asset_id;
 for(const f of items){
  const ext=extension(f.kind),type=mime(f.kind);
  if(typeof f.hash!=='string'||!/^[a-f0-9]{64}$/.test(f.hash)||
     f.path!=='staged/'+assetId+'/'+f.hash+'.'+ext)
   err('PRIVATE_PATH_OR_DIGEST_INVALID');
  f.mediaType=type;
  f.publicPath='creative/'+creative.id+'/'+assetId+'/'+f.hash+'.'+ext;
 }
 return items;
}
async function forensic(dep,assetId,created,code){
 if(!created.length)return;
 let ok=false;
 try{ok=(await dep.auditOrphan({assetId,objects:created,reason:code}))===true}catch{}
 if(!ok)err('DURABLE_PUBLIC_ORPHAN_AUDIT_REQUIRED');
}
export async function prepareB7PublicRelease(input,dep){
 const {token,creativeId,assetId,approvalIntent}=input||{};
 if(!uuid(creativeId)||!uuid(assetId)||!dep||
    typeof dep.verifyOwner!=='function'||typeof dep.loadCreative!=='function'||
    typeof dep.loadReceipt!=='function'||typeof dep.readPrivate!=='function'||
    typeof dep.checkPublicBucket!=='function'||typeof dep.putPublicCreateOnly!=='function'||
    typeof dep.readPublic!=='function'||typeof dep.recordRelease!=='function'||
    typeof dep.readRelease!=='function'||typeof dep.auditOrphan!=='function')
  err('TRUSTED_SERVER_ONLY_DEPS_REQUIRED');
 // No bytes become public until a deliberate, exact, matched Owner action.
 if(!approvalIntent||approvalIntent.action!=='B7_EXPLICIT_MEDIA_RELEASE_V1'||
    approvalIntent.creativeId!==creativeId||approvalIntent.assetId!==assetId)
  err('EXPLICIT_OWNER_INTENT_REQUIRED');
 let owner=null;try{owner=await dep.verifyOwner(token)}catch{}
 if(!uuid(owner))err('OWNER_AAL2_REQUIRED');
 const before=canon(await dep.loadCreative(creativeId),creativeId);
 if(approvalIntent.version!==before.version)err('STALE_RELEASE_CONSENT');
 const receipt=await dep.loadReceipt(assetId,before.creative_type);
 if(receipt?.asset_id!==assetId||receipt.owner_user_id!==owner)
  err('PRIVATE_ASSET_OWNER_MISMATCH');
 const objects=files(receipt,before);
 if(await dep.checkPublicBucket(CLEAN_PUBLIC_BUCKET)!==true)
  err('FIRST_PARTY_PUBLIC_BUCKET_NOT_VERIFIED');
 // Verify the private derivative hash BEFORE the public write. Nothing
 // from the original source, client-provided URL or unverified media passes.
 const ready=[];
 for(const f of objects){
  const bytes=await dep.readPrivate(f.bucket,f.path);
  if(!(bytes instanceof Uint8Array)||bytes.length<32||
     bytes.length>f.max||sha(bytes)!==f.hash)
    err('PRIVATE_SANITIZED_DERIVATIVE_HASH_MISMATCH');
  ready.push({bucket:CLEAN_PUBLIC_BUCKET,path:f.publicPath,
   mime:f.mediaType,bytes,sha256:f.hash});
 }
 // Authorization + latest draft is rechecked immediately before write.
 if(await dep.verifyOwner(token)!==owner)err('OWNER_REVOKED_BEFORE_RELEASE');
 const recheck=canon(await dep.loadCreative(creativeId),creativeId);
 if(recheck.campaign_id!==before.campaign_id||
    recheck.version!==before.version||recheck.creative_type!==before.creative_type)
  err('CREATIVE_CHANGED_BEFORE_RELEASE');
 const created=[];
 try{
  for(const f of ready){
   if(await dep.putPublicCreateOnly(f.bucket,f.path,f.bytes,f.mime)!==true)
    err('PUBLIC_IMMUTABLE_CREATE_FAILED');
   created.push({bucket:f.bucket,path:f.path});
   const proof=await dep.readPublic(f.bucket,f.path);
   if(!(proof instanceof Uint8Array)||proof.length!==f.bytes.length||
      sha(proof)!==f.sha256)err('PUBLIC_STORAGE_HASH_MISMATCH');
  }
  if(await dep.verifyOwner(token)!==owner)
   err('OWNER_REVOKED_AFTER_PUBLIC_COPY');
  const latest=canon(await dep.loadCreative(creativeId),creativeId);
  if(latest.version!==before.version||
     latest.campaign_id!==before.campaign_id||
     latest.creative_type!==before.creative_type)
   err('CREATIVE_CHANGED_AFTER_PUBLIC_COPY');
  const record={
   asset_id:assetId,campaign_id:before.campaign_id,
   creative_id:creativeId,creative_version:before.version,
   owner_user_id:owner,media_type:before.creative_type,
   clean_public_bucket:CLEAN_PUBLIC_BUCKET,
   media_path:ready[0].path,media_sha256:ready[0].sha256,
   poster_path:ready[1]?.path??null,poster_sha256:ready[1]?.sha256??null,
   verified_at:new Date().toISOString(),
   approval_state:'awaiting_atomic_owner_approval'
  };
  if(await dep.recordRelease(record)!==true)err('RELEASE_RECEIPT_FAILED');
  const stored=await dep.readRelease(assetId);
  if(!stored||stored.asset_id!==assetId||
     stored.campaign_id!==before.campaign_id||
     stored.creative_id!==creativeId||
     stored.creative_version!==before.version||
     stored.owner_user_id!==owner||
     stored.media_type!==before.creative_type||
     stored.clean_public_bucket!==CLEAN_PUBLIC_BUCKET||
     stored.media_path!==record.media_path||
     stored.media_sha256!==record.media_sha256||
     stored.poster_path!==record.poster_path||
     stored.poster_sha256!==record.poster_sha256||
     stored.approval_state!=='awaiting_atomic_owner_approval')
    err('RELEASE_RECEIPT_READBACK_FAILED');
  // The existing Creative approval RPC must still gate publication.
  return Object.freeze({
   assetId,creativeId,status:'PUBLIC_ASSET_CANDIDATE_PENDING_ATOMIC_OWNER_APPROVAL',
   approved:false,publishable:false,
   mediaType:before.creative_type,privateOriginalNeverCopied:true,
   nextGate:'CANONICAL_OWNER_APPROVE_MEDIA_CREATIVE_NOT_IMPLEMENTED'
  });
 }catch(_){
  await forensic(dep,assetId,created,'RELEASE_OR_OWNER_STATE_FAILED');
  err('PUBLIC_RELEASE_NOT_VERIFIED');
 }
}
