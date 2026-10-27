import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync('ci/phase4/b11/t071-closure-route-v1-frozen.json','utf8'));
const clone=()=>structuredClone(fixture);
const stages=['C1','C2','C3','C4','C5'];
const families=['social','analytics','notifications','grievance','compliance','advertising','search','accountability','live','provider','payments','messaging','database'];
const expectedBehavior=[
 'OPTIONAL_MODULE_FAILURE_DOES_NOT_CRASH_WHOLE_SITE',
 'AMBIGUOUS_PAYMENT_CANNOT_AUTOMATICALLY_MAKE_AD_LIVE',
 'MESSAGING_FAILURE_DOES_NOT_REVERSE_COMMITTED_BUSINESS_ACTION',
 'DATABASE_FAILURE_CANNOT_REPORT_FALSE_SUCCESS'];
const evidence=['E1','E2','E5','E8'];
const exclusions=[
 'NEW_CUSTOM_DNS_HOST_jantaboli.in',
 'PAID_HOSTING_OR_NEW_VERCEL_SUBSCRIPTION',
 'DEPLOY_ALL_11_ABSENT_REVIEW_ONLY_B7_RPC_FUNCTIONS',
 'FORCE_ENABLE_ADVANCED_ADS_PAYMENT_OR_EXTERNAL_SOCIAL',
 'PRODUCTION_CRASH_OR_PRODUCTION_PROVIDER_PAYMENT',
 'SOFT_LAUNCH_EDITORIAL_QA_NEWS_CLEANUP_AND_PUBLIC_URL_BRANDING',
 'P4_T072_PARTIAL_WRITE_AND_RETRY_IDEMPOTENCY',
 'P4_T070_FULL_E8_REOPEN_UNLESS_DIRECTLY_AFFECTS_T071_BASELINE'];

function check(r) {
 assert.equal(r.schema,'JB_PHASE4_T071_CLOSURE_ROUTE_V1_0_FROZEN_20261027');
 assert.equal(r.authority.master,'JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK(20261027-041849).pdf');
 assert.equal(r.authority.page,304);
 assert.equal(r.authority.test,'P4-T071');
 assert.equal(r.authority.run,'RUN-10');
 assert.equal(r.authority.requirement_range,'RECOV-019..RECOV-026');
 assert.equal(r.authority.section_range,'600..616');
 assert.equal(r.authority.source_of_truth_precedence,'MASTER_OVERRIDES_THIS_ROUTE');
 assert.deepEqual(r.mandatory_gates.map(x=>x.id),stages,'NO SIXTH GATE');
 assert.deepEqual(r.matrix.map(x=>x[0]),families,'NO FOURTEENTH FAMILY');
 assert.deepEqual(r.pass_invariants,expectedBehavior,'FOUR INVARIANTS IMMUTABLE');
 assert.deepEqual(r.required_evidence,evidence,'E1 E2 E5 E8');
 assert.deepEqual(r.excluded_as_extra_mandatory_gates,exclusions,'NO NEW HOSTED/DOMAIN/UNDEPLOYED PAID GATES');
 assert.equal(r.transition.next,'P4-T072');
 assert.equal(r.transition.master_range,'RECOV-027..RECOV-032');
 assert.match(r.transition.scope,/Idempotency/);
 assert.equal(r.transition.rule,'ALL_C1_C5_MANDATORY_PROOFS_ACCEPTED_AND_INDEPENDENT_E8_AND_FOUNDER_FINAL_SIGNOFF');
 assert.equal(r.latest_evidence.thirteen_real_integrated_acceptance,'NOT_COMPLETE');
 assert.equal(r.latest_evidence.full_e8,'HOLD');
 assert.equal(r.latest_evidence.final_pass_lock,false);
 assert.equal(r.latest_evidence.custom_domain,'DUE_OUTSIDE_T071');
 assert(!r.mandatory_gates.some(x=>/dns|purchase|payment provider subscription/i.test(x.name)),'DOMAIN GATE LEAK');
 assert(r.mandatory_gates.every(x=>x.close_condition.length>95),'DOCUMENT_ACCEPTANCE_BEFORE_EXECUTION');
 assert(r.mandatory_gates.every(x=>['PARTIAL','HOLD'].some(v=>x.status.startsWith(v))),'NO PREMATURE GREEN');
 return true;
}
test('V1 Frozen Master-scope: exactly five gates, thirteen faults, four conditions and E1/E2/E5/E8',()=>assert(check(clone())));
const mutations=[
 ['sixth hidden gate',r=>r.mandatory_gates.push({id:'C6',name:'New condition'})],
 ['extra family',r=>r.matrix.push(['dns','OTHER','ERR'])],
 ['missing actual module family',r=>r.matrix.splice(4,1)],
 ['fake production final lock',r=>r.latest_evidence.final_pass_lock=true],
 ['false integrated acceptance',r=>r.latest_evidence.thirteen_real_integrated_acceptance='PASS'],
 ['narrow evidence omitted',r=>r.required_evidence.splice(2,1)],
 ['new DNS launch prerequisite',r=>r.excluded_as_extra_mandatory_gates.shift()],
 ['fake custom domain configured',r=>r.latest_evidence.custom_domain='READY'],
 ['fifth behavioral invariant invented',r=>r.pass_invariants.push('ANY_NEW_RULE')],
 ['Founder signature bypass',r=>r.transition.rule='AUTO_PASS'],
 ['import T072 into T071',r=>r.transition.next='P4-T073'],
 ['swap Master precedence',r=>r.authority.source_of_truth_precedence='PR45_OVERRIDES_MASTER'],
 ['rewrite T071 section map',r=>r.authority.section_range='600..630'],
 ['change test number',r=>r.authority.test='P4-T072']
];
for(const [label,change] of mutations){
 test('Reject route drift: '+label,()=>{
  const r=clone();change(r);
  assert.throws(()=>check(r));
 });
}
test('Fixture itself remains HOLD and never changes database/app',()=>{
 const m=clone();
 assert(check(m));
 assert.equal(m.latest_evidence.b7_11_rpc_reconciliation,'PASS_DOCUMENTARY_20_20_GITHUB_40511005431');
 assert.equal(m.excluded_as_extra_mandatory_gates.includes('DEPLOY_ALL_11_ABSENT_REVIEW_ONLY_B7_RPC_FUNCTIONS'),true);
});
