import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DETAIL='2010 historical consultant summary: widening two-lane roadway to four/six lanes, not verified completed project. https://www.mppcb.mp.gov.in/pdf/Exe_Summ/Exe_Summ_NH3ShivDew_Eng.pdf';
test('T093 source-attributed purpose uses new private field only, never verified authority status',async()=>{
 const calls=[];const w=createB8Workflow({role:'owner',client:{rpc:async(name,args)=>{calls.push([name,args]);return {data:101,error:null};}}});
 const v=await w.ownerRecordG5Fact(CASE,'PURPOSE','DOCUMENTED_STATED',DETAIL);
 assert.equal(v.eventId,'101');
 assert.equal(v.authenticity,'NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(calls[0][0],'jb_b8_g5_owner_record_fact');
 assert.equal(calls[0][1].p_kind,'PURPOSE');
 assert.equal(calls[0][1].p_field_code,'DOCUMENTED_STATED');
 assert.equal(calls[0][1].p_cost_inr,null);
 assert.equal(calls[0][1].p_target_date,null);
 assert.equal(calls[0][1].p_receipt_id,null);
});
test('T093 client denies conflating project purpose with official impact, cost, ground, or source alternatives',async()=>{
 const calls=[];const w=createB8Workflow({role:'owner',client:{rpc:async(name,args)=>{calls.push([name,args]);return {data:101,error:null};}}});
 for(const [kind,field,cost,date]of [
 ['PURPOSE','AUTHORITY_STATED','',''],
 ['PURPOSE','GROUND_REPORTED','',''],
 ['IMPACT','DOCUMENTED_STATED','',''],
 ['ALTERNATIVE','DOCUMENTED_STATED','',''],
 ['PURPOSE','DOCUMENTED_STATED','10',''],
 ['PURPOSE','DOCUMENTED_STATED','','2027-01-01']
 ])await assert.rejects(w.ownerRecordG5Fact(CASE,kind,field,DETAIL,cost,date),/G5_(FACT_KIND_OR_FIELD_INVALID|COST_NOT_ALLOWED|DATE_NOT_ALLOWED)/);
 assert.equal(calls.length,0);
});
test('T093 reporter/editor cannot use private Founder purpose API',async()=>{
 for(const role of ['reporter','editor']){
  const w=createB8Workflow({role,client:{rpc:async()=>{throw Error('unexpected call')}}});
  await assert.rejects(w.ownerRecordG5Fact(CASE,'PURPOSE','DOCUMENTED_STATED',DETAIL),/B8_ROLE_OWNER_REQUIRED/);
 }
});
test('T093 Android Hindi proof explicitly historical, purpose source vs claims distinct',async()=>{
 const base=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,ui]=await Promise.all([readFile(new URL('b8-accountability.html',base),'utf8'),readFile(new URL('b8-accountability-ui.js',base),'utf8')]);
 assert.match(html,/<option value="PURPOSE">पुराने दस्तावेज में बताया गया परियोजना उद्देश्य<\/option>/);
 assert.match(html,/<optgroup label="दस्तावेजी उद्देश्य"><option value="DOCUMENTED_STATED">ऐतिहासिक दस्तावेज में बताया गया उद्देश्य \(आज की सरकारी पुष्टि नहीं\)<\/option>/);
 assert.match(ui,/PURPOSE:'दस्तावेजी उद्देश्य'/);
 assert.match(ui,/DOCUMENTED_STATED:'ऐतिहासिक दस्तावेज में बताया गया परियोजना उद्देश्य/);
 assert.match(ui,/option\.disabled=group\.label!==labels\[kind\]/);
});
