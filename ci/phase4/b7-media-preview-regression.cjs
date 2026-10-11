'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const bytes={
 jpeg:[255,216,255,224,0,16,74,70,73,70],
 png:[137,80,78,71,13,10,26,10,0,0],
 webp:[82,73,70,70,16,0,0,0,87,69,66,80],
 mp4:[0,0,0,24,102,116,121,112,105,115,111,109]
};
function makeFile(data,{name='ad.png',type='image/png',size=data.length}={}){
 return {name,type,size,slice(_start,end){
  return {arrayBuffer:async()=>Uint8Array.from(data.slice(0,end)).buffer};
 }};
}
function setup(){
 const urls=[];const revoked=[];
 const document={createElement(tag){return {
  tagName:tag.toUpperCase(),style:{},attributes:{},src:'',
  setAttribute(k,v){this.attributes[k]=v},
  textContent:'',controls:false,autoplay:false,muted:false,
  preload:'',append(){}}}};
 const window={document,URL:{
  createObjectURL(){const u='blob:private-preflight-'+(urls.length+1);urls.push(u);return u},
  revokeObjectURL(u){revoked.push(u)}
 }};
 const context=vm.createContext({window,Uint8Array,Array,String,Number,Object,Error});
 vm.runInContext(fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js','utf8'),
 context,{filename:'ad-media-preview.js'});
 return {window,urls,revoked};
}
test('ADS-015 local jpg/png/webp and MP4 require actual magic signatures + exact MIME/extension',async()=>{
 const {window}=setup();
 for(const [k,ext,mime] of [
  ['jpeg','jpg','image/jpeg'],['png','png','image/png'],
  ['webp','webp','image/webp'],['mp4','mp4','video/mp4']
 ]){
  const r=await window.JBAdMediaPreview.inspect(
   makeFile(bytes[k],{name:'proposed.'+ext,type:mime}));
  assert.equal(r.format,k);assert.equal(r.kind,k==='mp4'?'video':'image');
  assert.equal(r.status,'LOCAL_PREVIEW_ONLY_NOT_UPLOADED_OR_APPROVED');
 }
});
test('ADS-015 spoofed SVG/HTML and mismatched PNG-as-JPG or MP4-as-PNG rejected before preview',async()=>{
 const {window}=setup();
 for(const f of [
  makeFile([60,115,118,103,62],{name:'malware.svg',type:'image/svg+xml'}),
  makeFile(bytes.png,{name:'hello.html',type:'text/html'}),
  makeFile(bytes.png,{name:'fake.jpg',type:'image/jpeg'}),
  makeFile(bytes.mp4,{name:'fake.png',type:'image/png'}),
  makeFile(bytes.jpeg,{name:'bad.exe',type:'image/jpeg'}),
  makeFile([0,0,0,0,0,0,0,0],{name:'bad.mp4',type:'video/mp4'})
 ])await assert.rejects(()=>window.JBAdMediaPreview.inspect(f),/MIME_OR_MAGIC_SIGNATURE_MISMATCH/);
});
test('ADS-015 empty, oversized, invalid object and empty MIME fail closed',async()=>{
 const {window}=setup();
 await assert.rejects(()=>window.JBAdMediaPreview.inspect(null),/FILE_SIZE_OR_INPUT_INVALID/);
 await assert.rejects(()=>window.JBAdMediaPreview.inspect(makeFile(bytes.png,{size:0})),/FILE_SIZE_OR_INPUT_INVALID/);
 await assert.rejects(()=>window.JBAdMediaPreview.inspect(makeFile(bytes.png,{size:52428801})),/FILE_SIZE_OR_INPUT_INVALID/);
 await assert.rejects(()=>window.JBAdMediaPreview.inspect(makeFile(bytes.png,{type:''})),/MIME_OR_MAGIC_SIGNATURE_MISMATCH/);
});
test('ADS-010/011 photo preview keeps contain, video is silent/not autoplay; no network calls',async()=>{
 const {window,urls}=setup();const nodes=[];
 const box={replaceChildren(){nodes.length=0},append(...items){nodes.push(...items)}};
 const info=await window.JBAdMediaPreview.stage(box,
   makeFile(bytes.png,{name:'portrait.png',type:'image/png'}));
 assert.equal(info.kind,'image');assert.equal(nodes.length,2);
 assert.equal(nodes[0].style.objectFit,'contain');
 assert.equal(nodes[0].style.maxHeight,'320px');
 assert.match(nodes[1].textContent,/NOT APPROVED|NOT_UPLOADED|Approved नहीं/i);
 assert.match(nodes[1].textContent,/EXIF\/GPS stripping/);
 await window.JBAdMediaPreview.stage(box,
  makeFile(bytes.mp4,{name:'clip.mp4',type:'video/mp4'}));
 assert.equal(nodes.length,2);assert.equal(nodes[0].tagName,'VIDEO');
 assert.equal(nodes[0].controls,true);
 assert.equal(nodes[0].autoplay,false);
 assert.equal(nodes[0].muted,true);
 assert.equal(nodes[0].preload,'metadata');
 assert.equal(urls.length,2);
});
test('ADS-015 replacing or disposing preview revokes previous local blob and never uploads',async()=>{
 const {window,urls,revoked}=setup();const nodes=[];
 const box={replaceChildren(){nodes.length=0},append(...items){nodes.push(...items)}};
 const f=makeFile(bytes.webp,{name:'banner.webp',type:'image/webp'});
 await window.JBAdMediaPreview.stage(box,f);
 await window.JBAdMediaPreview.stage(box,f);
 assert.deepEqual(revoked,['blob:private-preflight-1']);
 window.JBAdMediaPreview.dispose(box);
 assert.equal(nodes.length,0);
 assert.deepEqual(revoked,urls);
 assert.equal(/(?:upload|fetch|XMLHttpRequest)\(/.test(
  fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js','utf8')),false);
});
test('ADS-010 local preview keeps user-supplied file name OUT of DOM HTML (no XSS)',async()=>{
 const {window}=setup();const nodes=[];
 const box={replaceChildren(){nodes.length=0},append(...items){nodes.push(...items)}};
 await window.JBAdMediaPreview.stage(box,
 makeFile(bytes.jpeg,{name:'<img src=x onerror=alert(1)>.jpg',type:'image/jpeg'}));
 assert.equal(nodes.length,2);
 assert.doesNotMatch(nodes[1].textContent,/<img/);
 assert.match(nodes[1].textContent,/LOCAL PREVIEW ONLY/);
});
