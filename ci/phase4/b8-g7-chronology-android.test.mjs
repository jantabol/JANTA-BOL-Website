import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const Q='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const REC='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
function fixture(role='owner',overrides={},reject=false){
 const calls=[];
 const client={rpc:async(name,args)=>{
  calls.push({name,args});
  if(reject)return {data:null,error:{message:'Backend isolation'}};
  const out={
   jb_b8_g7_owner_record_history:19,
   jb_b8_g7_owner_private_history:[{id:19,truth:'FOUNDER_ATTRIBUTED_UNVERIFIED'}]
  };
  return {data:Object.hasOwn(overrides,name)?overrides[name]:out[name],error:null};
 }};
 return {api:createB8Workflow({client,role}),calls};
}
test('G7 typed No Reply requires original Question and real as-of date',async()=>{
 const {api,calls}=fixture();
 await assert.rejects(api.ownerRecordG7History(CASE,'NO_REPLY_AS_OF_CLAIM',
  'No actual question was selected for follow-up'),/B8_G7_QUESTION_REQUIRED/);
 const x=await api.ownerRecordG7History(CASE,'NO_REPLY_AS_OF_CLAIM',
  'Reported answer was not independently confirmed as of stated date',
  Q,'','','2026-10-17');
 assert.equal(x.truth,'FOUNDER_ATTRIBUTED_UNVERIFIED');
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g7_owner_record_history']);
 assert.equal(calls[0].args.p_as_of_date,'2026-10-17');
 assert.equal(calls[0].args.p_question_id,Q);
});
test('G7 partial or late reply requires private byte receipt; never verified',async()=>{
 const {api,calls}=fixture();
 await assert.rejects(api.ownerRecordG7History(CASE,'PARTIAL_REPLY_CLAIM',
  'Claimed official reply with no actual byte receipt',Q),
  /B8_G7_PRIVATE_RECEIPT_REQUIRED/);
 const a=await api.ownerRecordG7History(CASE,'LATE_REPLY_CLAIM',
  'Later submitted answer remains a private attributed claim',Q,REC);
 assert.equal(a.truth,'FOUNDER_ATTRIBUTED_UNVERIFIED');
 assert.equal(calls[0].args.p_receipt_id,REC);
});
test('G7 summary correction preserves prior event identity and no in-place edit',async()=>{
 const {api,calls}=fixture();
 await assert.rejects(api.ownerRecordG7History(CASE,'SUMMARY_CORRECTION',
  'Cannot silently rewrite the original summary record'),
  /B8_G7_ORIGINAL_SUMMARY_REQUIRED/);
 await api.ownerRecordG7History(CASE,'SUMMARY_CORRECTION',
  'A material error was corrected in a separate immutable entry',
  '','','23');
 assert.equal(calls[0].args.p_prior_event_id,23);
});
test('G7 refuses wrong role, fabricated reply classification and server outage',async()=>{
 for(const role of ['reporter','editor']){
  const {api,calls}=fixture(role);
  await assert.rejects(api.ownerRecordG7History(CASE,'SUMMARY_DRAFT',
   'Only Founder may append private chronologies'),/B8_ROLE_OWNER_REQUIRED/);
  await assert.rejects(api.ownerG7PrivateHistory(CASE),/B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
 const {api,calls}=fixture();
 await assert.rejects(api.ownerRecordG7History(CASE,'OFFICIAL_REPLY_VERIFIED',
  'Never allow an unverified official status'),/B8_G7_KIND_NOT_ALLOWED/);
 assert.equal(calls.length,0);
 const {api:bad}=fixture('owner',{jb_b8_g7_owner_private_history:[
  {id:19,truth:'OFFICIALLY_VERIFIED'}]});
 await assert.rejects(bad.ownerG7PrivateHistory(CASE),/B8_G7_FALSE_OFFICIAL_HISTORY/);
 const {api:down}=fixture('owner',{},true);
 await assert.rejects(down.ownerG7PrivateHistory(CASE),
  /B8_SERVER_REJECTED_jb_b8_g7_owner_private_history/);
});
test('G7 Android Owner history, lock privacy and textContent rendering',async()=>{
 const dir=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,js]=await Promise.all([
  readFile(new URL('b8-accountability.html',dir),'utf8'),
  readFile(new URL('b8-accountability-ui.js',dir),'utf8')
 ]);
 for(const id of ['g7History','g7Case','g7Kind','g7Note','g7HistoryRead','g7HistoryOutput'])
  assert(html.includes('id="'+id+'"'));
 assert(html.indexOf('id="g7History"')<html.indexOf('<section id="reporter"'));
 assert(js.includes('ownerRecordG7History'));
 assert(js.includes('ownerG7HistoryPage'));
 assert(html.includes('id="g7HistoryMore"'));
 assert(js.includes("g7HistoryMore').hidden="));
 assert(js.includes("g7HistoryOutput').textContent='Locked"));
 assert(js.includes("node.textContent=JSON.stringify(value,null,2)"));
 assert(!js.includes('.innerHTML='));
 assert(!html.includes('onclick='));
});
