import {ImageMagick,initializeImageMagick,MagickFormat,MagickColor} from 'npm:@imagemagick/magick-wasm@0.0.30';
import {inspectCleanPngContainer} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-byte-policy.mjs';
import {buildPrivateAdImagePreview} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts';
import {assert,assertEquals,assertRejects} from 'jsr:@std/assert@1.0.14';
const wasm=await Deno.readFile(new URL('magick.wasm',import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.30')));
await initializeImageMagick(wasm);
function image(w:number,h:number){
 return ImageMagick.read(new MagickColor('red'),w,h,(img)=>
   img.write(MagickFormat.Png,(out)=>Uint8Array.from(out)));
}
Deno.test('Real WASM decode/transcode produces private metadata-free structural PNG, no approval',async()=>{
 const original=image(1280,720);
 const r=await buildPrivateAdImagePreview(original,'ad.png','image/png');
 assertEquals(r.status,'PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED');
 assertEquals(r.canApprove,false);assertEquals(r.canPublish,false);
 assert(r.width<=1200&&r.height<=1200);
 assertEquals(inspectCleanPngContainer(r.privatePreviewPng).canPublish,false);
 assertEquals(r.sourceSha256.length,64);assertEquals(r.derivativeSha256.length,64);
});
// True end-to-end metadata injection: source is a real decoder-readable PNG,
 // not merely a magic-byte fixture. Verify that its Comment cannot survive
 // WASM pixel decode, strip and re-encoding into approved-type output.
 function crc32(bytes:Uint8Array){
  let c=0xffffffff;for(const x of bytes){c^=x;for(let i=0;i<8;i++)
   c=c&1?0xedb88320^(c>>>1):c>>>1;}
  return (c^0xffffffff)>>>0;
 }
 function pngAddText(input:Uint8Array){
  const comment=new TextEncoder().encode('Comment\0GPS=12.000,76.000;private');
  const n=comment.length,chunk=new Uint8Array(n+12),v=new DataView(chunk.buffer);
  v.setUint32(0,n,false);chunk.set(new TextEncoder().encode('tEXt'),4);
  chunk.set(comment,8);v.setUint32(n+8,crc32(chunk.subarray(4,n+8)),false);
  // IHDR is the first 25-byte chunk after 8-byte signature.
  const position=33,result=new Uint8Array(input.length+chunk.length);
  result.set(input.subarray(0,position));result.set(chunk,position);
  result.set(input.subarray(position),position+chunk.length);
  return result;
 }
 Deno.test('Real trusted WASM removes injected PNG comment/GPS metadata and retains original pixels',async()=>{
  const original=image(400,200);
  const withComment=pngAddText(original);
  const a=await buildPrivateAdImagePreview(withComment,'private.png','image/png');
  assertEquals(a.canApprove,false);assertEquals(a.canPublish,false);
  assertEquals(a.width,400);assertEquals(a.height,200);
  const clean=inspectCleanPngContainer(a.privatePreviewPng);
  assertEquals(clean.containsMetadata,false);
  assertEquals(clean.width,400);assertEquals(clean.height,200);
  assertEquals(a.sourceSha256!==a.derivativeSha256,true);
 });

Deno.test('Unsafe HTML bytes never enter image decoding; cannot approve video',async()=>{
 await assertRejects(()=>buildPrivateAdImagePreview(new TextEncoder().encode('<svg></svg>'),'x.svg','image/svg+xml'),Error,'B7_MEDIA_');
 await assertRejects(()=>buildPrivateAdImagePreview(new TextEncoder().encode('....ftypisom'),'x.mp4','video/mp4'),Error,'B7_MEDIA_');
});

Deno.test('B7 actual Magick-WASM source and derivative are separately staged to private create-only buckets with SHA readback, NOT public',async()=>{
 const {stageB7Image,RAW,DERIV}=await import('../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-media-stage.mjs');
 const objects=new Map<string,Uint8Array>();const uploads:string[]=[];const orphans:unknown[]=[];
 const original=image(680,300);
 const receipt=await stageB7Image({
  token:'owner-fixture-'+('a'.repeat(100)),bytes:original,name:'source.png',mime:'image/png'
 },{
  authorize:async()=>true,
  convert:buildPrivateAdImagePreview,
  allocateId:()=> '55555555-5555-4555-8555-555555555555',
  onOrphan:async (x:unknown)=>{orphans.push(x);return true;},
  store:{
   checkPrivate:async (b:string)=>b===RAW||b===DERIV,
   createOnly:async (b:string,p:string,bytes:Uint8Array)=>{
    const k=b+'/'+p;uploads.push(k);
    if(objects.has(k))return false;
    objects.set(k,Uint8Array.from(bytes));return true;
   },
   readPrivate:async (b:string,p:string)=>objects.get(b+'/'+p)
  }
 });
 assertEquals(receipt.verifiedReadback,true);
 assertEquals(receipt.approved,false);assertEquals(receipt.publishable,false);
 assertEquals(receipt.state,'PRIVATE_QUARANTINE_NOT_REGISTERED');
 assertEquals(receipt.source.bucket,RAW);assertEquals(receipt.derivative.bucket,DERIV);
 assertEquals(receipt.derivative.width,680);assertEquals(receipt.derivative.height,300);
 assertEquals(uploads.length,2);assertEquals(orphans.length,0);
 const cleaned=objects.get(receipt.derivative.bucket+'/'+receipt.derivative.path);
 assert(cleaned instanceof Uint8Array);
 assertEquals(inspectCleanPngContainer(cleaned).containsMetadata,false);
 assertEquals(JSON.stringify(receipt).includes('publicUrl'),false);
});

Deno.test('ADS-010 REAL ImageMagick 480/800/1200 no-upscale clean PNG variants',async()=>{
 const {buildPrivateAdImageRenditions}=await import(
  '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts');
 const result=await buildPrivateAdImageRenditions(image(1600,900),'wide.png','image/png');
 assertEquals(result.status,'PRIVATE_RESPONSIVE_RENDITIONS_NOT_UPLOADED_NOT_APPROVED');
 assertEquals(result.approved,false);assertEquals(result.publishable,false);
 assertEquals(result.privateRenditions.map(x=>x.width),[480,800,1200]);
 for(const r of result.privateRenditions){
  const parsed=inspectCleanPngContainer(r.privatePng);
  assertEquals(parsed.width,r.width);assertEquals(parsed.height,r.height);
  assertEquals(parsed.containsMetadata,false);
  assertEquals(r.sha256.length,64);assertEquals(r.approved,false);
 }
 const portrait=await buildPrivateAdImageRenditions(image(600,1000),'portrait.png','image/png');
 assertEquals(portrait.privateRenditions.map(x=>x.width),[480,600]);
 assertEquals(portrait.privateRenditions.at(-1)?.height,1000);
 const low=await buildPrivateAdImageRenditions(image(320,200),'low.png','image/png');
 assertEquals(low.privateRenditions.map(x=>x.width),[320]);
});
Deno.test('Width limits fail closed before creating any responsive variants',async()=>{
 const {buildPrivateAdImageRenditions}=await import(
  '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts');
 await assertRejects(()=>buildPrivateAdImageRenditions(
  image(600,400),'safe.png','image/png',[480,1400]),Error,
  'B7_MEDIA_WIDTH_VARIANTS_POLICY_INVALID');
});


Deno.test('REAL WASM GPS scrubbed image -> public release pending Owner approval (no autoapprove)',async()=>{
 const {prepareB7PublicRelease,CLEAN_PUBLIC_BUCKET}=await import(
  '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-public-release-worker.mjs');
 const asset='44444444-4444-4444-8444-444444444444',
  creativeId='22222222-2222-4222-8222-222222222222',
  campaignId='33333333-3333-4333-8333-333333333333',
  ownerId='11111111-1111-4111-8111-111111111111';
 const withGps=pngAddText(image(800,450));
 const sanitized=await buildPrivateAdImagePreview(withGps,'verified.png','image/png');
 assertEquals(sanitized.sourceSha256===sanitized.derivativeSha256,false);
 assertEquals(inspectCleanPngContainer(sanitized.privatePreviewPng).containsMetadata,false);
 const privatePath='staged/'+asset+'/'+sanitized.derivativeSha256+'.png';
 const publicObjects=new Map<string,Uint8Array>();
 const input={
  token:'owner-synthetic-token',
  creativeId,assetId:asset,
  approvalIntent:{action:'B7_EXPLICIT_MEDIA_RELEASE_V1',creativeId,
   assetId:asset,version:2}
 };
 const receipt={
  asset_id:asset,creative_id:creativeId,campaign_id:campaignId,
  creative_version:2,owner_user_id:ownerId,
  approval_state:'private_quarantined',
  derivative_path:privatePath,derivative_sha256:sanitized.derivativeSha256
 };
 let stored:Record<string,unknown>|null=null;
 const deps={
  verifyOwner:async (_token:string)=>ownerId,
  loadCreative:async (_id:string)=>({id:creativeId,campaign_id:campaignId,
   creative_type:'image',approved:false,version:2,latest_version:2,
   campaign_status:'requested'}),
  loadReceipt:async (_asset:string)=>receipt,
  readPrivate:async (bucket:string,path:string)=>
   bucket==='jb-ad-previews-private'&&path===privatePath?
     sanitized.privatePreviewPng:undefined,
  checkPublicBucket:async (bucket:string)=>bucket===CLEAN_PUBLIC_BUCKET,
  putPublicCreateOnly:async (bucket:string,path:string,bytes:Uint8Array)=>
   {publicObjects.set(bucket+'/'+path,Uint8Array.from(bytes));return true;},
  readPublic:async (bucket:string,path:string)=>publicObjects.get(bucket+'/'+path),
  recordRelease:async (record:Record<string,unknown>)=>{
   stored={...record};return true;},
  readRelease:async (_asset:string)=>stored,
  auditOrphan:async (_evt:unknown)=>true
 };
 const result=await prepareB7PublicRelease(input,deps);
 assertEquals(result.approved,false);assertEquals(result.publishable,false);
 assertEquals(result.status,'PUBLIC_ASSET_CANDIDATE_PENDING_ATOMIC_OWNER_APPROVAL');
 assertEquals(publicObjects.size,1);
 const clean=[...publicObjects.values()][0];
 assertEquals(inspectCleanPngContainer(clean).containsMetadata,false);
 assertEquals(inspectCleanPngContainer(clean).width,800);
 assertEquals(JSON.stringify(result).includes('publicUrl'),false);
 // Negative: unsafe original bytes are NOT interchangeable with the
 // SHA attested first-party derivative. This must fail BEFORE public write.
 publicObjects.clear();
 const forged={
  ...deps,readPrivate:async (_bucket:string,_path:string)=>withGps
 };
 await assertRejects(()=>prepareB7PublicRelease(input,forged),
  Error,'PRIVATE_SANITIZED_DERIVATIVE_HASH_MISMATCH');
 assertEquals(publicObjects.size,0);
});
