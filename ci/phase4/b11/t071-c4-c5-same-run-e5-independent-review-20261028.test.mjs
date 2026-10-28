import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const original=JSON.parse(readFileSync('ci/phase4/b11/t071-c3-four-invariants-recovery-review-evidence-v1.json','utf8'));
const env=Object.freeze({
 repo:'jantabol/JANTA-BOL-Website',
 original_candidate:'659bcdc2ec4e270ea066863b4b456aeb65cb7c73',
 source_runner_sha:'4f54c959620c7c424729f2d1840be98f0f2750d3',
 source_runner_id:40638596053,
 source_job_id:122651220495
});
const names=['social','analytics','notifications','grievance','compliance','advertising','search','accountability','live','provider','payments','messaging','database'];
const rows=[
 ['social','C2_01_SOCIAL_REAL_HTTP_503=FAIL_CLOSED_NO_FAKE_POSTED'],
 ['analytics','C2_02_ANALYTICS_REAL_PG17_RPC_PERMISSION_FAULT_RESTORED=PASS'],
 ['notifications','C2_03_NOTIFICATIONS_REAL_PG17_STORAGE_FAULT_ORIGINAL_B8_CASE_SURVIVES=PASS'],
 ['grievance','C2_04_GRIEVANCE_REAL_HTTP_503=FAIL_CLOSED_SOURCE_ADAPTER'],
 ['compliance','C2_05_COMPLIANCE_REAL_HTTP_503=FAIL_CLOSED_SOURCE_ADAPTER'],
 ['advertising','C2_06_ADVERTISING_11_PAYMENTS_REAL_PG17_DENY_NO_PAID_AD_LIVE=PASS'],
 ['search','C2_07_SEARCH_REAL_HTTP_503=FAIL_CLOSED_ARTICLE_HTML_STILL_200'],
 ['accountability','C2_08_ACCOUNTABILITY_REAL_PG17_PUBLIC_RPC_FAULT_OTHER_CASE_PEER_CONTINUES=PASS'],
 ['live','C2_09_LIVE_REAL_HTTP_503=NO_FALSE_LIVE_SUCCESS'],
 ['provider','C2_10_CAMERA_PROVIDER_HTTP_503=NO_FALSE_REDIRECT'],
 ['payments','T071_C2_REAL_PG17_PAYMENT_WRITE_FAILURE=PASS'],
 ['messaging','C2_12_MESSAGING_EDGE_HTTP_503=NO_FALSE_ACK'],
 ['database','C2_13_DATABASE_REAL_PG17_FAILED_WRITE_FALSE_ACK_DENIED_RECOVERED=PASS']
];
const tok=process.env.GITHUB_TOKEN;
async function api(path){
 assert(tok&&tok.length>10,'no GitHub actions read-only token');
 const r=await fetch('https://api.github.com/repos/'+env.repo+path,{
   headers:{authorization:'Bearer '+tok,accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','user-agent':'JANTA-BOL-T071-E5-INDEPENDENT-SCOPE'},
   signal:AbortSignal.timeout(35000)
 });
 assert.equal(r.status,200,'GitHub read-only endpoint HTTP '+r.status);
 return path.endsWith('/logs')?r.text():r.json();
}
let actual;
test('E5 authentic GitHub CI original executed runner, job, source SHA and log read-only identity',async()=>{
 const [run,job,log]=await Promise.all([
   api('/actions/runs/'+env.source_runner_id),
   api('/actions/jobs/'+env.source_job_id),
   api('/actions/jobs/'+env.source_job_id+'/logs')
 ]);
 assert.equal(run.id,env.source_runner_id);
 assert.equal(run.conclusion,'success');
 assert.equal(run.head_sha,env.source_runner_sha);
 assert.equal(job.id,env.source_job_id);
 assert.equal(job.run_id,run.id);
 assert.equal(job.conclusion,'success');
 assert(log.length>15000,'actual negative log unexpectedly short');
 actual=log;
 console.log('T071_E5_VERIFIED_SAME_RUNNER_SOURCE_SHA_AND_ACTUAL_JOB_SUCCESS=PASS');
},{timeout:65000});
function linesMatching(marker){
 return actual.split('\n').filter(l=>
 /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z /.test(l) &&
 l.trim().endsWith(marker) &&
 !l.includes('echo ') &&
 !l.includes('\x1b[36;1m'));
}
test('E5 all thirteen original source fault cases executed in ONE original candidate isolated runner with timestamps',()=>{
 assert(actual,'first check missing');
 assert.deepEqual(rows.map(x=>x[0]),names);
 const observations=[];
 for(const [name,marker] of rows){
   const found=linesMatching(marker);
   assert.equal(found.length,1,'missing or duplicated actual execution '+name+' '+marker);
   const iso=found[0].split(' ')[0];
   assert(Number.isFinite(Date.parse(iso)));
   observations.push({name,at:iso});
 }
 assert.equal(observations.length,13);
 console.log('T071_C4_E5_SINGLE_ACTUAL_CANDIDATE_RUNNER_ALL_THIRTEEN_TIMESTAMPED=PASS_SCOPED');
});
test('E5 real remotely hosted public Article body+truthful LIVE before and after local controlled faults',()=>{
 assert(actual);
 assert.equal(linesMatching('C1_E1_ACTUAL_HOSTED_GUEST_RPC_PUBLISHED_ARTICLE_2896_CHARS=PASS').length,2);
 assert.equal(linesMatching('C1_E1_ACTUAL_ANON_PUBLIC_LIVE_ACTIVE_COUNT=0_TRUTHFUL_OFF').length,2);
 const before=linesMatching('C2_ACTUAL_REMOTE_PUBLIC_ARTICLE_LIVE_BEFORE_LOCAL_INJECTION=PASS')[0];
 const after=linesMatching('C2_REAL_SAME_DEPLOYED_FOUNDER_ARTICLE_GUEST_BODY_AND_LIVE_OFF_BEFORE_AFTER=PASS_NONDESTRUCTIVE')[0];
 assert(before&&after);
 assert(Date.parse(before.split(' ')[0])<Date.parse(after.split(' ')[0]));
 assert.equal(linesMatching('C2_PG17_ORIGINAL_BUSINESS_NEWS_AD_PERSISTED_AFTER_HTTP_FAILURES=PASS').length,1);
 console.log('T071_C4_E5_REMOTE_GUEST_NEWS_LIVE_READ_7_OF_7_BEFORE_AND_AFTER=PASS_NONDESTRUCTIVE');
});
test('C3 practical recovery review must disclose one acknowledged synthetic Article lost and exact Founder policy',()=>{
 const r=original.recovery_observed,p=original.practical_recovery_policy_review;
 assert.equal(r.observed_local_rpo_seconds,0.422);
 assert.equal(r.observed_local_rto_seconds,1.261);
 assert.equal(r.post_checkpoint_committed_synthetic_article_rows_lost,1);
 assert.equal(r.production_rpo,'NOT_MEASURED');
 assert.equal(r.production_rto,'NOT_MEASURED');
 assert.equal(p.founder_recovery_risk_acceptance,'APPROVED_PROVISIONAL_CONSERVATIVE_POLICY_2026_10_27');
 assert.equal(p.founder_production_rpo_numeric_target,'NOT_APPROVED');
 assert.equal(p.founder_production_rto_numeric_target,'NOT_APPROVED');
 assert.equal(original.status.t071_final_pass_lock,false);
 console.log('T071_C3_CONSERVATIVE_RECOVERY_LOST_ACK_1_AND_NO_PRODUCTION_SLA=ACCURATELY_DISCLOSED');
});
test('C4 protects original phase3+News+B9/LIVE Owner source regressions; do not turn mock into AAL2 proof',()=>{
 assert.equal(linesMatching('C2_POST_FAILURE_OLD_NEWS_B9_LIVE_OWNER_SOURCE_REGRESSION=PASS').length,1);
 assert.match(actual,/ℹ pass 32/);
 assert.equal(linesMatching('C2_ONE_RUNNER_13_AUTHENTIC_CANDIDATE_SOURCE_NEGATIVE_BOUNDARIES=PASS_SCOPED').length,1);
 console.log('T071_C4_ORIGINAL_CORE_REGRESSION_32_32_PASS_SAME_SOURCE');
});
test('C5 independent scope: no false E8 FULL/Production outage claim or premature T072',()=>{
 assert.equal(linesMatching('C2_FULL_HOSTED_E2_E8=HOLD').length,1);
 assert.equal(linesMatching('C2_EXTERNAL_SUPABASE_LARIX_REAL_PROVIDER_FAULTS=NOT_INJECTED').length,1);
 assert.equal(linesMatching('C2_FINAL_PASS_LOCK=false').length>=1,true);
 assert.equal(linesMatching('T071_FINAL_PASS_LOCK=false').length>=1,true);
 assert.equal(original.status.t072_started,false);
 console.log('T071_C5_INDEPENDENT_SCOPED_E5_E8_AUDIT=PASS_WITH_FULL_E8_AND_FINAL_T071_HOLD');
});
