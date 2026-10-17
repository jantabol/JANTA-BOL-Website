import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const C='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const D='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
function make(role,override={}){
 const calls=[];
 const replies={
  jb_b8_g3_owner_evidence_packet:{request_id:B,case_id:A,risk_lane:'R2',
    full_proof_pack_verified:false,original_official_source_authenticity_verified:false,
    external_delivery_status:'NOT_SENT',private_integrity_receipts:[{receipt_id:C}]},
  jb_b8_g3_owner_authorize_r2:D,
  jb_b8_g3_owner_handoff_truth:{question_id:B,case_id:A,
    official_delivery_verified:false,provider_acceptance_verified:false,
    external_delivery_status:'NOT_VERIFIED',reply_received_verified:false},
  jb_b8_g3_reporter_link_verified_bytes:D,
  jb_b8_g3_editor_screen_r1:D,
  jb_b8_g3_reporter_prepare_manual_handoff:C,
  jb_b8_g3_reporter_record_handoff_observation:D,
  jb_b8_g3_reporter_claim_official_reply:D,
  jb_b8_g3_owner_reply_claim_summary:{question_id:B,case_id:A,
   claimed_official_reply_count:1,official_reply_independently_verified:false,
   provider_external_delivery_verified:false,accuracy_class:'REPORTER_CLAIM_UNVERIFIED'}
 };
 const client={rpc:async(name,args)=>{
    calls.push({name,args});
    return {data:Object.hasOwn(override,name)?override[name]:replies[name],error:null};
  }};
 return {api:createB8Workflow({client,role}),calls};
}
test('Founder private evidence has explicit documentary truth gaps and no real SENT',async()=>{
 const {api}=make('owner');
 const x=await api.ownerEvidencePacket(B);
 assert.equal(x.full_proof_pack_verified,false);
 assert.equal(x.external_delivery_status,'NOT_SENT');
 assert.equal(x.private_integrity_receipts.length,1);
});
test('Founder rejects forged complete proof or provider delivery claim',async()=>{
 for(const corrupt of [
   {request_id:B,full_proof_pack_verified:true,original_official_source_authenticity_verified:false,external_delivery_status:'NOT_SENT'},
   {request_id:B,full_proof_pack_verified:false,original_official_source_authenticity_verified:true,external_delivery_status:'NOT_SENT'},
   {request_id:B,full_proof_pack_verified:false,original_official_source_authenticity_verified:false,external_delivery_status:'DELIVERED'}
 ]){
  const {api}=make('owner',{jb_b8_g3_owner_evidence_packet:corrupt});
  await assert.rejects(api.ownerEvidencePacket(B),/B8_INVALID_G3_FOUNDER_EVIDENCE_TRUTH/);
 }
});
test('Founder authorizes R2 only by owner-role narrow RPC, never sends by itself',async()=>{
 const {api,calls}=make('owner');
 const x=await api.ownerAuthorizeRestricted(B,
   'Confidential source and official wording checked for safe restricted inquiry.');
 assert.equal(x.externalStatus,'NOT_SENT');
 assert.equal(x.approvalId,D);
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g3_owner_authorize_r2']);
 assert.equal(calls[0].args.p_request_id,B);
});
test('Reporter cannot create R2 Owner decision; Editor cannot impersonate Founder',async()=>{
 for(const role of ['editor','reporter']){
  const {api,calls}=make(role);
  await assert.rejects(api.ownerAuthorizeRestricted(B,
   'A different role cannot authorize this very sensitive inquiry.'),
  /B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
});
test('Reporter links private byte receipt only for own assigned Case via server RPC',async()=>{
 const {api,calls}=make('reporter');
 const a=await api.reporterLinkReceipt(B,C);
 assert.equal(a.linkId,D);
 assert.equal(a.meaning,'PRIVATE_BYTE_INTEGRITY_NOT_OFFICIAL_TRUTH');
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g3_reporter_link_verified_bytes']);
});
test('Editor can screen a serious R1 Review, response is never SENT',async()=>{
 const {api,calls}=make('editor');
 const x=await api.editorScreenSerious(B,
  'Supporting private byte receipt checked, legal allegation must remain neutral.');
 assert.equal(x.externalStatus,'NOT_SENT');
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g3_editor_screen_r1']);
});
test('Reporter R0/approved R1/R2 can request manual handoff token; no external send',async()=>{
 const {api,calls}=make('reporter');
 const x=await api.reporterPrepareHandoff(B,'OFFICIAL_PORTAL');
 assert.equal(x.state,'PREPARED_NOT_SENT');
 assert.equal(x.deliveryVerified,false);
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g3_reporter_prepare_manual_handoff']);
});
test('Unsafe automatic bulk-send and arbitrary channel rejected on client before backend',async()=>{
 const {api,calls}=make('reporter');
 await assert.rejects(api.reporterPrepareHandoff(B,'AUTOMATIC_BULK_SEND'),
  /B8_HANDOFF_CHANNEL_NOT_ALLOWED/);
 assert.equal(calls.length,0);
});
test('Reporter may only log reality-limited manual observation, never DELIVERED',async()=>{
 const {api,calls}=make('reporter');
 const x=await api.reporterRecordHandoff(C,'COMPOSER_OPENED');
 assert.equal(x.delivered,false);
 assert.equal(x.externalStatus,'NOT_VERIFIED');
 await assert.rejects(api.reporterRecordHandoff(C,'PROVIDER_DELIVERED'),
   /B8_UNVERIFIED_OBSERVATION_INPUT/);
 await assert.rejects(api.reporterRecordHandoff(C,'UNVERIFIED_RECEIPT_ATTACHED',null),
   /B8_UNVERIFIED_OBSERVATION_INPUT/);
 assert.equal(calls.length,1);
});
test('Founder handoff status always rejects fake delivery',async()=>{
 const {api}=make('owner');
 const x=await api.ownerHandoffTruth(B);
 assert.equal(x.external_delivery_status,'NOT_VERIFIED');
 const {api:bad}=make('owner',{jb_b8_g3_owner_handoff_truth:{
  question_id:B,external_delivery_status:'DELIVERED',official_delivery_verified:true,
  provider_acceptance_verified:true
 }});
 await assert.rejects(bad.ownerHandoffTruth(B),/B8_FALSE_OFFICIAL_DELIVERY/);
});
test('G3 Android source has Founder packet/R2, Reporter handoff, Editor screen and no automatic send',async()=>{
 const dir=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const html=await readFile(new URL('b8-accountability.html',dir),'utf8');
 const js=await readFile(new URL('b8-accountability-ui.js',dir),'utf8');
 for(const id of ['g3Packet','g3R2Authorization','g3Truth','g3EvidenceLink','g3Handoff','g3Observation','g3Screen']){
  assert(html.includes('id="'+id+'"'));
  assert(js.includes("form('"+id+"',"));
 }
 assert(!html.includes('APPROVE_FOR_SEND'));
 assert(!html.includes('service_role'));
 assert(!js.includes("window.open("));
 assert(!js.includes("location.href='mailto"));
 assert(js.includes("allowPrivateUpload:role==='reporter'"))&&
 assert(js.includes('workflow.reporterPrivateUploadReadiness(c.id)'))&&
 assert(js.includes('if(!gate.allowed)'));
 assert(js.includes("showJSON($('g3PacketData'),packet)"));
});

test('Reporter claim of official reply stays UNVERIFIED and uses scoped server RPC',async()=>{
 const {api,calls}=make('reporter');
 const x=await api.reporterClaimOfficialReply(C,D,'District Public Works Office',
  '2026-10-17T05:00:00.000Z',
  'An office attachment is claimed and awaits independent verification.');
 assert.equal(x.accuracy,'REPORTER_CLAIM_UNVERIFIED');
 assert.equal(x.officiallyVerified,false);
 assert.deepEqual(calls.map(x=>x.name),['jb_b8_g3_reporter_claim_official_reply']);
});
test('Founder truth-check rejects forged independently verified official reply',async()=>{
 const {api}=make('owner');
 const x=await api.ownerReplyClaimSummary(B);
 assert.equal(x.official_reply_independently_verified,false);
 const {api:bad}=make('owner',{jb_b8_g3_owner_reply_claim_summary:{
  question_id:B,official_reply_independently_verified:true,
  provider_external_delivery_verified:true,accuracy_class:'OFFICIAL_VERIFIED'
 }});
 await assert.rejects(bad.ownerReplyClaimSummary(B),/B8_FALSE_OFFICIAL_REPLY_STATUS/);
});
