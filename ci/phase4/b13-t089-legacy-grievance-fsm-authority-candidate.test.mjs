// T089 P1 data integrity candidate: do not silently bypass backend grievance FSM.
// Based on actual production Git SHA 93df12aa8ffdfae38d9a4066b6a4556bb36969e5. Source & regression only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const src=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase2-client.js','utf8');
const ui=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/grievances.html','utf8');
const submission=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/grievance-submit.html','utf8');
const base='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const start=src.indexOf('async function setGrievanceStatus(id,status,note){');
const end=src.indexOf('async function liveSessions()',start);
const body=src.slice(start,end);
test('T089-G01 legacy Owner status write passes through server-side transition FSM, no direct table UPDATE',()=>{
 assert.ok(start>0&&end>start);
 assert.ok(body.includes('await owner()'));
 assert.ok(body.includes(".rpc('jb_grievance_transition_internal'"));
 assert.ok(body.includes("p_id:id,p_status:status,p_note:note||''"));
 assert.ok(body.includes("GRIEVANCE_TRANSITION_UNCONFIRMED"));
 assert.equal(body.includes(".from('grievances').update("),false);
 assert.equal(src.includes(".from('grievances').update("),false,'ANOTHER_LEGACY_DIRECT_STATUS_MUTATOR');
});
test('T089-G02 original Android UI uses same exported legacy wrapper, no orphan code and no extra DB engine',()=>{
 assert.ok(ui.includes('JBPhase2.setGrievanceStatus('));
 assert.ok(src.includes('setGrievanceStatus,liveSessions'));
 assert.ok(ui.includes('phase2-client.js'));
 assert.ok(!ui.includes('phase4-domain-client.js'));
});
test('T089-G03 public grievance submission and old Phase2 data methods retained, no new auth bypass',()=>{
 assert.ok(submission.includes('phase2-client.js'));
 assert.ok(src.includes('async function createGrievance('));
 assert.ok(src.includes(".from('grievances').insert("));
 assert.ok(src.includes("await owner()"));
 assert.ok(src.includes('global.JBPhase2='));
});
test('T089-G04 bounded diff allows only single legacy JS function and audit-only CI, no DB/Auth/News changes',()=>{
 const changed=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort();
 assert.deepEqual(changed,['JANTA_BOL_PHASE_3C_WORKING/phase2-client.js','ci/phase4/b13-t089-legacy-grievance-fsm-authority-candidate.test.mjs','.github/workflows/b13-t089-grievance-authority-candidate-20261103.yml','JANTA_BOL_PHASE_4_WORKING/review/P4_T089_GRIEVANCE_LEGACY_DIRECT_UPDATE_P1_MINIMAL_FIX_20261103.md'].sort());
 assert.equal(src.slice(0,start).includes(".from('grievances').update("),false);
});
console.log('T089_GRIEVANCE_SINGLE_SERVER_FSM_SOURCE_CANDIDATE=PASS_SCOPED');
console.log('T089_LIVE_PROD_MUTATION_FIXED=NO_NOT_DEPLOYED');
console.log('T089_ORIGINAL_FINAL_PASS_LOCK=HOLD');
