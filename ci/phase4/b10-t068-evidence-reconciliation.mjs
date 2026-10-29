#!/usr/bin/env node
// JANTA BOL B10 original P4-T068: evidence reconciliation, NEVER auto-grant a lock.
// Reads only versioned Register and anchored source references, no LIVE user tokens.
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const source=readFileSync(resolve(root,'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md'),'utf8');
const records=new Map();
for(const line of source.split(/\r?\n/)){
 const m=line.match(/^\|\s*(P4-T\d{3})\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/);
 if(!m)continue;
 if(records.has(m[1]))throw new Error('DUPLICATE_ORIGINAL_TEST_'+m[1]);
 records.set(m[1],{topic:m[2].trim(),description:m[3].trim(),block:m[4].trim(),status:m[5].trim()});
}
if(records.size!==109)throw new Error('ORIGINAL_109_TEST_REGISTER_DRIFT_'+records.size);
const required={
 'P4-T060':'B10','P4-T061':'B10','P4-T062':'B10',
 'P4-T063':'B10','P4-T064':'B10','P4-T065':'B10',
 'P4-T066':'B10','P4-T067':'B10','P4-T068':'B10'
};
for(const [id,block] of Object.entries(required)){
 if(records.get(id)?.block!==block)throw new Error('MISSING_OR_RENUMBERED_'+id);
}
const locked=id=>/^PASS\s*\+\s*LOCK\b/i.test(records.get(id)?.status??'');
for(const id of ['P4-T061','P4-T062','P4-T067']){
 if(!locked(id))throw new Error('REGRESSION_PREVIOUS_CERTIFIED_LOCK_'+id);
}
const expectedSources=[
 'ci/phase4/b10-t063-auth-manual-preflight.test.mjs',
 'ci/phase4/b10-t065-disposable-signed-http.test.mjs',
 'ci/phase4/b10-t066-disposable-signed-revocation.test.mjs',
 'ci/phase4/b10-t067-incident-contained-audit-notify-pg17.sql',
 'ci/phase3-regression/static-p3-security-regression.cjs',
 'ci/phase3-regression/static-p3-recovery-regression.cjs',
 'ci/phase3-regression/static-p3-incident-regression.cjs',
 'ci/phase4/build_b0_b10_full_source_zip.py',
 '.github/workflows/b10-whole-platform-security-candidate.yml',
 'JANTA_BOL_PHASE_4_WORKING/review/P4_T067_FINAL_INCIDENT_AUDIT_CONTAINMENT_RCA_PASS_LOCK_20261024.md'
];
for(const file of expectedSources)if(!existsSync(resolve(root,file)))
 throw new Error('MISSING_PROTECTED_EVIDENCE_SOURCE_'+file);
const openB10=Object.keys(required).filter(id=>id!=='P4-T068'&&!locked(id))
 .map(id=>({id,status:records.get(id).status,needed:true}));
const openPredecessors=[
 ...Array.from({length:8},(_,i)=>'P4-T'+String(i+92).padStart(3,'0')),
 'P4-T105'
].filter(id=>!locked(id)).map(id=>({id,status:records.get(id)?.status??'MISSING'}));
let sha='UNAVAILABLE';
try{sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',timeout:4000}).trim()}catch{}
const outcome={
 schema:'janta-bol-p4-t068-b10-final-gate-v1',
 source_sha:sha,test:'P4-T068',
 review_complete:true,
 b10_original_count:9,
 original_test_count:records.size,
 locked_prior:['P4-T061','P4-T062','P4-T067'],
 outstanding_b10:openB10,
 outstanding_predecessor_tests:openPredecessors,
 workflow_result_is_not_production_attestation:true,
 evidence_requirements:['E1','E2','E5','E7'],
 official_final_lock:'HOLD',
 requires_human_verification_of_live_evidence:true,
 reason:'T068 cannot close while any original B10 or prior required evidence is incomplete; E1/CI or a source ZIP is not a hosted E2/E5/E7 certificate.'
};
console.log(JSON.stringify(outcome,null,2));
if(process.argv.includes('--require-lock')){
 if(openB10.length||openPredecessors.length){process.stderr.write(
  'T068_LOCK_BLOCKED_FAIL_CLOSED: '+openB10.map(x=>x.id).join(',')+
  '; predecessor '+openPredecessors.map(x=>x.id).join(',')+'\n');
  process.exitCode=3;
 }else{
  process.stderr.write('T068_MANUAL_EVIDENCE_ATTESTATION_REQUIRED: do not autolock even when register changes\n');
  process.exitCode=4;
 }
}
