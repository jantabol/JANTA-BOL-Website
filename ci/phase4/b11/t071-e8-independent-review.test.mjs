import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditIndependentE8} from './t071-e8-independent-review.mjs';
const original=JSON.parse(readFileSync(
 'ci/phase4/b11/t071-e8-independent-observation-register-20261027.json','utf8'));
const copy=()=>structuredClone(original);
const fails=(mutator,reason)=>test(reason,()=>{
 const x=copy();mutator(x);
 assert.throws(()=>auditIndependentE8(x),/T071_G4_EVIDENCE_HOLD_/);
});

test('G4 real G2/G3 evidence record is internally consistent and remains scoped HOLD',()=>{
 const r=auditIndependentE8(copy());
 assert.equal(r.g3_actual_disposable_pg17_crash_restore,'VERIFIED_LOGS_SCOPED');
 assert.equal(r.g2_13_real_source_adapters_with_stubbed_failures,'VERIFIED_LOGS_SCOPED');
 assert.equal(r.local_pg_rpo_seconds,0.422);
 assert.equal(r.local_pg_rto_seconds,1.261);
 assert.equal(r.acknowledged_post_checkpoint_fixture_rows_lost,1);
 assert.equal(r.E8_full_system,'HOLD');
 assert.equal(r.t071_final_pass,false);
 assert.equal(r.t071_final_lock,false);
 assert.equal(r.t070_final_e8,'HOLD');
 assert.equal(r.soft_launch_release,'NOT_APPROVED');
 assert.equal(r.missing.length,4);
});

fails(x=>x.source.g2_actual_source_run_id=1,'Forged G2 run id denied');
fails(x=>x.source.g2_executed_case_count=999,'Forged adapter test count denied');
fails(x=>x.source.g2_live_integrated_faults='HOSTED_PASS','Adapter source VM cannot masquerade hosted');
fails(x=>x.source.b8_checked_source_sha='0'.repeat(40),'Pin drift of integrated adapter denied');
fails(x=>x.source.g3_local_pg17_tested_sha='0'.repeat(40),'Wrong local PG test code SHA denied');
fails(x=>x.rpo_observation.observed_local_rpo_seconds=0,'Synthetic asserted zero RPO is rejected');
fails(x=>x.rpo_observation.observed_local_rto_seconds=0,'Synthetic asserted zero RTO rejected');
fails(x=>x.rpo_observation.post_checkpoint_committed_fixture_rows_lost_on_restore=0,
 'Deleting acknowledged data loss is rejected');
fails(x=>x.rpo_observation.actual_production_rpo_rto='0.422s / 1.261s',
 'Promoting disposable DB metrics to production is rejected');
fails(x=>x.rpo_observation.t071_final_pass_lock=true,'Forged T071 PASS LOCK rejected');
fails(x=>x.rpo_observation.e8_independent_full_stack='PASS','Fabricated E8 full-system PASS rejected');
fails(x=>x.review_observations.independent_live_integrated_fault_logs_present=true,
 'No fabricated independent hosted fault logs');
fails(x=>x.review_observations.founder_signed_e8_attestation=true,
 'No invented Founder signoff');
fails(x=>x.review_observations.vercel_production_commit='0'.repeat(40),
 'Wrong production source binding rejected');
fails(x=>x.review_observations.vercel_production_static_unreviewed_live_headlines_visible=false,
 'Cannot call unreviewed public headlines cleared');
fails(x=>x.review_observations.anon_articles_select_granted=true,
 'Cannot call anon direct table SELECT allowed');
fails(x=>x.review_observations.anon_b9_search_rpc_known_title_count=0,
 'Independent anon RPC observation cannot be rewritten');
fails(x=>x.review_observations.no_production_failure_injection=false,
 'Production fault injection would violate safe scope');
fails(x=>x.rpo_observation.independently_observed_service_restored_at_utc=
 '2026-10-27T12:06:55.000000Z','Invalid restore-before-incident rejected');
test('E8 impossible to pass automatically from an evidence register, no secret requirement',()=>{
 const r=auditIndependentE8(copy());
 assert.equal(r.E8_full_system,'HOLD');
 assert.equal(r.t071_final_lock,false);
 assert.deepEqual(Object.keys(r).filter(k=>/token|password|service_role|private_uuid/i.test(k)),[]);
});
