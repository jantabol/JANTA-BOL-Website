// P4-T071 C3 single-checkpoint: original four Master invariants and practical RPO/RTO
// Independently query immutable GitHub Actions job metadata/logs READ-ONLY.
// No production services, secrets, writes, external provider, or false E8 acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=JSON.parse(readFileSync(
 'ci/phase4/b11/t071-c3-four-invariants-recovery-review-evidence-v1.json','utf8'));
const master=[
 'OPTIONAL_MODULE_FAILURE_DOES_NOT_CRASH_WHOLE_SITE',
 'AMBIGUOUS_PAYMENT_CANNOT_AUTOMATICALLY_MAKE_AD_LIVE',
 'MESSAGING_FAILURE_DOES_NOT_REVERSE_COMMITTED_BUSINESS_ACTION',
 'DATABASE_FAILURE_CANNOT_REPORT_FALSE_SUCCESS'
];
function audit(x){
 assert.equal(x.schema,'JANTA_BOL_T071_C3_FOUR_INVARIANTS_RECOVERY_PRACTICAL_REVIEW_V1');
 assert.equal(x.authority.test,'P4-T071');
 assert.equal(x.authority.master_page,304);
 assert.equal(x.authority.closure_gate,'C3');
 assert.equal(x.authority.recov,'RECOV-019..026');
 assert.equal(x.authority.precisely_four_invariants,true);
 assert.deepEqual(x.evidence.map(v=>v.invariant),master);
 assert.equal(x.evidence.length,4);
 assert.equal(x.evidence[0].verdict,'PARTIAL_ISOLATED');
 for(const [i,e] of x.evidence.entries()){
  assert.equal(e.full_integrated_pass,false,'unproven hosted pass at '+i);
  assert.equal(e.run_id,[40534396564,40530048228,40534396564,40531488909][i]);
  assert.equal(e.job_id,[122295571136,122280044810,122295571136,122285201848][i]);
  assert.ok(e.required_log_markers.length>=2);
 }
 const v=x.recovery_observed;
 assert.equal(v.reference_run_id,40501228346);
 assert.equal(v.reference_job_id,122179118305);
 assert.equal(v.reference_evidence_sha256,'b5edd1774be77b52ecc2cb47e59a6797a20dfee354461dbd98095220808d2220');
 // Date.parse truncates sub-millisecond precision. Preserve the original
 // PostgreSQL incident log's six fractional digits before comparing times.
 const stampMicro=s=>{
  const match=/^(.*)\.(\d{6})Z$/.exec(s);
  assert(match,'expected exact UTC microsecond timestamp');
  return BigInt(Date.parse(match[1]+'Z'))*1000n+BigInt(match[2]);
 };
 assert.equal(Math.round(Number(stampMicro(v.incident_start_at_utc)-stampMicro(v.last_verified_restorable_checkpoint_at_utc))/1000),422);
 assert.equal(Math.round(Number(stampMicro(v.independently_observed_service_restored_at_utc)-stampMicro(v.incident_start_at_utc))/1000),1261);
 assert.equal(v.observed_local_rpo_seconds,0.422);
 assert.equal(v.observed_local_rto_seconds,1.261);
 assert.equal(v.post_checkpoint_committed_synthetic_article_rows_lost,1);
 assert.equal(v.real_pg17_container_sigkill,true);
 assert.equal(v.same_disposable_db_endpoint_restored,true);
 assert.equal(v.network_disabled,true);
 assert.equal(v.zero_data_loss_claim,false);
 assert.equal(v.scope,'DISPOSABLE_OFFLINE_PG17_SYNTHETIC_FIXTURE_ONLY');
 assert.equal(v.production_rpo,'NOT_MEASURED');
 assert.equal(v.production_rto,'NOT_MEASURED');
 const p=x.practical_recovery_policy_review;
 assert.match(p.recommendation,/DO_NOT_ACCEPT_ANY_UNRECONCILED_ACKNOWLEDGED_AUTHORITATIVE_WRITE_LOSS/);
 assert.match(p.derived_risk,/already acknowledged/);
 assert.equal(p.founder_production_rpo_numeric_target,'NOT_APPROVED');
 assert.equal(p.founder_production_rto_numeric_target,'NOT_APPROVED');
 assert.equal(p.founder_recovery_risk_acceptance,'NOT_RECORDED');
 assert.equal(p.no_paid_service_required,true);
 assert.equal(p.no_new_t071_gate,true);
 assert.equal(x.status.four_invariants_reviewed_with_direct_run_log_markers,true);
 assert.equal(x.status.four_invariants_full_same_candidate_prod_pass,false);
 assert.equal(x.status.actual_disposable_pg17_restoration_practical_review_complete,true);
 assert.equal(x.status.production_recovery_objectives_approved,false);
 assert.equal(x.status.c3_local_evidence_and_risk_review,'COMPLETE');
 assert.equal(x.status.c3_final_pass_lock,false);
 assert.equal(x.status.c1_final_pass_lock,false);
 assert.equal(x.status.c2_final_pass_lock,false);
 assert.equal(x.status.t071_final_pass_lock,false);
 assert.equal(x.status.t072_started,false);
 assert.equal(x.prod_unchanged,true);
 assert.equal(x.cricket_resources_untouched,true);
 assert.equal(x.domain,'JANTABOL.in');
 return true;
}
test('C3 four and only four frozen Master invariants mapped, provenance scope bound',()=>assert(audit(structuredClone(data))));
const mutations=[
 ['fifth invented invariant',x=>x.evidence.push(structuredClone(x.evidence[0]))],
 ['missing original invariant',x=>x.evidence.splice(3,1)],
 ['upgrade optional HTML to hosted E8',x=>x.evidence[0].verdict='PASS_FULL'],
 ['falsify full hosted pass',x=>x.evidence[1].full_integrated_pass=true],
 ['change payment proof job',x=>x.evidence[1].job_id=1],
 ['fake recovery point',x=>x.recovery_observed.last_verified_restorable_checkpoint_at_utc='2026-10-27T12:07:03.330412Z'],
 ['fake observed RTO',x=>x.recovery_observed.observed_local_rto_seconds=0],
 ['pretend no committed rows lost',x=>x.recovery_observed.post_checkpoint_committed_synthetic_article_rows_lost=0],
 ['pretend zero-data-loss',x=>x.recovery_observed.zero_data_loss_claim=true],
 ['pretend real production RPO',x=>x.recovery_observed.production_rpo='0.422s'],
 ['pretend live RTO',x=>x.recovery_observed.production_rto='1.261s'],
 ['pretend approved Founder risk',x=>x.practical_recovery_policy_review.founder_recovery_risk_acceptance='ACCEPTED'],
 ['pretend Founder numeric SLA',x=>x.practical_recovery_policy_review.founder_production_rpo_numeric_target='0s'],
 ['pretend C3 PASS LOCK',x=>x.status.c3_final_pass_lock=true],
 ['pretend T071 final',x=>x.status.t071_final_pass_lock=true],
 ['start T072 without C1-C5',x=>x.status.t072_started=true],
 ['restore from wrong backup digest',x=>x.recovery_observed.reference_evidence_sha256='00'],
 ['fake same-source E8',x=>x.status.four_invariants_full_same_candidate_prod_pass=true],
 ['fake live access',x=>x.recovery_observed.network_disabled=false],
 ['confuse Cricket repository',x=>x.tested_sources.repo='jantabol/Cricket-Prediction-Research'],
 ['wrong domain',x=>x.domain='jantaboli.in']
];
for(const [name,mutate] of mutations)test('reject false C3 closure: '+name,()=>{
 const x=structuredClone(data);mutate(x);assert.throws(()=>audit(x));
});
const expectedExtra={
 40528474982:{id:122274421572,sha:'dc2d42db3f9b2d9dc950b4ce877bc8526accce38',
 markers:['T071_C2_REAL_B8_CORE_CASE_COMMITTED_DURING_NOTIFICATION_OUTAGE=PASS']}
};
const cache=new Map();
async function gh(url,textResult=false){
 const token=process.env.GITHUB_TOKEN;
 assert(token&&token.length>15,'read-only GITHUB_TOKEN required to independently inspect historical CI');
 const response=await fetch('https://api.github.com'+url,{
  headers:{
    authorization:'Bearer '+token,
    accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    'user-agent':'JANTA-BOL-T071-C3-independent-source-evidence-audit'
  },signal:AbortSignal.timeout(35000)});
 assert.equal(response.status,200,'GitHub read-only API failed '+url+' status '+response.status);
 return textResult?response.text():response.json();
}
async function verifiedRunLog(runId,jobId,headSha,markers){
 const key=runId+':'+jobId;
 if(!cache.has(key)){
  const [run,job,logs]=await Promise.all([
   gh('/repos/jantabol/JANTA-BOL-Website/actions/runs/'+runId),
   gh('/repos/jantabol/JANTA-BOL-Website/actions/jobs/'+jobId),
   gh('/repos/jantabol/JANTA-BOL-Website/actions/jobs/'+jobId+'/logs',true)
  ]);
  assert.equal(run.id,runId);
  assert.equal(run.conclusion,'success');
  assert.equal(run.head_sha,headSha);
  assert.equal(run.head_branch,'codex/b11-t071-failure-isolation-preflight-20261027');
  assert.equal(job.id,jobId);assert.equal(job.run_id,runId);
  assert.equal(job.conclusion,'success');
  assert(logs.length>300,'real historical job log missing');
  cache.set(key,logs);
 }
 const logs=cache.get(key);
 for(const marker of markers)assert(logs.split('\n').some(s=>s.trim().endsWith(marker)),
   'missing actual emitted result '+marker+' in '+runId+'/'+jobId);
 return logs;
}
test('C3 independent old GitHub Actions metadata+actual logs prove four invariant scopes, no rerun or pretend production',async()=>{
 for(const e of data.evidence){
  await verifiedRunLog(e.run_id,e.job_id,e.run_head_sha,e.required_log_markers);
  console.log('C3_'+e.invariant+'='+e.verdict+'_ACTUAL_JOB_LOG_VERIFIED_'+e.run_id);
 }
 const s=expectedExtra[40528474982];
 await verifiedRunLog(40528474982,s.id,s.sha,s.markers);
 console.log('C3_FOUR_INVARIANTS_HISTORICAL_CI_PROOF=INDEPENDENT_ACTUAL_LOGS_PASS');
 console.log('C3_SAME_RELEASE_HOSTED_E8=NOT_PROVEN');
},{timeout:180000});
test('C3 independent PG17 incident chronological recovery and original hash manifest match',async()=>{
 const m=data.recovery_observed;
 const logs=await verifiedRunLog(m.reference_run_id,m.reference_job_id,m.reference_test_sha,[
 'T071_RPO_RTO_ISOLATED_REAL_PG17_DUMP_RESTORE=PASS',
 'T071_LOCAL_POST_CHECKPOINT_ACKNOWLEDGED_WRITE_LOST=1_EXPECTED_AND_DISCLOSED',
 'T071_EVIDENCE_SHA256='+m.reference_evidence_sha256,
 'T071_HOSTED_END_TO_END_RPO_RTO=NOT_MEASURED'
 ]);
 const line=logs.split('\n').find(s=>s.includes('T071_RPO_RTO_OBSERVED_JSON={')&&!s.includes("echo "));
 assert(line,'historical actual PG17 observed JSON absent');
 const o=JSON.parse(line.substring(line.indexOf('T071_RPO_RTO_OBSERVED_JSON=')+'T071_RPO_RTO_OBSERVED_JSON='.length));
 const canonical=JSON.stringify(o,Object.keys(o).sort());
 // Original Python emitted sort_keys=True compact JSON, top-level scalar values.
 const sum=createHash('sha256').update(canonical).digest('hex');
 assert.equal(sum,m.reference_evidence_sha256,'old restore metric SHA digest integrity');
 assert.equal(o.last_verified_restorable_checkpoint_at_utc,m.last_verified_restorable_checkpoint_at_utc);
 assert.equal(o.incident_start_at_utc,m.incident_start_at_utc);
 assert.equal(o.independently_observed_service_restored_at_utc,m.independently_observed_service_restored_at_utc);
 assert.equal(o.post_checkpoint_committed_fixture_rows_lost_on_restore,1);
 assert.equal(o.observed_local_rpo_seconds,0.422);
 assert.equal(o.observed_local_rto_seconds,1.261);
 assert.equal(o.founder_approved_production_rpo_target,'NOT_ESTABLISHED');
 assert.equal(o.founder_approved_production_rto_target,'NOT_ESTABLISHED');
 console.log('C3_RECOVERY_TRUSTED_CHECKPOINT_AT='+m.last_verified_restorable_checkpoint_at_utc);
 console.log('C3_ACTUAL_DISPOSABLE_PG17_FAULT_AT='+m.incident_start_at_utc);
 console.log('C3_ACTUAL_LOCAL_RECOVERED_AT='+m.independently_observed_service_restored_at_utc);
 console.log('C3_MEASURED_DISPOSABLE_RPO_POINT_AGE_SECONDS=0.422');
 console.log('C3_MEASURED_DISPOSABLE_RTO_SECONDS=1.261');
 console.log('C3_ACKNOWLEDGED_SYNTHETIC_ROWS_LOST=1');
 console.log('C3_PRODUCTION_RPO_RTO=NOT_MEASURED');
 console.log('C3_FOUNDER_RECOVERY_RISK_ACCEPTANCE=NOT_RECORDED');
},{timeout:180000});
