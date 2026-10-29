/**
 * B7 ADS-015 only: server service_role adapter to unchanged canonical
 * public.ad_creatives and review-only service-execute receipts RPC.
 * Source reads are for preflight, DB trigger revalidates latest at INSERT.
 * NOT deployed. No publish, ad activation or public file URL methods.
 */
const denied=s=>{throw Error('B7_MEDIA_SERVER_ADAPTER_'+s)};
const valid=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export function b7MediaServerEvidence({
 client,identifyOwner,convert,store,allocateId
}){
 if(!client||typeof client.rpc!=='function'||typeof client.from!=='function'||
    typeof identifyOwner!=='function'||typeof convert!=='function'||!store)
  denied('SERVER_DEPENDENCIES_REQUIRED');
 return Object.freeze({
  convert,store,allocateId,
  async authorize(token,ownerId){
   if(!valid(ownerId))return false;
   let id=null;
   try{id=await identifyOwner(token)}catch{}
   // Important: caller-provided Owner ID is never taken as authority.
   return id===ownerId;
  },
  async getDraft(creativeId){
   if(!valid(creativeId))denied('INVALID_CREATIVE_ID');
   // This read is not an approval decision and never writes data.
   // PostgreSQL guard compares latest version atomically during INSERT.
   const {data:creative,error:ce}=await client.from('ad_creatives')
    .select('id,campaign_id,creative_type,approved,version')
    .eq('id',creativeId).single();
   if(ce||!creative||!valid(creative.campaign_id))
    denied('CANONICAL_CREATIVE_NOT_FOUND');
   const {data:last,error:le}=await client.from('ad_creatives')
    .select('version').eq('campaign_id',creative.campaign_id)
    .order('version',{ascending:false}).limit(1).single();
   if(le||!last||!Number.isInteger(last.version))
    denied('LATEST_CREATIVE_VERSION_UNAVAILABLE');
   const {data:campaign,error:pe}=await client.from('ad_campaigns')
    .select('status').eq('id',creative.campaign_id).single();
   if(pe||!campaign)denied('CANONICAL_CAMPAIGN_MISSING');
   return {...creative,latest_version:last.version,
    campaign_status:campaign.status};
  },
  async recordReceipt(receipt){
   if(!valid(receipt?.asset_id))return false;
   const {data,error}=await client.rpc('jb_ad_media_record_receipt_server',{p:receipt});
   return !error&&data===receipt.asset_id;
  },
  async readReceipt(assetId){
   if(!valid(assetId))denied('INVALID_ASSET_ID');
   const {data,error}=await client.rpc('jb_ad_media_read_receipt_server',{p_asset:assetId});
   if(error||!data)denied('PRIVATE_RECEIPT_NOT_READABLE');
   return data;
  },
  async appendOrphan(event){
   if(!valid(event?.assetId)||!Array.isArray(event?.objects)||
      event.objects.length<1||event.objects.length>2)return false;
   const {data,error}=await client.rpc('jb_ad_media_log_orphan_server',{p_event:event});
   return !error&&data===true;
  }
 });
}
