import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const QUESTION='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const RECEIPT='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
function fixture(role='owner',answers={}){
 const calls=[];
 const client={rpc:async(name,args)=>{
  calls.push({name,args});
  const reply=answers[name];
  if(reply instanceof Error)return {data:null,error:{message:'server denied'}};
  return {data:reply,error:null};
 }};
 return {api:createB8Workflow({client,role}),calls};
}
function factPage(ids,more,cursor){
 return {items:ids.map(id=>({id,kind:'COST',field:'ESTIMATED_PROPOSED',
    cost_inr:'23864600000.00',authenticity:'NOT_INDEPENDENTLY_VERIFIED'})),
  has_more:more,next_before_id:cursor,truth:'NOT_INDEPENDENTLY_VERIFIED'};
}
function historyPage(ids,more,cursor){
 return {items:ids.map(id=>({id,truth:'FOUNDER_ATTRIBUTED_UNVERIFIED'})),
   has_more:more,next_before_id:cursor,truth:'FOUNDER_ATTRIBUTED_UNVERIFIED'};
}
test('T096 Founder disposition stays unverified; same-case IDs and answer receipt are required',async()=>{
 const {api,calls}=fixture('owner',{jb_b8_t096_owner_record_question_disposition:42});
 await assert.rejects(api.ownerRecordG5QuestionDisposition(CASE,QUESTION,'ANSWERED_REPORTED',
   'Official answered allegedly', ''),/B8_T096_ANSWERED_RECEIPT_REQUIRED/);
 await assert.rejects(api.ownerRecordG5QuestionDisposition(CASE,QUESTION,'VERIFIED',
   'Never elevate a claim'),/B8_T096_DISPOSITION_INVALID/);
 assert.equal(calls.length,0);
 const x=await api.ownerRecordG5QuestionDisposition(CASE,QUESTION,'PARTIAL_REPORTED',
   'Only a partial reply was claimed, no E9 verified');
 assert.equal(x.truth,'FOUNDER_REPORTED_UNVERIFIED');
 assert.equal(calls[0].name,'jb_b8_t096_owner_record_question_disposition');
 assert.equal(calls[0].args.p_case_id,CASE);
 assert.equal(calls[0].args.p_question_id,QUESTION);
 assert.equal(calls[0].args.p_receipt_id,null);
 const y=await api.ownerRecordG5QuestionDisposition(CASE,QUESTION,'ANSWERED_REPORTED',
   'Claim of answer, not verification',RECEIPT);
 assert.equal(y.eventId,'42');
 assert.equal(calls[1].args.p_receipt_id,RECEIPT);
});
test('T096 reporter/editor cannot use Founder AAL2 disposition; backend errors fail closed',async()=>{
 for(const role of ['reporter','editor']){
  const {api,calls}=fixture(role,{});
  await assert.rejects(api.ownerRecordG5QuestionDisposition(CASE,QUESTION,
   'UNANSWERED_MONITORING','Only Founder should record'),/B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
 const {api}=fixture('owner',{jb_b8_t096_owner_record_question_disposition:new Error('denied')});
 await assert.rejects(api.ownerRecordG5QuestionDisposition(CASE,QUESTION,
   'UNANSWERED_MONITORING','Not actually verified at agency'),
  /B8_SERVER_REJECTED_jb_b8_t096_owner_record_question_disposition/);
});
test('T097 cursor pages return exact original decimal without global record cap',async()=>{
 const calls=[];
 const client={rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='jb_b8_t097_owner_fact_page')
   return {data:args.p_before_id===null?factPage([120,119],true,119):
       factPage([118,117],false,null),error:null};
  if(name==='jb_b8_t097_owner_history_page')
   return {data:args.p_before_id===null?historyPage([105],true,105):
       historyPage([104],false,null),error:null};
  return {data:null,error:{message:'unexpected RPC'}};
 }};
 const api=createB8Workflow({client,role:'owner'});
 const a=await api.ownerG5FactPage(CASE);
 assert.equal(a.nextBeforeId,'119');
 assert.equal(a.items[0].cost_inr,'23864600000.00');
 const b=await api.ownerG5FactPage(CASE,a.nextBeforeId);
 assert.equal(b.hasMore,false);
 assert.equal(b.items[0].id,118);
 const c=await api.ownerG7HistoryPage(CASE);
 const d=await api.ownerG7HistoryPage(CASE,c.nextBeforeId);
 assert.equal(d.items[0].id,104);
 assert.deepEqual(calls.map(x=>x.name),[
 'jb_b8_t097_owner_fact_page','jb_b8_t097_owner_fact_page',
 'jb_b8_t097_owner_history_page','jb_b8_t097_owner_history_page']);
 assert.deepEqual(calls.map(x=>x.args.p_limit),[50,50,50,50]);
});
test('T097 forgery, invalid cursor, nonmonotonic replay and wrong role all fail closed',async()=>{
 const bad=factPage([10],true,10);
 const {api}=fixture('owner',{jb_b8_t097_owner_fact_page:bad});
 await assert.rejects(api.ownerG5FactPage(CASE,'10'),/B8_T097_UNTRUSTED_PRIVATE_FACT_PAGE/);
 await assert.rejects(api.ownerG5FactPage(CASE,'not-valid'),/B8_T097_CURSOR_INVALID/);
 const {api:wrong}=fixture('owner',{jb_b8_t097_owner_fact_page:{
  ...factPage([5],false,null),items:[{id:5,authenticity:'OFFICIALLY_VERIFIED'}]}});
 await assert.rejects(wrong.ownerG5FactPage(CASE),/B8_T097_UNTRUSTED_PRIVATE_FACT_PAGE/);
 const {api:badHistory}=fixture('owner',{jb_b8_t097_owner_history_page:{
   ...historyPage([19],false,null),items:[{id:19,truth:'OFFICIALLY_VERIFIED'}]}});
 await assert.rejects(badHistory.ownerG7HistoryPage(CASE),/B8_T097_UNTRUSTED_PRIVATE_HISTORY_PAGE/);
 for(const role of ['reporter','editor']){
  const {api:x,calls}=fixture(role,{});
  await assert.rejects(x.ownerG5FactPage(CASE),/B8_ROLE_OWNER_REQUIRED/);
  await assert.rejects(x.ownerG7HistoryPage(CASE),/B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
});
test('Android actual UI has all linked controls, 15-minute lock and no official SEND',async()=>{
 const folder=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,ui]=await Promise.all(['b8-accountability.html','b8-accountability-ui.js']
  .map(n=>readFile(new URL(n,folder),'utf8')));
 for(const field of ['g5QuestionDisposition','g5QuestionCase','g5QuestionId','g5QuestionStatus',
   'g5QuestionReason','g5QuestionReceipt','g5LedgerMore','g7HistoryMore'])
  assert(html.includes('id="'+field+'"'));
 assert(ui.includes('workflow.ownerRecordG5QuestionDisposition('));
 assert(ui.includes('workflow.ownerG5FactPage('));
 assert(ui.includes('workflow.ownerG7HistoryPage('));
 assert(ui.includes("g5LedgerOutput').textContent='Locked"));
 assert(ui.includes("g7HistoryOutput').textContent='Locked"));
 assert(ui.includes('LOCK_MS=15*60*1000'));
 assert(!html.includes('onclick='));
 assert(!ui.includes('.innerHTML='));
});
