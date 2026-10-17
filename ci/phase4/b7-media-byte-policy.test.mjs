import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {inspectUntrustedImage,inspectCleanPngContainer} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-byte-policy.mjs';
const raw=s=>Buffer.from(s,'latin1'),n32=n=>{const x=Buffer.alloc(4);x.writeUInt32BE(n);return x;};
const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;};
function chunk(name,body){const v=Buffer.concat([raw(name),body]);return Buffer.concat([n32(body.length),v,n32(crc(v))]);}
function png(w=3,h=2,ancillary=[]){
 const hdr=Buffer.concat([n32(w),n32(h),Buffer.from([8,6,0,0,0])]);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',hdr),...ancillary,chunk('IDAT',deflateSync(Buffer.alloc((w*4+1)*h))),chunk('IEND',Buffer.alloc(0))]);
}
function jpeg(){const sof=Buffer.from([255,192,0,17,8,1,104,2,128,3,1,17,0,2,17,0,3,17,0]);
return Buffer.concat([Buffer.from([255,216,255,225,0,8]),raw('Exif\0\0'),sof,
 Buffer.from([255,218,0,8,1,1,0,0,63,0,1,2,3,255,217])]);}
function webp(animated=false){const x=Buffer.from([animated?2:0,0,0,0,9,0,0,9,0,0]);const f=Buffer.from([0,0,0,157,1,42,10,0,10,0]);
 const blocks=Buffer.concat([raw('VP8X'),Buffer.from([10,0,0,0]),x,raw('VP8 '),Buffer.from([10,0,0,0]),f]);
 return Buffer.concat([raw('RIFF'),Buffer.from([blocks.length+4,0,0,0]),raw('WEBP'),blocks]);}
test('original image preflight is NEVER approval and clean container is still not a server verified derivative',()=>{
 const a=inspectUntrustedImage(png(640,360),{name:'creative.png',mime:'image/png'});
 assert.equal(a.width,640);assert.equal(a.canApprove,false);assert.equal(a.canPublish,false);
 const x=inspectCleanPngContainer(png());assert.equal(x.canPublish,false);
 assert.equal(x.requiresDecodedDerivativeProof,true);
});
test('JPEG EXIF visible to server preflight but no claim of stripping',()=>{
 const a=inspectUntrustedImage(jpeg(),{name:'creative.jpeg',mime:'image/jpeg'});
 assert.equal(a.containsMetadata,true);assert.equal(a.width,640);assert.equal(a.height,360);
});
test('all untrusted MIME, disguised SVG/PDF, and MP4 denied',()=>{
 for(const [bytes,name,mime] of [[png(),'a.jpg','image/jpeg'],[png(),'a.png','text/html'],
  [raw('<svg onload=alert(1)>'),'a.png','image/png'],
  [raw('%PDF-1.7'),'a.png','image/png'],[raw('....ftypisom'),'a.mp4','video/mp4']])
  assert.throws(()=>inspectUntrustedImage(bytes,{name,mime}),/B7_MEDIA_/);
});
test('PNG ancillary EXIF/text forbidden in derivative and corrupted CRC rejected',()=>{
 const bad=png(10,10,[chunk('eXIf',raw('GPS secret'))]);
 assert.equal(inspectUntrustedImage(bad,{name:'a.png',mime:'image/png'}).containsMetadata,true);
 assert.throws(()=>inspectCleanPngContainer(bad),/B7_MEDIA_DERIVATIVE_HAS_ANCILLARY/);
 const flip=Buffer.from(png());flip[44]^=1;
 assert.throws(()=>inspectCleanPngContainer(flip),/B7_MEDIA_/);
});
test('malformed, excessive pixels, trailing polyglot, truncated images denied',()=>{
 for(const image of [png(9000,1),png(8000,3000),Buffer.concat([png(),raw('HTML')]),png().subarray(0,25)])
  assert.throws(()=>inspectUntrustedImage(image,{name:'a.png',mime:'image/png'}),/B7_MEDIA_/);
});
test('WebP compressed still image accepted only for private review; animated and RIFF forgery denied',()=>{
 const meta=inspectUntrustedImage(webp(),{name:'a.webp',mime:'image/webp'});
 assert.equal(meta.width,10);assert.equal(meta.canApprove,false);
 assert.throws(()=>inspectUntrustedImage(webp(true),{name:'a.webp',mime:'image/webp'}),/WEBP_ANIMATION/);
 const fake=webp();fake[4]=0xff;
 assert.throws(()=>inspectUntrustedImage(fake,{name:'a.webp',mime:'image/webp'}),/WEBP_RIFF/);
});
test('large bytes and wrong object type fail before decode or storage',()=>{
 assert.throws(()=>inspectUntrustedImage(new Uint8Array(8*1024*1024+1),{name:'a.png',mime:'image/png'}),/BYTE_LIMIT/);
 assert.throws(()=>inspectUntrustedImage('not bytes',{name:'a.png',mime:'image/png'}),/BYTES_REQUIRED/);
});
