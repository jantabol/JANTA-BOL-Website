import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const doc=JSON.parse(readFileSync('ci/phase4/b11/t071-c2-all-13-source-transport-pg17-evidence-index-20261027.json','utf8'));
const master=["social","analytics","notifications","grievance","compliance","advertising","search","accountability","live","provider","payments","messaging","database"];
const pg=new Set(["analytics","notifications","advertising","accountability","payments","database"]);
const http=new Set(["social","grievance","compliance","search","live","provider","messaging"]);
function check(d){
 assert.equal(d.schema,"JANTA_BOL_P4_T071_C2_ALL_13_SCOPED_FAILURE_EVIDENCE_V1");
 assert.equal(d.test,"P4-T071");assert.equal(d.gate,"C2");
 assert.equal(d.closure_route,"C2_OF_C1_C5");
 assert.equal(d.master,"RECOV-019..026 p304");
 assert.deepEqual(d.families.map(x=>x.module),master);
 assert.deepEqual(d.families.map(x=>x.index),Array.from({length:13},(_,i)=>i+1));
 assert.equal(d.source_adapters_with_fault_tests,13);
 assert.equal(d.pg17_source_component_families,6);
 assert.equal(d.actual_local_http_source_families,7);
 assert.equal(d.actual_loopback_static_news_article_live_routes_200,3);
 assert.equal(d.actual_loopback_invalid_static_route_404,true);
 assert.equal(d.actual_local_pg17_committed_case_unchanged_after_http_503,true);
 for(const x of d.families){
  assert.equal(x.full_product_e8,false,'NO_HOSTED_E8_'+x.module);
  if(pg.has(x.module))assert.match(x.proof,/^PG17_SOURCE_/);
  if(http.has(x.module))assert.match(x.proof,/^HTTP_503_SOURCE_/);
  assert(/^\d{11}$/.test(x.run_id),'REAL_GITHUB_RUN_ID_MISSING_'+x.module);
 }
 assert.equal(d.evidence_binding.actual_7_http_and_pg_case_ci,40534396564);
 assert.equal(d.evidence_binding.original_13_adapter_ci,40508982711);
 assert.equal(d.evidence_binding.production_mutated,false);
 assert.equal(d.evidence_binding.live_provider_called,false);
 assert.equal(d.evidence_binding.real_payment_made,false);
 assert.equal(d.supabase_connected_prod_readonly.production_write_operations,0);
 assert.equal(d.supabase_connected_prod_readonly.runtime_faults_injected_into_production,0);
 assert.equal(d.supabase_connected_prod_readonly.project,"vrffsnkycvjithwtiylt");
 assert.equal(d.supabase_connected_prod_readonly.social_provider_mode_manual_count,3);
 assert.equal(d.supabase_connected_prod_readonly.live_sessions_OFF_count,16);
 assert.equal(d.supabase_connected_prod_readonly.public_live_feed_OFF_count,7);
 assert.equal(d.supabase_connected_prod_readonly.notification_delivery_state_IN_APP_READY_count,160);
 assert.equal(d.supabase_connected_prod_readonly.real_anon_b9_T032_result_contains_full_body,false);
 assert.equal(d.accepted_scopes.c2_all_13_local_boundary_fault_probes,"PASS_SCOPED_ONLY");
 assert.equal(d.accepted_scopes.c2_exact_same_healthy_release_with_13_active_faults,"NOT_PROVEN");
 assert.equal(d.accepted_scopes.c2_full_real_hosted_integrated_E8,"HOLD");
 assert.equal(d.accepted_scopes.c2_final_PASS_LOCK,false);
 assert.equal(d.accepted_scopes.t071_final_PASS_LOCK,false);
 assert.equal(d.accepted_scopes.c1_final_PASS_LOCK,false);
 assert.equal(d.accepted_scopes.t072_started,false);
 assert.equal(d.no_new_gate_added,true);
 assert.equal(d.domain,"JANTABOL.in");
 return true;
}
test('C2 all 13 original families: 6 real PG17 + 7 localhost real HTTP, hosted E8 remains HOLD',()=>assert(check(structuredClone(doc))));
const mutants=[
 ['fake full C2 pass',d=>d.accepted_scopes.c2_final_PASS_LOCK=true],
 ['fake hosted E8',d=>d.accepted_scopes.c2_full_real_hosted_integrated_E8="PASS"],
 ['hide live status',d=>d.supabase_connected_prod_readonly.live_sessions_OFF_count=0],
 ['fourteenth invented module',d=>d.families.push({index:14,module:"dns",proof:"HTTP_503_SOURCE",run_id:"40534396564",full_product_e8:false})],
 ['drop module',d=>d.families.splice(4,1)],
 ['false PG17 to HTTP',d=>d.families[1].proof="HTTP_503_SOURCE_FAIL"],
 ['false HTTP to PG17',d=>d.families[0].proof="PG17_SOURCE_FAKE"],
 ['fake one hosted E8',d=>d.families[12].full_product_e8=true],
 ['pretend payment made',d=>d.evidence_binding.real_payment_made=true],
 ['pretend all PG17',d=>d.pg17_source_component_families=13],
 ['falsify prod mutation',d=>d.evidence_binding.production_mutated=true],
 ['start T072 prematurely',d=>d.accepted_scopes.t072_started=true],
 ['wrong cricket project',d=>d.supabase_connected_prod_readonly.project="hriakdazkcvplsdwgfle"],
 ['wrong domain',d=>d.domain="jantaboli.in"]
];
for(const [name,mutate] of mutants)test('Reject C2 evidence forgery: '+name,()=>{
 const m=structuredClone(doc);mutate(m);assert.throws(()=>check(m));
});
