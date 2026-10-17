import {test} from 'node:test';
import assert from 'node:assert/strict';
import {b7MediaServerEvidence} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-server-evidence.mjs';
const owner='11111111-1111-4111-8111-111111111111';
const creativeId='22222222-2222-4222-8222-222222222222';
const campaignId='33333333-3333-4333-8333-333333333333';
function fixture(options={}){
 const calls=[];
 const server={
  rpc:async(fn,arg)=>{
   calls.push({type:'rpc',fn,arg});
   if(options.missingRPC)return {data:null,error:{message:'no such function'}};
   if(fn==='jb_ad_media_record_receipt_server')return {data:arg.p.asset_id,error:null};
   if(fn==='jb_ad_media_read_receipt_server')return {data:{asset_id:arg.p_asset,approval_state:'private_quarantined'},error:null};
   if(fn==='jb_ad_media_log_orphan_server')return {data:true,error:null};
   throw Error('unexpected RPC');
  },
  from:table=>{
   const filters=[];
   const qry={
    select:cols=>{calls.push({type:'read',table,cols});return qry;},
    eq:(col,val)=>{filters.push([col,val]);return qry;},
    order:()=>qry,limit:()=>qry,
    single:async()=>{
     if(options.missingDraft)return {data:null,error:{message:'missing'}};
     if(table==='ad_campaigns')return {data:{status:'requested'},error:null};
     if(filters.some(([c])=>c==='id'))return {data:{id:creativeId,campaign_id:campaignId,
       creative_type:'image',approved:false,version:2},error:null};
     return {data:{version:2},error:null};
    }
   };return qry;
  }
 };
 const api=b7MediaServerEvidence({client:server,identifyOwner:async token=>token==='valid'?owner:null,
  convert:async()=>{},store:{}});
 return {api,calls};
}
test('User ID can NEVER bypass canonical Owner/AAL2 verification',async()=>{
 const {api,calls}=fixture();
 assert.equal(await api.authorize('valid',owner),true);
 assert.equal(await api.authorize('stolen-session',owner),false);
 assert.equal(await api.authorize('valid',creativeId),false);
 assert.equal(calls.length,0);
});
test('Server service-only DB adapter reads existing Creative SOT with latest-version and Campaign, no writes',async()=>{
 const {api,calls}=fixture();
 const row=await api.getDraft(creativeId);
 assert.equal(row.campaign_id,campaignId);assert.equal(row.creative_type,'image');
 assert.equal(row.latest_version,2);assert.equal(row.campaign_status,'requested');
 assert.deepEqual(calls.map(c=>c.type),['read','read','read']);
});
test('Only 3 approved service-role RPC contract names used, no public URL or media approval',async()=>{
 const {api,calls}=fixture();
 const asset='44444444-4444-4444-8444-444444444444';
 assert.equal(await api.recordReceipt({asset_id:asset,creative_id:creativeId}),true);
 assert.equal((await api.readReceipt(asset)).approval_state,'private_quarantined');
 assert.equal(await api.appendOrphan({assetId:asset,reason:'PRIVATE_STORAGE_FAILED',
  objects:[{bucket:'jb-ad-originals-private',path:'staged/safe'}]}),true);
 assert.deepEqual(calls.map(v=>v.fn),[
  'jb_ad_media_record_receipt_server',
  'jb_ad_media_read_receipt_server',
  'jb_ad_media_log_orphan_server']);
 assert(!JSON.stringify(api).includes('publicUrl'));
});
test('Missing private migrations, bad creative ID or unavailable source always deny',async()=>{
 const {api}=fixture({missingRPC:true,missingDraft:true});
 const asset='44444444-4444-4444-8444-444444444444';
 assert.equal(await api.recordReceipt({asset_id:asset}),false);
 assert.equal(await api.appendOrphan({assetId:asset,objects:[{}]}),false);
 await assert.rejects(api.readReceipt(asset),/PRIVATE_RECEIPT_NOT_READABLE/);
 await assert.rejects(api.getDraft(creativeId),/CANONICAL_CREATIVE_NOT_FOUND/);
 await assert.rejects(api.getDraft('bad'),/INVALID_CREATIVE_ID/);
});
