// T071: exercise the real pinned B8 integrated domain client with controlled
// in-memory RPC faults. NEVER connect to production or claim hosted E2/E8.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';

const fixture=process.env.T071_PINNED_INTEGRATED_ROOT;
assert(fixture && !fixture.includes('..') && fixture.endsWith('t071-integrated-fixture'),
 'PINNED_B8_SOURCE_CHECKOUT_REQUIRED');
const source=readFileSync(join(fixture,'JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js'),'utf8');
function boot({ownerAllowed=true,response='throw'}={}){
 const calls=[];
 const g={JBBackend:{
  requireOwner:async()=>{if(!ownerAllowed)throw Error('OWNER_AAL2_REQUIRED')},
  client:{
   rpc:async (name,args)=>{
    calls.push({name,args});
    if(response==='throw')throw Error('T071_ISOLATED_BACKEND_NETWORK_LOSS');
    if(response==='error')return {data:null,error:{code:'T071_FAKE_BACKEND_UNAVAILABLE'}};
    return {data:'FAKE_ACK_NO_PRODUCTION_ACTION',error:null};
   },
   from:table=>{
    calls.push({table});
    return {select(){return this},order(){return Promise.resolve(
      response==='success'?{data:[],error:null}:{data:null,error:{code:'T071_FAKE_DB_FAILURE'}})}};
   }
  }
 }};
 vm.runInNewContext(source,{window:g,Error,Date,URL});
 assert(g.JBPhase4,'Expected actual domain client object');
 return {api:g.JBPhase4,calls};
}
const id='30000000-0000-4000-8000-000000000001';
const receipt={amountMinor:50000,method:'upi',reference:'T071-FAKE-UTR-NOT-ACTUAL',
 evidenceRef:'T071-SIMULATED-RECEIPT',acceptanceRef:'T071-SIMULATED-TERMS',
 verificationNote:'T071 deliberately synthetic receipt, no payment',
 receiptAt:'2026-10-15T11:30:00Z',acceptedAt:'2026-10-15T11:00:00Z',
 confirm:'CONFIRM'};
for(const response of ['throw','error']){
 test('T071 actual domain client payment RPC '+response+' cannot report success or auto-schedule ads',async()=>{
  const x=boot({response});
  await assert.rejects(x.api.adConfirmManualPayment(id,receipt),
   /T071_ISOLATED_BACKEND_NETWORK_LOSS|T071_FAKE_BACKEND_UNAVAILABLE/);
  assert.equal(x.calls.length,1);
  assert.equal(x.calls[0].name,'jb_ad_confirm_manual_payment_internal');
  assert(!x.calls.some(c=>/schedule|activate|publish/i.test(c.name??'')));
 });
 test('T071 notification RPC '+response+' must not fabricate a successful Owner retry',async()=>{
  const x=boot({response});
  await assert.rejects(x.api.adRetryNotification(10),
   /T071_ISOLATED_BACKEND_NETWORK_LOSS|T071_FAKE_BACKEND_UNAVAILABLE/);
  assert.deepEqual(x.calls.map(c=>c.name),['jb_ad_notification_retry_internal']);
 });
 test('T071 grievance/compliance RPC '+response+' must not falsely confirm protected state change',async()=>{
  const x=boot({response});
  await assert.rejects(x.api.grievanceTransition(id,'UNDER_REVIEW','T071 simulated'),
   /T071_ISOLATED_BACKEND_NETWORK_LOSS|T071_FAKE_BACKEND_UNAVAILABLE/);
  await assert.rejects(x.api.complianceTransition(id,'REVIEW_REQUIRED','T071 simulated'),
   /T071_ISOLATED_BACKEND_NETWORK_LOSS|T071_FAKE_BACKEND_UNAVAILABLE/);
  assert.deepEqual(x.calls.map(c=>c.name),
   ['jb_grievance_transition_internal','jb_compliance_transition_internal']);
  // This test probes only returned client error: actual backend RLS authorization
  // remains a separate real-access test, not a claimed PASS here.
 });
}
test('T071 legacy ad payment action remains disabled even under Owner with healthy fake backend',async()=>{
 const x=boot({response:'success'});
 await assert.rejects(x.api.adConfirmPayment(id,'CONFIRM',50000),
  /B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE/);
 assert.equal(x.calls.length,0);
});
test('T071 expired Owner verification blocks payment before any backend or ad transition call',async()=>{
 const x=boot({ownerAllowed:false,response:'success'});
 await assert.rejects(x.api.adConfirmManualPayment(id,receipt),/OWNER_AAL2_REQUIRED/);
 assert.equal(x.calls.length,0);
});
test('T071 provider notification failure queue source throws instead of pretending 0 failures',async()=>{
 const x=boot({response:'error'});
 await assert.rejects(x.api.adNotificationFailures(),/T071_FAKE_BACKEND_UNAVAILABLE/);
 assert.deepEqual(x.calls.map(c=>c.name),['jb_ad_notification_failures_internal']);
});
test('T071 no external payment provider, DB, email or message was contacted by the isolated VM',()=>{
 assert.equal(process.env.T071_REAL_PRODUCTION_ENDPOINT_TOUCHED,undefined);
 assert(!source.includes('T071_ISOLATED_BACKEND_NETWORK_LOSS'));
});
