/**
 * B7 ADS-015: private creative-to-verified-storage receipt coordination.
 * REVIEW_ONLY. NOT a publish / approval API.
 * A single existing ad_creatives row remains the canonical creative SOT.
 * Caller supplies trusted, *durable* service-only append/readback adapters.
 * No direct client access, no content URLs, no Production deployment.
 */
import {stageB7Image} from './b7-private-media-stage.mjs';
const fail=s=>{throw Error('B7_MEDIA_COORD_'+s)};
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
function canonical(row,id){
 if(!row||row.id!==id||!uuid(row.campaign_id)||row.creative_type!=='image'||
    row.approved!==false||!Number.isSafeInteger(row.version)||row.version<1||
    row.latest_version!==row.version||
    ['rejected','cancelled'].includes(row.campaign_status)||
    !['requested','verified','approved','payment_pending','paid','live','paused','hidden','scheduled'].includes(row.campaign_status))
  fail('DRAFT_NOT_LATEST_APPROVABLE_IMAGE');
 return row;
}
async function orphanLog(adapter,assetId,files,reason){
 // An alert or console log is NOT a durable forensic record.
 const event={assetId,objects:files,status:'RECONCILIATION_REQUIRED',reason};
 let ok=false;try{ok=await adapter.appendOrphan(event)===true}catch{}
 if(!ok)fail('ORPHAN_NOT_DURABLY_RECORDED');
}
export async function linkB7VerifiedPrivateMedia(input,adapter){
 const {token,creativeId,ownerId,bytes,name,mime}=input||{};
 if(!uuid(creativeId)||!uuid(ownerId)||!adapter||
    typeof adapter.authorize!=='function'||typeof adapter.getDraft!=='function'||
    typeof adapter.recordReceipt!=='function'||typeof adapter.readReceipt!=='function'||
    typeof adapter.appendOrphan!=='function'||typeof adapter.convert!=='function'||
    !adapter.store)fail('MISSING_TRUSTED_DEPENDENCIES');
 // Original canonical Draft approval and latest-version constraints.
 // These checks are repeated AFTER storage to catch Owner/session revoke
 // and other concurrent creative saves while a multi-MiB image is decoded.
 let allowed=false;try{allowed=await adapter.authorize(token,ownerId)===true}catch{}
 if(!allowed)fail('OWNER_AAL2_REQUIRED');
 let before;
 try{before=canonical(await adapter.getDraft(creativeId),creativeId)}
 catch{fail('CREATIVE_NOT_ELIGIBLE')}
 const staged=await stageB7Image({token,bytes,name,mime},{
   authorize:async t=>adapter.authorize(t,ownerId),
   convert:adapter.convert,store:adapter.store,
   onOrphan:async e=>{
     await orphanLog(adapter,e.assetId,e.objects,'PRIVATE_STORAGE_FAILED');
     return true;
   },
   allocateId:adapter.allocateId
 });
 const paths=[
  {bucket:staged.source.bucket,path:staged.source.path},
  {bucket:staged.derivative.bucket,path:staged.derivative.path}
 ];
 try{
  if(await adapter.authorize(token,ownerId)!==true)
   fail('OWNER_REVOKED_AFTER_IMAGE_PROCESS');
  const after=canonical(await adapter.getDraft(creativeId),creativeId);
  if(after.campaign_id!==before.campaign_id||after.version!==before.version)
   fail('CONCURRENT_CREATIVE_CHANGED');
  const payload={
   asset_id:staged.assetId,campaign_id:after.campaign_id,creative_id:creativeId,
   creative_version:after.version,owner_user_id:ownerId,
   source_bucket:staged.source.bucket,source_path:staged.source.path,
   source_sha256:staged.source.sha256,source_mime:staged.source.mime,
   source_bytes:staged.source.bytes,
   derivative_bucket:staged.derivative.bucket,
   derivative_path:staged.derivative.path,
   derivative_sha256:staged.derivative.sha256,
   derivative_mime:staged.derivative.mime,
   derivative_bytes:staged.derivative.bytes,
   width:staged.derivative.width,height:staged.derivative.height,
   storage_readback_verified_at:new Date().toISOString()
  };
  // Adapter MUST fail rather than fabricate a receipt when the private
  // service-role DDL/migration is not actually installed.
  if(await adapter.recordReceipt(payload)!==true)fail('PERSIST_REJECTED');
  const actual=await adapter.readReceipt(staged.assetId);
  if(!actual||actual.asset_id!==payload.asset_id||
     actual.campaign_id!==payload.campaign_id||
     actual.creative_id!==payload.creative_id||
     actual.creative_version!==payload.creative_version||
     actual.owner_user_id!==payload.owner_user_id||
     actual.source_path!==payload.source_path||
     actual.source_sha256!==payload.source_sha256||
     actual.derivative_path!==payload.derivative_path||
     actual.derivative_sha256!==payload.derivative_sha256||
     actual.approval_state!=='private_quarantined')
   fail('RECEIPT_READBACK_MISMATCH');
  return Object.freeze({
   assetId:payload.asset_id,creativeId,version:payload.creative_version,
   state:'VERIFIED_PRIVATE_EVIDENCE_ONLY',
   approved:false,publishable:false,
   remaining:['OWNER_EXPLICIT_APPROVAL','PUBLIC_CLEAN_RENDITION',
              'REAL_E3_E5_E7_AND_FOUNDERSIGNOFF']
  });
 }catch(_){
  // Storage has already succeeded; DO NOT delete arbitrary objects or lie
  // that DB persist succeeded. Durable reconcile event required.
  await orphanLog(adapter,staged.assetId,paths,'RECEIPT_OR_OWNER_STATE_FAILED');
  fail('PRIVATE_EVIDENCE_NOT_COMPLETE');
 }
}
