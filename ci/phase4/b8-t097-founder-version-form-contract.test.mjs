// T097 / ACC-029–035: minimal additive Founder mobile wiring for existing immutable
// document versions. All fake RPCs below are isolated TEST doubles, NEVER live writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';

const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECEIPT='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ANOTHER='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const callname='jb_b8_t097_owner_record_document_version';
function setup(role='owner',answer=7){
  const calls=[];
  const client={rpc:async(name,args)=>{
    calls.push({name,args});
    if(answer instanceof Error)return {data:null,error:{message:'server rejected'}};
    return {data:answer,error:null};
  }};
  return {api:createB8Workflow({client,role}),calls,client};
}
function all(source,terms){
  for(const t of terms)assert(source.includes(t),'missing T097 safe form or guard: '+t);
}
async function rejectBeforeRPC(args,pattern){
  const f=setup();
  await assert.rejects(f.api.ownerRecordT097DocumentVersion(...args),pattern);
  assert.equal(f.calls.length,0,'invalid versioning must not mutate server');
}
test('T097-M01 ORIGINAL sends only required exactly typed server UUIDs, stage and null prior',async()=>{
  const f=setup('owner',9);
  const x=await f.api.ownerRecordT097DocumentVersion(CASE,'  nh3_mis_report  ','ORIGINAL',RECEIPT);
  assert.deepEqual(f.calls,[{name:callname,args:{
    p_case_id:CASE,p_document_key:'nh3_mis_report',p_stage:'ORIGINAL',
    p_receipt_id:RECEIPT,p_previous_version_id:null
  }}]);
  assert.deepEqual(x,{eventId:'9',stage:'ORIGINAL',
    provenance:'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED'});
  assert(Object.isFrozen(x));
});
test('T097-M02 REVISED requires explicit previous server record id (never invent it)',async()=>{
  const f=setup('owner','58');
  const x=await f.api.ownerRecordT097DocumentVersion(CASE,'nh3_mis_report','REVISED',ANOTHER,'49');
  assert.equal(f.calls.length,1);
  assert.deepEqual(f.calls[0].args,{p_case_id:CASE,p_document_key:'nh3_mis_report',
    p_stage:'REVISED',p_receipt_id:ANOTHER,p_previous_version_id:'49'});
  assert.equal(x.eventId,'58');
  assert.equal(x.provenance,'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED');
});
test('T097-M03 rejects forged/non-Owner Reporter/Editor before any RPC',async()=>{
  for(const role of ['reporter','editor']){
    const f=setup(role);
    await assert.rejects(f.api.ownerRecordT097DocumentVersion(
      CASE,'nh3_mis_report','ORIGINAL',RECEIPT),/B8_ROLE_OWNER_REQUIRED/);
    assert.equal(f.calls.length,0);
  }
});
test('T097-M04 strict document-key: only [a-z0-9_-] and length 3–80',async()=>{
  for(const key of ['', 'ab','NHAI','NHAI 2018','a.b','a/b','äbc',
      ' a '.trim(),'a'.repeat(81),'<script>alert(1)</script>','निजी']){
    await rejectBeforeRPC([CASE,key,'ORIGINAL',RECEIPT],
      /B8_T097_DOCUMENT_KEY_INVALID/);
  }
});
test('T097-M05 stage cannot be spoofed, no false government verified status',async()=>{
  for(const stage of ['', 'verified', 'REVISED_AND_SENT','original','PUBLISH',null]){
    await rejectBeforeRPC([CASE,'nh3_pdf',stage,RECEIPT],
      /B8_T097_DOCUMENT_STAGE_INVALID/);
  }
});
test('T097-M06 ORIGINAL cannot silently attach a previous version',async()=>{
  for(const p of ['1','0001',1,'-1','arbitrary']){
    await rejectBeforeRPC([CASE,'nh3_pdf','ORIGINAL',RECEIPT,p],
      /B8_T097_ORIGINAL_PREVIOUS_FORBIDDEN/);
  }
});
test('T097-M07 REVISED must have strictly positive uint-looking signed-int8 previous id',async()=>{
  for(const p of ['',null,'0','01','-1','1e2','1.1','xyz','  0  ','9223372036854775808']){
    await rejectBeforeRPC([CASE,'nh3_pdf','REVISED',RECEIPT,p],
      /B8_T097_REVISION_PREVIOUS_ID_REQUIRED/);
  }
});
test('T097-M08 does not change UUIDs, fabricate receipt or hide wrong-case failure',async()=>{
  await rejectBeforeRPC(['not-a-case','nh3_pdf','ORIGINAL',RECEIPT],
    /B8_UUID_REQUIRED/);
  await rejectBeforeRPC([CASE,'nh3_pdf','ORIGINAL','placeholder'],
    /B8_UUID_REQUIRED/);
  await rejectBeforeRPC([CASE,'nh3_pdf','REVISED','', '9'],
    /B8_UUID_REQUIRED/);
});
test('T097-M09 network/RPC permission/receipt failure remains a hard REJECT',async()=>{
  const f=setup('owner',new Error('not same-case receipt'));
  await assert.rejects(f.api.ownerRecordT097DocumentVersion(CASE,'nh3_pdf',
    'ORIGINAL',RECEIPT),/B8_SERVER_REJECTED_jb_b8_t097_owner_record_document_version/);
  assert.equal(f.calls.length,1,'no retries or fallback to service_role');
  assert.deepEqual(Object.keys(f.client),['rpc'],'no Storage or alternate client');
});
test('T097-M10 malformed or empty server acknowledgement cannot be mistaken for success',async()=>{
  for(const answer of [null,'0','-1',0,1.5,{},true,
    '1.5','1e3','9223372036854775808',Number.MAX_SAFE_INTEGER+1]){
    const f=setup('owner',answer);
    await assert.rejects(f.api.ownerRecordT097DocumentVersion(
      CASE,'nh3_pdf','ORIGINAL',RECEIPT),
    /B8_(?:EMPTY_SERVER_RESULT|T097_DOCUMENT_VERSION_SERVER_ACK_INVALID)/);
    assert.equal(f.calls.length,1);
  }
  // Explicit undefined server response: setup() uses a default argument for
  // omitted answers, so a custom stub is necessary to test this negative.
  const empty=createB8Workflow({role:'owner',client:{
    rpc:async()=>({data:undefined,error:null})
  }});
  await assert.rejects(empty.ownerRecordT097DocumentVersion(
    CASE,'nh3_pdf','ORIGINAL',RECEIPT),/B8_EMPTY_SERVER_RESULT/);
});
test('T097-M11 no blind RPC retry, success only attributed to server integer',async()=>{
  const f=setup('owner','37');
  const x=await f.api.ownerRecordT097DocumentVersion(CASE,'nh3_pdf','ORIGINAL',RECEIPT);
  assert.equal(x.eventId,'37');
  assert.equal(f.calls.length,1);
  assert.equal(x.provenance,'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED');
  assert.equal('officialAuthenticityVerified' in x,false);
  assert.equal('storageUploaded' in x,false);
});
test('T097-M12 Founder Android form has all labeled, required inputs and private truth notice',()=>{
  const html=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html','utf8');
  for(const x of ['t097Version','t097VersionCase','t097VersionKey','t097VersionStage',
   't097VersionReceipt','t097VersionPrevious','t097VersionConfirm'])
    assert(html.includes('id="'+x+'"'),x);
  all(html,['T097 — निजी दस्तावेज Original / Revised संस्करण दर्ज करें',
    'value="ORIGINAL"','value="REVISED"',
    'pattern="[a-z0-9_-]{3,80}"',
    'Private Upload अभी बंद है',
    'अभी कुछ प्रकाशित या भेजा नहीं जाएगा',
    'असली उसी-मामले की निजी सर्वर रसीद']);
});
test('T097-M13 Phone task menu includes form and safety lock scrubs private IDs',()=>{
  const ui=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js','utf8');
  all(ui,["'t097Version'","'t097VersionCase'",
   "form('t097Version',async()=>{",
   "workflow.ownerRecordT097DocumentVersion(",
   "$('t097VersionConfirm').checked",
   "$('t097Version').reset();",
   'LOCK_MS=15*60*1000','B8_PHONE_TASK_COVERAGE_MISMATCH']);
  assert(!ui.includes('.innerHTML='));
  assert(!ui.includes('localStorage.setItem('));
});
test('T097-M14 server remains source-of-truth and actual bytes not auto uploaded',()=>{
  const sql=readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t097_integrity_versioned_paging_REVIEW_ONLY.sql','utf8');
  all(sql,['jb_b8_t097_owner_record_document_version',
    'B8_OWNER_AAL2_REQUIRED','B8_T097_SAME_CASE_RECEIPT_REQUIRED',
    'B8_T097_ORIGINAL_FIRST_REQUIRED','B8_T097_REVISION_MUST_FOLLOW_LATEST_VERSION',
    'B8_T097_DOCUMENT_VERSION_IMMUTABLE','PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED']);
  const ui=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js','utf8');
  const idx=ui.indexOf("form('t097Version',async()=>{");
  assert(idx>=0);
  const scope=ui.slice(idx,ui.indexOf('// G5: exact Founder-only',idx));
  assert(!/reporterUploadCaseEvidence|jb-b8-private-evidence|PUBLISH|\.functions\.invoke\(/.test(scope));
});
test('T097-M15 original protected G5/G7/old News and backend SQL blobs untouched',()=>{
  const pins={
    'JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t097_integrity_versioned_paging_REVIEW_ONLY.sql':'0371733e65581c301d2ee479bc98a8613af90738',
    'JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql':'61b830ad2cfa1f705df22da32eb680a7e42cb450',
    'JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g7_accountability_chronology_REVIEW_ONLY.sql':'bed9504ca4f741d813172d6c64e20b572cf3e92b',
    'ci/phase4/b8-t097-neutral-integrity-paging-regression-v3.sql':'dbe70cb20cde6ce4185b8b7c242789325c102a79'
  };
  for(const [p,sha] of Object.entries(pins)){
    const actual=execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
    assert.equal(actual,sha,'protected original changed '+p);
  }
});
test('T097-M16 preview is code-only; no auto official validation or upload',()=>{
  const ui=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js','utf8');
  const html=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html','utf8');
  const client=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js','utf8');
  const begin=ui.indexOf("form('t097Version',async()=>{");
  const end=ui.indexOf('// G5: exact Founder-only',begin);
  const scope=ui.slice(begin,end);
  assert(begin>0&&end>begin);
  all(scope,['T097 निजी दस्तावेज संस्करण दर्ज हुआ','PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED','दोबारा Submit न करें']);
  assert(!/reporterUploadCaseEvidence|\.functions\.invoke\(|\bPUBLISH\b|\bSEND\b/.test(scope));
  assert(!/localStorage\.setItem\(/.test(scope));
  assert(html.includes('Private Upload अभी बंद है'));
  assert(client.includes("provenance:'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED'"));
});
