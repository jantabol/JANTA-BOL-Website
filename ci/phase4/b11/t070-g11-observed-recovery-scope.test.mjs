import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessT070G11} from './t070-g11-cross-component-gate.mjs';
const evidence=JSON.parse(readFileSync('ci/phase4/b11/t070-g11-observed-recovery-scope.json','utf8'));
test('G11 real official database/media successes do NOT masquerade as joint restore',()=>{
 const r=assessT070G11(evidence);
 assert.equal(r.status,'HOLD');
 assert.deepEqual(r.missing,[
 'ONE_TRUSTED_RECOVERY_POINT','DURABLE_INDEPENDENT_OWNER_AGE_KEY_RECOVERY',
 'COMPLETE_ISOLATED_RUNTIME_RESTORE','PERMANENT_IDENTITY_RELATIONSHIPS',
 'ZERO_ROW_EXERCISE_IN_CLONE_ONLY','FINAL_E1_E2_E4_E5_E8_INDEPENDENT_SECURITY']);
 assert.equal(r.final_pass,false);assert.equal(r.final_lock,false);assert.equal(r.can_start_t071,false);
});
test('G11 real runner IDs are distinct, real Storage includes both grievance objects, data never shared',()=>{
 assert.equal(evidence.database.run_id,'40223103797');
 assert.equal(evidence.media.run_id,'40274621191');
 assert.equal(evidence.media.file_count,5);
 assert.equal(evidence.media.grievance_file_count,2);
 assert.notEqual(evidence.coherence.database_point_id,evidence.coherence.media_point_id);
 assert.equal(evidence.secrets_included,false);assert.equal(evidence.private_object_paths_or_ids_included,false);
});
test('G11 SQL source active state has correct RLS counts and 81 non-cron policies',()=>{
 const o=evidence.observations;
 assert.equal(o.public_tables,100);
 assert.equal(o.public_tables_rls_enabled,100);
 assert.equal(o.policies.public+o.policies.storage+o.policies.private,81);
 assert.equal(o.policies.cron,2);
 assert.equal(o.auth_users,5);assert.equal(o.edge_functions_active,13);
});
test('G11 original source media inventory is 2 private grievance + 1 editorial + 2 public',()=>{
 const c=evidence.observations.storage_object_counts;
 assert.deepEqual(c,{'grievance-private':2,'private-editorial':1,'public-media':2});
});
test('G11 positive payment and live update coverage remains NOT EXERCISED despite valid empty FKs',()=>{
 const a=evidence.observations;
 assert.equal(a.source_rows.live_updates,0);assert.equal(a.source_rows.ad_payments,0);
 assert.deepEqual(a.unexercised_checks,['live_update_session_fk','payment_campaign_fk']);
 assert.equal(a.latest_source_fk_checks_consistent,12);
});
test('G11 no silent paid Supabase clone or decrypted Vercel secrets claimed',()=>{
 assert.equal(evidence.observations.dev_supabase_branches,0);
 assert.equal(evidence.observations.vercel_envs_visible_without_decrypt,0);
 assert.equal(evidence.limited_evidence_scope,'TRUSTED_GITHUB_LOGS_AND_READONLY_SOURCE_METADATA_NOT_COMBINED_RESTORE');
 assert.equal(evidence.observations.warning.includes('NOT an atomic/full-system restore'),true);
});
