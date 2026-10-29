// T071 actual integrated repository ADAPTERS executed in a sealed Node VM.
// Faults are injected into dependency boundaries, NEVER JANTA BOL prod/staging.
// 13 DOMAIN ADAPTER EXERCISES != 13 HOSTED FAULT MATRIX ACCEPTANCES or E8.
// Separately pinned fixture SHA checks are performed by GitHub Actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const dir=process.env.T071_PINNED_INTEGRATED_ROOT;
const b9dir=process.env.T071_PINNED_SEARCH_ROOT;
assert(dir?.endsWith('t071-integrated-fixture') && !dir.includes('..'),'Pinned real B8 source required');
assert(b9dir?.endsWith('t071-search-fixture') && !b9dir.includes('..'),'Pinned real B9 source required');
const file=(root,name)=>readFileSync(join(root,'JANTA_BOL_PHASE_3C_WORKING',name),'utf8');
const domainSource=file(dir,'phase4-domain-client.js');
const liveSource=file(dir,'phase3a-live-client.js');
const providerSource=file(dir,'phase3c-live-delivery.js');
const socialHtml=file(dir,'social.html');
const b9Source=file(b9dir,'b9-client.js');
const publicCaseSource=file(dir,'b8-public-case-client.js');
const id='30000000-0000-4000-8000-000000000001';
const fakeReceipt={amountMinor:50000,method:'upi',reference:'T071-NOT-A-REAL-UTR',
 evidenceRef:'T071-SYNTHETIC-RECEIPT',acceptanceRef:'T071-SYNTHETIC-CONSENT',
 verificationNote:'Isolated negative dependency fault check, no payment',
 receiptAt:'2026-10-15T11:30:00Z',acceptedAt:'2026-10-15T11:00:00Z',confirm:'CONFIRM'};
function domain(mode='throw',ownerAllowed=true) {
 const calls=[];const g={JBBackend:{
  requireOwner:async()=>{if(!ownerAllowed)throw Error('OWNER_AAL2_REQUIRED')},
  client:{
   rpc:async (name,args)=>{
    calls.push({name,args});
    if(mode==='throw')throw Error('T071_FAULT_RPC_NETWORK_DOWN');
    if(mode==='error')return {data:null,error:Error('T071_FAULT_RPC_ERROR')};
    if(mode==='bad')return {data:null,error:null};
    return {data:'T071_LOCAL_FAKE_RESULT',error:null};
   },
   from:table=>{
    calls.push({table});
    const q={select(){return q},order(){return Promise.resolve({data:null,error:Error('T071_FAULT_DB_READ')})}};
    return q;
   }
  }
 }};
 vm.runInNewContext(domainSource,{window:g,Error,Date,URL},{timeout:1000});
 assert(g.JBPhase4);
 return {api:g.JBPhase4,calls};
}
function live(mode='throw') {
 const calls=[];const win={JBBackend:{client:{functions:{invoke:async(name,{body})=>{
   calls.push({name,action:body.action});
   if(mode==='throw')throw Error('T071_FAULT_PROVIDER_NETWORK');
   if(mode==='error')return {data:null,error:Error('T071_FAULT_EDGE_HTTP')};
   return {data:{ok:false,error:'T071_PROVIDER_UNKNOWN'},error:null};
 }}}}};
 vm.runInNewContext(liveSource,{window:win,Error,Map},{timeout:1000});
 assert(win.JBLive);
 return {api:win.JBLive,calls};
}
function passed(name,classification='VM_REAL_ADAPTER_ONLY') {
 console.log('T071_FAULT_MATRIX_VM '+name+'='+classification+'; HOSTED_E8=NOT_RUN');
}
const expectFail=async promise=>assert.rejects(promise,/T071_FAULT|T071_PROVIDER_UNKNOWN|B7_SAFE|B7_LEGACY|B8_PUBLIC/);

test('01 SOCIAL: real social.html saveStatus refuses false Posted and failed socialAttempt leaves status unchanged',async()=>{
 const scripts=[...socialHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert(scripts.length>=1,'real social inline handler');
 const calls=[],win={};
 const doc={getElementById:id=>({textContent:'',checked:false,disabled:false,onchange:null}),
  documentElement:{dataset:{jbAuth:'loading'}}};
 const ctx=vm.createContext({
  window:win,document:doc,addEventListener:()=>{},
  JBPhase2:{socialAttempt:async(...args)=>{calls.push(args);throw Error('T071_FAULT_SOCIAL_PROVIDER')}},
  Error,URL,navigator:{},alert:()=>{},encodeURIComponent,
  location:{href:'https://invalid.local/social.html'}
 });
 vm.runInContext(scripts.at(-1)[1],ctx,{timeout:1000});
 const row={article_id:id,status:{facebook:'Pending'}};
 ctx.row=row;ctx.platform='facebook';ctx.value='Posted';
 await assert.rejects(vm.runInContext('saveStatus(row,platform,value)',ctx),/fake Posted allowed nahi/);
 assert.equal(calls.length,0);
 ctx.value='Failed';
 await assert.rejects(vm.runInContext('saveStatus(row,platform,value)',ctx),/T071_FAULT_SOCIAL_PROVIDER/);
 assert.equal(row.status.facebook,'Pending');
 assert.equal(calls.length,1);
 passed('social');
});
test('02 ANALYTICS: actual qualified analytics RPC outage gives error not invented zero views',async()=>{
 const x=domain('throw');await expectFail(x.api.adQualifiedAnalytics(id));
 assert.deepEqual(x.calls.map(z=>z.name),['jb_ad_qualified_analytics_internal']);
 passed('analytics');
});
test('03 NOTIFICATIONS: actual Owner retry outage returns rejection, not delivery confirmed',async()=>{
 const x=domain('error');await expectFail(x.api.adRetryNotification(7));
 assert.deepEqual(x.calls.map(z=>z.name),['jb_ad_notification_retry_internal']);
 passed('notifications');
});
test('04 GRIEVANCE: actual protected transition fails closed on RPC failure',async()=>{
 const x=domain();await expectFail(x.api.grievanceTransition(id,'UNDER_REVIEW','fault'));
 assert.deepEqual(x.calls.map(z=>z.name),['jb_grievance_transition_internal']);
 passed('grievance');
});
test('05 COMPLIANCE: actual protected compliance transition never returns false success',async()=>{
 const x=domain('error');await expectFail(x.api.complianceTransition(id,'REVIEW_REQUIRED','fault'));
 assert.deepEqual(x.calls.map(z=>z.name),['jb_compliance_transition_internal']);
 passed('compliance');
});
test('06 ADVERTISING: backend capability unavailable blocks LIVE before any transition',async()=>{
 const x=domain('error');await assert.rejects(x.api.adTransition(id,'live','fault'),/B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED/);
 assert.deepEqual(x.calls.map(z=>z.name),['jb_ad_lifecycle_capability_internal']);
 passed('advertising');
});
test('07 SEARCH: real B9 client requires RPC and throws on outage, no imaginary hits',async()=>{
 const calls=[],win={JBBackend:{client:{rpc:async(name,args)=>{
  calls.push({name,args});throw Error('T071_FAULT_SEARCH_DOWN');
 }}}};
 vm.runInNewContext(b9Source,{window:win,Error},{timeout:1000});
 await expectFail(win.JBB9.search({query:'पिछोर',limit:5}));
 assert.deepEqual(calls.map(z=>z.name),['jb_b9_search']);
 assert.equal(calls[0].args.p_limit,5);
 passed('search');
});
test('08 ACCOUNTABILITY: real allowlisted public projection adapter fails closed on outage',async()=>{
 const module=await import('data:text/javascript;base64,'+Buffer.from(publicCaseSource).toString('base64'));
 const calls=[];const api=module.createPublicCaseReader({rpc:async (method)=>{
  calls.push(method);return {data:null,error:Error('T071_FAULT_CASE_RPC')};
 }});
 await expectFail(api.feed(12));
 assert.deepEqual(calls,['jb_b8_g4_public_feed']);
 passed('accountability');
});
test('09 LIVE: real LIVE client rejects provider/edge failure, no command success',async()=>{
 const x=live('error');await expectFail(x.api.adminOverview());
 assert.deepEqual(x.calls.map(z=>z.name),['jb-live-api']);
 assert.deepEqual(x.calls.map(z=>z.action),['admin_overview']);
 passed('live');
});
test('10 EXTERNAL PROVIDER: real camera handoff refuses missing provider, never navigates',async()=>{
 const win={JBLive:{prepareCamera:async()=>{throw Error('T071_FAULT_ENCODER_PROVIDER')}}};
 const loc={href:'unchanged'};
 vm.runInNewContext(providerSource,{window:win,Error,location:loc,URL},{timeout:1000});
 await expectFail(win.JB3CDelivery.openReporterCamera(id));
 assert.equal(loc.href,'unchanged');
 passed('provider');
});
test('11 PAYMENTS: actual manual receipt RPC cannot confirm or auto-schedule after network loss',async()=>{
 const x=domain();
 await expectFail(x.api.adConfirmManualPayment(id,fakeReceipt));
 assert.deepEqual(x.calls.map(z=>z.name),['jb_ad_confirm_manual_payment_internal']);
 assert.equal(x.calls.some(z=>/schedule|activate|publish/i.test(z.name||'')),false);
 passed('payments');
});
test('12 MESSAGING: actual notification acknowledgement rejects unknown server state',async()=>{
 const x=live('unknown');
 await expectFail(x.api.acknowledgeNotification(id));
 assert.deepEqual(x.calls.map(z=>z.action),['notification_acknowledge']);
 passed('messaging');
});
test('13 DATABASE: actual Owner package read and write fail, never claim empty catalog or committed write',async()=>{
 const x=domain('throw');
 await assert.rejects(x.api.adPackages(),/T071_FAULT_DB_READ/);
 await expectFail(x.api.adSavePackage({name:'Test',placement:'homepage',priceMinor:100,
  durationDays:2,weight:1}));
 assert.deepEqual(x.calls.filter(z=>z.name).map(z=>z.name),['jb_ad_save_package_internal']);
 passed('database');
});
test('T071 boundary: no hosted recovery, real DB/transaction/message persistence, RPO/RTO or E8 can be inferred',()=>{
 assert.equal(process.env.T071_REAL_PRODUCTION_ENDPOINT_TOUCHED,undefined);
 assert.equal(process.env.T071_PRODUCTION_SECRETS_LOADED,undefined);
 assert(!domainSource.includes('T071_FAULT_RPC_NETWORK_DOWN'));
 assert(!liveSource.includes('T071_FAULT_PROVIDER_NETWORK'));
 console.log('T071_MATRIX_VM_SCOPE=13_REAL_CLIENT_ADAPTERS_WITH_FAKE_DEPENDENCY_FAILURES');
 console.log('T071_HOSTED_MATRIX=NOT_RUN; RPO=NOT_ESTABLISHED; RTO=NOT_ESTABLISHED; FINAL_LOCK=HOLD');
});
