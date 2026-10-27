import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessT070FinalE8} from './t070-final-e8-gate.mjs';

const x=JSON.parse(readFileSync(
  'ci/phase4/b11/t070-g19-live-source-role-negative-readonly-20261027.json','utf8'));

test('T070 actual SQL role negatives: real production read-only source evidence exactly scoped',()=>{
 assert.equal(x.project_ref,'vrffsnkycvjithwtiylt');
 assert.equal(x.schema,'JB_T070_LIVE_SOURCE_SQL_ROLE_NEGATIVE_V1');
 assert.equal(x.environment,'EXISTING_PRODUCTION_DB_READ_ONLY_NOT_RESTORED_GO_TRUE_OR_HTTP');
 assert.equal(x.no_production_write,true);
 assert.equal(x.no_data_rows_extracted,true);
 assert.equal(x.checks.length,6);
 const get=(role,obj)=>x.checks.find(y=>y.role===role&&y.object===obj);
 assert.equal(get('anon','public.grievances')?.observed,'SQLSTATE_42501_PERMISSION_DENIED');
 assert.equal(get('anon','public.grievance_evidence')?.observed,'SQLSTATE_42501_PERMISSION_DENIED');
 assert.equal(get('anon',"storage.objects WHERE bucket_id='grievance-private'")?.observed_visible,0);
 assert.equal(get('authenticated (no JWT claims)','public.grievances')?.observed_visible,0);
 assert.equal(get('authenticated (no JWT claims)','public.user_roles')?.observed_visible,0);
 assert.equal(get('anon','public.articles')?.observed_visible,16);
});
test('Production SQL role parity cannot pass restored Auth/MFA or private Storage HTTP gates',()=>{
 assert.equal(x.cloned_runtime_auth_mfa_negative_tests_executed,false);
 assert.equal(x.HTTP_storage_private_access_negative_tests_executed,false);
 assert.equal(x.auth_token_revocation_AAL2_tests_executed,false);
 assert.equal(x.all_E8_ready,false);
 assert.equal(x.T070_FINAL_LOCK,false);
 assert.equal(x.T071_STARTED,false);
 const r=assessT070FinalE8({
  project:x.project_ref,cricket_resources_touched:false,
  platform:{auth_service_restored_to_disposable:x.cloned_runtime_auth_mfa_negative_tests_executed,
   storage_private_access_negative_tests:x.HTTP_storage_private_access_negative_tests_executed,
   runtime_auth_sessions_recovery_reviewed:x.auth_token_revocation_AAL2_tests_executed}
 });
 assert.ok(r.missing.includes('AUTH_AND_PERMISSIONS'));
 assert.ok(r.missing.includes('PLATFORM_CONFIG_RESTORED'));
 assert.equal(r.final_pass,false);
 assert.equal(r.final_lock,false);
 assert.equal(r.can_start_t071,false);
});
