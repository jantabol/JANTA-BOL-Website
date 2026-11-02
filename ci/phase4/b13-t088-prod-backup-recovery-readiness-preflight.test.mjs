// P4-T088 original RUN15 784-792: fail-hard E1 source gate; real E3/E6/E8 are separate.
// This test MUST NOT be cited as real recovery, multi-device, production AUTH/API, or external Live.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=(f)=>readFileSync(f,'utf8');
const requirePaths=(paths)=>{for(const p of paths) assert.ok(existsSync(p),'T088_SOURCE_MISSING: '+p);};
const dossier='JANTA_BOL_PHASE_4_WORKING/review/P4_T088_PRODUCTION_RECOVERY_READINESS_START_20261102.md';
const register='JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md';

test('T088-01 original RUN15 scope and all 4 evidence types E1/E3/E6/E8 explicitly protected',()=>{
 const d=read(dossier);
 for(const x of ['P4-T088','784–792','E1 + E3 + E6 + E8','real restore','Final PASS+LOCK = HOLD']){
  assert.ok(d.includes(x),'T088_ORIGINAL_GATE_OMITTED: '+x);
 }
});
test('T088-02 original 109 IDs, only T088 IN PROGRESS; prior T087 scoped lock not false full PASS',()=>{
 const reg=read(register);
 const ids=[...reg.matchAll(/^\| P4-T(\d{3}) \|/gm)].map(x=>x[1]);
 assert.equal(ids.length,109,'original 109 test rows must remain present');
 assert.equal(new Set(ids).size,109,'original 109 test IDs must be unique');
 const get=(n)=>reg.split('\n').find(x=>x.startsWith('| P4-T'+n+' |'));
 assert.ok(get('086')?.includes('| PASS |'),'T086 original locked result missing');
 assert.ok(get('087')?.includes('SCOPED PASS+LOCK') && get('087')?.includes('FINAL PASS+LOCK HOLD'),'T087 original outstanding E2/E5 must be preserved');
 assert.ok(get('088')?.includes('IN PROGRESS') && get('088')?.includes('Final Lock HOLD'),'T088 must not be false PASS');
 assert.ok(get('089')?.includes('NOT RUN'),'T089 must not be started by T088');
});
test('T088-03 real DB/Media backup workflow entry points and real manual controls preserved',()=>{
 requirePaths([
  '.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml',
  '.github/workflows/b11-storage-media-MANUAL.yml',
  '.github/workflows/b11-t069-backup-run-health-readonly.yml',
  '.github/workflows/b11-t070-real-joint-restore-MANUAL.yml',
  '.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml',
  'ci/backup/jb-free-offsite-backup.sh',
  'ci/phase4/b11/t070-final-e8-gate.test.mjs',
  'ci/phase4/b11/t070-real-joint-manual-safety.test.mjs'
 ]);
 const t070=read('.github/workflows/b11-t070-real-joint-restore-MANUAL.yml');
 assert.match(t070,/workflow_dispatch/,'real restore must be explicit and manual');
 const dossierText=read(dossier);
 assert.match(dossierText,/real joint restore \*\*NOT_RUN\*\*/,'No false real restore proof');
});
test('T088-04 original Phase3 security/core + 13 failure families remain runnable and not bypassed',()=>{
 requirePaths([
  'ci/phase3-regression/static-p3-security-regression.cjs',
  'ci/phase3-regression/static-p3-recovery-regression.cjs',
  'ci/phase3-regression/static-p3-incident-regression.cjs',
  'ci/phase4/b11/t071-c2-all-13-scoped-fault-proof-contract.test.mjs',
  'ci/phase4/b11/t070-final-e8-gate.test.mjs',
  'ci/phase4/b10-t068-evidence-reconciliation.test.mjs',
  'ci/phase4/b13-t087-cross-module-security-negative-map.test.mjs'
 ]);
});
test('T088-05 existing production domain/HTTPS read-only checks retained; E6 not invented',()=>{
 requirePaths([
  '.github/workflows/b12-t076-current-prod-domain-https-READONLY.yml',
  '.github/workflows/b12-t076-integrated-https-readonly.yml',
  'JANTA_BOL_PHASE_3C_WORKING/index.html',
  'JANTA_BOL_PHASE_3C_WORKING/backend-client.js',
  'JANTA_BOL_PHASE_3C_WORKING/supabase-config.js'
 ]);
 const d=read(dossier);
 assert.ok(d.includes('authenticated production API and external provider readiness'),'E6 real integration not silently waived');
});
test('T088-06 original Android multi-device/news, founder session/AAL2 and audit safety test files retained',()=>{
 requirePaths([
  'ci/phase4/b12/t080-android-reload-reconciliation.test.mjs',
  'ci/phase4/b12/t080-admin-ack-failclosed.test.mjs',
  'ci/phase4/b12/founder-auth-readonly-regression.test.cjs',
  'ci/phase4/b12/t083-current-live-public-truth-safety.test.mjs',
  'ci/phase4/b13-t086-run15-lifecycle-full.test.mjs',
  'JANTA_BOL_PHASE_3C_WORKING/admin-auth.js',
  'JANTA_BOL_PHASE_3C_WORKING/add-news.html'
 ]);
});
test('T088-07 backup/restore/source-only evidence cannot be mistaken for E8 or E3',()=>{
 const d=read(dossier);
 for(const x of ['Backup must actually be usable','No blanket original T087 final PASS claim','single distinct action/device/expected/proof']){
  assert.ok(d.includes(x),'False acceptance risk: '+x);
 }
 const m=read('ci/phase4/b11/t070-real-joint-manual-safety.test.mjs');
 assert.ok(m.includes('guardManual'),'T070 real manual safety guard removed');
});
test('T088-08 T087 evidence branch is unchanged; T088 only adds CI/dossier/register (no old test or product modification)',()=>{
 const base='48260e31e8e69dc12d6905c5765b0341f3538192';
 const changed=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allow=new Set([
  dossier,register,
  'ci/phase4/b13-t088-prod-backup-recovery-readiness-preflight.test.mjs',
  'ci/phase4/b13-t088-prod-anon-rpc-readonly.mjs',
  '.github/workflows/b13-t088-prod-backup-readiness-preflight-20261102.yml'
 ]);
 for(const p of changed) assert.ok(allow.has(p),'T088_UNAUTHORIZED_SOURCE_OR_BACKUP_CHANGE: '+p);
 assert.equal(changed.filter(p=>p.startsWith('JANTA_BOL_PHASE_3C_WORKING/')).length,0);
 assert.equal(changed.filter(p=>p.startsWith('JANTA_BOL_PHASE_4_WORKING/db/')).length,0);
});
