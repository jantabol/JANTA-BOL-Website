import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const detail='Historical consultant PDF estimates possible tree and forest impacts, not verified loss.';
function session(role='owner'){
 const calls=[];
 const workflow=createB8Workflow({role,client:{rpc:async(name,args)=>{
  calls.push({name,args});return {data:82,error:null};
 }}});
 return {workflow,calls};
}
test('Old consultant projected IMPACT is a distinct attributed field in API, not official/field claim',async()=>{
 const {workflow,calls}=session();
 const result=await workflow.ownerRecordG5Fact(CASE,'IMPACT','DOCUMENTED_PROJECTED',detail);
 assert.equal(result.eventId,'82');
 assert.equal(result.authenticity,'NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'jb_b8_g5_owner_record_fact');
 assert.equal(calls[0].args.p_kind,'IMPACT');
 assert.equal(calls[0].args.p_field_code,'DOCUMENTED_PROJECTED');
 assert.equal(calls[0].args.p_cost_inr,null);
 assert.equal(calls[0].args.p_target_date,null);
 assert.equal(calls[0].args.p_receipt_id,null);
});
test('Impact cannot be misfiled as alternatives, actual money or deadline',async()=>{
 const {workflow,calls}=session();
 for(const [kind,field,cost,date] of [
  ['IMPACT','DOCUMENTED_PROPOSAL','',''],
  ['ALTERNATIVE','DOCUMENTED_PROJECTED','',''],
  ['IMPACT','DOCUMENTED_PROJECTED','23864600000',''],
  ['IMPACT','DOCUMENTED_PROJECTED','','2027-01-01']
 ]){
  await assert.rejects(workflow.ownerRecordG5Fact(CASE,kind,field,detail,cost,date),
   /B8_G5_(FACT_KIND_OR_FIELD_INVALID|COST_NOT_ALLOWED|DATE_NOT_ALLOWED)/);
 }
 assert.equal(calls.length,0);
});
test('Reporter and Editor may not write projected IMPACT to Founder private ledger',async()=>{
 for(const role of ['reporter','editor']){
  const {workflow,calls}=session(role);
  await assert.rejects(workflow.ownerRecordG5Fact(CASE,'IMPACT','DOCUMENTED_PROJECTED',detail),
   /B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
});
test('Android Hindi category describes historical projected not real harms; no source verification implied',async()=>{
 const path=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,ui]=await Promise.all([
  readFile(new URL('b8-accountability.html',path),'utf8'),
  readFile(new URL('b8-accountability-ui.js',path),'utf8')]);
 assert.match(html,/<optgroup label="जनता पर प्रभाव"><option value="DOCUMENTED_PROJECTED">ऐतिहासिक दस्तावेज में अनुमानित\/संभावित प्रभाव \(वास्तविक नुकसान नहीं\)<\/option>/);
 assert.match(html,/<option value="AUTHORITY_STATED">अधिकारी द्वारा बताया गया प्रभाव/);
 assert.match(html,/<option value="GROUND_REPORTED">जमीन से दर्ज प्रभाव/);
 assert.match(ui,/DOCUMENTED_PROJECTED:'ऐतिहासिक दस्तावेज में अनुमानित\/संभावित प्रभाव/);
 assert.match(ui,/option\.disabled=group\.label!==labels\[kind\]/);
 assert(!html.includes('काटे गए पेड़ सत्यापित'));
});
