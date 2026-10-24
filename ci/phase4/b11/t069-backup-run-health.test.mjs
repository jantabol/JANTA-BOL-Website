import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectBackupRuns,fetchTrustedRuns} from './t069-backup-run-health.mjs';
const asOf='2026-10-24T11:40:00Z';
const verified={id:39602669748,repository:{full_name:'jantabol/JANTA-BOL-Website'},
path:'.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml',head_branch:'main',
event:'workflow_dispatch',actor:{login:'jantabol'},run_attempt:1,status:'completed',
conclusion:'success',created_at:'2026-10-21T12:49:11Z'};
test('T069 real 21 Oct historical record is valid but current freshness not owner-approved',()=>{
 const a=inspectBackupRuns([verified],{observed_at:asOf});
 assert.equal(a.last_good_run_id,39602669748);
 assert.equal(a.status,'HOLD_FOUNDER_RECENCY_UNAPPROVED');
 assert.equal(a.final_t069,'HOLD');
});
test('T069 a demonstrative approved 96h threshold can pass only GitHub history layer',()=>{
 const a=inspectBackupRuns([verified],{observed_at:asOf,approved_max_age_hours:96});
 assert.equal(a.status,'PASS_RUN_HISTORY_ONLY');assert.equal(a.b2_object_retention_now_verified,false);
});
test('T069 a demonstrative 24h threshold detects backup staleness',()=>{
 const a=inspectBackupRuns([verified],{observed_at:asOf,approved_max_age_hours:24});
 assert.equal(a.status,'ALERT_BACKUP_STALE');
});
test('T069 newest failed run overrides older recent successful run',()=>{
 const failed={...verified,id:40000000001,created_at:'2026-10-24T10:00:00Z',conclusion:'failure'};
 const a=inspectBackupRuns([verified,failed],{observed_at:asOf,approved_max_age_hours:96});
 assert.equal(a.status,'ALERT_LATEST_BACKUP_RUN_FAILED');
});
test('T069 cancelled run raises alarm; running run does not yield false positive',()=>{
 for(const conclusion of ['cancelled','timed_out']){
  const a=inspectBackupRuns([{...verified,conclusion}],{observed_at:asOf,approved_max_age_hours:96});
  assert.equal(a.status,'ALERT_LATEST_BACKUP_RUN_FAILED');
 }
 const a=inspectBackupRuns([{...verified,status:'in_progress',conclusion:null}],{observed_at:asOf,approved_max_age_hours:96});
 assert.equal(a.status,'HOLD_RUN_IN_PROGRESS');
});
test('T069 wrong workflow/repo/branch/actor/retry/cricket rejected',()=>{
 for(const bad of [{repository:{full_name:'jantabol/Cricket-Prediction-Research'}},
 {head_branch:'feature'},{actor:{login:'other'}},{run_attempt:2},
 {path:'.github/workflows/unreviewed.yml'},{event:'schedule'}]){
  const a=inspectBackupRuns([{...verified,...bad}],{observed_at:asOf});
  assert.equal(a.status,'HOLD_NO_TRUSTED_RUN');
 }
});
test('T069 wrong age or duplicate IDs fail closed',()=>{
 assert.throws(()=>inspectBackupRuns([verified,verified],{observed_at:asOf}),/DUPLICATE_RUN_IDS/);
 for(const a of [0,-1,NaN,0.2,10000])
  assert.throws(()=>inspectBackupRuns([verified],{observed_at:asOf,approved_max_age_hours:a}),/INVALID_FOUNDER_MAX_AGE/);
});
test('T069 GitHub secret-less wrong environment never makes network call',async()=>{
 let invoked=false;
 await assert.rejects(()=>fetchTrustedRuns({token:'x'.repeat(40),env:{},
  fetchImpl:()=>{invoked=true}}),/UNAUTHORIZED_GITHUB_METADATA_FETCH/);
 assert.equal(invoked,false);
});
test('T069 GitHub API denial is HOLD, not healthy',async()=>{
 await assert.rejects(()=>fetchTrustedRuns({token:'x'.repeat(40),
 env:{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website'},
 fetchImpl:async()=>({ok:false})}),/GITHUB_META_RETRIEVAL_FAILED/);
});
test('T069 live GitHub metadata transport only uses GET and cannot read B2',async()=>{
 const runs=await fetchTrustedRuns({token:'x'.repeat(40),
 env:{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website'},
 fetchImpl:async(url,params)=>{assert.equal(params.method,'GET');
 assert.match(url,/api.github.com\/repos\/jantabol\/JANTA-BOL-Website/);
 return {ok:true,json:async()=>({workflow_runs:[verified]})}}});
 assert.equal(inspectBackupRuns(runs,{observed_at:asOf}).final_t069,'HOLD');
});
