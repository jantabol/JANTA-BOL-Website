import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow,NO_DISPATCH_STATUS,LANES,EDITOR_DECISIONS,validId}
  from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.mjs';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const Q='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const REQ='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const RECEIPT='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
function fixture(role,opts={}){
  const calls=[];
  const replies={
    jb_b8_g1_owner_create_case:CASE,
    jb_b8_g1_owner_assign_reporter:true,
    jb_b8_g1_owner_assign_editor:true,
    jb_b8_g2_owner_link_article:Q,
    jb_b8_g2_owner_assert_hold:12,
    jb_b8_g1_owner_preliminary_review_packet:{
      case_id:CASE,request_id:REQ,complete_proof_pack:false,delivery_status:'NOT_SENT',
      evidence_status:'EVIDENCE_GAP',editor_decision:'ESCALATE_TO_FOUNDER'
    },
    jb_b8_g2_owner_provenance_summary:{bytes_verified:false,proof_status:'NOT_VERIFIED'},
    jb_b8_g2_owner_verified_upload_summary:{official_documentary_proof_verified:false},
    jb_b8_g1_reporter_case_card:{id:CASE,title:'Synthetic Case',
      risk_lane:'R1',state:'draft'},
    jb_b8_g1_reporter_create_draft:Q,
    jb_b8_g1_reporter_request_review:REQ,
    jb_b8_g1_editor_review_card:{
      request_id:REQ,case_id:CASE,state:'UNSENT_REVIEW_ONLY',
      proof_status:'EVIDENCE_NOT_VERIFIED',risk_lane:'R1'
    },
    jb_b8_g1_editor_review:RECEIPT,
    jb_b8_g2_reporter_submit_evidence_claim:RECEIPT
  };
  const client={
    rpc:async(name,args)=>{
      calls.push({name,args});
      if(opts.reject)return {data:null,error:{message:'RLS DENY'}};
      return {data:opts.override?.[name]??replies[name]??null,error:null};
    },
    auth:{getSession:async()=>({data:{session:{access_token:'synthetic_session_only'}}})},
    functions:{invoke:async(name,opts)=>{calls.push({name,args:opts});
      return {data:{ok:true,receiptId:RECEIPT,
        byteCount:16,proof:'PRIVATE_READBACK_SHA256_ONLY',
        documentaryAuthenticityVerified:false},error:null};
    }}
  };
  return {api:createB8Workflow({client,role,
    allowPrivateUpload:opts.allowPrivateUpload??false}),calls,client};
}
test('UUID, lane and review enums cover exact roles — never SENT or PUBLISHED',()=>{
  assert.equal(validId(CASE),true);
  assert.equal(validId('danger'),false);
  assert.deepEqual(LANES,['R0','R1','R2']);
  assert.deepEqual(EDITOR_DECISIONS,['RETURN_FOR_EVIDENCE',
    'EVIDENCE_REVIEW_PENDING','ESCALATE_TO_FOUNDER']);
  assert.equal(NO_DISPATCH_STATUS,'NOT_SENT');
});
test('Reporter draft has server returned UUID + accurate NOT_SENT only',async()=>{
  const {api,calls}=fixture('reporter');
  const a=await api.reporterCreateDraft(CASE,
    'Please give public approved cost and complete inspection papers.',
    'Public Works Department');
  assert.equal(a.draftId,Q);
  assert.equal(a.status,'NOT_SENT');
  assert.equal(a.approvalStatus,'DRAFT_ONLY');
  assert.deepEqual(calls.map(x=>x.name),['jb_b8_g1_reporter_create_draft']);
});
test('Reporter R1/R2 review request has no invented Editor approval/delivery',async()=>{
  const {api,calls}=fixture('reporter');
  const x=await api.reporterRequestReview(Q);
  assert.equal(x.requestId,REQ);
  assert.equal(x.status,'EDITOR_REVIEW_PENDING');
  assert.equal(x.deliveryStatus,'NOT_SENT');
  assert.equal(calls[0].name,'jb_b8_g1_reporter_request_review');
});
test('Editor can record only one of three non-dispatch decisions',async()=>{
  const {api,calls}=fixture('editor');
  const r=await api.editorRecordReview(REQ,'ESCALATE_TO_FOUNDER',
    'Confidential official source needs Founder clearance before any release.');
  assert.equal(r.status,'ESCALATE_TO_FOUNDER');
  assert.equal(r.deliveryStatus,'NOT_SENT');
  assert.deepEqual(calls.map(x=>x.name),['jb_b8_g1_editor_review']);
  await assert.rejects(api.editorRecordReview(REQ,'APPROVE_FOR_SEND',
    'We should not authorize sending from this incomplete system.'),/B8_EDITOR_DECISION_NOT_ALLOWED/);
  assert.equal(calls.length,1);
});
test('Editor case card rejects false evidence-verified or false SENT response',async()=>{
  const {api}=fixture('editor',{override:{jb_b8_g1_editor_review_card:{
    request_id:REQ,case_id:CASE,state:'SENT',proof_status:'EVIDENCE_VERIFIED'
  }}});
  await assert.rejects(api.editorReviewCard(REQ),/B8_UNTRUSTED_EDITOR_CARD/);
});
test('Founder can only view truth-tagged incomplete proof pack, never fake complete',async()=>{
  const {api}=fixture('owner');
  const p=await api.ownerPreliminaryPacket(REQ);
  assert.equal(p.evidence_status,'EVIDENCE_GAP');
  assert.equal(p.delivery_status,'NOT_SENT');
  assert.equal(p.complete_proof_pack,false);
  const {api:bad}=fixture('owner',{override:{jb_b8_g1_owner_preliminary_review_packet:{
    complete_proof_pack:true,delivery_status:'DELIVERED',evidence_status:'VERIFIED'
  }}});
  await assert.rejects(bad.ownerPreliminaryPacket(REQ),/B8_FALSE_COMPLETE_EVIDENCE_PACK/);
});
test('Client role boundary: Reporter cannot invoke Owner or Editor RPC',async()=>{
  const {api,calls}=fixture('reporter');
  await assert.rejects(api.ownerCreateCase('Synthetic real case','Pichhore','R0'),
    /B8_ROLE_OWNER_REQUIRED/);
  await assert.rejects(api.editorRecordReview(REQ,'ESCALATE_TO_FOUNDER',
    'Reporter is never the official Editor.'),/B8_ROLE_EDITOR_REQUIRED/);
  assert.equal(calls.length,0);
});
test('Client role boundary: Editor cannot create Reporter draft, Founder cannot fake Reporter',async()=>{
  const {api:ed,calls:ec}=fixture('editor');
  const {api:own,calls:oc}=fixture('owner');
  await assert.rejects(ed.reporterCreateDraft(CASE,'Please show signed receipts and verified totals.','District Office'),
    /B8_ROLE_REPORTER_REQUIRED/);
  await assert.rejects(own.reporterRequestReview(Q),/B8_ROLE_REPORTER_REQUIRED/);
  assert.equal(ec.length+oc.length,0);
});
test('Owner AAL2-dependent RPC names and input validation are exact; server remains authority',async()=>{
  const {api,calls}=fixture('owner');
  const id=await api.ownerCreateCase('Synthetic accountability road expense','Pichhore','R2');
  assert.equal(id,CASE);
  assert.equal(await api.ownerAssignReporter(CASE,USER,'2026-10-19T00:00:00.000Z'),true);
  assert.equal(await api.ownerAssignEditor(CASE,USER,'2026-10-19T00:00:00.000Z'),true);
  assert.equal((await api.ownerLinkArticle(CASE,Q)),Q);
  assert.equal(await api.ownerAssertHold(CASE,'Preserve original evidence pending case.'),12);
  assert.deepEqual(calls.map(v=>v.name),[
   'jb_b8_g1_owner_create_case','jb_b8_g1_owner_assign_reporter',
   'jb_b8_g1_owner_assign_editor','jb_b8_g2_owner_link_article',
   'jb_b8_g2_owner_assert_hold']);
  await assert.rejects(api.ownerCreateCase('short','Pichhore','R0'),/B8_CASE_TITLE_REQUIRED/);
});
test('Backend rejects: never present POST success despite GUI attempting valid action',async()=>{
  const {api}=fixture('reporter',{reject:true});
  await assert.rejects(api.reporterCreateDraft(CASE,
    'Please send public records for this project.',
    'Public Works Office'),/B8_SERVER_REJECTED_jb_b8_g1_reporter_create_draft/);
});
test('Reporter case scope mismatch blocks UI from showing other Case',async()=>{
  const {api}=fixture('reporter',{override:{jb_b8_g1_reporter_case_card:{
    id:Q,risk_lane:'R1',title:'wrong case'
  }}});
  await assert.rejects(api.reporterCaseCard(CASE),/B8_CASE_SCOPE_MISMATCH/);
});
test('Evidence claim is explicitly UNVERIFIED, hash rejected unless SHA256 length',async()=>{
  const {api}=fixture('reporter');
  const good=await api.reporterSubmitClaim(CASE,'PUBLIC_DOCUMENT',
    'Synthetic inspector office letter', 'a'.repeat(64));
  assert.equal(good.state,'CLAIM_UNVERIFIED_NO_BYTES');
  await assert.rejects(api.reporterSubmitClaim(CASE,'PUBLIC_DOCUMENT','some file','oops'),
    /B8_CLAIM_HASH_INVALID/);
});
test('Real private upload stays hard OFF without Founder-approved hosted gate',async()=>{
  const {api,calls}=fixture('reporter');
  await assert.rejects(api.reporterUploadCaseEvidence(CASE,{
    type:'image/png',size:16,name:'evidence.png',arrayBuffer:async()=>new ArrayBuffer(16)
  }),/B8_UPLOAD_HOSTED_GATE_NOT_APPROVED/);
  assert.equal(calls.length,0);
});
test('Android UI static: exactly role-scoped private forms, no fake official SEND or uncontrolled upload',async()=>{
  const base=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
  const html=await readFile(new URL('b8-accountability.html',base),'utf8');
  const ui=await readFile(new URL('b8-accountability-ui.mjs',base),'utf8');
  assert(html.includes('id="owner"')&&html.includes('id="editor"')&&html.includes('id="reporter"'));
  assert(html.includes('id="uploadBtn" type="submit" disabled'));
  // G6 replaced permanent UX OFF with Founder server-default-OFF, not free upload.
  assert(ui.includes("allowPrivateUpload:role==='reporter'"));
  assert(ui.includes('workflow.reporterPrivateUploadReadiness(c.id)'));
  assert(ui.includes("if(!gate.allowed)"));
  assert(ui.includes("uploadReadyCase=null"));
  assert(html.includes('id="uploadBtn" type="submit" disabled'));
  assert(ui.includes('LOCK_MS=15*60*1000'));
  assert(ui.includes('auth.getUser()'));
  assert(ui.includes("node.textContent=JSON.stringify(value,null,2)"));
  assert(!ui.includes('.innerHTML='));
  assert(!ui.includes('localStorage.'));
  assert(!ui.includes('window.open('));
  assert(!html.includes('onclick='));
  assert(!html.includes('service_role'));
  assert(!html.includes('APPROVE_FOR_SEND'));
});
