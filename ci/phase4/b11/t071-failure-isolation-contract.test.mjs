import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FAULT_MATRIX,assessT071FailureMatrix,assessRpoRto,inspectReleaseSource}
 from './t071-failure-isolation-contract.mjs';
const SHA='a'.repeat(64);
const common=()=>({
 real_product_adapter_tested:true,isolated_fault_injected:true,
 actual_failure_logs_reviewed:true,protected_production_untouched:true,
 no_false_success:true,old_core_regression_green:true,
 source_sha256:SHA,log_evidence_sha256:SHA
});
const extras={
 CORE_CONTINUES:{article_read_remained_available:true,article_publish_business_action_preserved:true},
 COMMITTED_ACTION_STABLE:{business_commit_not_rolled_back:true,delivery_failure_audited:true},
 PRIVATE_ACTION_DENIED_ON_DEPENDENCY_FAILURE:{sensitive_write_denied:true,private_data_not_exposed:true},
 PAYMENT_AND_PUBLICATION_GUARD:{uncertain_payment_not_auto_active:true,ad_not_auto_published:true},
 PROTECTED_WRITE_FAILS_CLOSED:{protected_write_denied:true,audit_preserved:true},
 NO_FALSE_LIVE_STATE:{live_command_not_claimed_success:true,provider_retry_bounded:true},
 UNKNOWN_MUST_WAIT:{provider_unknown_explicit:true,no_provider_success_fabricated:true},
 AMBIGUOUS_MUST_NOT_GO_LIVE:{payment_unknown_not_promoted:true,no_duplicate_charge_or_action:true},
 NO_FALSE_COMMIT_SUCCESS:{db_failed_write_not_claimed_committed:true,safe_public_read_behavior_recorded:true}
};
const asserted=()=>Object.fromEntries(FAULT_MATRIX.map(x=>[x.name,{...common(),...extras[x.expect]}]));
test('master P4-T071 RECOV-019–026 covers 13 distinct real-failure destinations',()=>{
 assert.equal(FAULT_MATRIX.length,13);
 assert.equal(new Set(FAULT_MATRIX.map(x=>x.name)).size,13);
 for(const k of ['social','analytics','notifications','grievance','compliance','advertising','search',
 'accountability','live','provider','payments','messaging','database'])
  assert.ok(FAULT_MATRIX.some(x=>x.name===k));
});
test('real product failure execution absent: all 13 HOLD and release not authorized',()=>{
 for(const bad of [{},null,{social:{real_product_adapter_tested:'true'}},[],undefined]){
  const o=assessT071FailureMatrix(bad);
  assert.equal(o.status,'HOLD');assert.equal(o.missing.length,13);
  assert.equal(o.final_lock,false);assert.equal(o.soft_launch_release_authorized,false);
 }
});
for(const scenario of FAULT_MATRIX){
 test('missing independently-proven '+scenario.name+' failure must always HOLD',()=>{
  const e=asserted();
  delete e[scenario.name].isolated_fault_injected;
  const r=assessT071FailureMatrix(e);
  assert.ok(r.missing.includes(scenario.name));
  assert.equal(r.final_pass,false);assert.equal(r.final_lock,false);
 });
}
test('all-true forged input is only READY FOR INDEPENDENT REVIEW, never PASS',()=>{
 const r=assessT071FailureMatrix(asserted());
 assert.equal(r.status,'READY_FOR_INDEPENDENT_REAL_LOG_REVIEW');
 assert.equal(r.missing.length,0);
 assert.equal(r.matrix_complete,false);assert.equal(r.final_lock,false);
 assert.equal(r.soft_launch_release_authorized,false);
});
test('missing or malformed evidence digests do not authorize social failure proof',()=>{
 const x=asserted();x.social.log_evidence_sha256='a'.repeat(63);
 assert.ok(assessT071FailureMatrix(x).missing.includes('social'));
});
test('payment ambiguity cannot be disguised as successful public advertisement',()=>{
 const x=asserted();x.payments.payment_unknown_not_promoted=false;
 x.advertising.ad_not_auto_published=false;
 const r=assessT071FailureMatrix(x);
 assert.ok(r.missing.includes('payments'));assert.ok(r.missing.includes('advertising'));
});
test('messaging fault cannot remove proof that business action committed',()=>{
 const x=asserted();x.messaging.business_commit_not_rolled_back=false;
 const r=assessT071FailureMatrix(x);
 assert.ok(r.missing.includes('messaging'));
});
test('database unavailable must never emit a successful commit confirmation',()=>{
 const x=asserted();x.database.db_failed_write_not_claimed_committed=false;
 const r=assessT071FailureMatrix(x);
 assert.ok(r.missing.includes('database'));
});
test('unknown provider must result in explicit WAIT, not invented LIVE status',()=>{
 const x=asserted();x.provider.provider_unknown_explicit=false;
 x.live.live_command_not_claimed_success=false;
 const r=assessT071FailureMatrix(x);
 assert.ok(r.missing.includes('provider'));assert.ok(r.missing.includes('live'));
});
test('RPO/RTO are not workflow minutes or assumptions, missing actual incident evidence holds',()=>{
 for(const x of [{},null,{failure_at:'2026-10-27T12:00:00+05:30'},{
  failure_at:'2026-10-27T12:00:00+05:30',
  last_verified_recovery_point_at:'2026-10-27T11:45:00+05:30',
  real_service_restored_at:'2026-10-27T12:15:00+05:30'}]){
  const r=assessRpoRto(x);
  assert.equal(r.status,'HOLD');assert.equal(r.rto_ms,null);assert.equal(r.rpo_ms,null);
 }
});
test('synthetic RPO/RTO math is correct but target not invented (not product proof)',()=>{
 const input={failure_at:'2026-10-27T12:00:00+05:30',
  last_verified_recovery_point_at:'2026-10-27T11:45:00+05:30',
  real_service_restored_at:'2026-10-27T12:15:00+05:30',
  real_service_recovery_observed:true,same_system_source_and_restore:true,
  no_untracked_write_loss_proven:true,independent_measurement_reviewed:true};
 const r=assessRpoRto(input);
 assert.equal(r.status,'NO_APPROVED_RPO_RTO_TARGETS');
 assert.equal(r.rpo_ms,900000);assert.equal(r.rto_ms,900000);
 assert.equal(r.final_pass,false);
 const t=assessRpoRto({...input,rpo_target_ms:300000,rto_target_ms:1500000});
 assert.equal(t.target_comparison,'EXCEEDS_STATED_TARGETS');
 assert.equal(t.final_pass,false);
});
test('invalid restore-before-incident chronology or naive timestamp cannot produce RPO/RTO',()=>{
 const e={failure_at:'2026-10-27T12:00:00Z',
  last_verified_recovery_point_at:'2026-10-27T12:01:00Z',
  real_service_restored_at:'2026-10-27T12:02:00Z',
  real_service_recovery_observed:true,same_system_source_and_restore:true,
  no_untracked_write_loss_proven:true,independent_measurement_reviewed:true};
 assert.equal(assessRpoRto(e).status,'HOLD');
 assert.equal(assessRpoRto({...e,last_verified_recovery_point_at:'2026-10-27T11:45:00'}).status,'HOLD');
});
test('actual GitHub main static HTML contains editorial copy and LIVE badge needing release verification',()=>{
 const html=readFileSync('index.html','utf8');
 const js=readFileSync('script.js','utf8');
 const r=inspectReleaseSource(html,js);
 assert.equal(r.scope,'REPOSITORY_STATIC_FILES_ONLY_NOT_DEPLOYMENT');
 assert.equal(r.static_news_copy_present,true);
 assert.equal(r.static_live_badge,true);
 assert.equal(r.client_fetch_calls_detected,0);
 assert.equal(r.actual_vercel_source_mapping_verified,false);
 assert.equal(r.production_public_article_lifecycle_proven,false);
 assert.equal(r.status,'SOFT_LAUNCH_EDITORIAL_VERIFICATION_REQUIRED');
});
test('even removing static placeholder in a fixture does not prove Vercel origin or published lifecycle',()=>{
 const r=inspectReleaseSource('<html><body>ok</body></html>','');
 assert.equal(r.status,'PRODUCTION_MAPPING_STILL_REQUIRED');
 assert.equal(r.actual_vercel_source_mapping_verified,false);
});
