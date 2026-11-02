// B13 / P4-T086 — release boundary source review only.
// No deployment, connected auth, private evidence, network or production mutations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const oldProduction='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const t080Preview='51b3f5fa46708bfeb357b0b61076583e19b04383';
const t097Preview='725df42de228bbe3fb1c263ee7b24455707b743f';
const approvedT086='edecc6290a0c87e36b7510dafffa11f4ad74e9f3';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const page=root+'b12-safe-nav.js';
const run=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const blob=(rev,path)=>run('rev-parse',rev+':'+path);
const file=(path)=>readFileSync(path,'utf8');
const changed=(base,head)=>run('diff','--name-only',base,head,'--',root).split('\n').filter(Boolean).sort();
const articleProtected=[root+'backend-client.js',root+'add-news.html',root+'published.html',
 root+'admin-auth.js',root+'admin-login.html',root+'article.html'];
const expectedFullProd=[
 root+'add-news.html',root+'b12-safe-nav.js',root+'b8-accountability-client.js',
 root+'b8-accountability-ui.js',root+'b8-accountability.html',
 root+'backend-client.js',root+'index.html',root+'published.html',root+'script.js'
].sort();
const expectedT080=[root+'b12-safe-nav.js',root+'b8-accountability-client.js',
 root+'b8-accountability-ui.js',root+'b8-accountability.html'].sort();
const report=file('JANTA_BOL_PHASE_4_WORKING/review/P4_T086_RELEASE_SCOPE_AND_SOFT_LAUNCH_GATE_20261102.md');
test('T086-G01 current release-scope branch descended from exact reviewed A2 source without altering product code',()=>{
 assert.equal(run('merge-base',approvedT086,'HEAD'),approvedT086);
 const p=run('diff','--name-only',approvedT086,'HEAD').split('\n').filter(Boolean);
 const allowed=[
  'JANTA_BOL_PHASE_4_WORKING/review/P4_T086_RELEASE_SCOPE_AND_SOFT_LAUNCH_GATE_20261102.md',
  'ci/phase4/b13-t086-release-source-boundary.test.mjs',
  '.github/workflows/b13-t086-release-scope-20261102.yml'
 ];
 assert(p.length===3,'Unexpected source changes since already-tested A2: '+p.join(','));
 assert.deepEqual(p.slice().sort(),allowed.sort());
});
test('T086-G02 original exact production source delta is NINE old product files, not one',()=>{
 assert.deepEqual(changed(oldProduction,'HEAD'),expectedFullProd);
 assert.equal(expectedFullProd.length,9);
});
test('T086-G03 original T080 preview source delta is exactly four known product files',()=>{
 assert.deepEqual(changed(t080Preview,'HEAD'),expectedT080);
});
test('T086-G04 actual T097 READY isolated preview source delta is exactly one nav file',()=>{
 assert.deepEqual(changed(t097Preview,'HEAD'),[page]);
});
test('T086-G05 no original Creator/Owner login/Live/Ads/DB config changed vs verified A2 CI',()=>{
 for(const p of [root+'admin-auth.js',root+'admin-login.html',root+'backend-client.js',
  root+'add-news.html',root+'published.html',root+'article.html',root+'index.html',
  root+'phase3a-live-client.js',root+'phase3c-live-delivery.js',
  root+'b8-accountability-client.js',root+'b8-accountability-ui.js',
  root+'b8-accountability.html','vercel.json']){
  assert.equal(blob(approvedT086,p),blob('HEAD',p),'Protected source changed '+p);
 }
});
test('T086-G06 the only nav file difference vs T097 preview exactly matches A2 review blob',()=>{
 assert.equal(blob(t097Preview,page),'a2107140321c2e099e785c678213ad278cbcfd5f');
 assert.equal(blob('HEAD',page),'d2d2742e46d3d373f6a6dd549f9d7b0fe684b862');
 assert.equal(blob(approvedT086,page),blob('HEAD',page));
});
test('T086-G07 A1 and O historical test source stays immutable and dual A2 canon preserved',()=>{
 for(const [p,sha] of [
  ['ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs','47452e35d880b3123ff0782f00564d849f5a06ba'],
  ['ci/phase4/b12/history/v3-c1-public-integration-20261102-founder-a-v1.cjs','474ff764ae65850863b8142318083964086d4e4e'],
  ['ci/phase4/b12/v3-c1-public-integration.test.cjs','ba03508b617ec6388bed458d986758383ba60943']
 ])assert.equal(blob('HEAD',p),sha,p);
 assert(file('ci/phase4/b12/v3-c1-public-integration.test.cjs').includes("b12-safe-nav.js"));
});
test('T086-G08 production release authorization not implied by an SSO isolated preview or Draft PR',()=>{
 for(const marker of [
 'T086_DIRECT_STACKED_PR108_PRODUCTION_PROMOTION=BLOCKED_9_PRODUCT_FILE_DELTA',
 'T086_ISOLATED_PREVIEW_REAL_OWNER_AUTH=NOT_PROVEN_OR_ENABLED',
 'T086_RELEASE_CANDIDATE_PRODUCTION_AUDIT=NOT_RUN',
 'T086_REAL_ANDROID_POST_MFA_CORRECTION_E3=NOT_RUN',
 'T086_REAL_SAME_ARTICLE_CORRECTION_AND_REPUBLISH_E4=NOT_RUN',
 'T086_REAL_LIVE_ENCODER_PROVIDER_E5=NOT_RUN',
 'T086_OFFICIAL_FINAL_PASS_LOCK=HOLD'
 ])assert(report.includes(marker),marker);
 assert(!report.includes('T086_OFFICIAL_FINAL_PASS_LOCK=PASS'));
});
test('T086-G09 current README/documentation does not grant realtime edits and original old Security/Auth unaffected',()=>{
 const nav=file(page);
 const auth=file(root+'admin-auth.js');
 const login=file(root+'admin-login.html');
 assert(nav.includes("from === 'published'"));
 assert(nav.includes("UUID.test(edit || '')"));
 assert(nav.includes("params.getAll('edit').length !== 1"));
 assert(auth.includes("aal?.currentLevel!=='aal2'"));
 assert(auth.includes('JBBackend.serverSessionValid()'));
 assert(login.includes('window.JBProdSafeNav.target(target)'));
 assert(login.includes('mfaChallengeAndVerify('));
});
