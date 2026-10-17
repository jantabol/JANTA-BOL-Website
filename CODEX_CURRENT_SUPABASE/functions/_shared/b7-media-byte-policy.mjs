/**
 * JANTA BOL B7 ADS-010/011/015 — private SERVER media intake gate.
 * REVIEW ONLY, no deployment. This does not decode, sanitize, upload,
 * approve, or publish an asset; caller must use trusted image processing.
 * Video fails closed until trusted H.264/AAC+poster processing exists.
 */
export const imageLimits=Object.freeze({maxBytes:8*1024*1024,maxPixels:16_000_000,maxSide:8192});
const fail=s=>{throw Error('B7_MEDIA_'+s)};
const txt=(b,i,n)=>String.fromCharCode(...b.subarray(i,i+n));
const be=(b,i)=>(b[i]*16777216+b[i+1]*65536+b[i+2]*256+b[i+3])>>>0;
const le=(b,i)=>(b[i]+b[i+1]*256+b[i+2]*65536+b[i+3]*16777216)>>>0;
function size(w,h){
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1||
    w>imageLimits.maxSide||h>imageLimits.maxSide||w*h>imageLimits.maxPixels)
   fail('PIXEL_LIMIT');
 return {width:w,height:h};
}
function bytes(b){if(!(b instanceof Uint8Array))fail('BYTES_REQUIRED');
 if(b.length<16||b.length>imageLimits.maxBytes)fail('BYTE_LIMIT');return b;}
function crc(x){
 let c=0xffffffff;for(const n of x){c^=n;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;}
 return (c^0xffffffff)>>>0;
}
const pngMagic=[137,80,78,71,13,10,26,10];
function png(b,derivative){
 if(!pngMagic.every((x,i)=>b[i]===x))fail('PNG_SIGNATURE');
 let p=8,ihdr=false,idat=false,done=false,w=0,h=0,metadata=false;
 let colorType=-1,bitDepth=-1,paletteSize=0,paletteSeen=false,transparencySeen=false;
 while(p<b.length){
  if(p+12>b.length)fail('PNG_TRUNCATED');
  const len=be(b,p),type=txt(b,p+4,4),end=p+len+12;
  if(len>imageLimits.maxBytes||end>b.length||!/^[A-Za-z]{4}$/.test(type))
    fail('PNG_CHUNK_BOUNDS');
  if(crc(b.subarray(p+4,p+8+len))!==be(b,p+8+len))fail('PNG_CRC');
  if(!ihdr){
   if(type!=='IHDR'||len!==13)fail('PNG_IHDR');
   w=be(b,p+8);h=be(b,p+12);size(w,h);
   bitDepth=b[p+16];colorType=b[p+17];
   // Indexed PNGs use PLTE (actual pixel palette), not EXIF metadata.
   // Magick-WASM legitimately chooses 1/2/4/8-bit indexed output.
   const validMode=(colorType===3&&[1,2,4,8].includes(bitDepth))||
     ([0,2,4,6].includes(colorType)&&bitDepth===8);
   if(!validMode||b[p+18]!==0||b[p+19]!==0||b[p+20]!==0)
     fail('PNG_MODE');
   ihdr=true;
  }else if(type==='IHDR')fail('PNG_DUP_IHDR');
  if(type==='PLTE'){
   if(paletteSeen||idat||colorType===0||colorType===4||
      len===0||len>768||len%3!==0)fail('PNG_PALETTE_ORDER');
   paletteSeen=true;paletteSize=len/3;
   if(colorType===3&&paletteSize>2**bitDepth)fail('PNG_PALETTE_TOO_LARGE');
  }
  if(type==='tRNS'){
   if(transparencySeen||idat||colorType!==3||!paletteSeen||
      len===0||len>paletteSize)fail('PNG_TRANSPARENCY_SHAPE');
   transparencySeen=true;
  }
  if(type==='IDAT')idat=true;
  if(type[0]===type[0].toUpperCase()&&!['IHDR','IDAT','IEND','PLTE'].includes(type))
   fail('PNG_UNKNOWN_CRITICAL');
  if(!['IHDR','PLTE','tRNS','IDAT','IEND'].includes(type))metadata=true;
  if(derivative&&!['IHDR','PLTE','tRNS','IDAT','IEND'].includes(type))
   fail('DERIVATIVE_HAS_ANCILLARY_'+type);
  p=end;
  if(type==='IEND'){if(len!==0||p!==b.length)fail('PNG_TRAILING');done=true;break;}
 }
 if(!done||!idat||(colorType===3&&!paletteSeen))fail('PNG_INCOMPLETE');
 return {format:'png',mime:'image/png',...size(w,h),containsMetadata:metadata};
}
function jpeg(b){
 if(b[0]!==255||b[1]!==216||b[2]!==255||
    b.at(-2)!==255||b.at(-1)!==217)fail('JPEG_MAGIC_OR_TRAILING');
 let p=2,scanned=false,w=0,h=0,exif=false;
 while(p<b.length-2){
  if(b[p++]!==255)fail('JPEG_MARKER');
  while(b[p]===255)p++;const marker=b[p++];
  if(marker===218){scanned=true;break;}
  if(marker===216||marker===217||marker===0||marker>=208&&marker<=215)
   fail('JPEG_MARKER');
  if(p+2>b.length)fail('JPEG_TRUNCATED');
  const len=b[p]*256+b[p+1];
  if(len<2||p+len>b.length-2)fail('JPEG_SEGMENT');
  if(marker===225&&txt(b,p+2,6)==='Exif\0\0')exif=true;
  if([192,193,194].includes(marker)){
   if(w||len<8||b[p+2]!==8)fail('JPEG_SOF');
   h=b[p+3]*256+b[p+4];w=b[p+5]*256+b[p+6];size(w,h);
  }else if(marker>=192&&marker<=207&&![196,200,204].includes(marker))
   fail('JPEG_UNSUPPORTED_CODEC');
  p+=len;
 }
 if(!scanned||!w)fail('JPEG_NO_FRAME');
 return {format:'jpeg',mime:'image/jpeg',...size(w,h),containsMetadata:exif};
}
function webp(b){
 if(txt(b,0,4)!=='RIFF'||txt(b,8,4)!=='WEBP'||le(b,4)+8!==b.length)
  fail('WEBP_RIFF');
 let p=12,w=0,h=0,px=0,ext=false,animated=false,meta=false;
 while(p<b.length){
  if(p+8>b.length)fail('WEBP_CHUNK');
  const type=txt(b,p,4),len=le(b,p+4),v=p+8;
  if(v+len>b.length)fail('WEBP_BOUNDS');
  if(type==='VP8X'){
   if(ext||px||len!==10)fail('WEBP_EXT_HEADER');
   ext=true;animated=!!(b[v]&2);meta=!!(b[v]&8);
   w=1+b[v+4]+256*b[v+5]+65536*b[v+6];
   h=1+b[v+7]+256*b[v+8]+65536*b[v+9];size(w,h);
  }else if(type==='VP8 '){
   if(px||len<10||b[v+3]!==157||b[v+4]!==1||b[v+5]!==42)
    fail('WEBP_VP8');
   const iw=(b[v+6]+256*b[v+7])&16383,ih=(b[v+8]+256*b[v+9])&16383;
   if(w&&w!==iw||h&&h!==ih)fail('WEBP_DIMENSION_DRIFT');
   w=iw;h=ih;size(w,h);px++;
  }else if(type==='VP8L'){
   if(px||len<5||b[v]!==47)fail('WEBP_VP8L');
   const bits=le(b,v+1),iw=1+(bits&16383),ih=1+((bits>>>14)&16383);
   if(w&&w!==iw||h&&h!==ih)fail('WEBP_DIMENSION_DRIFT');
   w=iw;h=ih;size(w,h);px++;
  }else if(type==='ANIM'||type==='ANMF')animated=true;
  else if(['EXIF','XMP ','ICCP'].includes(type))meta=true;
  p=v+len+(len%2);
 }
 if(animated)fail('WEBP_ANIMATION_REQUIRES_VIDEO');
 if(px!==1||p!==b.length)fail('WEBP_NO_FRAME');
 return {format:'webp',mime:'image/webp',...size(w,h),containsMetadata:meta};
}
export function inspectUntrustedImage(input,{name,mime}={}){
 const b=bytes(input),ext=String(name||'').trim().toLowerCase().split('.').pop();
 let found;
 if(pngMagic.every((x,i)=>b[i]===x))found=png(b,false);
 else if(b[0]===255&&b[1]===216)found=jpeg(b);
 else if(txt(b,0,4)==='RIFF')found=webp(b);
 else fail('UNSUPPORTED_MAGIC');
 const good={png:['png'],jpeg:['jpg','jpeg'],webp:['webp']}[found.format];
 if(String(mime||'').trim().toLowerCase()!==found.mime||!good.includes(ext))
  fail('MIME_EXTENSION_MISMATCH');
 return Object.freeze({...found,sourceBytes:b.length,
  status:'UNTRUSTED_SERVER_PRECHECK_ONLY',canApprove:false,canPublish:false});
}
export function inspectCleanPngContainer(input){
 const found=png(bytes(input),true);
 return Object.freeze({...found,status:'CONTAINER_CHECK_ONLY',
  canApprove:false,canPublish:false,requiresDecodedDerivativeProof:true});
}
