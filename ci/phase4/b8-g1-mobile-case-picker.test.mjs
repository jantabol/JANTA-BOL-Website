import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function mock(role='owner',payload=[]){
 const calls=[];
 const api=createB8Workflow({role,client:{rpc:async(name,args)=>{
   calls.push({name,args});return {data:payload,error:null};
 }}});
 return {api,calls};
}
test('Case name selector only invokes read-only AAL2-guarded Founder RPC',async()=>{
 const {api,calls}=mock('owner',[{id:ID,title:'TEST ONLY Shivpuri case',area:'Shivpuri',
   risk_lane:'R0',state:'draft'}]);
 const choices=await api.ownerCaseChoices();
 assert.deepEqual(choices.map(c=>c.id),[ID]);
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'jb_b8_g1_owner_case_choices');
 assert.deepEqual(calls[0].args,{});
 assert(Object.isFrozen(choices));
});
test('Reporter and Editor cannot even call case-choice RPC',async()=>{
 for(const role of ['reporter','editor']){
   const {api,calls}=mock(role,[]);
   await assert.rejects(api.ownerCaseChoices(),/B8_ROLE_OWNER_REQUIRED/);
   assert.equal(calls.length,0);
 }
});
test('Case chooser rejects forged invalid UUID, malformed title, extra-large payload',async()=>{
 const record={id:ID,title:'TEST ONLY Shivpuri case',area:'Shivpuri',
   risk_lane:'R0',state:'draft'};
 for(const value of [[{...record,id:'fake'}],[{...record,title:''}],
  [{...record,risk_lane:'R9'}],[{...record,state:'delivered'}],
  Array.from({length:51},()=>record),{cases:[record]}]){
   const {api}=mock('owner',value);
   await assert.rejects(api.ownerCaseChoices(),/B8_OWNER_CASE_CHOICES_INVALID/);
 }
});
test('Hindi mobile picker binds only CASE UUIDs and wipes stale cross-case data',async()=>{
 const [ui,sql]=await Promise.all([
  readFile(new URL('../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js',import.meta.url),'utf8'),
  readFile(new URL('../../JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_owner_mobile_case_picker_REVIEW_ONLY.sql',import.meta.url),'utf8')
 ]);
 assert.match(ui,/मामला नाम से चुनें/);
 assert.match(ui,/applyOwnerCaseSelection\(ownerCasePick\.value,true\)/);
 assert.match(ui,/if\(current\.id!=='createCase'&&current\.id!=='g6Release'\)current\.reset\(\)/);
 assert.match(ui,/ownerKnownCases=\[\]/);
 assert.match(ui,/drawOwnerCaseChoices\(id\)/);
 assert.match(ui,/\$\('createCase'\)\.reset\(\)/);
 assert(!ui.includes('localStorage.'));
 assert.match(sql,/private\.current_owner_aal2\(\)/);
 assert.match(sql,/limit 50/);
 assert.match(sql,/revoke all on function public\.jb_b8_g1_owner_case_choices/);
 assert.match(sql,/grant execute on function public\.jb_b8_g1_owner_case_choices/);
 assert(!sql.includes('grant select on public.b8_cases'));
});
