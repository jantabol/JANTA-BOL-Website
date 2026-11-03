// T090 evidence integrity for LIVE SQL role context using REAL existing identities and sessions.
// SQL snapshots are NOT a signed GoTrue/HTTPS JWT test and never prove true E5 full signoff.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file='JANTA_BOL_PHASE_4_WORKING/review/P4_T090_E5_EXISTING_OWNER_REPORTER_SESSION_RLS_SQL_20261103.json';
const e=JSON.parse(fs.readFileSync(file,'utf8'));
const by=new Map(e.scenarios.map(x=>[x.scenario,x]));
test('T090-EXIST-01 real current DB read-only RLS SQL scope, without credentials or real signed JWT',()=>{
 assert.equal(e.exact_real_live_db,true);
 for(const fragment of ['BEGIN READ ONLY','auth.sessions','SET LOCAL ROLE authenticated','ROLLBACK'])assert.ok(e.method.includes(fragment),fragment);
 for(const k of ['verified_http_jwt_signature','verified_real_issued_owner_jwt','verified_real_issued_reporter_jwt','verified_revoked_real_jwt','credentials_or_session_ids_logged','real_production_database_write_performed'])assert.equal(e[k],false,k);
 assert.equal(e.scenarios.length,4);
 assert.equal(new Set(e.scenarios.map(x=>x.scenario)).size,4);
});
test('T090-EXIST-02 reporter with spoofed Owner AAL2 claim cannot see Owner/private rows',()=>{
 const x=by.get('ACTIVE_REAL_REPORTER_SESSION_SPOOF_OWNER_AAL2');
 assert.equal(x.db_role,'authenticated');
 assert.equal(x.real_db_role,'reporter');
 assert.equal(x.session_exists,true);
 assert.equal(x.owner_aal2_guard,false);
 assert.equal(x.p4_owner_allowed,false);
 assert.equal(x.staff_allowed,false);
 for(const key of ['visible_grievances','visible_live_sessions','visible_nonpublished_articles']) assert.equal(x[key],0);
 assert.equal(x.visible_role_rows,1);
});
test('T090-EXIST-03 Owner genuine existing session AAL1 blocks Owner; simulated AAL2 positive-control exposes correct scoped data',()=>{
 const low=by.get('ACTIVE_REAL_OWNER_SESSION_AAL1');
 const high=by.get('ACTIVE_REAL_OWNER_SESSION_SIMULATED_AAL2');
 for(const x of [low,high]){
  assert.equal(x.real_db_role,'owner');
  assert.equal(x.session_exists,true);
 }
 assert.equal(low.owner_aal2_guard,false);
 assert.equal(low.p4_owner_allowed,false);
 for(const key of ['visible_grievances','visible_live_sessions','visible_nonpublished_articles'])assert.equal(low[key],0,key);
 assert.equal(high.owner_aal2_guard,true);
 assert.equal(high.p4_owner_allowed,true);
 for(const key of ['visible_grievances','visible_live_sessions','visible_nonpublished_articles'])assert.ok(high[key]>0,'MISSING_POSITIVE_CONTROL_'+key);
 assert.ok(high.visible_role_rows>1);
});
test('T090-EXIST-04 missing Owner session denies Owner sensitive data; self role RLS exception precisely flagged',()=>{
 const x=by.get('REAL_OWNER_ID_NONEXISTENT_SESSION_SIMULATED_AAL2');
 assert.equal(x.session_exists,false);
 assert.equal(x.owner_aal2_guard,false);
 assert.equal(x.p4_owner_allowed,false);
 for(const key of ['visible_grievances','visible_live_sessions','visible_nonpublished_articles'])assert.equal(x[key],0);
 assert.equal(x.visible_role_rows,1);
 assert.equal(e.finding.severity,'P2_REVIEW');
 assert.equal(e.finding.key,'USER_ROLES_SELF_READ_MISSING_SESSION_GUARD');
 assert.equal(e.finding.production_policy_changed,false);
 assert.match(e.finding.not_proven,/No actual revoked hosted JWT/);
});
test('T090-EXIST-05 original signed E5, full E7, hosted E8 and final lock remain HOLD',()=>{
 assert.equal(e.e5_sql_existing_identity_session_scoped,'PASS+LOCK_SCOPED');
 assert.equal(e.e5_signed_cross_user_https,'HOLD');
 assert.equal(e.e8_full_hosted_restore,'HOLD');
 assert.equal(e.e7_full_semantic_1034,'HOLD');
 assert.equal(e.original_t090_final,'HOLD');
 assert.equal(e.original_t091_started,false);
});
console.log('T090_EXISTING_LIVE_OWNER_REPORTER_RLS_SQL=PASS_LOCK_SCOPED_ONLY');
console.log('T090_TRUE_SIGNED_E5_FULL_E7_E8_AND_FINAL=HOLD');
