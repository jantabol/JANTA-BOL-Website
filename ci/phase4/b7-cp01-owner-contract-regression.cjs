'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8');
const uuid='11111111-1111-4111-8111-111111111111';
function setup(data,owner=true){
 const calls=[],window={JBBackend:{
  requireOwner:async()=>{if(!owner)throw Error('OWNER_AAL2_REQUIRED')},
  client:{rpc:async(name,args)=>{calls.push({name,args});const v=data[name];return v instanceof Error?{data:null,error:v}:{data:v,error:null}}}
 }};
 vm.runInNewContext(src,{window,Date,URL,Error,Number,Array,String,Object});
 return {api:window.JBPhase4,calls};
}
const queues=[
 ['BE02','adNotificationFailures','jb_ad_notification_failures_internal',
 [{audit_id:11,record_id:uuid,event:'ad_requested'}]],
 ['BE03','adRenewalRequests','jb_ad_owner_renewals_internal',
 [{id:uuid,campaign_id:uuid,status:'pending'}]],
 ['BE04','adChangeRequests','jb_ad_owner_change_requests_internal',
 [{id:uuid,campaign_id:uuid,status:'pending'}]]
];
for(const [id,method,rpc,valid] of queues){
 test('CP01 '+id+': genuine [] is empty; missing/malformed RPC must never show false zero',async()=>{
  for(const malformed of [null,false,{},'',{rows:[]}]){
   const x=setup({[rpc]:malformed});
   await assert.rejects(()=>x.api[method](),/B7_OWNER_QUEUE_INVALID_RESPONSE/);
  }
  const good=setup({[rpc]:[]});assert.deepEqual(Array.from(await good.api[method]()),[]);
  assert.equal(good.calls[0].name,rpc);
  assert.equal((await setup({[rpc]:valid}).api[method]()).length,1);
 });
 test('CP01 '+id+': malformed row denied instead of silently skipped',async()=>{
  for(const rows of [[null],[{}],[{id:'forged',campaign_id:uuid,audit_id:-1,record_id:'forged'}]]){
   const x=setup({[rpc]:rows});
   await assert.rejects(()=>x.api[method](),/B7_OWNER_QUEUE_INVALID_RESPONSE/);
  }
 });
 test('CP01 '+id+': require Owner before any backend read',async()=>{
  const x=setup({[rpc]:[]},false);
  await assert.rejects(()=>x.api[method](),/OWNER_AAL2_REQUIRED/);
  assert.equal(x.calls.length,0);
 });
}
const stat=(p={})=>({today:2,d7:3,d30:4,total:5,unverified_legacy:0,
 reach_type:'client_reported_estimate_not_unique_people',anti_bot_verified:false,...p});
test('CP01 BE01: qualified counts require nonnegative consistent safe integers and truthful reach type',async()=>{
 const good=setup({jb_ad_qualified_analytics_internal:stat()});
 assert.equal((await good.api.adQualifiedAnalytics(uuid)).today,2);
 for(const value of [null,[],true,stat({today:null}),stat({d7:-1}),stat({d7:2.5}),
  stat({total:'5'}),stat({today:10}),stat({d7:9}),stat({d30:9}),
  stat({anti_bot_verified:true}),stat({reach_type:'human_confirmed'})]){
  const x=setup({jb_ad_qualified_analytics_internal:value});
  await assert.rejects(()=>x.api.adQualifiedAnalytics(uuid),/QUALIFIED_ANALYTICS_NOT_AVAILABLE/);
 }
});
test('CP01 BE01: wrong campaign and AAL1 cannot read stats',async()=>{
 const x=setup({jb_ad_qualified_analytics_internal:stat()});
 await assert.rejects(()=>x.api.adQualifiedAnalytics('forged'),/INVALID_CAMPAIGN_ID/);
 assert.equal(x.calls.length,0);
 const denied=setup({jb_ad_qualified_analytics_internal:stat()},false);
 await assert.rejects(()=>denied.api.adQualifiedAnalytics(uuid),/OWNER_AAL2_REQUIRED/);
 assert.equal(denied.calls.length,0);
});
test('CP01 BE16: remote RPC error retains original source code, never disguised as empty',async()=>{
 for(const [,method,rpc] of queues){
  for(const code of ['PGRST202','42501']){
   const err=Object.assign(Error('unavailable'),{code}),x=setup({[rpc]:err});
   await assert.rejects(()=>x.api[method](),v=>v.code===code);
  }
 }
});
test('CP01 5 issue single-home and safe Owner UI contracts preserved',()=>{
 assert.doesNotMatch(src,/return Array\.isArray\(rows\)\?rows:\[\]/);
 for(const [,method,fn] of queues)assert.match(src,new RegExp(fn));
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
 for(const label of ['Qualified analytics','Notification issues queue','Renewal queue','Change-request queue'])
  assert.ok(html.includes("b7OwnerReadFailure(e,'"+label+"')"));
 assert.ok(html.includes('CLIENT-REPORTED AD ACTIVITY'));
});
