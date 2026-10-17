import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.mjs';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function fixture(role='owner',out=[{
 case_id:CASE,deadline:'2026-10-01',days_overdue:16,
 readiness:'DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT'
}],reject=false){
 const calls=[];
 const client={rpc:async(name,args)=>{calls.push({name,args});
 return reject?{data:null,error:{message:'offline'}}:{data:out,error:null};}};
 return {api:createB8Workflow({client,role}),calls};
}
test('G9 Owner due list is server-scoped and NOT a guilty verdict',async()=>{
 const {api,calls}=fixture();
 const d=await api.ownerDueG9Followups();
 assert.equal(d.length,1);assert.equal(d[0].case_id,CASE);
 assert.equal(d[0].readiness,'DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT');
 assert.deepEqual(calls,[{name:'jb_b8_g9_owner_due_followups',args:{}}]);
});
test('G9 Reporter/Editor cannot open Founder due case list',async()=>{
 for(const role of ['reporter','editor']){
  const {api,calls}=fixture(role);
  await assert.rejects(api.ownerDueG9Followups(),/B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
});
test('G9 cross-case / false proof / server outage rejected',async()=>{
 for(const item of [
  {case_id:'not-a-uuid',deadline:'2026-10-01',days_overdue:16,
   readiness:'DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT'},
  {case_id:CASE,deadline:'2026-10-01',days_overdue:16,
   readiness:'OFFICIAL_GUILT_VERIFIED'},
  {case_id:CASE,deadline:'2026-10-01',days_overdue:-3,
   readiness:'DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT'}
 ]){
  const {api}=fixture('owner',[item]);
  await assert.rejects(api.ownerDueG9Followups(),/B8_G9_UNTRUSTED_DUE_DASHBOARD/);
 }
 const {api:off}=fixture('owner',[],true);
 await assert.rejects(off.ownerDueG9Followups(),
  /B8_SERVER_REJECTED_jb_b8_g9_owner_due_followups/);
});
test('G9 private Owner dashboard uses textContent and clears on 15m lock',async()=>{
 const dir=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,js]=await Promise.all([
  readFile(new URL('b8-accountability.html',dir),'utf8'),
  readFile(new URL('b8-accountability-ui.mjs',dir),'utf8')
 ]);
 assert(html.includes('id="g9Due"'));
 assert(html.includes('id="g9DueOutput"'));
 assert(html.indexOf('id="g9Due"')<html.indexOf('<section id="reporter"'));
 assert(js.includes('workflow.ownerDueG9Followups()'));
 assert(js.includes("g9DueOutput').textContent='Locked"));
 assert(js.includes('LOCK_MS=15*60*1000'));
 assert(js.includes('node.textContent=JSON.stringify(value,null,2)'));
 assert(!js.includes('.innerHTML='));
});
