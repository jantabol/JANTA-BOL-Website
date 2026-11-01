// P4-T095 / RUN-12 / ACC020-024: current-source verification ONLY.
// This is never official E5/E9 proof or permission to write production.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const r = (p) => readFileSync(p, 'utf8');
const blob = (p) => execFileSync('git', ['rev-parse', 'HEAD:' + p], { encoding:'utf8' }).trim();
const dbPath='JANTA_BOL_PHASE_4_WORKING/db/';
const sql=r(dbPath+'20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql');
const due=r(dbPath+'20261017_b8_g9_due_followup_safe_notifications_REVIEW_ONLY.sql');
const replay=r(dbPath+'20261021_b8_g5_no_exact_duplicate_fact_REVIEW_ONLY.sql');
const mobile=r('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js');
const html=r('JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html');
const ui=r('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js');
const g5reg=r('ci/phase4/b8-g5-original-accountability-regression.sql');
const g9reg=r('ci/phase4/b8-g9-due-followup-notification-regression.sql');
const report=r('JANTA_BOL_PHASE_4_WORKING/review/P4_T095_BACKEND_SOURCE_HOSTED_PREFLIGHT_20261101.md');

test('T095-01 canonical RUN12 original test remains NOT RUN; no fake final PASS',()=>{
 const register=r('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
 const line=register.split('\n').find(x=>x.startsWith('| P4-T095 |'));
 assert(line?.includes('Ground Verification + Deadline + Responsibility Map'));
 assert.match(line, /\| B8 \| NOT RUN \|$/);
 assert(report.includes('T095_FORMAL_FINAL_PASS_LOCK=HOLD'));
});
test('T095-02 exact existing G5, G9 and UI blob identities remain untouched',()=>{
 const pins={
  'JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql':'61b830ad2cfa1f705df22da32eb680a7e42cb450',
  'JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_g5_no_exact_duplicate_fact_REVIEW_ONLY.sql':'ff9daad4d30ebf9c9e17da71a1de0898865398a7',
  'JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g9_due_followup_safe_notifications_REVIEW_ONLY.sql':'2575233b2db392c81402abb76a80f66fde198584',
  'JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html':'d9e0b79bacdd3b85fa23fee8310a16ea750f686d',
  'JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js':'0bf53ef35efdc21ac985493ccb49734cdd1a0fb1',
  'JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js':'505d5ccd27bd62bb111061632b784aae77a56a89'
 };
 for(const [p,v] of Object.entries(pins))assert.equal(blob(p),v,'Source changed: '+p);
});
test('T095-03 authority completion assertion and field observation are distinct source classes',()=>{
 assert(sql.includes("kind='GROUND' and field_code in('AUTHORITY_COMPLETION_CLAIM','FIELD_OBSERVATION_REPORTED')"));
 assert(mobile.includes("GROUND:['AUTHORITY_COMPLETION_CLAIM','FIELD_OBSERVATION_REPORTED']"));
 assert(html.includes('value="AUTHORITY_COMPLETION_CLAIM"'));
 assert(html.includes('value="FIELD_OBSERVATION_REPORTED"'));
});
test('T095-04 claimed completion, historical forecast and actual ground are not auto verified',()=>{
 assert(sql.includes("authenticity text not null default 'NOT_INDEPENDENTLY_VERIFIED'"));
 assert(sql.includes("check(authenticity='NOT_INDEPENDENTLY_VERIFIED')"));
 assert(mobile.includes("authenticity:'NOT_INDEPENDENTLY_VERIFIED'"));
 assert(html.includes('ये रिकॉर्ड निजी रहेंगे'));
});
test('T095-05 original/revised deadline are typed distinct with date required, no monetary value',()=>{
 assert(sql.includes("kind='DEADLINE' and field_code in('ORIGINAL','REVISED')"));
 assert(sql.includes('target_date is not null and cost_inr is null'));
 assert(mobile.includes("DEADLINE:['ORIGINAL','REVISED']"));
 assert(mobile.includes("deny('G5_DEADLINE_INVALID')"));
});
test('T095-06 revised deadline cannot precede original or replace sealed first original',()=>{
 for(const x of [
  'B8_G5_ORIGINAL_DEADLINE_ALREADY_SEALED',
  'B8_G5_ORIGINAL_DEADLINE_REQUIRED',
  "p_kind='DEADLINE' and p_field_code='ORIGINAL'",
  "p_kind='DEADLINE' and p_field_code='REVISED'"
 ])assert(sql.includes(x),x);
});
test('T095-07 immutable event history and fail-closed private grants are retained',()=>{
 for(const x of [
  'alter table public.b8_g5_fact_events enable row level security',
  'revoke all on public.b8_g5_fact_events from public,anon,authenticated',
  'before update or delete',
  'B8_G5_IMMUTABLE_FACT_HISTORY'
 ])assert(sql.includes(x),'missing '+x);
});
test('T095-08 only Owner AAL2 with case row lock may record facts, closed cases block edits',()=>{
 for(const x of [
  'private.current_owner_aal2()',
  'B8_OWNER_AAL2_REQUIRED',
  'where id=p_case_id for update',
  'B8_G5_CLOSED_CASE_IMMUTABLE_UNTIL_REOPEN',
  'B8_G5_CASE_REQUIRED'
 ])assert(sql.includes(x),'missing '+x);
});
test('T095-09 responsibility map is an attributed ROLE only, not automatic fault',()=>{
 assert(sql.includes("kind='RESPONSIBILITY' and field_code='ROLE_MAP'"));
 assert(mobile.includes("RESPONSIBILITY:['ROLE_MAP']"));
 assert(html.includes('जिम्मेदार पद / भूमिका (दोष साबित नहीं)'));
 assert(report.includes('cannot convict, infer motive or blame'));
});
test('T095-10 cross-case private receipt and duplicate unchanged fact submissions fail closed',()=>{
 assert(sql.includes('B8_G5_CROSS_CASE_RECEIPT_DENIED'));
 assert(replay.includes('B8_G5_EXACT_DUPLICATE_NOT_APPENDED'));
 assert(replay.includes('e.cost_inr is not distinct from p_cost_inr'));
 assert(replay.includes('e.target_date is not distinct from p_target_date'));
 assert(replay.includes('e.evidence_receipt_id is not distinct from p_receipt_id'));
});
test('T095-11 overdue workflow uses latest appended deadline and records only human review',()=>{
 for(const x of [
  'jb_b8_g9_owner_due_followups',
  "e.kind='DEADLINE'",
  'order by e.id desc limit 1',
  'd.target_date < current_date',
  'DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT',
  "c.case_state<>'closed'"
 ])assert(due.includes(x),'missing '+x);
});
test('T095-12 due follow-up event is required to close pending review, not false official reply',()=>{
 assert(due.includes("e.event_kind='DEADLINE_FOLLOWUP'"));
 assert(due.includes('e.as_of_date >= d.target_date'));
 assert(due.includes('private.current_owner_aal2()'));
 assert(!due.includes('smtp.send('));
});
test('T095-13 Founder notifications are private, generic, in-app and deduplicated',()=>{
 for(const x of [
  "if new.event_kind not in",
  "'DEADLINE_FOLLOWUP','LATE_REPLY_CLAIM','SUMMARY_CORRECTION'",
  "'B8_ACCOUNTABILITY_FOLLOWUP'",
  "'IN_APP_READY'",
  "'SAFE_CASE_REFERENCE_ONLY'",
  'on conflict(recipient_user_id,dedupe_key)'
 ])assert(due.includes(x),'missing '+x);
});
test('T095-14 existing Founder UI remains 15-minute locked and source-only inputs',()=>{
 for(const x of ['id="g5Fact"','id="g5Kind"','id="g5Field"','id="g5Date"','id="g5Detail"','id="g5Receipt"','id="g9Due"'])assert(html.includes(x));
 assert(ui.includes('LOCK_MS=15*60*1000'));
 assert(ui.includes("form('g5Fact',async()=>{"));
 assert(ui.includes("form('g9Due',async()=>{"));
 assert(mobile.includes("requireRole(role,'owner')"));
});
test('T095-15 original disposable PG17 negative tests still cover all roles and deadlines',()=>{
 for(const x of [
  'B8_G5_REPORTER_ESCALATED',
  'B8_G5_OWNER_AAL1_BYPASS',
  'B8_G5_REVISED_WITH_NO_ORIGINAL',
  'B8_G5_ORIGINAL_DEADLINE_DUPLICATED',
  'FIELD_OBSERVATION_REPORTED',
  'AUTHORITY_COMPLETION_CLAIM',
  "'RESPONSIBILITY','ROLE_MAP'",
  'rollback;'
 ])assert(g5reg.includes(x),'missing '+x);
 for(const x of ['B8_G9_REPORTER_READ_OWNER_DUE','B8_G9_DUE_PERSISTS_AFTER_FOLLOWUP','B8_G9_ROLLBACK_LEAK'])assert(g9reg.includes(x));
});
test('T095-16 source precheck never promotes external field truth or official final lock',()=>{
 for(const status of [
  'T095_E2_HOSTED_CATALOG_RLS_TYPE_GUARDS=PASS_SCOPED_READ_ONLY',
  'T095_FOUNDER_E5_LIVE_FACT_APPEND_AND_REVISED_HISTORY=NOT_RUN',
  'T095_REAL_2026_INDEPENDENT_GROUND_VERIFICATION_E9=NOT_RUN',
  'T095_REAL_DELAY_REASON_EXTERNAL_ANSWER_E9=NOT_RUN',
  'T095_FORMAL_FINAL_PASS_LOCK=HOLD'
 ])assert(report.includes(status),'missing report truth '+status);
 assert(!report.includes('T095_FORMAL_FINAL_PASS_LOCK=PASS'));
});
