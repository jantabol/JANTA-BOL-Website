'use strict';
// CP02 E1: exercise actual optional renderer bridge + review-only viewer guard.
// NO Supabase, no paid ad or real Android. Exact tests are not E2/E3/E5.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C='30000000-0000-0000-0000-000000000001';
const K='40000000-0000-0000-0000-000000000001';
class FakeEl {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.dataset={};this.children=[];this.parentNode=null;this.attributes={};this.style={};this.isConnected=true}
 append(...es){for(const e of es){e.parentNode=this;this.children.push(e)}}
 replaceChildren(...es){for(const x of this.children)x.parentNode=null;this.children=[];this.append(...es)}
 setAttribute(k,v){this.attributes[k]=v}
 addEventListener(n,cb){this['on'+n]=cb}
 querySelector(s){return this.children.find(x=>x.tagName===s.toUpperCase())||null}
}
function setup({visibility=true,bridge=true,adType='text',creativeId=K}={}){
 let events={},timers=new Map(),index=0,fetches=0,probes=0,paused=0;
 const slot=new FakeEl();slot.dataset.jbAdPlacement='article';
 const doc={createElement:t=>new FakeEl(t),querySelectorAll:()=>[slot]};
 const g={
  addEventListener:(n,cb)=>{events[n]=cb},
  removeEventListener:(n,cb)=>{if(events[n]===cb)delete events[n]},
  setInterval:(fn,ms)=>{assert.equal(ms,15000);const id=++index;timers.set(id,fn);return id},
  clearInterval:id=>timers.delete(id),
  setTimeout,clearTimeout,
  JBBackend:{client:{rpc:async(name,args)=>{
   if(name==='jb_ad_public_feed'){
    fetches++;
    return {data:[{campaign_id:C,creative_id:creativeId,creative_type:adType,
      text_body:'साफ विज्ञापन परीक्षण',media_url:'https://media.example.com/img.jpg',
      poster_url:'https://media.example.com/poster.jpg',cta_type:null,cta_target:null}],error:null};
   }
   if(name!=='jb_ad_visibility_alive_public')throw Error('UNEXPECTED_RPC_'+name);
   probes++;assert.equal(args.p_campaign,C);assert.equal(args.p_creative,creativeId);
   if(visibility==='error')return{data:null,error:{code:'PGRST202'}};
   if(visibility==='throw')throw Error('network');
   if(typeof visibility==='function')return visibility();
   return {data:visibility,error:null};
  }}}}
 };
 const c=vm.createContext({window:g,document:doc,URL,setTimeout,clearTimeout});
 vm.runInContext(fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8'),c);
 if(bridge)vm.runInContext(fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/b7-ad-revocation-bridge.js','utf8'),c);
 return {g,slot,events,timers,flush:async()=>{for(const t of [...timers.values()])await t()},
  render:()=>g.JBPublicAds.render('article','global'),
  get fetches(){return fetches},get probes(){return probes}
 };
}
test('ADS019: default legacy HTML has NO ad revocation script, so existing article is not secretly reselected',async()=>{
 for(const page of ['article.html','index.html']){
  const text=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/'+page,'utf8');
  assert.equal(text.includes('b7-ad-revocation-bridge.js'),false,
   'paired server E2+E5 missing; do not activate prematurely');
 }
 const t=setup({bridge:false});await t.render();
 assert.equal(t.slot.children.length,1);assert.equal(t.timers.size,0);
 assert.equal(t.fetches,1);
});
test('ADS019: true from same-card server probe keeps the ONE pinned advertisement unchanged',async()=>{
 const x=setup({visibility:true});await x.render();const card=x.slot.children[0];
 assert.equal(x.timers.size,1);assert.equal(x.fetches,1);
 await x.flush();assert.equal(x.slot.children.length,1);assert.equal(x.slot.children[0],card);
 assert.equal(x.fetches,1);assert.equal(x.probes,1);
});
test('ADS019: emergency hide FALSE revokes existing card and never auto-selects second ad',async()=>{
 const x=setup({visibility:false});await x.render();assert.equal(x.slot.children.length,1);
 await x.flush();assert.equal(x.slot.children.length,0);assert.equal(x.timers.size,0);
 await x.render();assert.equal(x.fetches,1,'pinned slot never rotates after emergency hide');
 assert.equal(x.slot.children.length,0);
});
for(const state of ['error','throw',null,'1']){
 test('ADS019: missing/invalid/rejected backend visibility '+String(state)+' fails closed',async()=>{
  const x=setup({visibility:state});await x.render();await x.flush();
  assert.equal(x.slot.children.length,0);assert.equal(x.timers.size,0);
  assert.equal(x.fetches,1);
 });
}
test('ADS019: stale or invalid creative id never enters a polling cycle',async()=>{
 const x=setup({creativeId:'not-a-uuid'});await x.render();
 assert.equal(x.slot.children.length,0);assert.equal(x.timers.size,0);
});
test('ADS019: closing Article clears heartbeat and does not touch NEWS page',async()=>{
 const x=setup();await x.render();assert.ok(x.events.pagehide);
 x.events.pagehide();assert.equal(x.timers.size,0);
 assert.equal(x.fetches,1);
});
test('ADS019: repeated rapid timers never overlap pending visibility requests',async()=>{
 let finish;const x=setup({visibility:()=>new Promise(resolve=>{finish=resolve})});
 await x.render();
 const fn=[...x.timers.values()][0];const waiting=fn();await fn();
 assert.equal(x.probes,1);
 finish({data:false,error:null});await waiting;
 assert.equal(x.slot.children.length,0);assert.equal(x.timers.size,0);
});
test('ADS019: active video paused before removal (no other element affected)',async()=>{
 const x=setup();const slot=new FakeEl(),box=new FakeEl('aside');slot.append(box);
 let pauses=0;box.querySelector=()=>({pause(){pauses++}});
 let hidden=false;
 const client={rpc:async()=>({data:hidden?false:true,error:null})};
 const watcher=x.g.JBAdRevocation.watch({slot,box,campaignId:C,creativeId:K,client});
 assert.ok(watcher);await watcher.checkNow();assert.equal(slot.children.length,1);
 hidden=true;await watcher.checkNow();assert.equal(pauses,1);
 assert.equal(slot.children.length,0);
});
test('ADS023: Owner AAL2 is required for opt-in idempotent safety RPC, and LIVE cannot use it',async()=>{
 const rpc=[];
 const g={JBBackend:{
  requireOwner:async()=>true,
  client:{rpc:async(name,args)=>{rpc.push({name,args});return{data:{status:'hidden'},error:null}}}
 }};
 vm.runInNewContext(fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8'),{window:g,Error,Date,URL});
 await g.JBPhase4.adSafetyTransitionIdempotent(C,'hidden','Emergency confirmed');
 assert.equal(rpc.length,1);assert.equal(rpc[0].name,'jb_ad_safety_transition_idempotent_internal');
 assert.equal(rpc[0].args.p_id,C);assert.equal(rpc[0].args.p_status,'hidden');
 for(const status of ['live','approved','paid','payment_pending']){
  await assert.rejects(()=>g.JBPhase4.adSafetyTransitionIdempotent(C,status),/T036_CP02_SAFETY_ONLY/);
 }
 assert.equal(rpc.length,1,'positive state must never call safety RPC');
 g.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED')};
 await assert.rejects(()=>g.JBPhase4.adSafetyTransitionIdempotent(C,'hidden'),/OWNER_AAL2_REQUIRED/);
 assert.equal(rpc.length,1);
});
test('ADS023: missing paired backend procedure fails CLOSED with no legacy write fallback',async()=>{
 const seen=[],g={JBBackend:{
  requireOwner:async()=>true,client:{rpc:async(name,args)=>{seen.push(name);return{data:null,error:{code:'PGRST202'}}}}
 }};
 vm.runInNewContext(fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8'),{window:g,Error,Date,URL});
 await assert.rejects(()=>g.JBPhase4.adSafetyTransitionIdempotent(C,'hidden'));
 assert.deepEqual(seen,['jb_ad_safety_transition_idempotent_internal']);
 assert.equal(seen.includes('jb_ad_transition_internal'),false);
});
