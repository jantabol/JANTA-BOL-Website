import {assert,assertEquals,assertRejects} from 'jsr:@std/assert@1.0.14';
import {ImageMagick,initializeImageMagick,MagickFormat,MagickColor} from 'npm:@imagemagick/magick-wasm@0.0.30';
import {processB7PrivateImageJob} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-image-job.ts';
import {inspectCleanPngContainer} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-byte-policy.mjs';

const wasm=await Deno.readFile(new URL('magick.wasm',
  import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.30')));
await initializeImageMagick(wasm);
const owner='11111111-1111-4111-8111-111111111111';
const campaign='33333333-3333-4333-8333-333333333333';
const creative='22222222-2222-4222-8222-222222222222';
const token='a'.repeat(100);
const input=(override:Record<string,unknown>={})=>({
 token,creativeId:creative,name:'ad.png',mime:'image/png',
 bytes:ImageMagick.read(new MagickColor('blue'),720,400,
  img=>img.write(MagickFormat.Png,out=>Uint8Array.from(out))),
 ...override
});
function fakeInfra(settings:{revokeAt?:number;badBucket?:boolean;badReceipt?:boolean}={}){
 const stored=new Map<string,Uint8Array>(),receipt=new Map<string,unknown>();
 const events:unknown[]=[];
 let identifyCalls=0,uploads=0;
 const fetcher=async(raw:string|URL|Request)=>{
  const url=String(raw);
  if(url.endsWith('/auth/v1/user')){
   identifyCalls++;
   return new Response(JSON.stringify({id:owner}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(url.endsWith('/rest/v1/rpc/jb_ad_creative_workflow_capability_internal')){
   if(settings.revokeAt&&identifyCalls>=settings.revokeAt)
    return new Response('{}',{status:403});
   return new Response(JSON.stringify('B7_DRAFT_THEN_EXPLICIT_APPROVE_V1'),{status:200});
  }
  throw Error('UNEXPECTED_NET_REQUEST');
 };
 const serverClient={
  storage:{
   async getBucket(id:string){
    return {data:{id,public:settings.badBucket===true,file_size_limit:8388608},error:null};
   },
   from(bucket:string){
    return {
     async upload(path:string,blob:Blob,opts:{upsert:boolean}){
      assertEquals(opts.upsert,false);
      const key=bucket+'/'+path;uploads++;
      if(stored.has(key))return {error:{message:'duplicate'}};
      stored.set(key,new Uint8Array(await blob.arrayBuffer()));return {error:null};
     },
     async download(path:string){
      const bytes=stored.get(bucket+'/'+path);
      if(!bytes)return {data:null,error:'not found'};
      return {data:new Blob([new Uint8Array(bytes).buffer]),error:null};
     }
    };
   }
  },
  from(table:string){
   const conditions:Record<string,unknown>={};
   const query={
    select(_cols:string){return query;},
    eq(col:string,val:unknown){conditions[col]=val;return query;},
    order(_col:string,_args:unknown){return query;},
    limit(_n:number){return query;},
    async single(){
     if(table==='ad_campaigns')return {data:{status:'requested'},error:null};
     if(conditions.id)return {data:{id:creative,campaign_id:campaign,
      creative_type:'image',approved:false,version:2},error:null};
     return {data:{version:2},error:null};
    }
   };return query;
  },
  async rpc(name:string,args:Record<string,unknown>){
   if(name==='jb_ad_media_record_receipt_server'){
    const payload=args.p as Record<string,unknown>;
    receipt.set(String(payload.asset_id),{...payload,approval_state:'private_quarantined'});
    return {data:payload.asset_id,error:null};
   }
   if(name==='jb_ad_media_read_receipt_server'){
    if(settings.badReceipt)return {data:{asset_id:'forged'},error:null};
    return {data:receipt.get(String(args.p_asset)),error:null};
   }
   if(name==='jb_ad_media_log_orphan_server'){
    events.push(args.p_event);
    return {data:true,error:null};
   }
   return {data:null,error:{message:'RPC_MISSING'}};
  }
 };
 return {env:{
  serverClient,
  supabaseUrl:'https://vrffsnkycvjithwtiylt.supabase.co',
  anonKey:'PUBLIC_TEST_ANON',
  fetcher:fetcher as typeof fetch,
  allocateId:()=> '44444444-4444-4444-8444-444444444444'
 },stored,receipt,events,
 get calls(){return identifyCalls;},get uploads(){return uploads;}};
}
Deno.test('FULL REAL WASM -> 2 private Supabase create-only blobs -> SQL receipt readback -> stays unapproved',async()=>{
 const f=fakeInfra();
 const r=await processB7PrivateImageJob(input(),f.env);
 assertEquals(r.state,'VERIFIED_PRIVATE_EVIDENCE_ONLY');
 assertEquals(r.approved,false);assertEquals(r.publishable,false);
 assertEquals(f.stored.size,2);assertEquals(f.receipt.size,1);
 assertEquals(f.events.length,0);assertEquals(f.calls,4);
 const record=[...f.receipt.values()][0] as Record<string,unknown>;
 assertEquals(record.owner_user_id,owner);
 assertEquals(record.creative_id,creative);
 assertEquals(record.creative_version,2);
 assertEquals(record.source_bucket,'jb-ad-originals-private');
 assertEquals(record.derivative_bucket,'jb-ad-previews-private');
 const clean=f.stored.get(String(record.derivative_bucket)+'/'+String(record.derivative_path));
 assert(clean instanceof Uint8Array);
 const parsed=inspectCleanPngContainer(clean);
 assertEquals(parsed.containsMetadata,false);
 assertEquals(parsed.width,720);assertEquals(parsed.height,400);
 assertEquals((record.source_sha256 as string).length,64);
 assertEquals((record.derivative_sha256 as string).length,64);
 assertEquals(JSON.stringify(r).includes('url'),false);
});
Deno.test('Wrong browser ownerId is ignored; only Auth+AAL2 controls derived identity',async()=>{
 const f=fakeInfra();
 const forged=input({ownerId:'99999999-9999-4999-8999-999999999999'});
 const r=await processB7PrivateImageJob(forged,f.env);
 assertEquals(r.approved,false);
 assertEquals(([...f.receipt.values()][0] as Record<string,unknown>).owner_user_id,owner);
});
Deno.test('Owner revoked AFTER image upload => durable orphan ledger, never clean receipt',async()=>{
 const f=fakeInfra({revokeAt:4});
 await assertRejects(
  ()=>processB7PrivateImageJob(input(),f.env),Error,'PRIVATE_EVIDENCE_NOT_COMPLETE');
 assertEquals(f.stored.size,2);assertEquals(f.receipt.size,0);
 assertEquals(f.events.length,1);
 assertEquals((f.events[0] as Record<string,unknown>).reason,'RECEIPT_OR_OWNER_STATE_FAILED');
});
Deno.test('Public bucket, invalid Owner capability or forged DB receipt cannot succeed',async()=>{
 const badBucket=fakeInfra({badBucket:true});
 await assertRejects(
  ()=>processB7PrivateImageJob(input(),badBucket.env),Error,'PRIVATE_BUCKET_REQUIRED');
 assertEquals(badBucket.stored.size,0);
 const badReceipt=fakeInfra({badReceipt:true});
 await assertRejects(
  ()=>processB7PrivateImageJob(input(),badReceipt.env),Error,'PRIVATE_EVIDENCE_NOT_COMPLETE');
 assertEquals(badReceipt.events.length,1);
 const revoked=fakeInfra({revokeAt:1});
 await assertRejects(
  ()=>processB7PrivateImageJob(input(),revoked.env),Error,'OWNER_AAL2_REQUIRED');
 assertEquals(revoked.stored.size,0);
});
