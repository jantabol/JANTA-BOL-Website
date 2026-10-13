'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const media=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js','utf8');
const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
const script=html.split("<script>'use strict';")[1]?.split('</script>')[0];
if(!script)throw Error('B7_CP04_OWNER_INLINE_SCRIPT_NOT_FOUND');
const bytes={
 jpg:[255,216,255,224,0,16,74,70,73,70],
 mp4:[0,0,0,24,102,116,121,112,105,115,111,109]
};
function file(data,kind='image',custom={}){
 return {name:kind==='video'?'clip.mp4':'5990.jpg',
  type:kind==='video'?'video/mp4':'image/jpeg',
  size:data.length,slice(_start,end){
   return {arrayBuffer:async()=>Uint8Array.from(data.slice(0,end)).buffer};
  },...custom};
}
function harness(){
 const elements=new Map(),urls=[],revoked=[],created=[];
 function el(id){
  if(elements.has(id))return elements.get(id);
  const obj={
   id,value:'',hidden:false,disabled:false,type:'url',accept:'',
   placeholder:'',textContent:'',files:[],attributes:{},children:[],
   setAttribute(k,v){this.attributes[k]=v},
   replaceChildren(){this.children=[];this.textContent=''},
   append(...nodes){this.children.push(...nodes)}
  };
  if(id.startsWith('adfile-')){
   let value='';
   Object.defineProperty(obj,'value',{get(){return value},
    set(v){value=v;if(v==='')obj.files=[]}});
  }
  elements.set(id,obj);return obj;
 }
 const document={
  documentElement:{dataset:{jbAuth:'pending'}},getElementById:el,
  createElement(tag){
   const node={tagName:tag.toUpperCase(),style:{},attributes:{},
    textContent:'',src:'',setAttribute(k,v){this.attributes[k]=v}};
   created.push(node);return node;
  }
 };
 const window={document,URL:{
  createObjectURL(){const url='blob:b7-owner-cp04-'+(urls.length+1);urls.push(url);return url},
  revokeObjectURL(url){revoked.push(url)}
 },addEventListener(){}};
 const ctx=vm.createContext({window,document,Intl,Date,Set,Uint8Array,
  Array,Number,String,Object,Error,addEventListener(){},
  JBBackend:{esc:x=>x},JBPhase4:{}});
 vm.runInContext(media,ctx,{filename:'ad-media-preview.js'});
 ctx.JBAdMediaPreview=window.JBAdMediaPreview;
 vm.runInContext("'use strict';"+script,ctx,{filename:'ads.html-inline'});
 return {ctx,window,el,urls,revoked,created};
}
test('UI01: every CTA switch clears the previous URL/phone; No CTA never keeps a target',()=>{
 const h=harness(),id='owner-01',choice=h.el('ca-'+id),target=h.el('cu-'+id);
 for(const [kind,input,expectedType] of [
  ['website','https://site.example.org','url'],
  ['call','+919876543210','tel'],
  ['whatsapp','+919876543210','tel'],
  ['map','https://maps.example.org/location','url'],
  ['', '', 'url']
 ]){
  target.value=input||'https://stale.example.org';
  choice.value=kind;h.ctx.creativeCtaChanged(id);
  assert.equal(target.value,'');
  assert.equal(target.hidden,!kind);
  assert.equal(target.disabled,!kind);
  if(kind)assert.equal(target.type,expectedType);
 }
 // The Save DRAFT action MUST NOT reuse a target in No CTA mode.
 const ownerSql=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_creative_draft_approval_REVIEW_ONLY.sql','utf8');
 assert.match(ownerSql,/CTA_TARGET_WITHOUT_TYPE/);
 assert.match(ownerSql,/HTTPS_CTA_REQUIRED/);
 assert.match(ownerSql,/INVALID_PHONE_CTA/);
});
test('UI02: changing Image→Video disposes photo bytes + URL before any new video preview',async()=>{
 const h=harness(),id='owner-02',f=h.el('adfile-'+id),kind=h.el('ct-'+id),box=h.el('adfilepreview-'+id);
 f.value='5990.jpg';f.files=[file(bytes.jpg)];
 kind.value='image';
 await h.ctx.previewLocalMedia(id);
 assert.equal(box.children[0]?.tagName,'IMG');
 assert.equal(h.urls.length,1);
 kind.value='video';h.ctx.creativeTypeChanged(id);
 assert.equal(f.value,'');assert.equal(f.files.length,0);
 assert.equal(f.accept,'video/mp4');
 assert.equal(box.children.length,0);assert.deepEqual(h.revoked,h.urls);
 f.value='5990.jpg';f.files=[file(bytes.jpg)];
 await h.ctx.previewLocalMedia(id);
 assert.equal(box.children.length,0,'JPG signature must not preview as video');
 assert.equal(f.value,'');
 assert.match(box.textContent,/LOCAL_MEDIA_TYPE_MISMATCH/);
 assert.equal(h.urls.length,1);
});
test('UI03: Image→Text invalidates slow pending Android Gallery preview',async()=>{
 const h=harness(),id='owner-03',chooser=h.el('adfile-'+id),kind=h.el('ct-'+id),box=h.el('adfilepreview-'+id);
 let resume;
 chooser.value='waiting.jpg';
 chooser.files=[file(bytes.jpg,'image',{
  slice(){return {arrayBuffer:()=>new Promise(resolve=>{resume=resolve})}}
 })];
 kind.value='image';const inFlight=h.ctx.previewLocalMedia(id);
 assert.equal(typeof resume,'function');
 kind.value='text';h.ctx.creativeTypeChanged(id);
 resume(Uint8Array.from(bytes.jpg).buffer);
 await inFlight;
 assert.equal(box.children.length,0);assert.equal(box.textContent,'');
 assert.equal(h.urls.length,0);
 assert.equal(chooser.files.length,0);
});
test('UI04: Text mode hides and disables all media fields; Image restores them',()=>{
 const h=harness(),id='owner-04',kind=h.el('ct-'+id);
 const group=h.el('admedia-controls-'+id),file=h.el('adfile-'+id),url=h.el('cm-'+id);
 file.value='old.mp4';url.value='https://media.example.com/old.mp4';
 kind.value='text';h.ctx.creativeTypeChanged(id);
 assert.equal(group.hidden,true);assert.equal(file.disabled,true);assert.equal(url.disabled,true);
 assert.equal(file.value,'');assert.equal(url.value,'');
 assert.match(html,/id="admedia-controls-\$\{x\.id\}"/);
 assert.match(html,/\.ad-media-controls\[hidden\].*display:none!important/);
 kind.value='image';h.ctx.creativeTypeChanged(id);
 assert.equal(group.hidden,false);assert.equal(file.disabled,false);assert.equal(url.disabled,false);
 assert.equal(file.accept,'image/jpeg,image/png,image/webp');
});
test('UI05: removing Gallery preview revokes blob but retains text draft + CTA and request fields',async()=>{
 const h=harness(),id='owner-05',fileInput=h.el('adfile-'+id),
  textDraft=h.el('cx-'+id),target=h.el('cu-'+id),cta=h.el('ca-'+id),
  mediaProposal=h.el('cm-'+id),box=h.el('adfilepreview-'+id);
 textDraft.value='Founder unsaved text';target.value='https://site.example.org';
 cta.value='website';mediaProposal.value='https://img.example.org/proposal.jpg';
 fileInput.value='5990.jpg';fileInput.files=[file(bytes.jpg)];
 h.el('ct-'+id).value='image';await h.ctx.previewLocalMedia(id);
 assert.equal(h.urls.length,1);assert.equal(box.children[0]?.tagName,'IMG');
 h.ctx.clearLocalAdFile(id);
 assert.equal(fileInput.value,'');assert.equal(fileInput.files.length,0);
 assert.equal(box.children.length,0);assert.deepEqual(h.revoked,h.urls);
 assert.match(box.textContent,/nothing uploaded/);
 assert.equal(textDraft.value,'Founder unsaved text');
 assert.equal(target.value,'https://site.example.org');
 assert.equal(cta.value,'website');
 assert.equal(mediaProposal.value,'https://img.example.org/proposal.jpg');
 assert.match(html,/LOCAL_MEDIA_NOT_UPLOADED/);
});
test('UI05 failure safety: failed DOM append must immediately revoke URL and not revoke twice on Remove',async()=>{
 const h=harness(),box=h.el('adfilepreview-fail');
 box.append=()=>{throw Error('DOM_APPEND_FAILURE')};
 await assert.rejects(
  ()=>h.window.JBAdMediaPreview.stage(box,file(bytes.jpg),'image'),
  /DOM_APPEND_FAILURE/);
 assert.deepEqual(h.revoked,h.urls);
 assert.equal(h.urls.length,1);
 h.window.JBAdMediaPreview.dispose(box);
 assert.deepEqual(h.revoked,h.urls,'blob URL must not linger after failed DOM append');
});
