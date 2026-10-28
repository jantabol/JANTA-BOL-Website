import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessExistingBackupReuse} from './t070-g18-legacy-backup-reuse-gate.mjs';
const p='ci/phase4/b11/t070-g18-legacy-backup-drift-observed.json';
const e=JSON.parse(readFileSync(p,'utf8'));
test('G18 authentic DB-only + all-five-media-only GitHub PASS run identities match',()=>{
 const r=assessExistingBackupReuse(e);
 assert.equal(r.checks.correct_source,true);
 assert.equal(r.checks.two_real_run_ids,true);
 assert.equal(r.checks.source_before_media,true);
 assert.equal(r.checks.actual_db_component,true);
 assert.equal(r.checks.actual_media_component,true);
});
test('G18 all eleven live source families checked, two empty classes not invented',()=>{
 const r=assessExistingBackupReuse(e);
 assert.equal(r.checks.all_family_rows_current,true);
 const m=Object.fromEntries(e.source_metadata_rowcounts_and_updated_since_db_start.map(x=>[x.family,x]));
 assert.equal(m.live_updates.count,0);
 assert.equal(m.ad_payments.count,0);
 assert.equal(m.storage_metadata.count,5);
 assert.equal(m.articles.count,32);
});
test('G18 source timestamps stable for ten app/media tables but cannot assert historical binary sameness',()=>{
 assert.equal(assessExistingBackupReuse(e).checks.no_app_timestamp_drift,true);
 assert.equal(e.unchanged_timestamp_does_not_prove_unchanged_data,true);
 assert.equal(e.original_5_file_bytes_verified_with_db_archive,false);
});
test('G18 real auth login happened AFTER both backups, not between them; not exact identity parity',()=>{
 assert.equal(assessExistingBackupReuse(e).checks.auth_signin_churn_observed,true);
 assert.equal(assessExistingBackupReuse(e).checks.auth_drift_outside_inter_run_gap,true);
 assert.equal(e.auth_followup.users_updated_between_db_and_media_runs,0);
 assert.equal(e.auth_followup.auth_sessions_created_between_db_and_media_runs,0);
 assert.equal(e.auth_followup.users_updated_after_media_start,1);
 assert.equal(e.auth_followup.new_auth_sessions_since_db_start,1);
 assert.equal(e.auth_followup.identity_or_permission_mutation_proven,false);
 assert.equal(assessExistingBackupReuse(e).auth_session_equivalence_proven,false);
});
test('G18 any missing family, changed article, mismatched source, or fake backup blocks reuse preflight',()=>{
 const mutations=[
  x=>x.source_project='hriakdazkcvplsdwgfle',
  x=>x.source_metadata_rowcounts_and_updated_since_db_start.pop(),
  x=>x.source_metadata_rowcounts_and_updated_since_db_start.find(f=>f.family==='articles').changed=1,
  x=>x.database_backup.github_conclusion='failure',
  x=>x.auth_followup.users_updated_between_db_and_media_runs=1
 ];
 for(const change of mutations){const x=structuredClone(e);change(x);assert.equal(assessExistingBackupReuse(x).status,'HOLD_UNVERIFIED_COMPONENTS');}
});
test('G18 even perfect legacy timestamp preflight never authorizes real T070 or T071',()=>{
 const r=assessExistingBackupReuse(e);
 assert.equal(r.status,'SOURCE_TIMESTAMP_COMPATIBILITY_ONLY');
 assert.equal(r.original_archives_combined_restore_proven,false);
 assert.equal(r.exact_single_trusted_recovery_point_proven,false);
 assert.equal(r.real_e8_independent_audit_complete,false);
 assert.equal(r.t070_final_lock,false);
 assert.equal(r.can_start_t071,false);
});
