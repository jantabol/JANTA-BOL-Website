import test from 'node:test';
import assert from 'node:assert/strict';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';

const ID='11111111-1111-4111-8111-111111111111';
const DRAFT='22222222-2222-4222-8222-222222222222';
const INTENT='33333333-3333-4333-8333-333333333333';
const RECEIPT='44444444-4444-4444-8444-444444444444';
const QUESTION='कृपया परियोजना की स्वीकृत लागत तथा खर्च का दिनांक सहित अधिकृत स्रोत उपलब्ध कराएँ।';
const make=(role,handler)=>{const calls=[];return {
 calls,workflow:createB8Workflow({role,client:{rpc:async(name,args)=>{calls.push({name,args});return {data:await handler(name,args),error:null};}}})
}};

test('T094 ACC013: Reporter creates a draft; never sends and AI/author is not final authority',async()=>{
 const {calls,workflow}=make('reporter',async name=>{assert.equal(name,'jb_b8_g1_reporter_create_draft');return DRAFT;});
 const p=await workflow.reporterCreateDraft(ID,QUESTION,'संबंधित कार्यालय (निर्धारित नहीं)');
 assert.deepEqual(p,{draftId:DRAFT,status:'NOT_SENT',approvalStatus:'DRAFT_ONLY'});
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g1_reporter_create_draft']);
 assert.equal(calls[0].args.p_case_id,ID);
 assert.equal(calls[0].args.p_question,QUESTION);
});

test('T094 ACC014: Client denies Owner-created Reporter drafts and Reporter Founder authorization without ANY RPC',async()=>{
 let calls=0;
 for(const [role,method,args] of [
  ['owner','reporterCreateDraft',[ID,QUESTION,'सरकारी कार्यालय']],
  ['editor','reporterPrepareHandoff',[DRAFT,'EMAIL']],
  ['reporter','ownerAuthorizeRestricted',[DRAFT,'साक्ष्य के बिना कोई भेजने की अनुमति नहीं दी जा सकती।']],
  ['reporter','ownerAttestManualDelivery',[INTENT,RECEIPT,'डिलीवरी स्वीकार होने का मूल निजी प्रमाण देखना जरूरी है।']]
 ]){
  const w=createB8Workflow({role,client:{rpc:async()=>{calls++;return {data:DRAFT,error:null};}}});
  await assert.rejects(w[method](...args),/B8_ROLE_(REPORTER|OWNER)_REQUIRED/);
 }
 assert.equal(calls,0);
});

test('T094 ACC014/015: allowed manual preparation is never proof of SEND; invalid bulk send is denied',async()=>{
 const {calls,workflow}=make('reporter',async name=>{
  if(name==='jb_b8_g3_reporter_prepare_manual_handoff')return INTENT;
  if(name==='jb_b8_g3_reporter_record_handoff_observation')return INTENT;
  throw new Error('Unexpected RPC: '+name);
 });
 const h=await workflow.reporterPrepareHandoff(DRAFT,'OFFICIAL_PORTAL');
 assert.deepEqual(h,{handoffId:INTENT,state:'PREPARED_NOT_SENT',deliveryVerified:false});
 const seen=await workflow.reporterRecordHandoff(INTENT,'USER_REPORTED_ATTEMPT');
 assert.equal(seen.externalStatus,'NOT_VERIFIED');
 assert.equal(seen.delivered,false);
 await assert.rejects(workflow.reporterPrepareHandoff(DRAFT,'AUTOMATIC_BULK_SEND'),/HANDOFF_CHANNEL_NOT_ALLOWED/);
 assert.deepEqual(calls.map(x=>x.name),[
  'jb_b8_g3_reporter_prepare_manual_handoff','jb_b8_g3_reporter_record_handoff_observation'
 ]);
});

test('T094 ACC015/016: Reporter reply claim remains unverified, no generated official acknowledgment',async()=>{
 const {calls,workflow}=make('reporter',async name=>{
  assert.equal(name,'jb_b8_g3_reporter_claim_official_reply');return DRAFT;
 });
 const x=await workflow.reporterClaimOfficialReply(INTENT,RECEIPT,'एक कार्यालय',
 '2026-10-20T12:00:00+05:30','अप्रमाणित अधिकारी-जवाब का संक्षिप्त दावा, जवाब के मूल प्रमाण की अभी स्वतंत्र जाँच नहीं।');
 assert.deepEqual(x,{replyClaimId:DRAFT,accuracy:'REPORTER_CLAIM_UNVERIFIED',officiallyVerified:false});
 assert.equal(calls.length,1);
 assert.equal(calls[0].args.p_receipt_id,RECEIPT);
});

test('T094 ACC015: Founder truth refuses a server that falsely asserts official delivery',async()=>{
 const falseProof={question_id:DRAFT,official_delivery_verified:true,
   provider_acceptance_verified:true,external_delivery_status:'VERIFIED'};
 const {workflow}=make('owner',async name=>{
  assert.equal(name,'jb_b8_g3_owner_handoff_truth');return falseProof;
 });
 await assert.rejects(workflow.ownerHandoffTruth(DRAFT),/FALSE_OFFICIAL_DELIVERY/);
 const verifiedRead=make('owner',async()=>({
  question_id:DRAFT,official_delivery_verified:false,provider_acceptance_verified:false,
  external_delivery_status:'NOT_VERIFIED',reply_received_verified:false
 }));
 const truth=await verifiedRead.workflow.ownerHandoffTruth(DRAFT);
 assert.equal(truth.official_delivery_verified,false);
 assert.equal(truth.external_delivery_status,'NOT_VERIFIED');
});
