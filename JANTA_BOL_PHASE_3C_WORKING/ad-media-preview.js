/* JANTA BOL B7 / ADS-010,011,015 — Founder LOCAL ONLY media preview.
 * NO upload, no new server Storage API, no approval, no analytics, no EXIF
 * claims. Server-side AV/codec/image-dimension/EXIF/GPS validation is
 * mandatory before media can be approved. REVIEW/preview stage only.
 */
(function(g){'use strict';
const max=52428800; // Exact inspected public-media bucket per-file 50MiB cap.
const objects=new WeakMap();
const generations=new WeakMap(); // invalidate out-of-order Android file selections
const ascii=a=>Array.from(a).map(n=>String.fromCharCode(n)).join('');
function signature(a){
 if(a.length>=3&&a[0]===255&&a[1]===216&&a[2]===255)return 'jpeg';
 if(a.length>=8&&a.slice(0,8).every((x,i)=>x===[137,80,78,71,13,10,26,10][i]))return 'png';
 if(a.length>=12&&ascii(a.slice(0,4))==='RIFF'&&ascii(a.slice(8,12))==='WEBP')return 'webp';
 // ftyp alone is NOT proof of MP4: AVIF/HEIC/other ISO-BMFF files
 // also have that box. This is local preflight only, not codec validation.
 if(a.length>=12&&ascii(a.slice(4,8))==='ftyp'&&
    ['isom','iso2','iso4','iso5','iso6','mp41','mp42','avc1','M4V ','dash']
      .includes(ascii(a.slice(8,12))))return 'mp4';
 return '';
}
const map={
 jpeg:{kind:'image',mime:'image/jpeg',ext:['jpg','jpeg']},
 png:{kind:'image',mime:'image/png',ext:['png']},
 webp:{kind:'image',mime:'image/webp',ext:['webp']},
 mp4:{kind:'video',mime:'video/mp4',ext:['mp4']}
};
async function inspect(file){
 if(!file||typeof file.size!=='number'||!Number.isFinite(file.size)||
    file.size<=0||file.size>max||
    typeof file.slice!=='function')throw Error('AD_MEDIA_FILE_SIZE_OR_INPUT_INVALID');
 const bytes=new Uint8Array(await file.slice(0,32).arrayBuffer());
 const format=signature(bytes),info=map[format],extension=String(file.name||'')
   .trim().toLowerCase().split('.').pop(),mime=String(file.type||'').toLowerCase();
 if(!info||!info.ext.includes(extension)||mime!==info.mime)
  throw Error('AD_MEDIA_MIME_OR_MAGIC_SIGNATURE_MISMATCH');
 return {format,kind:info.kind,mime:info.mime,size:file.size,
   status:'LOCAL_PREVIEW_ONLY_NOT_UPLOADED_OR_APPROVED',
   warning:'Server byte/codec/dimension validation, EXIF/GPS stripping, poster and Owner approval still required'};
}
function dispose(container){
 if(container)generations.set(container,(generations.get(container)||0)+1);
 const old=objects.get(container);
 if(old&&g.URL?.revokeObjectURL){try{g.URL.revokeObjectURL(old)}catch(_){}}
 objects.delete(container);
 if(container&&typeof container.replaceChildren==='function')container.replaceChildren();
}
async function stage(container,file,expectedKind){
 if(!container||!g.document||!g.URL?.createObjectURL)
  throw Error('MEDIA_PREVIEW_NOT_SUPPORTED');
 // Android may resolve two file.arrayBuffer() calls out of order.
 // Latest request wins; an old decode MUST NOT replace current artwork.
 const request=(generations.get(container)||0)+1;
 generations.set(container,request);
 let info;
 try{info=await inspect(file)}
 catch(e){
  // An invalid CURRENT selection cannot leave the old thumbnail/URL alive.
  // A failed STALE selection may not destroy a newer approved local preview.
  if(generations.get(container)===request)dispose(container);
  throw e;
 }
 if(generations.get(container)!==request)
  return {...info,status:'SUPERSEDED_LOCAL_PREVIEW_NO_CHANGE'};
 if(expectedKind&&info.kind!==expectedKind){
  // A valid JPEG is NOT a valid video creative. Clear any previous thumbnail.
  dispose(container);
  throw Error('LOCAL_MEDIA_TYPE_MISMATCH');
 }
 dispose(container);
 const tag=info.kind==='image'?'img':'video',media=g.document.createElement(tag);
 media.setAttribute('aria-label','विज्ञापन media local preview — not approved');
 media.style.maxWidth='100%';media.style.width='100%';
 media.style.maxHeight='320px';media.style.objectFit='contain';
 media.style.background='#e8e8e8';
 media.style.height='auto';
 media.setAttribute('playsinline','');
 if(tag==='video'){
  media.controls=true;media.autoplay=false;media.muted=true;
  media.preload='metadata';
 }else media.setAttribute('loading','lazy');
 const label=g.document.createElement('p');
 // Gallery sometimes returns a screenshot instead of the original image.
 // Never print filenames or claim that local media provenance is validated.
 label.textContent='LOCAL PREVIEW ONLY — File नहीं भेजी गई, Approved नहीं है. '+
   info.warning+'; Gallery screenshot भी चुन सकती है: तस्वीर खुद देखें. '+
   'Whole photo visible (contain), no crop. Local dimensions pending.';
 let url='';
 const previewGeneration=generations.get(container);
 if(typeof media.addEventListener==='function'){
  media.addEventListener(tag==='video'?'loadedmetadata':'load',()=>{
   // Late metadata for superseded local files cannot replace current label.
   if(!url||objects.get(container)!==url||
      generations.get(container)!==previewGeneration)return;
   const w=tag==='video'?media.videoWidth:media.naturalWidth;
   const h=tag==='video'?media.videoHeight:media.naturalHeight;
   if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<=0||h<=0)return;
   let note='Local visible dimensions: '+w+' × '+h+
     ' pixels (aspect '+(w/h).toFixed(3)+'). ';
   if(tag==='video'&&Number.isFinite(media.duration)&&media.duration>=0)
    note+='Local video duration: '+media.duration.toFixed(1)+
     ' seconds; 15s limit must still be validated by server. ';
   label.textContent='LOCAL PREVIEW ONLY — File नहीं भेजी गई, Approved नहीं है. '+
     note+info.warning+
     '; Source file/original vs screenshot NOT independently verified; contain/no crop.';
  },{once:true});
 }
 try{
  url=g.URL.createObjectURL(file);
  if(!url)throw Error('AD_MEDIA_LOCAL_PREVIEW_URL_NOT_READY');
  media.src=url;
  objects.set(container,url);
  container.append(media,label);
 }catch(e){
  // Even a DOM insertion failure after createObjectURL must leave no
  // private blob reference or half-built old preview. Never retry/upload.
  objects.delete(container);
  if(url&&g.URL?.revokeObjectURL)try{g.URL.revokeObjectURL(url)}catch(_){}
  try{container.replaceChildren()}catch(_){}
  throw e;
 }
 return info;
}
g.JBAdMediaPreview=Object.freeze({inspect,signature,stage,dispose});
})(window);
