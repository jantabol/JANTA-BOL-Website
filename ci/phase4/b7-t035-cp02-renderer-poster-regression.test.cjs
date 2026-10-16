'use strict';
// ADS-010/011/012/015: CP02 local DOM+renderer contract only.
// No production DB, URL fetch, credential, payment, or media upload.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
const HTTPS='https://media.example.org/';
function creative(type,changes={}){
 return {
  campaign_id:'10000000-0000-4000-8000-000000000001',
  creative_id:'20000000-0000-4000-8000-000000000001',
  creative_type:type,media_url:HTTPS+'sample.mp4',
  poster_url:HTTPS+'reviewed-poster.png',text_body:'Test sponsored content',
  cta_type:null,cta_target:null,...changes
 };
}
function harness(ad){
 const posterProbes=[];
 class FakePoster {
  constructor(){this.naturalWidth=0;this.naturalHeight=0;this.onload=null;this.onerror=null;posterProbes.push(this)}
  set src(v){this._src=v}
  get src(){return this._src}
  success(){this.naturalWidth=1920;this.naturalHeight=1080;this.onload?.()}
  fail(){this.onerror?.()}
 }
 class El {
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.attributes={};this.dataset={};this.isConnected=true}
  setAttribute(n,v){this.attributes[n]=v}
  addEventListener(n,cb){this['on'+n]=cb}
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this.children=[...nodes]}
 }
 const slot=new El('div');slot.dataset.jbAdPlacement='article';
 const document={createElement:tag=>new El(tag),querySelectorAll:()=>[slot]};
 const calls=[];
 const window={
  Image:FakePoster,
  setTimeout,clearTimeout,
  JBBackend:{client:{rpc:async (name,args)=>{
   calls.push({name,args});return{data:[ad],error:null};
  }}}
 };
 const context=vm.createContext({document,window,URL,setTimeout,clearTimeout});
 vm.runInContext(code,context,{filename:'public-ads.js'});
 return {slot,posterProbes,calls,render:(scope='global')=>window.JBPublicAds.render('article',scope)};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('ADS-011 no approved public video is inserted BEFORE poster decodes',async()=>{
 const h=harness(creative('video'));
 const task=h.render();
 await tick();
 assert.equal(h.calls.length,1);
 assert.equal(h.posterProbes.length,1,'must decode poster BEFORE DOM display');
 assert.equal(h.slot.children.length,0,'broken/undecoded poster must not expose video');
 h.posterProbes[0].success();
 await task;
 assert.equal(h.slot.children.length,1,'only one valid ad card allowed');
 const box=h.slot.children[0];
 assert.equal(box.children[0].textContent,'विज्ञापन');
 const video=box.children.find(x=>x.tagName==='VIDEO');
 assert.ok(video,'valid poster authorizes local display of video element');
 assert.equal(video.autoplay,false);
 assert.equal(video.muted,true);
 assert.equal(video.controls,true);
 assert.equal(video.preload,'none');
});
test('ADS-011 failed poster decode makes public ad empty and leaves news usable',async()=>{
 const h=harness(creative('video'));
 const task=h.render();
 await tick();
 assert.equal(h.posterProbes.length,1);
 h.posterProbes[0].fail();
 await task;
 assert.equal(h.slot.children.length,0,'broken poster must fail closed');
});
test('ADS-011 missing or private-IP poster never attempts preview or inserts ad',async()=>{
 for(const poster of [null,'', 'https://127.0.0.1/poster.png', 'http://media.example.org/poster.png']){
  const h=harness(creative('video',{poster_url:poster}));
  await h.render();
  assert.equal(h.posterProbes.length,0);
  assert.equal(h.slot.children.length,0);
 }
});
test('ADS-012 text-only public card preserves explicit विज्ञापन label and no media fetch',async()=>{
 const h=harness(creative('text',{media_url:null,poster_url:null}));
 await h.render();
 assert.equal(h.posterProbes.length,0);
 assert.equal(h.slot.children.length,1);
 const box=h.slot.children[0];
 assert.equal(box.attributes['aria-label'],'विज्ञापन');
 assert.equal(box.children[0].textContent,'विज्ञापन');
 assert.equal(box.children.find(x=>x.tagName==='P').textContent,'Test sponsored content');
 assert.equal(box.children.some(x=>x.tagName==='VIDEO'||x.tagName==='IMG'),false);
});
test('ADS-010 image uses contain CSS and does not need poster preload',async()=>{
 const h=harness(creative('image',{media_url:HTTPS+'whole-poster.png',poster_url:null}));
 await h.render();
 assert.equal(h.posterProbes.length,0);
 assert.equal(h.slot.children.length,1);
 const img=h.slot.children[0].children.find(x=>x.tagName==='IMG');
 assert.ok(img); assert.equal(img.alt,'विज्ञापन');
 const css=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.css','utf8');
 assert.match(css,/\.jb-public-ad-image,\.jb-public-ad-video\{[^}]*object-fit:contain/);
});
test('ADS-015 raw local phone file stays blocked from Save Pending DRAFT',()=>{
 const admin=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
 assert.match(admin,/LOCAL_MEDIA_NOT_UPLOADED/);
 assert.match(admin,/Local File Preview — NO UPLOAD/);
 assert.match(admin,/Image\/Video approval server media verification/);
});
