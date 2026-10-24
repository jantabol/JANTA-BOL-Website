import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const script=resolve(root,'ci/phase4/b11-g0-readonly-source-and-release-gates.mjs');
function go(flag='--report'){
 const r=spawnSync(process.execPath,[script,flag],{cwd:root,encoding:'utf8',timeout:8000});
 const result=JSON.parse(r.stdout);
 return {code:r.status,err:r.stderr,data:result};
}
test('B11 G0 original 109 tests preserved with exact 7 B11 T069-T075',()=>{
 const {code,data}=go();assert.equal(code,0);assert.equal(data.total_original_tests,109);
 assert.deepEqual(data.b11_original_ids,['P4-T069','P4-T070','P4-T071','P4-T072','P4-T073','P4-T074','P4-T075']);
 assert.equal(data.original_b11_official_status,'NOT RUN');
});
test('B11 refuses to mislabel held B10 tests as prior full release',()=>{
 const {data}=go();assert.deepEqual(data.previous_b10_official_open_tests,
 ['P4-T060','P4-T063','P4-T064','P4-T065','P4-T066','P4-T068']);
 assert.equal(data.release_authorized,false);
});
test('B11 reuses genuine historic PG17 DB restore but not unverified storage file bytes',()=>{
 const {data}=go();
 assert.equal(data.historic_real_db_restore,'EXISTING_SCOPED_PASS_20261015');
 assert.ok(data.historic_scope_gaps.includes('storage-media-original-bytes'));
 assert.ok(data.historic_scope_gaps.includes('full-platform-settings'));
});
test('B11 no automatic/live backup execution, only Founder-approved manual gate',()=>{
 const {data}=go();
 assert.equal(data.existing_backup_manual_trigger_locked,true);
 assert.equal(data.production_backup_dispatched,false);
 assert.equal(data.independent_cricket_resources_untouched,true);
});
test('B11 real release demand fails closed until required original proofs exist',()=>{
 const {code,err,data}=go('--require-b11-lock');
 assert.equal(code,3);assert.match(err,/B11_RELEASE_BLOCKED/);
 assert.equal(data.b11_final_lock,'NOT_RUN');
});
