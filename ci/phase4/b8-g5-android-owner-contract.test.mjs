import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECEIPT='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
function fixture(role='owner',override={},serverReject=false){
 const calls=[];
 const results={
  jb_b8_g5_owner_record_fact:17,
  jb_b8_g5_owner_record_outcome:18,
  jb_b8_g5_owner_reopen_case:19,
  jb_b8_g5_owner_private_ledger:[{id:17,kind:'COST',field:'SANCTIONED',
    authenticity:'NOT_INDEPENDENTLY_VERIFIED'}]
 };
 return {api:createB8Workflow({role,client:{rpc:async(name,args)=>{
   calls.push({name,args});
   return serverReject?{data:null,error:{message:'server stop'}}:
    {data:Object.hasOwn(override,name)?override[name]:results[name],error:null};
 }}}),calls};
}
test('Owner exact cost decimal transport; sanctioned/tender/revised/actual distinct',async()=>{
 const {api,calls}=fixture();
 for(const code of ['SANCTIONED','TENDER','REVISED','ACTUAL']){
  const x=await api.ownerRecordG5Fact(CASE,'COST',code,
   'Official attributed cost claim (unverified)','9007199254740993.01');
  assert.equal(x.authenticity,'NOT_INDEPENDENTLY_VERIFIED');
 }
 assert.equal(calls.length,4);
 assert(calls.every(({name,args})=>name==='jb_b8_g5_owner_record_fact'&&
   args.p_cost_inr==='9007199254740993.01'&&args.p_case_id===CASE));
});
test('Original and revised deadline calendar strings preserved, no timestamp coercion',async()=>{
 const {api,calls}=fixture();
 await api.ownerRecordG5Fact(CASE,'DEADLINE','ORIGINAL',
 'Original scheduled work target', '', '2027-01-01');
 await api.ownerRecordG5Fact(CASE,'DEADLINE','REVISED',
 'Later announced completion date', '', '2027-04-03');
 assert.equal(calls[0].args.p_target_date,'2027-01-01');
 assert.equal(calls[1].args.p_target_date,'2027-04-03');
 assert.equal(calls[0].args.p_cost_inr,null);
});
test('Invalid fields, cost mixes and decimals denied BEFORE server call',async()=>{
 const {api,calls}=fixture();
 await assert.rejects(api.ownerRecordG5Fact(CASE,'COST','AUTHORITY_STATED',
  'Wrong kind mixed with source claim','1'),/G5_FACT_KIND_OR_FIELD_INVALID/);
 await assert.rejects(api.ownerRecordG5Fact(CASE,'COST','ACTUAL',
  'Malformed not safely rounded', '3.123'),/G5_COST_MUST_BE_EXACT_DECIMAL_STRING/);
 await assert.rejects(api.ownerRecordG5Fact(CASE,'GROUND','FIELD_OBSERVATION_REPORTED',
  'No financial field for a ground note','234'),/G5_COST_NOT_ALLOWED/);
 await assert.rejects(api.ownerRecordG5Fact(CASE,'DEADLINE','REVISED',
  'Invalid date must not be stored','', 'tomorrow'),/G5_DEADLINE_INVALID/);
 assert.equal(calls.length,0);
});
test('Role isolation Owner methods never callable from Reporter or Editor',async()=>{
 for(const role of ['reporter','editor']){
  const {api,calls}=fixture(role);
  await assert.rejects(api.ownerRecordG5Fact(CASE,'CONFLICT','FLAG_RAISED',
   'Founder newsroom conflict has been flagged'),/B8_ROLE_OWNER_REQUIRED/);
  await assert.rejects(api.ownerG5PrivateLedger(CASE),/B8_ROLE_OWNER_REQUIRED/);
  await assert.rejects(api.ownerRecordG5Outcome(CASE,'closed',
   'Editorial case closure with factual caveats',RECEIPT),/B8_ROLE_OWNER_REQUIRED/);
  await assert.rejects(api.ownerReopenG5(CASE,RECEIPT,
   'More evidence means the inquiry resumes'),/B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
});
test('Close requires private receipt, re-open is evidence-bound and never verified',async()=>{
 const {api,calls}=fixture();
 await assert.rejects(api.ownerRecordG5Outcome(CASE,'closed',
  'Closing a case with no evidence', ''),/G5_CLOSE_REQUIRES_PRIVATE_RECEIPT/);
 const close=await api.ownerRecordG5Outcome(CASE,'closed',
  'Closure reason retained for internal history',RECEIPT);
 const reopen=await api.ownerReopenG5(CASE,RECEIPT,
  'New material receipt requires additional fact checking');
 assert.equal(close.authenticity,'NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(reopen.authenticity,'NOT_INDEPENDENTLY_VERIFIED');
 assert.deepEqual(calls.map(x=>x.name),[
  'jb_b8_g5_owner_record_outcome','jb_b8_g5_owner_reopen_case']);
});
test('Private ledger rejects false independent verification and backend outage',async()=>{
 const {api}=fixture();
 assert.equal((await api.ownerG5PrivateLedger(CASE)).length,1);
 const {api:wrong}=fixture('owner',{jb_b8_g5_owner_private_ledger:[
  {id:17,authenticity:'OFFICIAL_VERIFIED'}]});
 await assert.rejects(wrong.ownerG5PrivateLedger(CASE),/G5_FALSE_OFFICIAL_VERIFICATION/);
 const {api:unavailable}=fixture('owner',{},true);
 await assert.rejects(unavailable.ownerG5PrivateLedger(CASE),/B8_SERVER_REJECTED_jb_b8_g5_owner_private_ledger/);
});
test('Android G5 private forms are behind existing owner/15-minute lock and safe text rendering',async()=>{
 const dir=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,ui]=await Promise.all([
  readFile(new URL('b8-accountability.html',dir),'utf8'),
  readFile(new URL('b8-accountability-ui.js',dir),'utf8')]);
 for(const id of ['g5Fact','g5Outcome','g5Reopen','g5Ledger','g5LedgerOutput'])
  assert(html.includes('id="'+id+'"'));
 const ownerEnd=html.indexOf('<section id="reporter"');
 assert(html.indexOf('id="g5Fact"')<ownerEnd);
 assert(ui.includes("LOCK_MS=15*60*1000"));
 assert(ui.includes("auth.getUser()"));
 assert(ui.includes("g5LedgerOutput').textContent='Locked"));
 assert(ui.includes("node.textContent=JSON.stringify(value,null,2)"));
 assert(!ui.includes('.innerHTML='));
 assert(!html.includes('onclick='));
 assert(html.includes('id="uploadBtn" type="submit" disabled'));
});
