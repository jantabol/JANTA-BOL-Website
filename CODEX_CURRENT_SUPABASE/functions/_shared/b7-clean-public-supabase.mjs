/**
 * B7 first-party CLEAN media publication candidate -- REVIEW ONLY.
 * Actual Supabase Storage/SQL adapter. No HTTP route, no direct UI
 * service_role, no Owner approval, no public ad selection authority.
 * The dedicated public bucket contains ONLY sanitized derivatives after
 * explicit Owner release intent, never original uploads.
 */
import {identifyB7OwnerAal2} from './b7-owner-identity.mjs';
import {b7MediaServerEvidence} from './b7-media-server-evidence.mjs';
import {prepareB7PublicRelease,CLEAN_PUBLIC_BUCKET} from './b7-public-release-worker.mjs';
const fail=x=>{throw Error('B7_PUBLIC_GATEWAY_'+x)};
const safePath=p=>typeof p==='string'&&
 /^creative\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9]{64}\.(png|mp4)$/.test(p);
const contentType=(path)=>path.endsWith('.mp4')?'video/mp4':'image/png';
export function b7CleanPublicSupabaseStore(client){
 if(!client?.storage?.getBucket||!client?.storage?.from)
  fail('SERVER_STORAGE_ADAPTER_REQUIRED');
 const store={
  async checkPublicBucket(bucket){
   if(bucket!==CLEAN_PUBLIC_BUCKET)return false;
   try{
    const {data,error}=await client.storage.getBucket(bucket);
    return !error&&data?.id===CLEAN_PUBLIC_BUCKET&&data.public===true&&
      Number(data.file_size_limit)>=8388608&&
      Array.isArray(data.allowed_mime_types)&&
      ['image/png','video/mp4'].every(t=>data.allowed_mime_types.includes(t));
   }catch{return false}
  },
  async putPublicCreateOnly(bucket,path,bytes,mime){
   if(bucket!==CLEAN_PUBLIC_BUCKET||!safePath(path)||
      !(bytes instanceof Uint8Array)||bytes.length<32||bytes.length>8388608||
      contentType(path)!==mime||!await store.checkPublicBucket(bucket))
    return false;
   const data=new Uint8Array(bytes);
   const {error}=await client.storage.from(CLEAN_PUBLIC_BUCKET).upload(
     path,new Blob([data],{type:mime}),
     {upsert:false,contentType:mime,cacheControl:'31536000'});
   return !error;
  },
  async readPublic(bucket,path){
   if(bucket!==CLEAN_PUBLIC_BUCKET||!safePath(path)||
      !await store.checkPublicBucket(bucket))
    fail('PUBLIC_STORAGE_NOT_SAFE');
   const {data,error}=await client.storage.from(bucket).download(path);
   if(error||!data||data.size>8388608)fail('PUBLIC_READBACK_UNAVAILABLE');
   return new Uint8Array(await data.arrayBuffer());
  }
 };
 return Object.freeze(store);
}
/**
 * Only separate private worker injects privileged client. The token is
 * NEVER stored in a durable job / returned in any response or audit event.
 */
export async function processB7CleanReleaseCandidate(input,{
 client,supabaseUrl,anonKey,fetcher
}={}){
 if(!client?.rpc||!client?.from||!supabaseUrl||!anonKey)
  fail('ISOLATED_PRIVILEGED_WORKER_NOT_CONFIGURED');
 const identifyOwner=jwt=>identifyB7OwnerAal2(jwt,{
  baseUrl:supabaseUrl,anonKey,request:fetcher??fetch
 });
 const reader=b7MediaServerEvidence({
  client,identifyOwner,convert:async()=>{},store:{}
 });
 const publicStore=b7CleanPublicSupabaseStore(client);
 return prepareB7PublicRelease(input,{
  verifyOwner:identifyOwner,
  loadCreative:id=>reader.getDraft(id),
  async loadReceipt(asset,kind){
   const fn=kind==='video'?'jb_ad_video_read_receipt_server':
    'jb_ad_media_read_receipt_server';
   const {data,error}=await client.rpc(fn,{p_asset:asset});
   if(error||!data)fail('PRIVATE_ASSET_LEDGER_NOT_DEPLOYED');
   return data;
  },
  async readPrivate(bucket,path){
   if(!['jb-ad-previews-private','jb-ad-videos-private',
        'jb-ad-video-posters-private'].includes(bucket)||
      !/^staged\/[a-f0-9-]{36}\/[a-f0-9]{64}\.(png|mp4)$/.test(path))
    fail('PRIVATE_DERIVATIVE_OR_PATH_UNTRUSTED');
   const {data,error}=await client.storage.from(bucket).download(path);
   if(error||!data||data.size>8388608)
    fail('PRIVATE_SOURCE_READBACK_FAILED');
   return new Uint8Array(await data.arrayBuffer());
  },
  ...publicStore,
  async recordRelease(x){
   const {data,error}=await client.rpc('jb_ad_clean_record_release_server',{p:x});
   return !error&&data===x.asset_id;
  },
  async readRelease(asset){
   const {data,error}=await client.rpc('jb_ad_clean_read_release_server',{p_asset:asset});
   if(error||!data)fail('RELEASE_ATTESTATION_NOT_DEPLOYED');
   return data;
  },
  async auditOrphan(x){
   const {data,error}=await client.rpc('jb_ad_clean_orphan_release_server',{p:x});
   return !error&&data===true;
  }
 });
}
