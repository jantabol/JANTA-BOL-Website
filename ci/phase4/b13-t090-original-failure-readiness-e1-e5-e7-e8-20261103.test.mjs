// P4-T090 Sections805-818: exact original signed-gate evidence accounting.
// This suite DOES NOT mark E5/E8 or FULL ORIGINAL T089/T090 PASS.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const root='JANTA_BOL_PHASE_4_WORKING/';
const ledger=JSON.parse(fs.readFileSync(root+'review/P4_T090_109_OFFICIAL_UNRESOLVED_EVIDENCE_GATE_20261103.json','utf8'));
const idx=JSON.parse(fs.readFileSync(root+'review/P4_T089_OFFICIAL_E7_REGISTER_EVIDENCE_INDEX_20261102.json','utf8'));
const data=fs.readFileSync(root+'TEST-REGISTER.md','utf8');
const rows=[...data.matchAll(/^\|\s*(P4-T\d{3})\s*\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|/gm)].map(x=>({id:x[1],block:x[4].trim(),status:x[5].trim()}));
const byId=new Map(rows.map(x=>[x.id,x]));
const original=new Map(idx.records.map(x=>[x.id,x.official_register_status]));
test('T090-E1-01 all 109 unique original tests preserved with true exact statuses, 14 unique blocks',()=>{
 assert.equal(rows.length,109);
 assert.equal(ledger.official_states.length,109);
 assert.deepEqual(rows.map(x=>x.id),Array.from({length:109},(_,i)=>'P4-T'+String(i+1).padStart(3,'0')));
 assert.equal(new Set(rows.map(x=>x.block)).size,14);
 assert.equal(new Set(rows.map(x=>x.id)).size,109);
 for(let i=0;i<109;i++){
  assert.equal(ledger.official_states[i].id,rows[i].id);
  assert.equal(ledger.official_states[i].block,rows[i].block);
  assert.equal(ledger.official_states[i].status,rows[i].status);
  assert.equal(ledger.official_states[i].source_original_status,original.get(rows[i].id));
 }
});
test('T090-E7-02 old master statuses immutable except declared scoped T089 and newly started T090',()=>{
 const changed=rows.filter(x=>x.status!==original.get(x.id)).map(x=>x.id);
 assert.deepEqual(changed,['P4-T089','P4-T090']);
 assert.match(byId.get('P4-T089').status,/^SCOPED PASS\+LOCK.*ORIGINAL FINAL PASS\+LOCK HOLD/);
 assert.match(byId.get('P4-T090').status,/^IN PROGRESS.*ORIGINAL FINAL PASS\+LOCK HOLD/);
 assert.equal(byId.get('P4-T091').status,'NOT RUN — FINAL');
 assert.equal(rows.filter(x=>x.status.startsWith('NOT RUN')).length,65);
 assert.equal(rows.filter(x=>x.status.startsWith('IN PROGRESS')).length,15); // 15 initial incl T089, T089 scoped locks (-1), T090 starts (+1)
 assert.equal(idx.counts.not_run,67);
 assert.equal(ledger.counts.source_snapshot_initial_not_run,67);
});
test('T090-E1-03 two real P1 RED/RCA/MINIMUM/RETEST cases have independent live SHA and old regression CI source references',()=>{
 assert.equal(ledger.repaired_cases.length,2);
 assert.deepEqual(ledger.repaired_cases.map(x=>x.case),['P1-PUBLIC-LEGACY-INDEX','P1-LEGACY-GRIEVANCE-FSM']);
 const prod=ledger.live_snapshot;
 assert.equal(prod.vercel_ready,true);
 assert.equal(prod.github_sha,'60970abdacf560815b9db3bd819eb467ef984616');
 assert.equal(prod.deployment,'dpl_7YhVGAh758YvZq6HmteERdyCKtMb');
 assert.equal(prod.root_http_200_canonical,true);
 assert.equal(prod.direct_index_http_200_canonical,true);
 assert.equal(prod.grievance_ui_js_rpc,true);
 for(const row of ledger.repaired_cases){
  for(const key of ['red','rca','min_safe_fix','green'])assert.ok(row[key]?.length>30,'MISSING_RCA_EVIDENCE_'+row.case+'_'+key);
  assert.equal(row.merge_sha,prod.github_sha);
 }
 assert.equal(prod.actual_browser_article_render_not_verified,true);
});
test('T090-E7-04 every remaining high-risk E5/E8 and original semantic due has reason, owner dependency and no fake PASS',()=>{
 assert.deepEqual(ledger.critical_due.map(x=>x.id),['DUE-T087','DUE-T088','DUE-T089','DUE-T090-E5','DUE-T090-E8','DUE-T090-AD-METRIC-LEGACY']);
 for(const x of ledger.critical_due){assert.ok(x.test&&x.why_due?.length>25&&x.dependency?.length>30);}
 assert.equal(ledger.official_test_gate,'T090_FULL_FINAL_HOLD_UNTIL_E1_E5_E7_E8_AND_REQUIRED_ALL_REGRESSIONS_GREEN');
 assert.equal(ledger.status,'IN_PROGRESS_FULL_FINAL_HOLD');
});
test('T090-E5-05 real signed E5 and full independent E8 cannot be inferred from source/preview/HTTP smoke',()=>{
 assert.equal(ledger.live_snapshot.full_owner_e2_e5_negative_not_executed,true);
 assert.equal(ledger.live_snapshot.actual_browser_article_render_not_verified,true);
 assert.equal(ledger.critical_due.some(x=>x.id==='DUE-T088'),true);
 assert.equal(ledger.critical_due.some(x=>x.id==='DUE-T090-E8'),true);
 assert.equal(ledger.official_test_gate.includes('E5_E7_E8'),true);
});
test('T090-E7-06 security advisor warnings are evidence for future triage, NOT proven exploits or automatic user-paid upgrades',()=>{
 const adv=ledger.current_supabase_security_advisors;
 assert.equal(adv.security_definer_anon_executable.level,'WARN');
 assert.equal(adv.security_definer_anon_executable.count,23);
 assert.equal(adv.security_definer_authenticated_executable.count,118);
 assert.equal(adv.rls_enabled_no_policy.level,'INFO');
 assert.equal(adv.rls_enabled_no_policy.count,43);
 assert.equal(adv.leaked_password_protection.enabled,false);
 assert.match(adv.scope,/NOT_PROOF_OF_VULNERABILITY/);
 assert.equal(ledger.external_paid_service_started,false);
});
test('T090-E5-08 real anon 11-table privilege snapshot is scoped, not signed hosted E5 or E8',()=>{
 const p=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PUBLIC_ANON_RLS_AND_DEFINER_SCOPED_20261103.json','utf8'));
 assert.equal(p.sensitive_table_role_snapshot.length,11);
 assert.ok(p.sensitive_table_role_snapshot.every(x=>x.rls_on&&!x.anon_select&&!x.anon_update));
 assert.equal(p.anon_definer_routine_count,23);
 assert.equal(p.anon_definer_mutation_text_signals,6);
 assert.equal(p.actual_signed_owner_reporter_e5_verified,false);
 assert.equal(p.independent_full_e8_backup_restore_verified,false);
});
test('T090-E5-09 actual 6/6 public anon HTTPS completed CI 41615897511 but original full signed E5/E8 unproved',()=>{
 const proof=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PUBLIC_ANON_RLS_AND_DEFINER_SCOPED_20261103.json','utf8'));
 assert.equal(proof.production_negative_https_ci_status,'PASS_SCOPED_REAL_PUBLIC_KEY_NO_USER_JWT_RUN_41615897511');
 assert.equal(proof.http_test_count_passed,6);
 assert.equal(proof.private_dataapi_anon_select_denied_tables,11);
 assert.equal(proof.public_c1_rpc_publishable_key_http_200,true);
 assert.equal(proof.actual_signed_owner_reporter_e5_verified,false);
 assert.equal(proof.independent_full_e8_backup_restore_verified,false);
 assert.equal(proof.original_t090_final,'HOLD');
});
test('T090-E8-10 original Nov02 real joint restore and Nov03 independent count scope explicitly HOLD beyond PG17',()=>{
 const e=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_E8_REAL_JOINT_BACKUP_20261102_TO_LIVE_COUNTS_20261103.json','utf8'));
 assert.equal(e.source_run.run_id,41444146576);
 assert.deepEqual(e.backup_clone_sql_row_counts,e.live_read_only_counts_20261103);
 assert.equal(e.evidence_from_real_job_logs.disposable_pg17_restored,true);
 assert.equal(e.evidence_from_real_job_logs.real_auth_gotrue_server_rebuilt,false);
 assert.equal(e.evidence_from_real_job_logs.storage_file_bytes_restored_into_actual_supabase_storage_runtime,false);
 assert.equal(e.original_T090_full_e1_e5_e7_e8,'HOLD');
});
test('T090-E7-11 actual production immutable 18 critical asset / two duplicate anon AdEvent RPC E7 evidence stays scoped and honest',()=>{
 const a=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PRODUCTION_18_CRITICAL_ASSET_BYTE_PARITY_AND_AD_RPC_DUPLICATE_20261103.json','utf8'));
 assert.equal(a.exact_verified_by_connected_readonly_git_and_vercel_pairs_20261103.length,18);
 assert.equal(a.all_32_js_and_32_html_proven,false);
 assert.equal(a.anon_public_ad_duplicate.current_canonical_js_files_scanned,32);
 assert.equal(a.anon_public_ad_duplicate.current_canonical_js_has_direct_legacy_rpc_call,false);
 assert.equal(a.anon_public_ad_duplicate.both_security_definer,true);
 assert.equal(a.anon_public_ad_duplicate.both_anon_executable,true);
 assert.equal(a.original_full_T090,'HOLD');
});
test('T090-E7-12 full 64 hosted asset byte-parity planned without upgrading signed E5/E8 or semantic 1-339',()=>{
 const p=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_ALL_64_CANONICAL_ASSETS_LIVE_BYTE_PARITY_20261103.json','utf8'));
 assert.equal(p.expected_total,64);
 assert.equal(p.html_count,32);
 assert.equal(p.js_count,32);
 assert.equal(p.source_prod_sha,'60970abdacf560815b9db3bd819eb467ef984616');
 assert.equal(p.semantic_requirements_1_339_proven,false);
 assert.equal(p.signed_owner_reporter_E5_run,false);
 assert.equal(p.full_independent_E8_hosted_runtime_restored,false);
 assert.equal(p.original_t090_final_pass_lock,'HOLD');
});
test('T090-E7-13 exact original hosted all-64 static byte parity green without inventing E5 E8 or semantic implementation proof',()=>{
 const p=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_ALL_64_CANONICAL_ASSETS_LIVE_BYTE_PARITY_20261103.json','utf8'));
 assert.equal(p.all64_exact_byte_parity_proven,true);
 assert.equal(p.actual_all64_https_ci.run_id,41624965471);
 assert.equal(p.actual_all64_https_ci.conclusion,'success');
 assert.equal(p.actual_all64_https_ci.exact_full_64_byte_match,true);
 assert.equal(p.actual_all64_https_ci.actual_hosted_32_html_verified,true);
 assert.equal(p.actual_all64_https_ci.actual_hosted_32_js_verified,true);
 assert.equal(p.semantic_requirements_1_339_proven,false);
 assert.equal(p.signed_owner_reporter_E5_run,false);
 assert.equal(p.full_independent_E8_hosted_runtime_restored,false);
 assert.equal(p.original_t090_final_pass_lock,'HOLD');
});
test('T090-E5-E7-14 live 15 Edge source authority has true 18 files and five no-JWT entrypoints scoped, NOT full E5/E8',()=>{
 const p=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json','utf8'));
 assert.equal(p.functions_active,15);
 assert.equal(p.live_files_compared,18);
 assert.equal(p.tracked_functions,10);
 assert.equal(p.review_only_archived_functions,5);
 assert.equal(p.verify_jwt_false_functions.length,5);
 assert.equal(p.current_T087_signed_E5,'HOLD');
 assert.equal(p.current_T088_full_E8,'HOLD');
 assert.equal(p.current_T090_full_final,'HOLD');
});
test('T090-E5-E7-15 exact real Edge 15/18 source and five no-JWT negative scoped proof GREEN but no signed E5/E8',()=>{
 const p=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json','utf8'));
 assert.equal(p.functions_active,15);
 assert.equal(p.live_files_compared,18);
 assert.equal(p.source_git_blob_integrity_CI.run_id,41628751442);
 assert.equal(p.source_git_blob_integrity_CI.conclusion,'success');
 assert.equal(p.public_https_no_token_negative_CI.run_id,41628751442);
 assert.equal(p.public_https_no_token_negative_CI.conclusion,'success');
 assert.equal(p.public_https_no_token_negative_CI.tests_passed,7);
 assert.equal(p.public_https_no_token_negative_CI.real_privileged_role_test_performed,false);
 assert.equal(p.scoped_verdicts.signed_owner_reporter,'HOLD');
 assert.equal(p.scoped_verdicts.full_independent_disaster_rebuild,'HOLD');
 assert.equal(p.current_T090_full_final,'HOLD');
});
test('T090-E1-07 no source/News/Auth/Database/Backup/Edge modifications for independent T090 audit',()=>{
 const base='c813490ac36bba2e1958eb8f62f55168a71c68ce';
 const diff=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort();
 assert.deepEqual(diff,[
  root+'TEST-REGISTER.md',root+'CODE-MAP.md',root+'DEBUG-MAP.md',root+'CHANGELOG.md',
  root+'review/P4_T089_RUN15_E1_E7_COVERAGE_AUDIT_START_20261102.md',
  'ci/phase4/b13-t089-e7-official-records-coverage.test.mjs',
  root+'review/P4_T090_E1_E5_E7_E8_FAIL_RCA_DUE_GATE_START_20261103.md',
  root+'review/P4_T090_E5_REAL_RLS_ROLE_GRANTS_AND_AD_RISK_READONLY_20261103.md',
  root+'review/P4_T090_109_OFFICIAL_UNRESOLVED_EVIDENCE_GATE_20261103.json',
  'ci/phase4/b13-t090-original-failure-readiness-e1-e5-e7-e8-20261103.test.mjs',
  'JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PUBLIC_ANON_RLS_AND_DEFINER_SCOPED_20261103.json',
  'ci/phase4/b13-t090-live-anon-private-access-denial.test.mjs',
  'JANTA_BOL_PHASE_4_WORKING/review/P4_T090_E8_REAL_JOINT_BACKUP_20261102_TO_LIVE_COUNTS_20261103.json',
  'ci/phase4/b13-t090-e8-real-backup-independent-history-and-current-live-counts.test.mjs',
  'JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PRODUCTION_18_CRITICAL_ASSET_BYTE_PARITY_AND_AD_RPC_DUPLICATE_20261103.json',
  'ci/phase4/b13-t090-production-source-e7-18-file-parity-20261103.test.mjs',
  'JANTA_BOL_PHASE_4_WORKING/review/P4_T090_ALL_64_CANONICAL_ASSETS_LIVE_BYTE_PARITY_20261103.json',
  'ci/phase4/b13-t090-all64-live-deployment-git-byte-parity-20261103.test.mjs',
  'JANTA_BOL_PHASE_4_WORKING/review/P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json',
  'ci/phase4/b13-t090-live-edge15-source-and-5-no-jwt-negative-20261103.test.mjs',
  'ci/phase4/b13-t090-live-edge10-jwt-required-no-auth-denials-20261103.test.mjs',
  'ci/phase4/b13-t090-live-edge10-forged-bearer-negatives-20261103.test.mjs',
  'ci/phase4/b13-t090-synthetic-role-rls-no-publish-leak-20261103.test.mjs',
  'ci/phase4/b13-t090-existing-identity-session-rls-sql-scoped-20261103.test.mjs',
  'ci/phase4/b13-t090-live-http-forged-owner-reporter-postgrest-gotrue-negative-20261103.test.mjs',
  root+'review/P4_T090_E5_EXISTING_OWNER_REPORTER_SESSION_RLS_SQL_20261103.json',
  'ci/phase4/b13-t090-build-verified-prod64-static-archive-20261103.py',
  root+'review/P4_T090_E5_SYNTHETIC_AUTHENTICATED_RLS_REAL_DB_READONLY_20261103.json',
  '.github/workflows/b13-t090-failure-readiness-original-evidence-20261103.yml'
 ].sort());
 assert.ok(diff.every(x=>x.startsWith(root)||x.startsWith('ci/phase4/')||x.startsWith('.github/workflows/')));
 assert.equal(ledger.source_product_auth_db_mutation_by_this_t090_commit,false);
});
console.log('T090_ORIGINAL_109_REGISTER_STATUS_ACCOUNTING=PASS_SCOPED');
console.log('T090_P1_FAIL_RCA_SAFE_FIX_EXACT_RETEST=PASS_SCOPED');
console.log('T090_E5_SIGNED_NEGATIVE_AND_E8_FULL_RESTORE=HOLD');
console.log('T090_FULL_FINAL_PASS_LOCK=HOLD');
