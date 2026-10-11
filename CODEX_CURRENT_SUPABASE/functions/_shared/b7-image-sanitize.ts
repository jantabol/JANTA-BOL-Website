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
