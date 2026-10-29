import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const script=resolve(root,'ci/phase4/b10-t068-evidence-reconciliation.mjs');
function run(mode){
 const r=spawnSync(process.execPath,[script,mode],{cwd:root,encoding:'utf8',timeout:10000});
 assert.ok(r.stdout?.includes('janta-bol-p4-t068-b10-final-gate-v1'),'no audit JSON');
 return {code:r.status,report:JSON.parse(r.stdout),stderr:r.stderr};
}
test('T068 enumerates precisely original 109 and 9 B10 IDs without losing certified locks',()=>{
 const x=run('--audit');
 assert.equal(x.code,0);
 assert.equal(x.report.original_test_count,109);
 assert.equal(x.report.b10_original_count,9);
 assert.deepEqual(x.report.locked_prior,['P4-T061','P4-T062','P4-T067']);
 assert.equal(x.report.review_complete,true);
});
test('T068 does not pretend T060 or held T063-T066 attained final PASS+LOCK',()=>{
 const x=run('--audit');
 assert.deepEqual(x.report.outstanding_b10.map(y=>y.id),
 ['P4-T060','P4-T063','P4-T064','P4-T065','P4-T066']);
 assert.ok(x.report.outstanding_b10.find(y=>y.id==='P4-T064')?.status.includes('HOLD'));
 assert.equal(x.report.official_final_lock,'HOLD');
});
test('T068 strict official lock refuses release and recognizes unresolved B8/B9 evidence',()=>{
 const x=run('--require-lock');
 assert.equal(x.code,3,'CI is expected to block official lock until original evidence resolves');
 assert.ok(x.report.outstanding_predecessor_tests.some(z=>z.id==='P4-T105'));
 assert.ok(x.report.outstanding_predecessor_tests.some(z=>z.id==='P4-T099'));
 assert.match(x.stderr,/T068_LOCK_BLOCKED_FAIL_CLOSED/);
});
test('T068 protected source and ZIP do not substitute for real E2 E5 E7',()=>{
 const x=run('--audit');
 assert.equal(x.report.workflow_result_is_not_production_attestation,true);
 assert.equal(x.report.requires_human_verification_of_live_evidence,true);
 assert.deepEqual(x.report.evidence_requirements,['E1','E2','E5','E7']);
});
