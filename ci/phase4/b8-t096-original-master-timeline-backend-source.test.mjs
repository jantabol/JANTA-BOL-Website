// Phase 4 original P4-T096 ACC025-028 source-only, never E4/E5/E9 final acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir='JANTA_BOL_PHASE_4_WORKING/db/';
const get=(p)=>readFileSync(p,'utf8');
const gitsha=(p)=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
const linkPath=dir+'20261017_b8_g2_cp01_provenance_survival_REVIEW_ONLY.sql';
const t96Path=dir+'20261021_b8_t096_master_outcome_reopen_guard_REVIEW_ONLY.sql';
const histPath=dir+'20261017_b8_g7_accountability_chronology_REVIEW_ONLY.sql';
const g4Path=dir+'20261017_b8_g4_cp01_cp03_public_projection_REVIEW_ONLY.sql';
const sql=get(t96Path),link=get(linkPath),hist=get(histPath),g4=get(g4Path);
const cPath='JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const uiPath='JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js';
const htmlPath='JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html';
const client=get(cPath),ui=get(uiPath),html=get(htmlPath);
const pg17=get('ci/phase4/b8-t096-master-outcome-reopen-regression-v3.sql');
const android=get('ci/phase4/b8-t096-t097-android-live-parity.test.mjs');
const doc=get('JANTA_BOL_PHASE_4_WORKING/review/P4_T096_MASTER_TIMELINE_OUTCOME_REOPEN_BACKEND_PREFLIGHT_20261101.md');
const includesAll=(s,items)=>{for(const x of items)assert(s.includes(x),'Missing safeguard '+x)};
test('T096-01 original RUN12 register remains NOT RUN, official final gate held',()=>{
 const row=get('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md').split('\n').find(x=>x.startsWith('| P4-T096 |'));
 assert(row?.includes('Timeline + Master Accountability Record + Outcome + Reopen'));
 assert.match(row,/\| B8 \| NOT RUN \|$/);
 includesAll(doc,['ACC025','ACC026','ACC027','ACC028','T096_OFFICIAL_FINAL_PASS_LOCK=HOLD']);
});
test('T096-02 original protected Article, G2/G4/G5/G7 migration and UI blobs are not touched',()=>{
 const hashes={
  [linkPath]:'3170d4ea22f15bce58f32756b771109af06e1889',
  [t96Path]:'be7028be51ae1da8deeaa3f6053de7ff804c45fc',
  [histPath]:'bed9504ca4f741d813172d6c64e20b572cf3e92b',
  [g4Path]:'1decf7e3a9cb9ad15e9c6665eb0e6e114d7ca44c',
  [cPath]:'0bf53ef35efdc21ac985493ccb49734cdd1a0fb1',
  [uiPath]:'505d5ccd27bd62bb111061632b784aae77a56a89',
  [htmlPath]:'d9e0b79bacdd3b85fa23fee8310a16ea750f686d'
 };
 for(const [p,sha] of Object.entries(hashes))assert.equal(gitsha(p),sha,p+' changed');
});
test('T096-03 exactly one original Article can belong to one Master; many distinct Articles can share a Case',()=>{
 includesAll(sql,['create unique index b8_t096_article_single_master_case on public.b8_case_article_links(article_id);']);
 includesAll(link,['unique(case_id,article_id)','linked_order bigint generated always as identity unique','case_id uuid not null references public.b8_cases(id)']);
 assert(!/unique\s*\(\s*case_id\s*\)/i.test(link),'wrongly limited one Article per Case');
});
test('T096-04 Founder links only existing nondeleted Article and private immutable title/status/version snapshot',()=>{
 includesAll(link,[
  'jb_b8_g2_owner_link_article','private.current_owner_aal2()',
  'B8_EXISTING_NONDELETED_ARTICLE_REQUIRED',
  'select a.title,a.version,a.status::text',
  'where a.id=p_article_id and a.deleted_at is null',
  'for key share',
  'article_title_at_link,article_version_at_link,',
  'article_status_at_link,linked_by',
  'b8_case_article_links_immutable'
 ]);
 const block=link.slice(link.indexOf('create function public.jb_b8_g2_owner_link_article('),
  link.indexOf('-- Submitted hash is an UNVERIFIED CLAIM'));
 assert(!/update\s+public\.articles\b/i.test(block),'Article source mutated');
});
test('T096-05 Owner-only dispositions require same-case draft, active Case and Owner AAL2',()=>{
 includesAll(sql,[
  'create function public.jb_b8_t096_owner_record_question_disposition',
  'private.current_owner_aal2()',
  'B8_T096_ACTIVE_CASE_REQUIRED','q.id=p_question_id and q.case_id=p_case_id',
  'B8_T096_QUESTION_CROSS_CASE_DENIED',
  'p_receipt_id and r.case_id=p_case_id',
  'B8_T096_RECEIPT_CROSS_CASE_DENIED'
 ]);
});
test('T096-06 private answer labels can never silently become verified official reply',()=>{
 includesAll(sql,[
  "'ANSWERED_REPORTED','PARTIAL_REPORTED','UNANSWERED_MONITORING'",
  "verification text not null default 'FOUNDER_REPORTED_UNVERIFIED'",
  "check(verification='FOUNDER_REPORTED_UNVERIFIED')",
  "disposition<>'ANSWERED_REPORTED' or evidence_receipt_id is not null",
  'B8_T096_ANSWERED_NEEDS_PRIVATE_BYTES'
 ]);
 includesAll(client,['T096_ANSWERED_RECEIPT_REQUIRED', "truth:'FOUNDER_REPORTED_UNVERIFIED'"]);
});
test('T096-07 disposition history is append only, RLS enabled, no direct anon or authenticated grant',()=>{
 includesAll(sql,[
  'b8_t096_disposition_immutable before update or delete',
  'B8_T096_DISPOSITION_IMMUTABLE',
  'alter table public.b8_t096_question_disposition_events enable row level security',
  'revoke all on public.b8_t096_question_disposition_events from public,anon,authenticated',
  'grant execute on function public.jb_b8_t096_owner_record_question_disposition'
 ]);
});
test('T096-08 closure cannot silently erase unanswered questions or avoid real scoped receipt',()=>{
 includesAll(sql,[
  "p_case_state='closed' and p_receipt_id is null",
  'B8_G5_CLOSE_REQUIRES_PRIVATE_BYTES_RECEIPT',
  'B8_T096_UNRESOLVED_QUESTION_DISPOSITION_REQUIRED',
  'select 1 from public.b8_question_drafts q where q.case_id=p_case_id',
  'select 1 from public.b8_t096_question_disposition_events d',
  'd.case_id=p_case_id and d.question_id=q.id',
  "'CLOSED_WITH_REASONS' else 'MONITORING'"
 ]);
});
test('T096-09 closure remains private attribution, not an official outcome or Court finding',()=>{
 includesAll(sql,[
  "insert into public.b8_g5_fact_events",
  "values(p_case_id,'OUTCOME',v_code,p_reason,p_receipt_id,auth.uid())",
  'update public.b8_cases set case_state=p_case_state'
 ]);
 includesAll(html,[
  'मामले का संपादकीय निष्कर्ष (अदालत का निर्णय नहीं)',
  'जवाब नहीं मिला — निगरानी जारी (दावा)',
  'जवाब दर्ज होने का दावा (निजी बाइट रसीद जरूरी)'
 ]);
});
test('T096-10 re-open needs different genuine same-case private receipt and CLOSED state',()=>{
 includesAll(sql,[
  "v_state<>'closed'",'B8_G5_CLOSED_CASE_REQUIRED',
  'B8_G5_REOPEN_REQUIRES_SAME_CASE_BYTES',
  'p_new_material_receipt_id',
  "e.kind in('OUTCOME','REOPEN')",
  'B8_G5_REOPEN_RECEIPT_ALREADY_USED',
  "'REOPEN','NEW_MATERIAL_EVIDENCE'",
  "update public.b8_cases set case_state='investigating'"
 ]);
});
test('T096-11 atomic HIDE of former public CLOSED state, never silent stale republication',()=>{
 includesAll(sql,[
  "where case_id=p_case_id order by revision_no desc limit 1",
  "in ('PUBLISH','REVISE')",
  "p_case_id,'HIDE',null,null,null,false"
 ]);
 includesAll(g4,["if p_action='HIDE'","B8_G4_NOT_PUBLIC_TO_HIDE","b8_g4_revisions_immutable"]);
});
test('T096-12 private chronological originals and corrections cannot overwrite history',()=>{
 includesAll(hist,[
  'create table public.b8_g7_history_events',
  'prior_event_id bigint references public.b8_g7_history_events',
  "'SUMMARY_DRAFT','SUMMARY_CORRECTION','EVIDENCE_VERSION'",
  "truth text not null default 'FOUNDER_ATTRIBUTED_UNVERIFIED'",
  'B8_G7_HISTORY_APPEND_ONLY',
  'B8_G7_SUMMARY_ORIGINAL_REQUIRED',
  'B8_G7_PRIOR_CROSS_CASE_DENIED'
 ]);
});
test('T096-13 safe public timeline cannot expose arbitrary narrative or fake official dispatch',()=>{
 includesAll(g4,[
  "'FOLLOWUP_ARTICLE_LINKED'",
  "p_event_code='QUESTION_DRAFT_PREPARED'",
  "B8_G4_NO_REAL_OFFICIAL_DISPATCH_PROOF",
  'B8_G4_FOUNDER_PRIVACY_ATTESTATION_REQUIRED'
 ]);
});
test('T096-14 original isolated real PG17 regression protects Article UUID/title and bad duplicate Master',()=>{
 includesAll(pg17,[
  'T096_SAME_ARTICLE_TWO_MASTER_CASES_ALLOWED',
  'T096_OLD_ARTICLE_ID_CONTENT_MUTATED',
  "select version::text from public.articles",
  "select title from public.articles",
  'T096_FALSE_CLOSURE_ALLOWED',
  'T096_REOPEN_PUBLIC_STALE_OR_OLD_OUTCOME_LOST',
  "v_last_action<>'HIDE'", 'rollback;'
 ]);
 assert(pg17.includes('T096 isolated')||pg17.includes('T096 synthetic'));
});
test('T096-15 product Android Founder screen retains 15-min lock, retry fail-closed and private read',()=>{
 includesAll(html,[
  'id="g5QuestionDisposition"','id="g5Outcome"','id="g5Reopen"',
  'id="g5Ledger"', 'id="g7HistoryRead"'
 ]);
 includesAll(ui,[
  'LOCK_MS=15*60*1000',
  "form('g5QuestionDisposition',async()=>{",
  "form('g5Outcome',async()=>{",
  "form('g5Reopen',async()=>{",
  "form('g7HistoryRead',async()=>{"
 ]);
 includesAll(android,['T096 Founder disposition stays unverified','T096 reporter/editor cannot use Founder AAL2 disposition']);
});
test('T096-16 no private byte receipt or prepared email is falsely promoted to real E9 truth',()=>{
 includesAll(doc,[
  'T096_ORIGINAL_CURRENT_ARTICLE_E4=NOT_RUN',
  'T096_REAL_FOUNDER_MULTI_ARTICLE_AND_OUTCOME_E5=NOT_RUN',
  'T096_AUTHENTIC_EXTERNAL_FACT_OR_MATERIAL_E9=NOT_RUN',
  'T096_OFFICIAL_FINAL_PASS_LOCK=HOLD'
 ]);
 assert(!doc.includes('T096_OFFICIAL_FINAL_PASS_LOCK=PASS'));
 assert(!doc.includes('T096_ORIGINAL_CURRENT_ARTICLE_E4=PASS'));
});
