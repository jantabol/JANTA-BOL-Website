// B12 Topic-11 audit ledger guard, using independently observed CI/provider facts.
// This is a code test of release HOLD accounting, NOT real missing E4/E8 evidence.
// Never turn historical/synthetic/scoped evidence into a current full-stack PASS.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file='JANTA_BOL_PHASE_4_WORKING/b12/P4_B12_T076_T083_FINAL_EVIDENCE_LEDGER_20261031.json';
const ledger=JSON.parse(readFileSync(file,'utf8'));
const IDS=Array.from({length:8},(_,n)=>'P4-T'+String(n+76).padStart(3,'0'));
const CODES=new Set(['E1','E2','E3','E4','E5','E6','E7','E8']);
const mustGlobal=[
 'B12-E8-CURRENT-RESTORE',
 'B12-E4-CURRENT-LIFECYCLE',
 'B12-T080-PROD-IDEMPOTENCY',
 'B12-OLD-REGRESSION-FULL',
 'B12-PROVIDER-DUE',
 'B12-REGISTRAR-AUTO-RENEW'
];
function deepClone(x){return JSON.parse(JSON.stringify(x));}
function gate(l){
 const unique=new Set(l.tests.map(t=>t.id));
 if(unique.size!==8||IDS.some(id=>!unique.has(id)))return false;
 const blockers=new Map(l.global_blockers.map(b=>[b.id,b]));
 if(mustGlobal.some(id=>blockers.get(id)?.state!=='CLOSED_WITH_REAL_EVIDENCE'))return false;
 if(l.recorded_founder_date?.independently_verified!==true)return false;
 if(l.archive_scope?.full_B12_source_zip!==true||l.archive_scope?.full_prod_data_backup!==true)return false;
 if(l.CI_selected_historic_runs_status!=='full_current_release_protected_ci_green')return false;
 if(l.may_unlock_without_new_evidence!==false)return false;
 return l.tests.every(t=>t.status==='FINAL_PASS_WITH_REAL_EVIDENCE'&&
    t.required.every(id=>t.proven.includes(id))&&t.proof_runs.length>0);
}
test('B12 must map exactly T076..T083, no missing duplicate tests',()=>{
 assert.deepEqual(ledger.tests.map(t=>t.id),IDS);
 assert.deepEqual([...new Set(ledger.tests.map(t=>t.id))],IDS);
});
test('T083 is final B12 test and all eight currently record PARTIAL',()=>{
 assert.equal(IDS.at(-1),'P4-T083');
 assert(ledger.tests.every(t=>t.status==='PARTIAL'));
 assert.equal(ledger.final_lock,'HOLD');
});
test('Every required/proven evidence code is documented and constrained',()=>{
 for(const t of ledger.tests){
  assert(t.required.length>=3);
  for(const code of [...t.required,...t.proven])assert(CODES.has(code));
  assert(t.proven.every(code=>t.required.includes(code)));
  assert(t.remaining.length>0,'no missing gate description on '+t.id);
 }
});
test('Concrete production identity binds to known live SHA, not review branch',()=>{
 assert.equal(ledger.production.source_sha,'93df12aa8ffdfae38d9a4066b6a4556bb36969e5');
 assert.equal(ledger.production.deployment_id,'dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF');
 assert.equal(ledger.production.main_commits_behind_production,434);
 assert.match(ledger.production.release_precondition,/do_not_deploy_main_blindly/);
});
test('Neither old mock pass nor Founder-reported auto-renew can permit final lock',()=>{
 assert.equal(ledger.recorded_founder_date.auto_renew_date,'2027-08-14');
 assert.equal(ledger.recorded_founder_date.independently_verified,false);
 assert.equal(ledger.archive_scope.full_B12_source_zip,false);
 assert.equal(ledger.archive_scope.full_prod_data_backup,false);
 assert.equal(gate(ledger),false);
});
test('Current E8 and Founder current E4 cannot be replaced by historical run status',()=>{
 assert.equal(ledger.global_blockers.find(x=>x.id==='B12-E8-CURRENT-RESTORE').state,'HOLD');
 assert.equal(ledger.global_blockers.find(x=>x.id==='B12-E4-CURRENT-LIFECYCLE').state,'HOLD');
 const bad=deepClone(ledger);
 bad.tests.forEach(x=>{x.status='FINAL_PASS_WITH_REAL_EVIDENCE';x.proven=[...x.required]});
 assert.equal(gate(bad),false,'historic CI alone must NEVER unlock');
});
test('Mislabeling all blockers CLOSED still cannot hide missing E1..E8 tests',()=>{
 const bad=deepClone(ledger);
 bad.global_blockers.forEach(b=>b.state='CLOSED_WITH_REAL_EVIDENCE');
 bad.recorded_founder_date.independently_verified=true;
 bad.archive_scope.full_B12_source_zip=true;
 bad.archive_scope.full_prod_data_backup=true;
 bad.CI_selected_historic_runs_status='full_current_release_protected_ci_green';
 assert.equal(gate(bad),false,'test evidence remains missing');
});
test('T080 pending PR84 is not the currently deployed idempotency fix',()=>{
 const x=ledger.tests.find(t=>t.id==='P4-T080');
 assert(x.remaining.some(s=>s.includes('PR84')&&s.includes('not current live')));
 assert.equal(ledger.global_blockers.find(b=>b.id==='B12-T080-PROD-IDEMPOTENCY').state,'HOLD');
});
test('Original skipped Master ZIP job does not count as full old-CI success',()=>{
 assert.match(ledger.CI_selected_historic_runs_status,/skipped/);
 assert.equal(ledger.global_blockers.find(b=>b.id==='B12-OLD-REGRESSION-FULL').state,'HOLD');
});
test('Founder nonpaid, truthful-news and reserved rights remain hard constraints',()=>{
 assert.equal(ledger.founder_constraints.max_new_paid_service_cost_inr,0);
 assert.equal(ledger.founder_constraints.no_fake_pass,true);
 assert.equal(ledger.founder_constraints.keep_existing_published_news,true);
 assert.equal(ledger.founder_constraints.protect_founder_publish_rights,true);
 assert.equal(ledger.founder_constraints.no_public_testing_article_without_editorial_approval,true);
});
