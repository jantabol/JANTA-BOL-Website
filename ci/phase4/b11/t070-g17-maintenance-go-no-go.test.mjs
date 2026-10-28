import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateG17,REQUIRED_PROOFS} from './t070-g17-maintenance-go-no-go.mjs';
const src=JSON.parse(readFileSync('ci/phase4/b11/t070-g17-production-maintenance-preflight.json','utf8'));
const risk=JSON.parse(readFileSync('ci/phase4/b11/t070-g17-edge-writer-risk-observation.json','utf8'));
const okProof=()=>Object.fromEntries(REQUIRED_PROOFS.map(k=>[k,true]));
test('G17 real metadata shows currently 3 active cron jobs and 48 public enabled triggers',()=>{
 assert.equal(src.active_pg_cron_jobs,3);
 assert.equal(src.enabled_public_user_triggers,48);
 assert.equal(src.public_tables,100);
});
test('G17 RLS alone cannot freeze 5 anon writable tables / 15 authenticated writable tables',()=>{
 assert.equal(src.direct_anon_write_grants_tables,5);
 assert.equal(src.direct_authenticated_write_grants_tables,15);
 assert.equal(src.public_security_definer_functions,215);
 assert.equal(src.anon_executable_public_functions,22);
});
test('G17 all Edge static writer hints and JWT-less endpoints demand a separate barrier plan',()=>{
 assert.equal(risk.risk_indicators.length,13);
 assert.equal(src.edge_functions_live,13);
 assert.equal(src.edge_functions_verify_jwt_false,5);
 assert.equal(risk.risk_indicators.filter(x=>!x.verify_jwt).length,5);
 assert.equal(risk.production_paused,false);
 assert.equal(risk.rollback_proven,false);
 assert.equal(risk.combined_real_restore,false);
});
test('G17 conditional founder A is NOT blanket permission for unvalidated production freeze',()=>{
 assert.equal(src.founder_approved_conditional_maintenance,true);
 assert.equal(src.founder_approved_immediate_irreversible_writes,false);
 const a=evaluateG17(src,{});
 assert.equal(a.status,'HOLD');
 assert.equal(a.maintenance_active,false);
 assert.equal(a.permission_to_apply_maintenance_from_this_code,false);
});
test('G17 18 independent missing controls hard block until every risk addressed',()=>{
 assert.equal(REQUIRED_PROOFS.length,18);
 assert.equal(evaluateG17(src,{}).missing.length,18);
 for(const k of REQUIRED_PROOFS){let p=okProof();p[k]=false;assert.equal(evaluateG17(src,p).status,'HOLD');}
});
test('G17 even all-true untrusted evidence remains independent review only, never full E8 lock',()=>{
 const a=evaluateG17(src,okProof());
 assert.equal(a.status,'INDEPENDENT_REVIEW_REQUIRED');
 assert.equal(a.maintenance_active,false);
 assert.equal(a.real_joint_restore_proven,false);
 assert.equal(a.t070_final_pass,false);
 assert.equal(a.t070_final_lock,false);
 assert.equal(a.can_start_t071,false);
});
test('G17 wrong or stale project or writer counts cannot pass, cricket never referenced as scope',()=>{
 assert.equal(evaluateG17({...src,project_ref:'hriakdazkcvplsdwgfle'},okProof()).status,'HOLD');
 assert.equal(evaluateG17({...src,active_pg_cron_jobs:0},okProof()).status,'HOLD');
 assert.equal(evaluateG17({...src,edge_functions_live:0},okProof()).status,'HOLD');
});
