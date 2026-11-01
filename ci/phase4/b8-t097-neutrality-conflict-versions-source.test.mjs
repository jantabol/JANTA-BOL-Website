// Current-source P4-T097 original Topic13 ACC029–035; no live data modifications.
// Dated evidence and owner/mobile human E5 or third-party E9 cannot be replaced by static tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const r=(p)=>readFileSync(p,'utf8');
const blob=(p)=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
const db='JANTA_BOL_PHASE_4_WORKING/db/';
const vPath=db+'20261021_b8_t097_integrity_versioned_paging_REVIEW_ONLY.sql';
const g5Path=db+'20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql';
const retryPath=db+'20261021_b8_g5_no_exact_duplicate_fact_REVIEW_ONLY.sql';
const g6Path=db+'20261017_b8_g6_private_upload_release_gate_REVIEW_ONLY.sql';
const g4Path=db+'20261017_b8_g4_cp01_cp03_public_projection_REVIEW_ONLY.sql';
const g7Path=db+'20261017_b8_g7_accountability_chronology_REVIEW_ONLY.sql';
const pgPath='ci/phase4/b8-t097-neutral-integrity-paging-regression-v3.sql';
const clientPath='JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const htmlPath='JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html';
const uiPath='JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js';
const docPath='JANTA_BOL_PHASE_4_WORKING/review/P4_T097_NEUTRALITY_CONFLICT_PRIVATE_VERSIONING_BACKEND_20261101.md';
const v=r(vPath),g5=r(g5Path),retry=r(retryPath),g6=r(g6Path),g4=r(g4Path),
 g7=r(g7Path),pg=r(pgPath),client=r(clientPath),html=r(htmlPath),ui=r(uiPath),doc=r(docPath);
const all=(data,terms)=>terms.forEach(t=>assert(data.includes(t),'missing guard '+t));
test('T097-01 original official topic and evidence classes immutable, final run NOT RUN',()=>{
 const register=r('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
 const row=register.split('\n').find(x=>x.startsWith('| P4-T097 |'));
 assert(row?.includes('Neutral Evidence Standard + Conflict + Evidence Integrity + Versioning'));
 assert.match(row,/\| B8 \| NOT RUN \|$/);
 all(doc,['ACC029','ACC035','E2 + E5 + E7 + E9','T097_OFFICIAL_FINAL_PASS_LOCK=HOLD']);
});
test('T097-02 unchanged original G2–G7/backend; only exact scoped reviewed mobile blobs changed',()=>{
 const hashes={
  [vPath]:'0371733e65581c301d2ee479bc98a8613af90738',
  [g5Path]:'61b830ad2cfa1f705df22da32eb680a7e42cb450',
  [retryPath]:'ff9daad4d30ebf9c9e17da71a1de0898865398a7',
  [g6Path]:'e605e0d7fbe96ef7bc664924dd5bec69c4bbd410',
  [g4Path]:'1decf7e3a9cb9ad15e9c6665eb0e6e114d7ca44c',
  [g7Path]:'bed9504ca4f741d813172d6c64e20b572cf3e92b',
  [clientPath]:'bf9295b4a16f2434532ec0fe508fd15c7f531500',
  [htmlPath]:'903ccbf4f9da273540349dee44484ded76b5744e',
  [uiPath]:'8620dc304e733a70c9c4ce593b73992e2aa6a4b1'
 };
 for(const [p,sha] of Object.entries(hashes))assert.equal(blob(p),sha,'Protected product source modified: '+p);
});
test('T097-03 Founder and newsroom conflict flag is distinct factual category, not guilty verdict',()=>{
 all(g5,["kind='CONFLICT'","field_code='FLAG_RAISED'","if p_kind='CONFLICT'",'B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG']);
 all(html,['value="CONFLICT"','value="FLAG_RAISED"','हितों का टकराव']);
 assert(client.includes("CONFLICT:['FLAG_RAISED']"));
});
test('T097-04 already public case must HIDE before flag; unresolved flag forbids later public release',()=>{
 all(g5,["v_last_action<>'HIDE'",'B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG',
 'private.b8_g5_block_conflicted_public_revision',
 "new.action in('PUBLISH','REVISE')",
 'B8_G5_UNRESOLVED_CONFLICT_PUBLIC_DENIED','b8_g5_conflict_public_revision_gate']);
 all(g4, ["if p_action='HIDE'",'B8_G4_FOUNDER_PRIVACY_ATTESTATION_REQUIRED']);
});
test('T097-05 document originals and revisions are typed with immutable chain, no raw official verification',()=>{
 all(v,[
  'create table public.b8_t097_document_versions',
  "stage text not null check(stage in('ORIGINAL','REVISED'))",
  'version_no integer not null check(version_no>=1)',
  'previous_version_id bigint references public.b8_t097_document_versions',
  "'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED'",
  "check((stage='ORIGINAL' and version_no=1 and previous_version_id is null)",
  "(stage='REVISED' and version_no>1 and previous_version_id is not null)",
  'unique(case_id,document_key,version_no)',
  'unique(case_id,document_key,private_receipt_id)'
 ]);
});
test('T097-06 original-first, latest-only revision, new same-case receipt and immutable version',()=>{
 all(v,[
  'jb_b8_t097_owner_record_document_version',
  'private.current_owner_aal2()',
  'B8_OWNER_AAL2_REQUIRED',
  "where id=p_receipt_id and case_id=p_case_id",
  'B8_T097_SAME_CASE_RECEIPT_REQUIRED',
  "if p_stage is distinct from 'ORIGINAL'",
  'B8_T097_ORIGINAL_FIRST_REQUIRED',
  "if p_stage is distinct from 'REVISED'",
  'p_previous_version_id is distinct from v_previous.id',
  'p_receipt_id=v_previous.private_receipt_id',
  'B8_T097_REVISION_MUST_FOLLOW_LATEST_VERSION',
  'B8_T097_DOCUMENT_VERSION_IMMUTABLE'
 ]);
});
test('T097-07 raw document versions always remain private RLS with no direct anon/auth grants',()=>{
 all(v,[
  'alter table public.b8_t097_document_versions enable row level security',
  'revoke all on public.b8_t097_document_versions from public,anon,authenticated',
  'create trigger b8_t097_document_versions_immutable before update or delete',
  'revoke all on function public.jb_b8_t097_owner_record_document_version',
  'grant execute on function public.jb_b8_t097_owner_record_document_version'
 ]);
});
test('T097-08 fact and chronology pages are keyset, bounded per page but without global cap',()=>{
 all(v,[
  'jb_b8_t097_owner_fact_page',
  'jb_b8_t097_owner_history_page',
  'p_limit integer default 50',
  'p_limit>100',
  'B8_T097_PAGE_LIMIT_INVALID',
  'id<p_before_id',
  "'next_before_id'",
  "'has_more'",
  "'NOT_INDEPENDENTLY_VERIFIED'",
  "'FOUNDER_ATTRIBUTED_UNVERIFIED'"
 ]);
});
test('T097-09 no public or Reporter direct private page RPC; Owner AAL2 enforced',()=>{
 all(v,[
  'revoke all on function public.jb_b8_t097_owner_fact_page',
  'revoke all on function public.jb_b8_t097_owner_history_page',
  "if not coalesce(private.current_owner_aal2(),false)",
  'grant execute on function public.jb_b8_t097_owner_history_page'
 ]);
});
test('T097-10 Android Owner pagination uses 50-item pages, fail closed on forged labels/cursor',()=>{
 all(client,[
  'async ownerG5FactPage(', 'async ownerG7HistoryPage(', 'p_limit:50',
  'T097_CURSOR_INVALID', 'T097_UNTRUSTED_PRIVATE_FACT_PAGE',
  'T097_UNTRUSTED_PRIVATE_HISTORY_PAGE',
  "'NOT_INDEPENDENTLY_VERIFIED'",
  "'FOUNDER_ATTRIBUTED_UNVERIFIED'"
 ]);
 all(ui,["g5LedgerMore","g7HistoryMore",'LOCK_MS=15*60*1000',"node.textContent=JSON.stringify(value,null,2)"]);
 assert(!ui.includes('.innerHTML='));
});
test('T097-11 private evidence upload stays Founder-controlled OFF by default, not fake receipt',()=>{
 all(g6,[
  "enabled boolean not null default false",
  "values ('PRIVATE_EVIDENCE_UPLOAD',false)",
  'B8_G6_PRIVATE_UPLOAD_FOUNDER_RELEASE_DISABLED',
  'private.current_owner_aal2()'
 ]);
 all(v,[
  'p_receipt_id is null or not exists',
  'B8_T097_SAME_CASE_RECEIPT_REQUIRED'
 ]);
});
test('T097-12 source revision test uses two distinct synthetic receipts, cross-case fails',()=>{
 all(pg,[
  'T097_CROSS_CASE_RECEIPT_ACCEPTED',
  'T097_FORKED_OLD_OFFICIAL_VERSION',
  'T097_OLD_VERSION_MUTATED',
  'T097_EVIDENCE_VERSION_COUNT_WRONG',
  "'ORIGINAL'",
  "'REVISED'"
 ]);
 assert(pg.includes('Synthetic original document'));
 assert(pg.includes('Synthetic revised document'));
});
test('T097-13 real disposable PG17 fixture verifies 120 G5, 105 G7 across three keyset pages',()=>{
 all(pg,[
  'generate_series(1,119)',
  'generate_series(1,105)',
  'id_count<>120',
  'jsonb_array_length(all_events)<>120',
  'id_h_count<>105',
  'jsonb_array_length(all_history)<>105',
  'T097_LOST_120_EVIDENCE_ROWS_OR_BAD_CURSOR',
  'T097_LOST_105_TIMELINE_ROWS',
  'rollback;'
 ]);
});
test('T097-14 immutable G5 and G7 original versions remain source-protected',()=>{
 all(g5,['b8_g5_fact_events_immutable','B8_G5_IMMUTABLE_FACT_HISTORY']);
 all(g7,['b8_g7_history_append_only','B8_G7_HISTORY_APPEND_ONLY','FOUNDER_ATTRIBUTED_UNVERIFIED']);
 all(retry,['B8_G5_EXACT_DUPLICATE_NOT_APPENDED']);
});
test('T097-15 public safe projection never treats private bytes or raw allegations as public',()=>{
 all(g4,[
  "'PUBLISH','REVISE','HIDE'",
  'B8_G4_FOUNDER_PRIVACY_ATTESTATION_REQUIRED',
  'B8_G4_RESTRICTED_CASE_PUBLICATION_DENIED',
  'B8_G4_NO_REAL_OFFICIAL_DISPATCH_PROOF'
 ]);
 assert(doc.includes('Public G4 fixed safe projection'));
});
test('T097-16 historical missing mobile versioning repaired in source, E5 still not falsely passed',()=>{
 // Original baseline report remains immutable evidence that this form was absent.
 all(doc,['T097_REAL_MOBILE_VERSIONING_E5=BLOCKED_FRONTEND_MISSING',
 'T097_REAL_2026_INDEPENDENT_ORIGINAL_REVISED_BYTES_E9=NOT_RUN']);
 all(client,['async ownerRecordT097DocumentVersion(', 'jb_b8_t097_owner_record_document_version']);
 all(ui,["form('t097Version',async()=>{", "workflow.ownerRecordT097DocumentVersion("]);
 all(html,['id="t097Version"','id="t097VersionReceipt"','id="t097VersionConfirm"']);
 const patch=r('JANTA_BOL_PHASE_4_WORKING/review/P4_T097_ANDROID_VERSION_ENTRY_SCOPED_PATCH_20261101.md');
 all(patch,['T097_REAL_FOUNDER_ANDROID_E5=NOT_RUN',
 'T097_REAL_SAME_CASE_BYTE_RECEIPT_E9=NOT_RUN','T097_OFFICIAL_FINAL_PASS_LOCK=HOLD']);
});
test('T097-17 no neutral treatment, real agency/Founder cross-subject or real E9 falsely passed',()=>{
 all(doc,[
  'T097_REAL_FOUNDER_CROSS_SUBJECT_E5=NOT_RUN',
  'T097_REAL_PUBLIC_HTTP_PRIVACY_E5_E9=NOT_RUN',
  'T097_REAL_2026_INDEPENDENT_ORIGINAL_REVISED_BYTES_E9=NOT_RUN',
  'T097_OFFICIAL_FINAL_PASS_LOCK=HOLD'
 ]);
 assert(!doc.includes('T097_OFFICIAL_FINAL_PASS_LOCK=PASS'));
});
