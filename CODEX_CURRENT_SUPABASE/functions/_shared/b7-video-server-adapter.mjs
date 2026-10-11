/**
 * JANTA BOL B7 ADS-011/015 -- production-contract shaped isolated VIDEO
 * worker adapter, REVIEW ONLY. No HTTP route. No client-side service_role.
 * Reuses ORIGINAL canonical owner identity (Auth+AAL2 external verifier)
 * and ORIGINAL ad_creatives/campaign database reader, NO parallel role DB.
 * Three server-only private buckets and three restricted receipt/orphan RPCs.
 * No media approval, feed, URL, or ad activation operation exists here.
 */
import {b7MediaServerEvidence} from './b7-media-server-evidence.mjs';
import {stageB7PrivateVideo,b7VideoPrivateStore} from './b7-video-private-stage.mjs';
const denied=s=>{throw Error('B7_VIDEO_SERVER_'+s)};
export async function processB7IsolatedVideoCandidate({
 token,creativeId,source,name,mime,policy
},{
 client,identifyOwner,allocateId
}={}){
 if(!client||typeof client.rpc!=='function'||!client.storage||
    typeof identifyOwner!=='function'||typeof token!=='string')
  denied('PRIVILEGED_RUNTIME_NOT_CONFIGURED');
 const owner=await identifyOwner(token).catch(()=>null);
 if(!owner)denied('EXISTING_OWNER_AAL2_REQUIRED');
 // Existing draft reader always uses canonical ad_creatives + ad_campaigns,
 // and SQL insert guard independently checks latest version under FOR UPDATE.
 const reader=b7MediaServerEvidence({
  client,identifyOwner,convert:async()=>{},store:{}
 });
 return stageB7PrivateVideo({
  token,creativeId,source,name,mime,policy
 },{
  allocateId,
  authorize:identifyOwner,
  getDraft:(id)=>reader.getDraft(id),
  store:b7VideoPrivateStore(client),
  async recordReceipt(row){
   const {data,error}=await client.rpc('jb_ad_video_record_receipt_server',{p:row});
   return !error&&data===row.asset_id;
  },
  async readReceipt(asset){
   const {data,error}=await client.rpc('jb_ad_video_read_receipt_server',{p_asset:asset});
   if(error||!data)denied('VIDEO_LEDGER_READBACK_FAILED');
   return data;
  },
  async appendOrphan(event){
   const {data,error}=await client.rpc('jb_ad_video_log_orphan_server',{p:event});
   return !error&&data===true;
  }
 });
}
