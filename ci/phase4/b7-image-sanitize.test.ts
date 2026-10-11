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
