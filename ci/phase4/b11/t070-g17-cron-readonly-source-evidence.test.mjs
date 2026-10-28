import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path='ci/phase4/b11/t070-g17-cron-readonly-source-evidence.json';
const e=JSON.parse(readFileSync(path,'utf8'));
test('G17 live cron evidence belongs to original JANTA BOL and has exactly three schedules',()=>{
 assert.equal(e.project_ref,'vrffsnkycvjithwtiylt');
 assert.equal(e.jobs.length,3);
 assert.deepEqual(e.jobs.map(j=>j.jobid),[3,4,5]);
 assert.deepEqual(e.jobs.map(j=>j.schedule),['5 seconds','* * * * *','0 * * * *']);
});
test('G17 every active job has 64-char opaque command and execution scope digests only',()=>{
 for(const j of e.jobs){
  assert.equal(j.active,true);
  assert.match(j.command_sha256,/^[0-9a-f]{64}$/);
  assert.match(j.execution_scope_sha256,/^[0-9a-f]{64}$/);
  assert.equal(j.failed_last_hour,0);
  assert.equal(j.running_at_observation,0);
 }
 assert.equal(e.no_live_cron_changed,true);
});
test('G17 high-frequency 5-second job makes blind maintenance unsafe',()=>{
 assert.ok(e.jobs.find(j=>j.jobid===3).succeeded_last_hour>=100);
 assert.equal(e.no_jobs_paused,true);
 assert.equal(e.no_production_rollback_drill_passed,true);
});
test('G17 moving counts are observations not same-point recoverability',()=>{
 assert.equal(e.no_real_same_point_recovery,true);
 assert.equal(e.t070_final_lock,false);
 assert.equal(e.scope,'READONLY_SOURCE_SCHEDULES_AND_ONE_HOUR_AGGREGATES_ONLY');
 assert.ok(e.caveats.some(s=>s.includes('NOT backups')));
});
