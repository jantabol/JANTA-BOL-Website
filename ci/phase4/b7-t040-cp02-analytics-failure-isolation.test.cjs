'use strict';
// T040 CP02 E1: execute ACTUAL public renderer with simulated analytics
// outage. This is NOT a real Android E3 or production paid campaign.
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
const ARTICLE='10000000-0000-0000-0000-000000000001';
function setup(outage){
 class Node{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};
   this.dataset={};this.isConnected=true;this.textContent='';}
  append(...els){for(const e of els){e.parentNode=this;this.children.push(e)}}
  replaceChildren(...els){this.children=[];this.append(...els)}
  setAttribute(k,v){this.attributes[k]=v}
  addEventListener(event,fn){this['on'+event]=fn}
 }
 const slot=new Node('section');slot.dataset.jbAdPlacement='article';
 const news={textContent:'यह मूल समाचार है। विज्ञापन असफल होने पर भी यही रहेगा।'};
 let feedCalls=0,analyticsCalls=0;
 const ad={
  campaign_id:'30000000-0000-0000-0000-000000000005',
  creative_id:'40000000-0000-0000-0000-000000000005',
  creative_type:'text',text_body:'मूल स्वीकृत विज्ञापन',
  cta_type:'website',cta_target:'https://advertiser.example.org/promo'
 };
 const window={
  JBBackend:{client:{rpc:async name=>{
   if(name!=='jb_ad_public_feed')throw Error('NO_STATS_BACKEND_CALL_FROM_RENDERER');
   feedCalls++;
   if(outage==='feed-down')return{data:null,error:{code:'PGRST202'}};
   return{data:[ad],error:null};
  }}},
  JBAdAnalytics:{prepare(){
   analyticsCalls++;
   if(outage==='throw')throw Error('T040_ANALYTICS_BACKEND_DOWN');
   if(outage==='reject')return Promise.reject(Error('T040_STATS_RPC_UNAVAILABLE'));
   return Promise.resolve(false);
  }}
 };
 const document={createElement:tag=>new Node(tag),querySelectorAll:()=>[slot]};
 const context=vm.createContext({window,document,URL,WeakMap,WeakSet,Promise});
 vm.runInContext(code,context,{filename:'public-ads.js'});
 return{slot,news,window,get feedCalls(){return feedCalls},
  get analyticsCalls(){return analyticsCalls}};
}
for(const mode of ['throw','reject']){
 test('T040 ADS050: ad-analytics failure '+mode+' cannot remove News or the one advertised CTA',async()=>{
  const x=setup(mode);
  await x.window.JBPublicAds.render('article','article:'+ARTICLE);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(x.feedCalls,1);
  assert.equal(x.analyticsCalls,1);
  assert.equal(x.slot.children.length,1,'ONE original ad survives optional stats exception');
  const box=x.slot.children[0];
  assert.equal(box.attributes['aria-label'],'विज्ञापन');
  assert.equal(box.children.find(c=>c.tagName==='P').textContent,'मूल स्वीकृत विज्ञापन');
  const link=box.children.find(c=>c.tagName==='A');
  assert.equal(link.href,'https://advertiser.example.org/promo');
  assert.equal(x.news.textContent,'यह मूल समाचार है। विज्ञापन असफल होने पर भी यही रहेगा।');
  await x.window.JBPublicAds.render('article','article:'+ARTICLE);
  assert.equal(x.feedCalls,1,'Failure must not trigger new paid-ad selection');
  assert.equal(x.slot.children[0],box,'Card cannot rotate after analytics outage');
 });
}
test('T040 ADS050: public ad feed outage empties optional ad slot, never removes News',async()=>{
 const x=setup('feed-down');
 await x.window.JBPublicAds.render('article','article:'+ARTICLE);
 assert.equal(x.feedCalls,1);
 assert.equal(x.slot.children.length,0);
 assert.equal(x.analyticsCalls,0);
 assert.match(x.news.textContent,/मूल समाचार/);
 await x.window.JBPublicAds.render('article','article:'+ARTICLE);
 assert.equal(x.feedCalls,1,'Article remains pinned even when first feed is unavailable');
});
