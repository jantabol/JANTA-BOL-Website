// T090 E5 scoped evidence integrity: live SQL read-only fake-role RLS tests recorded on 2026-11-03.
// Does NOT run SQL with privileged CI credentials, use any real JWT, or prove true signed E5.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file='JANTA_BOL_PHASE_4_WORKING/review/P4_T090_E5_SYNTHETIC_AUTHENTICATED_RLS_REAL_DB_READONLY_20261103.json';
const p=JSON.parse(fs.readFileSync(file,'utf8'));
test('T090-SQL-E5-01 exact real read-only transaction protocol, no actual accounts or production writes',()=>{
 assert.equal(p.project,'vrffsnkycvjithwtiylt');
 assert.equal(p.scope,'LIVE_READONLY_AUTHENTICATED_DB_ROLE_FAKE_CLAIMS_NEGATIVE_ONLY');
 assert.match(p.statement,/BEGIN READ ONLY/);
 assert.match(p.statement,/SET LOCAL ROLE authenticated/);
 assert.match(p.statement,/ROLLBACK/);
 assert.equal(p.rollback_executed_after_each_scenario,true);
 for(const k of ['production_data_mutated','real_user_ids_or_sessions_used','actual_signed_jwt_verified','actual_signed_owner_reporter_cross_account_test_run','private_record_rows_or_secrets_extracted'])assert.equal(p[k],false,k);
});
test('T090-SQL-E5-02 both synthetic Owner AAL2 and Reporter AAL1 denied all privileged predicates and private rows',()=>{
 assert.equal(p.scenario_results.length,2);
 assert.deepEqual(p.scenario_results.map(x=>x.scenario),['FAKE_OWNER_AAL2_WITH_TOTP_CLAIM','FAKE_REPORTER_AAL1']);
 assert.equal(p.backend_privileged_admin_visibility_preflight.grievances_have_at_least_one_record,true);
 assert.equal(p.backend_privileged_admin_visibility_preflight.nonpublished_articles_exist,true);
 for(const x of p.scenario_results){
  assert.equal(x.db_role,'authenticated');
  assert.equal(x.user_id_kind,'SYNTHETIC_NOT_A_REAL_USER');
  assert.equal(x.session_id_kind,'SYNTHETIC_NOT_A_REAL_SESSION');
  for(const k of ['backend_role_found','current_session_active','owner_aal2_pass','owner_recent_mfa_pass','staff_allowed','owner_allowed'])assert.equal(x[k],false,'PRIVILEGED_GATE_FALSE_'+k);
  for(const k of ['visible_grievance_rows','visible_user_roles','visible_nonpublished_articles'])assert.equal(x[k],0,'PRIVATE_DATA_NOT_VISIBLE_'+k);
  assert.equal(x.visible_published_articles,p.backend_privileged_admin_visibility_preflight.published_article_count_at_observation);
 }
});
test('T090-SQL-E5-03 signed Owner Reporter and true platform disaster recovery remain original HOLD',()=>{
 assert.equal(p.verdict_scoped,'PASS_SCOPED_REAL_LIVE_SQL_FAKE_ROLE_RLS_NEGATIVES');
 assert.equal(p.actual_signed_owner_reporter_cross_account_test_run,false);
 assert.equal(p.t087_full_signed_e5,'HOLD');
 assert.equal(p.t088_original_real_e8,'HOLD');
 assert.equal(p.t089_original_full_e7,'HOLD');
 assert.equal(p.t090_original_final_pass_lock,'HOLD');
 assert.equal(p.t091_started,false);
 assert.ok(p.limitations.length>=4);
});
console.log('T090_LIVE_READONLY_FAKE_OWNER_AND_REPORTER_RLS_DENIAL=PASS_SCOPED');
console.log('T090_GENUINE_SIGNED_CROSS_ACCOUNT_E5_AND_FULL_E8=HOLD');
