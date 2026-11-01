// Original Phase-4 RUN-12 / P4-T098 (ACC036–044, §§903–916).
// Source + contract probes ONLY; never stand in for real E3/E4/E5/E9.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const blob=p=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
const root='JANTA_BOL_PHASE_3C_WORKING/';
const db='JANTA_BOL_PHASE_4_WORKING/db/';
const path={
  news:root+'add-news.html',
  backend:root+'backend-client.js',
  article:root+'article.html',
  b8:root+'b8-accountability-client.js',
  ui:root+'b8-accountability-ui.js',
  html:root+'b8-accountability.html',
  g2:db+'20261017_b8_g2_cp01_provenance_survival_REVIEW_ONLY.sql',
  hold:db+'20261017_b8_g2_cp02_article_hold_GUARD_REVIEW_ONLY.sql',
  g7:db+'20261017_b8_g7_accountability_chronology_REVIEW_ONLY.sql',
  g9:db+'20261017_b8_g9_due_followup_safe_notifications_REVIEW_ONLY.sql',
  g6:db+'20261017_b8_g6_private_upload_release_gate_REVIEW_ONLY.sql',
  g4:db+'20261017_b8_g4_cp01_cp03_public_projection_REVIEW_ONLY.sql',
  g5:db+'20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql',
  g9test:'ci/phase4/b8-g9-due-followup-notification-regression.sql',
  g9Android:'ci/phase4/b8-g9-due-dashboard-android.test.mjs',
  g7Android:'ci/phase4/b8-g7-chronology-android.test.mjs',
  report:'JANTA_BOL_PHASE_4_WORKING/review/P4_T098_CORRECTION_NOTIF_AUDIT_RETENTION_SECURITY_BACKEND_20261101.md'
};
const s=Object.fromEntries(Object.entries(path).map(([k,p])=>[k,read(p)]));
const all=(src,terms)=>terms.forEach(x=>assert(src.includes(x),'T098 guard missing: '+x));
const safe=(txt)=>assert(!txt.includes('T098_OFFICIAL_FINAL_PASS_LOCK=PASS'),'fake Final PASS');
test('T098-01 original authority is RUN12 ACC036-044, E1/E2/E3/E4/E5/E9, NOT RUN',()=>{
  const lines=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md').split('\n');
  const row=lines.find(v=>v.startsWith('| P4-T098 |'));
  assert(row?.includes('Correction + Notification + Audit + Retention + Security + Failure + Android'));
  assert(row.includes('| B8 | NOT RUN |'));
  all(s.report,['ACC-036–ACC-044','E1 + E2 + E3 + E4 + E5 + E9',
    'T098_REAL_FOUNDER_ANDROID_FULL_CHAIN_E3_E5=NOT_RUN',
    'T098_OFFICIAL_FINAL_PASS_LOCK=HOLD']);
  safe(s.report);
});
test('T098-02 product/Article/Founder/b8/G9 DB source EXACT preflight SHA preserved',()=>{
  const pins={
    [path.news]:'813d00fbf96b31214cce1f4147d14615c3de4be1',
    [path.backend]:'fb2c60d241ef772d4990536b577acc3c7d70fad7',
    [path.article]:'98dca1e26f32846b6fba722731acd6d14f0aed41',
    [path.b8]:'bf9295b4a16f2434532ec0fe508fd15c7f531500',
    [path.ui]:'8620dc304e733a70c9c4ce593b73992e2aa6a4b1',
    [path.g9]:'2575233b2db392c81402abb76a80f66fde198584'
  };
  for(const [file,sha] of Object.entries(pins))assert.equal(blob(file),sha,'unexpected original product change '+file);
});
test('T098-03 Founder published same-story correction reuses current Article identity',()=>{
  all(s.news,["Published News Correction","'article.html?id='+encodeURIComponent(i.id)",
    "source==='published'?'none':''","if(origin==='published')",
    'Published correction ko Final Review']);
});
test('T098-04 existing correction uses UPDATE exact Article UUID plus optimistic CAS; no new insert',()=>{
  const pub=s.backend.slice(s.backend.indexOf('async function publish('),s.backend.indexOf('async function unpublish('));
  all(pub,['const newlyCreated=!working.id','if(newlyCreated){','working=await saveDraft(',
    ".from('articles')",".update({",".eq('id',working.id)",
    ".eq('version',expectedVersion)","throw new Error('VERSION_CONFLICT')",
    'const confirmed=await getArticle(out.id']);
  assert(!pub.includes('.insert({'),'Existing Article correction must NOT insert another Article');
});
test('T098-05 separate follow-up must link distinct preexisting Article ID; no B8 publisher',()=>{
  all(s.g2,['create table public.b8_case_article_links',
    'article_id uuid not null', 'unique(case_id,article_id)',
    'article_version_at_link bigint not null',
    'article_status_at_link text not null',
    'where a.id=p_article_id and a.deleted_at is null',
    'B8_EXISTING_NONDELETED_ARTICLE_REQUIRED',
    'b8_case_article_links_immutable']);
  all(s.b8,['async ownerLinkArticle(caseId,articleId)',
    "jb_b8_g2_owner_link_article"]);
});
test('T098-06 relevant linked Article hard DELETE blocked until separate lawful disposition',()=>{
  all(s.hold,['b8_guard_linked_article_hard_delete','before delete on public.articles',
    'B8_LINKED_ARTICLE_REQUIRES_CONTROLLED_DISPOSITION',
    'including Founder requests','A linked Article can still be unpublished/corrected']);
});
test('T098-07 SUMMARY_CORRECTION requires prior summary event; does NOT rewrite old history',()=>{
  all(s.g7,["event_kind='SUMMARY_CORRECTION' and prior_event_id is not null",
    "references public.b8_g7_history_events(id) on delete restrict",
    'b8_g7_history_append_only','B8_G7_HISTORY_APPEND_ONLY',
    'B8_OWNER_AAL2_REQUIRED']);
  all(s.b8,["if(kind==='SUMMARY_CORRECTION'&&!pPrior)",
    'G7_ORIGINAL_SUMMARY_REQUIRED',
    'p_prior_event_id:pPrior']);
});
test('T098-08 private correction truth cannot promote government verification',()=>{
  all(s.g7,["truth text not null default 'FOUNDER_ATTRIBUTED_UNVERIFIED'",
    "check(truth='FOUNDER_ATTRIBUTED_UNVERIFIED')",
    'B8_G7_RECEIPT_CROSS_CASE_DENIED',
    'B8_G7_QUESTION_CROSS_CASE_DENIED']);
  all(s.b8,["truth:'FOUNDER_ATTRIBUTED_UNVERIFIED'",
    "deny('G7_KIND_NOT_ALLOWED')"]);
});
test('T098-09 exactly three sealed private event types trigger Owner follow-up alerts',()=>{
  all(s.g9,["if new.event_kind not in",
    "('DEADLINE_FOLLOWUP','LATE_REPLY_CLAIM','SUMMARY_CORRECTION')",
    "after insert on public.b8_g7_history_events"]);
  assert(!s.g9.includes("'FULL_REPLY_CLAIM','SUMMARY_CORRECTION'"));
});
test('T098-10 B3 notification is generic Owner-only IN_APP_READY, not claimed outbound send',()=>{
  all(s.g9,["from public.user_roles ur where ur.role='owner'::public.app_role",
    "'B8_ACCOUNTABILITY_FOLLOWUP'",
    "'Accountability follow-up ready for review'",
    "'A private accountability record changed. Review after secure staff login.'",
    "'IN_APP_READY'",
    "'privacy','SAFE_CASE_REFERENCE_ONLY'",
    'No added cron']);
});
test('T098-11 follow-up alert unique per event, no duplicate on repeated delivery attempt',()=>{
  all(s.g9,["'b8:followup:'||new.id::text",
    'on conflict(recipient_user_id,dedupe_key) where dedupe_key is not null do nothing']);
});
test('T098-12 Owner due dashboard excludes closed, covers late only and limits PAGE not lifetime',()=>{
  all(s.g9,['jb_b8_g9_owner_due_followups',
    'private.current_owner_aal2()',
    'B8_OWNER_AAL2_REQUIRED',
    "where c.case_state<>'closed'",
    "and d.target_date < current_date",
    "e.event_kind='DEADLINE_FOLLOWUP'",
    'order by days_overdue desc,c.id limit 50',
    'DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT']);
});
test('T098-13 G9 actual synthetic PG17 verifies deny, safe inbox and post-follow-up suppression',()=>{
  all(s.g9test,[
    'B8_G9_PUBLIC_DUE_CASE_LEAK',
    'B8_G9_REPORTER_READ_OWNER_DUE',
    'B8_G9_MISSED_DEADLINE_NOT_LISTED',
    'B8_G9_BAD_B3_PRIVACY_OR_DUPLICATE_NOTIFY',
    'B8_G9_PRIVATE_CASE_TITLE_LEAK',
    'B8_G9_DUE_PERSISTS_AFTER_FOLLOWUP',
    'B8_G9_ROLLBACK_LEAK',
    'rollback;'
  ]);
});
test('T098-14 strict private storage RLS / no direct public case evidence or chronology',()=>{
  all(s.g2,['enable row level security',
    'revoke all on public.b8_case_article_links,public.b8_case_evidence_claims',
    'B8_G2_IMMUTABLE_CASE_PROVENANCE']);
  all(s.g7,['alter table public.b8_g7_history_events enable row level security',
    'revoke all on public.b8_g7_history_events from public,anon,authenticated']);
});
test('T098-15 G9 private trigger and Owner due entry not executable by anon',()=>{
  all(s.g9,['revoke all on function public.jb_b8_g9_owner_due_followups()',
    'from public,anon,authenticated;',
    'revoke all on function private.b8_g9_notify_owner_followup()']);
});
test('T098-16 Android workflow has real Founder/Reporter/Editor forms; read and 15min lock',()=>{
  all(s.ui,['LOCK_MS=15*60*1000',
    "form('g7History',async()=>{",
    "form('g7HistoryRead',async()=>{",
    "form('g9Due',async()=>{",
    'B8_PHONE_TASK_COVERAGE_MISMATCH',
    'ownerDueG9Followups()',
    "g7HistoryOutput').textContent='Locked",
    "g9DueOutput').textContent='Locked"]);
  all(s.g7Android,["'SUMMARY_CORRECTION'",'B8_ROLE_OWNER_REQUIRED']);
  all(s.g9Android,['B8_ROLE_OWNER_REQUIRED','LOCK_MS=15*60*1000']);
});
test('T098-17 on network/auth/role failures private actions fail closed, no official send',()=>{
  all(s.ui,['B8_15_MINUTE_INACTIVITY_LOCK','B8_OFFLINE_NO_SERVER_CONFIRMATION',
    'B8_LOGIN_EXPIRED','B8_ROLE_CHANGED',
    "await window.JBBackend.requireOwner()",
    "showStatus('कार्रवाई रोक दी गई:",
    "showJSON(out,due)"]);
  assert(!s.ui.includes('.innerHTML='));
});
test('T098-18 Owner action and G6 evidence upload never enabled merely for source CI',()=>{
  all(s.g6,["enabled boolean not null default false",
    "values ('PRIVATE_EVIDENCE_UPLOAD',false)",
    'B8_G6_PRIVATE_UPLOAD_FOUNDER_RELEASE_DISABLED']);
  all(s.report,['b8_private_upload_receipts=0',
    'T098_REAL_OFFICIAL_OR_PRIVATE_BYTES_E9=NOT_RUN']);
});
test('T098-19 no case/Evidence/Question/Revision must silently auto expire or be publicly exposed',()=>{
  all(s.g2,['references public.b8_cases(id) on delete restrict','b8_case_article_links_immutable']);
  all(s.g4,['b8_g4_revisions_immutable','B8_G4_PUBLIC_APPROVAL_HISTORY_IMMUTABLE']);
  all(s.g5,['b8_g5_fact_events_immutable']);
  all(s.g9,['No arbitrary evidence cap, no retention deletion']);
});
test('T098-20 explicitly preserve E3/E4/E5/E9 and original formal PASS+LOCK HOLD',()=>{
  all(s.report,['T098_REAL_FOUNDER_ANDROID_FULL_CHAIN_E3_E5=NOT_RUN',
    'T098_REAL_SAME_ARTICLE_CORRECTION_AND_NEW_FOLLOWUP_E4=NOT_RUN',
    'T098_REAL_OFFICIAL_OR_PRIVATE_BYTES_E9=NOT_RUN',
    'T098_LIVE_HTTP_CROSS_ROLE_AND_FAILURE_E5_E9=NOT_RUN',
    'T098_OFFICIAL_FINAL_PASS_LOCK=HOLD']);
  safe(s.report);
});
