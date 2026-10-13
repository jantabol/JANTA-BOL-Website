'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js','utf8');
const owner=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
const portal=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html','utf8');
const login=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/admin-login.html','utf8');
const png=[137,80,78,71,13,10,26,10,0,0,0,0],jpg=[255,216,255,224,0,16,74,70,73,70];
const mp4=[0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0];
const file=(bytes,name,type)=>({name,type,size:bytes.length,slice(){return {arrayBuffer:async()=>Uint8Array.from(bytes).buffer}}});
function browser(){
 let n=0;const urls=[],revoked=[],media=[];
 const document={createElement(tag){
  const item={tagName:tag.toUpperCase(),style:{},textContent:'',naturalWidth:0,naturalHeight:0,
   videoWidth:0,videoHeight:0,duration:0,handlers:{},setAttribute(){},
   addEventListener(k,cb){this.handlers[k]=cb},emit(k){this.handlers[k]?.()},src:''};
  if(tag==='img'||tag==='video')media.push(item);
  return item;
 }};
 const window={document,URL:{createObjectURL(){const x='blob:local-'+(++n);urls.push(x);return x},revokeObjectURL(x){revoked.push(x)}}};
 vm.runInNewContext(script,{window,Uint8Array,Array,String,Number,Object,Error});
 const box={children:[],replaceChildren(){this.children=[]},append(...nodes){this.children.push(...nodes)}};
 return {api:window.JBAdMediaPreview,box,media,urls,revoked};
}
test('ENV01 SPCK localhost refused is lifecycle condition not evidence of changed production',()=>{
 const map=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/B7_5X5_CHECKPOINT_EXECUTION_MAP_20261012.md','utf8');
 assert.match(map,/ERR_CONNECTION_REFUSED/);
 const flow=fs.readFileSync('.github/workflows/p4-t035-candidate-static.yml','utf8');
 assert.match(flow,/SPCK local preview DOES NOT deploy Supabase migrations/);
});
test('ENV02 same-tab relative advertiser portal cannot open new localhost tab',()=>{
 assert.match(owner,/href="advertiser-portal\.html">Advertiser portal page<\/a>/);
 assert.doesNotMatch(owner,/href="advertiser-portal\.html"[^>]*target="_blank"/);
 assert.match(portal,/href="index\.html"/);
});
test('ENV03 device credential requires supported secure context and existing Owner AAL2; no insecure workaround',()=>{
 for(const s of ['window.isSecureContext&&window.PublicKeyCredential&&navigator.credentials',
   'navigator.credentials.create','navigator.credentials.get',
   'DEVICE_CREDENTIAL_API_UNSUPPORTED',"aal?.currentLevel!=='aal2'",
   'Admin content locked hai'])
  assert.ok(login.includes(s),'missing local lock guard '+s);
});
test('ENV04 Gallery screenshot not auto-detected, only on-screen local dimensions are shown',async()=>{
 const h=browser();
 await h.api.stage(h.box,file(jpg,'<script>alert(1)</script>.jpg','image/jpeg'),'image');
 const lab=h.box.children[1];assert.doesNotMatch(lab.textContent,/<script>|alert\(/);
 assert.match(lab.textContent,/Gallery screenshot/);
 const img=h.media[0];img.naturalWidth=3264;img.naturalHeight=1840;img.emit('load');
 assert.match(lab.textContent,/3264 × 1840/);
 assert.match(lab.textContent,/original vs screenshot NOT independently verified/);
});
test('ENV04 stale old load event cannot change newer Gallery file preview label',async()=>{
 const h=browser();await h.api.stage(h.box,file(jpg,'old.jpg','image/jpeg'),'image');
 const old=h.media[0],oldLabel=h.box.children[1];
 await h.api.stage(h.box,file(png,'new.png','image/png'),'image');
 old.naturalWidth=123;old.naturalHeight=456;old.emit('load');
 assert.doesNotMatch(h.box.children[1].textContent,/123 × 456/);
 assert.ok(h.revoked.includes('blob:local-1'));
 h.media[1].naturalWidth=2448;h.media[1].naturalHeight=2448;h.media[1].emit('load');
 assert.match(h.box.children[1].textContent,/2448 × 2448/);
 assert.doesNotMatch(oldLabel.textContent,/123 × 456/);
});
test('ENV05 16:9, square, portrait 4:5 and ultra-wide preserve aspect without crop',async()=>{
 for(const [w,ht] of [[3264,1840],[2448,2448],[1600,2000],[4000,1000]]){
  const h=browser();await h.api.stage(h.box,file(jpg,'photo.jpg','image/jpeg'),'image');
  const img=h.media[0];img.naturalWidth=w;img.naturalHeight=ht;img.emit('load');
  assert.match(h.box.children[1].textContent,new RegExp(w+' × '+ht));
  assert.equal(img.style.objectFit,'contain');
  assert.match(h.box.children[1].textContent,/EXIF\/GPS stripping/);
 }
});
test('ENV05 15s MP4 is only LOCAL metadata, not a server poster or sanitation PASS',async()=>{
 const h=browser();await h.api.stage(h.box,file(mp4,'clip.mp4','video/mp4'),'video');
 const video=h.media[0];video.videoWidth=1920;video.videoHeight=1080;video.duration=15;
 video.emit('loadedmetadata');
 assert.match(h.box.children[1].textContent,/1920 × 1080/);
 assert.match(h.box.children[1].textContent,/15\.0 seconds/);
 assert.match(h.box.children[1].textContent,/must still be validated by server/);
 assert.match(h.box.children[1].textContent,/Approved नहीं है/);
 assert.equal(video.autoplay,false);assert.equal(video.preload,'metadata');
 h.api.dispose(h.box);assert.deepEqual(h.revoked,h.urls);
});
