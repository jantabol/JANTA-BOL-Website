/** B7 ADS-010/015 private worker IMAGE decoder — REVIEW ONLY, NOT DEPLOYED.
 * Requires Authenticated+Owner AAL2 server gateway and private storage
 * ingestion before any creative can be approved. This function only takes
 * PRIVATE bytes and returns a newly decoded + re-encoded preview derivative.
 * No database INSERT, no Storage write and NO ad publication.
 * Pinned magick-wasm version, no Supabase Pro image-transform dependency.
 */
import {ImageMagick,initializeImageMagick,MagickFormat} from 'npm:@imagemagick/magick-wasm@0.0.30';
import {inspectUntrustedImage,inspectCleanPngContainer,imageLimits} from './b7-media-byte-policy.mjs';
let init:Promise<void>|null=null;
async function initialized(){
 if(!init)init=(async()=>{
  const wasm=await Deno.readFile(new URL('magick.wasm',
    import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.30')));
  await initializeImageMagick(wasm);
 })().catch(error=>{init=null;throw error;});
 return init;
}
export async function buildPrivateAdImagePreview(
 input:Uint8Array,fileName:string,claimedMime:string
){
 // Verify FULL binary before asking a decoder to allocate image memory.
 const original=inspectUntrustedImage(input,{name:fileName,mime:claimedMime});
 await initialized();
 let sanitized:Uint8Array;
 try{
  sanitized=ImageMagick.read(input,(img)=>{
   if(img.width!==original.width||img.height!==original.height)
    throw Error('B7_MEDIA_DECODED_DIMENSION_MISMATCH');
   img.autoOrient();
   // ImageMagick can still write its private PNG orNT orientation chunk
   // after strip(). Canonicalized pixels must have NO separate orientation.
   // The PINNED 0.0.30 package does not re-export Orientation at root.
   // Its ImageMagick native orientation enum value 0 means Undefined.
   img.orientation=0 as typeof img.orientation;
   const scale=Math.min(1,1200/Math.max(img.width,img.height));
   if(scale<1){
    const w=Math.max(1,Math.round(img.width*scale));
    const h=Math.max(1,Math.round(img.height*scale));
    img.resize(w,h);
   }
   img.strip(); // After EXIF orientation correction, discard origin metadata.
   return img.write(MagickFormat.Png,(out)=>Uint8Array.from(out));
  });
 }catch(_){
  // Never emit a failing image nor reveal original bytes or decoder stack.
  throw Error('B7_MEDIA_SERVER_DECODING_FAILED');
 }
 if(sanitized.length>imageLimits.maxBytes)
   throw Error('B7_MEDIA_DERIVATIVE_TOO_LARGE');
 const proof=inspectCleanPngContainer(sanitized);
 if(proof.width>1200||proof.height>1200)
   throw Error('B7_MEDIA_DERIVATIVE_DIMENSIONS_WRONG');
 // INDEPENDENT RCA: Deno 2.9.7 requires WebCrypto BufferSource backed
 // by ArrayBuffer, while typed Uint8Array defaults to ArrayBufferLike.
 // An explicit, non-shared buffer copy is safe for original AND derivative.
 const hash=async (x:Uint8Array)=>{
  const buffer=new ArrayBuffer(x.byteLength);
  new Uint8Array(buffer).set(x);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));
  return Array.from(digest,n=>n.toString(16).padStart(2,'0')).join('');
 };
 return Object.freeze({
  privatePreviewPng:sanitized,
  sourceSha256:await hash(input),
  derivativeSha256:await hash(sanitized),
  width:proof.width,height:proof.height,contentType:'image/png',
  status:'PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED',
  canApprove:false,canPublish:false,
  pendingGates:['OWNER_AAL2','IMMUTABLE_STORAGE_ASSET','SERVER_DERIVATIVE_PROOF','HUMAN_REVIEW']
 });
}

/** ADS-010 actual static PNG server-side responsive renditions, private only.
 * 480/800/1200 are review-policy candidates and never cause upscaling.
 * This function does NOT store, approve, publish or create public links.
 */
export async function buildPrivateAdImageRenditions(
 source:Uint8Array,fileName:string,mime:string,
 widths:readonly number[]=[480,800,1200]
){
 if(!Array.isArray(widths)||widths.length<1||widths.length>6||
    widths.some(w=>!Number.isInteger(w)||w<160||w>1200))
  throw Error('B7_MEDIA_WIDTH_VARIANTS_POLICY_INVALID');
 const first=await buildPrivateAdImagePreview(source,fileName,mime);
 const sorted=[...new Set(widths.filter(w=>w<first.width)
  .concat(first.width))].sort((a,b)=>a-b);
 const digest=async(bytes:Uint8Array)=>{
  const own=new ArrayBuffer(bytes.byteLength);
  new Uint8Array(own).set(bytes);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',own)),
   x=>x.toString(16).padStart(2,'0')).join('');
 };
 const result=[];
 for(const width of sorted){
  let bytes=first.privatePreviewPng;
  if(width<first.width){
   try{
    bytes=ImageMagick.read(first.privatePreviewPng,img=>{
     const height=Math.max(1,Math.round(first.height*width/first.width));
     img.resize(width,height);
     img.orientation=0 as typeof img.orientation;
     img.strip();
     return img.write(MagickFormat.Png,out=>Uint8Array.from(out));
    });
   }catch{throw Error('B7_MEDIA_RESPONSIVE_RECODE_FAILED')}
  }
  if(bytes.length>imageLimits.maxBytes)throw Error('B7_MEDIA_RENDITION_TOO_LARGE');
  const actual=inspectCleanPngContainer(bytes);
  if(actual.width>width||actual.width>first.width||
     actual.height>first.height||
     Math.abs(actual.width/actual.height-first.width/first.height)>0.018)
    throw Error('B7_MEDIA_ASPECT_OR_UPSCALE_NOT_ALLOWED');
  result.push(Object.freeze({
   width:actual.width,height:actual.height,mime:'image/png',
   privatePng:bytes,sha256:await digest(bytes),bytes:bytes.length,
   approved:false,publishable:false
  }));
 }
 return Object.freeze({
  originalSha256:first.sourceSha256,
  canonicalPreviewSha256:first.derivativeSha256,
  sourceWidth:first.width,sourceHeight:first.height,
  privateRenditions:Object.freeze(result),
  status:'PRIVATE_RESPONSIVE_RENDITIONS_NOT_UPLOADED_NOT_APPROVED',
  approved:false,publishable:false
 });
}
