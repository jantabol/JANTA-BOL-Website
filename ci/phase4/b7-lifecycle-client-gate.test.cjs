'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8');
function setup(mode){
 const calls=[],window={};
 const client={rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='jb_ad_lifecycle_capability_internal'){
   if(mode==='missing')return {error:{code:'PGRST202'}};
   return {data:mode==='wrong'?'OLD_UNSAFE_BACKEND':'B7_LIFECYCLE_PROTECTED_V1',error:null};
  }
  return {data:{ok:true},error:null};
 }};
 window.JBBackend={client,requireOwner:async()=>true};
 vm.runInNewContext(src,{window,Error,Array,Object,Number,String});
 return {api:window.JBPhase4,calls};
}
const id='33333333-3333-4333-8333-333333333333';
for(const state of ['approved','payment_pending','live']){
 test('BE07: '+state+' denied while safe backend not deployed',async()=>{
  const x=setup('missing');
  await assert.rejects(()=>x.api.adTransition(id,state,'test'),/B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED/);
  assert.equal(x.calls.some(y=>y.name==='jb_ad_transition_internal'),false);
 });
}
test('BE07: misleading old sentinel cannot allow LIVE',async()=>{
 const x=setup('wrong');
 await assert.rejects(()=>x.api.adTransition(id,'live'),/B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED/);
 assert.equal(x.calls.some(y=>y.name==='jb_ad_transition_internal'),false);
});
test('BE07: Owner emergency hide/pause/reject/cancel keep their existing backend path',async()=>{
 for(const status of ['hidden','paused','rejected','cancelled']){
  const x=setup('missing');
  await x.api.adTransition(id,status,'safety');
  assert.equal(x.calls.filter(y=>y.name==='jb_ad_transition_internal').length,1);
  assert.equal(x.calls.filter(y=>y.name==='jb_ad_lifecycle_capability_internal').length,0);
 }
});
test('BE07: strict capability permits reaching canonical backend (not E2 proof)',async()=>{
 const x=setup('good');await x.api.adTransition(id,'live','receipt');
 assert.equal(x.calls[0].name,'jb_ad_lifecycle_capability_internal');
 assert.equal(x.calls[1].name,'jb_ad_transition_internal');
});
test('BE07: malformed campaign id rejected before any RPC',async()=>{
 const x=setup('good');
 await assert.rejects(()=>x.api.adTransition('wrong','live'),/INVALID_CAMPAIGN_ID/);
 assert.equal(x.calls.length,0);
});
