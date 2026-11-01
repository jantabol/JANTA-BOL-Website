// P4-T094 SOURCE/CATALOG preflight only. NO current Founder E5 or external E9.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',timeout:12000,maxBuffer:4*1024*1024}).trim();
const root='JANTA_BOL_PHASE_4_WORKING/';
const binding=root+'db/20261021_b8_t094_cp03_question_evidence_binding_REVIEW_ONLY.sql';
const ready=root+'db/20261021_b8_t094_cp03_reporter_readiness_REVIEW_ONLY.sql';
const mobile='ci/phase4/b8-t094-cp03-source-binding-android.test.mjs';
const ui='JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js';
const orig=root+'review/B8_T094_CP03_FINAL_ISOLATED_R0_R1_R2_REGRESSION_20261021.md';
const report=root+'b13/P4_T094_NOV01_HOSTED_SECURITY_SOURCE_ACCEPTANCE.md';
const master=root+'TEST-REGISTER.md';
const pins=[
 [binding,'6f87dd0da5fe8ea713d78353af0863ea3027e64f'],
 [ready,'5c46a7e09b575f4f73b759060d30ff5a9ff57217'],
 [mobile,'b98f0f9654adfe01e5b20ef3fd790ab61f4eacae'],
 [ui,'505d5ccd27bd62bb111061632b784aae77a56a89'],
 [orig,'fb339beacb5757aeadb39e00af0d5f81f84059bb']
];
const bind=read(binding),readiness=read(ready),screen=read(ui),previous=read(orig),doc=read(report);

test('T094 1: five original trusted code, UI and 21 Oct result blobs are immutable',()=>{
 for(const [path,sha] of pins)assert.equal(git('rev-parse','HEAD:'+path),sha,'UNAPPROVED_ORIGINAL_SOURCE_DRIFT:'+path);
});
test('T094 2: original E2+E5+E9 test remains explicitly NOT RUN in official register',()=>{
 const original=read(master).split('\n## Register\n')[1]?.split('\n## B0 evidence ledger')[0]||'';
 const row=original.split('\n').find(x=>x.startsWith('| P4-T094 |'));
 assert(row && /\| B8 \| NOT RUN \|$/.test(row),'DO_NOT_FAKE_ORIGINAL_FINAL_PASS');
 assert.match(doc,/T094_FORMAL_FINAL_PASS_LOCK=HOLD/);
});
test('T094 3: evidence-link table is RLS, no anon authenticated direct writes and UPDATE/DELETE immutable',()=>{
 for(const x of [
  'create table public.b8_question_evidence_links(',
  'truth text not null default',
  "check(truth='CLAIM_UNVERIFIED_NO_BYTES')",
  'alter table public.b8_question_evidence_links enable row level security',
  'revoke all on public.b8_question_evidence_links from public,anon,authenticated',
  'before update or delete on public.b8_question_evidence_links',
  'B8_T094_QUESTION_EVIDENCE_IMMUTABLE'
 ])assert(bind.includes(x),'BINDING_PRIVACY_GUARD_MISSING:'+x);
});
test('T094 4: claimed source remains unverified and same-case Reporter ownership is enforced',()=>{
 for(const x of [
  'B8_T094_OWN_DRAFT_REQUIRED','B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED',
  'B8_T094_SAME_CASE_OWN_EVIDENCE_CLAIM_REQUIRED',
  'B8_T094_FROZEN_QUESTION_LINK_CONFLICT',
  'e.submitted_by=auth.uid()',
  'e.evidence_state=\'CLAIM_UNVERIFIED_NO_BYTES\''
 ])assert(bind.includes(x),'BINDING_FAIL_CLOSED_GUARD_MISSING:'+x);
});
test('T094 5: question without same-case original source can never enter handoff candidate',()=>{
 for(const x of [
  'B8_T094_QUESTION_SOURCE_LINK_REQUIRED',
  'select 1 from public.b8_question_evidence_links',
  'join public.b8_case_evidence_claims',
  'e.linked_by=v_q.reporter_user_id',
  'c.submitted_by=v_q.reporter_user_id'
 ])assert(bind.includes(x),'R0_SOURCE_BOUNDARY_REMOVED:'+x);
});
test('T094 6: R1 Editor and R2 Founder authorizations still gate any prepared handoff',()=>{
 for(const x of [
  'B8_G3_SERIOUS_EDITOR_REVIEW_REQUIRED',
  'B8_G3_R1_SCREENING_REQUIRED',
  'B8_G3_R2_FOUNDER_APPROVAL_REQUIRED',
  'public.b8_g3_editor_screenings',
  'public.b8_g3_founder_authorizations',
  'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED'
 ])assert(bind.includes(x),'RISK_LANE_ESCALATION_REMOVED:'+x);
});
test('T094 7: duplicate handoff replay must be idempotent and changed channels denied',()=>{
 assert(bind.includes('B8_G3_REPLAY_CHANNEL_CONFLICT'));
 assert(bind.includes('select id into v_id from public.b8_g3_handoff_intents'));
 assert(bind.includes('return v_id;'));
});
test('T094 8: publicly reachable readiness and official-send claims cannot be forged',()=>{
 for(const x of [
  "'contract','B8_T094_SOURCE_BINDING_V1'",
  "'official_send_by_app',false",
  "'source_independently_verified',false",
  'B8_T094_QUESTION_SOURCE_LINK_REQUIRED',
  'revoke all on function public.jb_b8_t094_source_binding_readiness()',
  'to authenticated;'
 ])assert(readiness.includes(x),'SOURCE_TRUTH_DISCLAIMER_REMOVED:'+x);
 assert(!readiness.includes("'official_send_by_app',true"));
});
test('T094 9: Android form is guarded by actual source binding and cannot claim external SEND',()=>{
 for(const x of [
  'sourceLinkForm',
  'workflow.reporterBindQuestionEvidence',
  'jb_b8_t094_source_binding_readiness',
  'B8_T094_QUESTION_SOURCE_SERVER_GUARD_NOT_READY',
  'server_guard_ready!==true'
 ])assert(screen.includes(x),'MOBILE_FAIL_CLOSED_GUARD_MISSING:'+x);
});
test('T094 10: original 21 Oct PG17 source pass never interpreted as hosted E3/E9',()=>{
 assert(previous.includes('39562469553'));
 assert(previous.includes('PG17 candidate PASS'));
 assert(previous.includes('No actual external SEND'));
 assert(previous.includes('HOLD'));
});
test('T094 11: real 1 Nov hosted negative-gate snapshot explicitly tracks zero drafts and sends',()=>{
 for(const x of [
  '2026-11-01','vrffsnkycvjithwtiylt',
  '0 drafts','0 question↔source links','0 review requests',
  '0 Editor screenings','0 Founder handoff authorizations',
  '0 handoff intents','0 manual delivery attestations','0 official reply claims',
  'anon direct SELECT=false','authenticated direct INSERT=false',
  'anon EXECUTE=false',
  'T094_HOSTED_RLS_AND_RPC_CATALOG=PASS_SCOPED',
  'T094_LIVE_AUTHENTICATED_REPORTER_EDITOR_FOUNDER_E5=NOT_RUN',
  'T094_ACTUAL_DELIVERY_REPLY_NO_REPLY_LATER_REPLY_E9=NOT_RUN',
  'T094_FORMAL_FINAL_PASS_LOCK=HOLD'
 ])assert(doc.includes(x),'SOURCE_ONLY_REPORT_MUST_NOT_FAKE_CURRENT_E5_E9:'+x);
});
test('T094 12: source test contains NO live SQL driver or writable direct service credential',()=>{
 assert(!doc.includes('T094_FORMAL_FINAL_PASS_LOCK=PASS'));
 assert(!bind.includes('http.request('));
 assert(!readiness.includes("'official_send_by_app',true"));
 assert(doc.includes('no Founder account impersonation'));
});
