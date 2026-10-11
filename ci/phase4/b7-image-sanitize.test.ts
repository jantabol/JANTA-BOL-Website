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
Deno.test('Unsafe HTML bytes never enter image decoding; cannot approve video',async()=>{
 await assertRejects(()=>buildPrivateAdImagePreview(new TextEncoder().encode('<svg></svg>'),'x.svg','image/svg+xml'),Error,'B7_MEDIA_');
 await assertRejects(()=>buildPrivateAdImagePreview(new TextEncoder().encode('....ftypisom'),'x.mp4','video/mp4'),Error,'B7_MEDIA_');
});
