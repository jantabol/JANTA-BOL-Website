// P4-T087 / RUN15 — original 13 cross-module families, read-only E1 SECURITY SOURCE negative coverage.
// All execution E2/RLS and E5 live audit proof is separate; no credential, network or Production mutation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const read=p=>readFileSync(p,'utf8');
const exist=paths=>paths.forEach(p=>assert(existsSync(p),'T087_MISSING_PROTECTED_FILE: '+p));
const families=[
 ['News & Article',[
  root+'backend-client.js',root+'article.html','ci/phase4/b12/t080-durable-article-intent.test.mjs',
  'ci/phase4/b13-t086-run15-lifecycle-full.test.mjs']],
 ['Grievance',[
  root+'grievances.html','ci/phase4/b11/t071-c2-all-13-scoped-fault-proof-contract.test.mjs',
  'ci/phase4/b10-whole-platform-security-source.test.mjs']],
 ['Compliance',[
  root+'compliance.html','ci/phase4/p4-t019-publishing-fault-injection.cjs',
  'ci/phase4/b11/t071-thirteen-actual-adapters-isolated-faults.test.mjs']],
 ['Team & Founder Auth',[
  root+'admin-auth.js',root+'admin-login.html',root+'admin-security.html',
  'ci/phase4/b12/founder-auth-readonly-regression.test.cjs',
  'ci/phase4/b10-t063-auth-manual-preflight.test.mjs']],
 ['Social publication',[
  'ci/phase4/b11/t071-c2-all-13-scoped-fault-proof-contract.test.mjs',
  'ci/phase4/b8-live-parity-static.test.mjs']],
 ['Advertising & payment',[
  root+'ads.html',root+'advertiser-portal.html',root+'b7-ad-revocation-bridge.js',
  'ci/phase4/b7-cp02-five-safety-gates.test.mjs',
  'ci/phase4/b7-t041-no-paid-source-gate.test.cjs']],
 ['Notification & safe failure',[
  'ci/phase4/b11/t071-c2-all-13-scoped-fault-proof-contract.test.mjs',
  'ci/phase4/b8-g9-due-dashboard-android.test.mjs',
  'ci/phase4/b8-g7-chronology-android.test.mjs']],
 ['Audit & retention',[
  'ci/phase4/b10-t067-incident-source-and-rca.test.mjs',
  'ci/phase4/b10-t068-evidence-reconciliation.test.mjs',
  'ci/phase4/b8-g7-chronology-android.test.mjs']],
 ['Search & analytics',[
  root+'b9-client.js','ci/phase4/b9-client-and-ui.test.mjs',
  'ci/phase4/b12/t080-geo-coverage-public-c1.test.mjs']],
 ['B8 accountability & private case',[
  root+'b8-accountability-client.js',root+'b8-accountability.html',
  'ci/phase4/b8-t094-cp02-right-to-reply-security.test.mjs',
  'ci/phase4/b8-t098-correction-notification-retention-source.test.mjs']],
 ['Phase3A/3B controlled Live',[
  root+'phase3a-live-client.js',root+'phase3c-live-delivery.js',
  'ci/phase3-regression/functional-live-evidence.cjs',
  'ci/phase3-regression/static-p3-final-p4-regression.cjs']],
 ['Backup & recovery',[
  'ci/phase4/b11/t070-final-e8-gate.test.mjs',
  'ci/phase4/b11/t070-real-joint-manual-safety.test.mjs',
  'ci/phase3-regression/static-p3-recovery-regression.cjs']],
 ['Cross-role/unauthorized/public/whole-platform',[
  'ci/phase4/b10-whole-platform-security-source.test.mjs',
  'ci/phase4/b10-t064-source-secrets-gate.test.mjs',
  'ci/phase4/b10-t068-evidence-reconciliation.test.mjs',
  'ci/phase4/b12/v3-c1-public-integration.test.cjs']]
];
for(let i=0;i<families.length;i++){
 const [name,paths]=families[i];
 test('T087-M'+String(i+1).padStart(2,'0')+' original family exists, mandatory original negative/source adapters retained: '+name,
  ()=>exist(paths));
}
test('T087-M14 complete original 109 Test IDs and honest P4-T087 still not falsely PASS',()=>{
 const txt=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
 const entries=[...txt.matchAll(/^\| P4-T(\d{3}) \|/gm)].map(x=>x[1]);
 assert.equal(entries.length,109);
 assert.equal(new Set(entries).size,109);
 const t=txt.split('\n').find(x=>x.startsWith('| P4-T087 |'));
 assert(t?.includes('Whole Phase-4 Module Regression + Security Negatives'));
 assert(t?.includes('NOT RUN — FINAL') || t?.includes('IN PROGRESS') || t?.includes('HOLD'));
 assert(!t?.includes('| PASS |'),'No security-wide fake pass');
});
test('T087-M15 original Founder Owner AAL2/session, private news and no fake Live guard sources remain',()=>{
 const auth=read(root+'admin-auth.js');
 const backend=read(root+'backend-client.js');
 const publicClient=read(root+'public-c1-projection.js');
 const live=read(root+'website-v3.js');
 for(const p of [
  "aal?.currentLevel!=='aal2'",'JBBackend.serverSessionValid()'
 ])assert(auth.includes(p),'MISSING_OWNER_GUARD: '+p);
 assert(backend.includes('await requireOwner()'));
 assert(backend.includes('VERSION_CONFLICT'));
 assert(publicClient.includes("row.status !== 'published'"));
 assert(live.includes(".in('public_status',['LIVE','INTERRUPTED'])"));
});
test('T087-M16 whole-platform root product files identical to reviewed T086, no silent rebuild',()=>{
 const base='e5cb88f98ec6f5a7f9e71c6e4b1fa1291a74ee71';
 for(const folder of ['JANTA_BOL_PHASE_3C_WORKING','CODEX_CURRENT_SUPABASE','JANTA_BOL_PHASE_4_WORKING/db']){
  const d=execFileSync('git',['diff','--name-only',base,'HEAD','--',folder],{encoding:'utf8'}).trim();
  assert.equal(d,'','Product/protected database changed without authorization: '+folder+' '+d);
 }
});
test('T087-M17 must not reclassify original T063/T065 or B11 E8 external dependency as hosted PASS',()=>{
 const doc=read('JANTA_BOL_PHASE_4_WORKING/review/P4_T087_WHOLE_PLATFORM_SECURITY_PRECHECK_20261102.md');
 for(const s of [
  'T087_REAL_HOSTED_CROSS_ACCOUNT_HTTPS_NEGATIVES=DUE',
  'T087_WHOLE_PLATFORM_E1_E2_E5_RECONCILIATION=PARTIAL',
  'T087_ORIGINAL_FULL_PASS_LOCK=HOLD',
  'T087_FOUNDER_ANDROID_MANUAL_STEP=NONE_NOW'
 ])assert(doc.includes(s),s);
 assert(!doc.includes('T087_ORIGINAL_FULL_PASS_LOCK=PASS'));
});
test('T087-M18 original T086 16-case history lock and Founder safe nav exact files preserved',()=>{
 exist(['ci/phase4/b13/history/b13-t086-article-share-live-source-20261102-pre-lock.mjs',
  'ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs',
  'ci/phase4/b12/history/v3-c1-public-integration-20261102-founder-a-v1.cjs',
  'ci/phase4/b13-t086-owner-correction-post-mfa-safe-nav.test.mjs']);
 const d=execFileSync('git',['diff','--name-only',
 'e5cb88f98ec6f5a7f9e71c6e4b1fa1291a74ee71','HEAD','--',
 'ci/phase4/b13-t086-article-share-live-source.test.mjs',
 'ci/phase4/b13/history','ci/phase4/b12/history'],{encoding:'utf8'}).trim();
 assert.equal(d,'');
});
