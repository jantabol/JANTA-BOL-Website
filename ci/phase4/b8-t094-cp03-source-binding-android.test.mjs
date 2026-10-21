import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';

const uuid='11111111-1111-4111-8111-111111111111';
const claim='22222222-2222-4222-8222-222222222222';
const html=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html','utf8');
const ui=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js','utf8');

test('ACC013 Android case-scoped source form has all IDs and phone task, no outbound send',()=>{
  for(const id of ['sourceLinkForm','sourceDraftId','sourceClaimId']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/सवाल और स्रोत को सुरक्षित जोड़ें/);
  assert.match(ui,/\['सवाल का मसौदा',\['draftForm','sourceLinkForm','requestReview'\]\]/);
  assert.match(ui,/form\('sourceLinkForm',async\(\)=>/);
  assert.match(ui,/workflow\.reporterBindQuestionEvidence/);
  assert.match(ui,/currentRole==='reporter'/);
  assert.match(ui,/jb_b8_t094_source_binding_readiness/);
  assert.match(ui,/B8_T094_QUESTION_SOURCE_SERVER_GUARD_NOT_READY/);
  assert.match(ui,/server_guard_ready!==true/);
  assert.doesNotMatch(html,/on(?:click|submit)\s*=/i);
});

test('ACC013 Reporter source claim link only; never marks evidence as E9 VERIFIED or official SENT',async()=>{
  const calls=[];
  const client={rpc:async(name,args)=>{
    calls.push({name,args});
    return {data:true,error:null};
  }};
  const api=createB8Workflow({client,role:'reporter'});
  const result=await api.reporterBindQuestionEvidence(uuid,claim);
  assert.deepEqual(result,{linked:true,authenticity:'CLAIM_UNVERIFIED_NO_BYTES',status:'NOT_SENT'});
  assert.deepEqual(calls,[{name:'jb_b8_g1_reporter_bind_question_evidence',
    args:{p_question_id:uuid,p_claim_id:claim}}]);
});

test('ACC013 no Owner/Editor spoof, malformed IDs, RPC false and error are fail CLOSED',async()=>{
  let calls=0;
  const client={rpc:async()=>{calls++;return {data:false,error:null};}};
  for(const role of ['owner','editor']){
    await assert.rejects(createB8Workflow({client,role}).reporterBindQuestionEvidence(uuid,claim),
      /B8_ROLE_REPORTER_REQUIRED/);
  }
  const api=createB8Workflow({client,role:'reporter'});
  await assert.rejects(api.reporterBindQuestionEvidence('bad',claim),/B8_UUID_REQUIRED/);
  await assert.rejects(api.reporterBindQuestionEvidence(uuid,'bad'),/B8_UUID_REQUIRED/);
  assert.equal(calls,0);
  await assert.rejects(api.reporterBindQuestionEvidence(uuid,claim),/B8_QUESTION_EVIDENCE_LINK_NOT_CONFIRMED/);
  assert.equal(calls,1);
  const failing=createB8Workflow({client:{rpc:async()=>({data:null,error:{message:'DENIED'}})},role:'reporter'});
  await assert.rejects(failing.reporterBindQuestionEvidence(uuid,claim),/B8_SERVER_REJECTED_jb_b8_g1_reporter_bind_question_evidence/);
});
