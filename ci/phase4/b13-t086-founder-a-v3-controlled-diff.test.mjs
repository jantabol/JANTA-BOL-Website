// Founder A / 2026-11-02 — audited controlled V3 baseline, no live DB/secrets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const gitblob=p=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
const read=p=>readFileSync(p,'utf8');
const currentPath='ci/phase4/b12/v3-c1-public-integration.test.cjs';
const frozenPath='ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs';
const governancePath='JANTA_BOL_PHASE_4_WORKING/review/P4_T086_FOUNDER_A_V3_CONTROLLED_BASELINE_20261102.md';
const old=read(frozenPath),now=read(currentPath),doc=read(governancePath);
const historicalCommit='5d5fa9bd703607f890851b7a6d5aad3e80e3285e';
const oldSHA='47452e35d880b3123ff0782f00564d849f5a06ba';
const newSHA='474ff764ae65850863b8142318083964086d4e4e';
const heading=[
'// FOUNDER DECISION A, 2026-11-02 — authorized controlled V3 security baseline.',
'// The original 2026-10-29 test remains unchanged and permanently archived at',
'// ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs',
'// Historical original 10/10 must execute on its authentic original source commit;',
'// current 10/10 is NEVER a substitute for Phase3/Auth/T080 and negative guard tests.',
''
].join('\n');
function replaceOnce(src,find,replacement){
 const n=src.split(find).length-1;
 assert.equal(n,1,'unexpected V3 security baseline source-delta count: '+find);
 return src.replace(find,replacement);
}
test('T086-A01 immutable historic original SHA and updated original test SHA pinned',()=>{
 assert.equal(gitblob(frozenPath),oldSHA);
 assert.equal(gitblob(currentPath),newSHA);
 assert(doc.includes(historicalCommit));
 assert(doc.includes('Founder Decision A'));
});
test('T086-A02 all ten original named V3 cases preserved in exact same order',()=>{
 const pattern=/^test\('([^']+)'/gm;
 const oldNames=[...old.matchAll(pattern)].map(x=>x[1]);
 const newNames=[...now.matchAll(pattern)].map(x=>x[1]);
 assert.equal(oldNames.length,10);
 assert.deepEqual(newNames,oldNames);
});
test('T086-A03 exactly five Founder-approved expectations changed, no other test source edits',()=>{
 let approved=old;
 approved=replaceOnce(approved,
  'assert.match(homepage,/#citizen-news-form,#official-reporter-form\\{display:none!important\\}/);',
  [
   'assert.match(homepage,/#citizen-news-form,#official-reporter-form,#top-story\\[hidden\\]\\{display:none!important\\}/);',
   '  assert.match(homepage,/<form class="citizen-news-form" id="citizen-news-form" hidden inert style="display:none" aria-hidden="true">/);',
   '  assert.match(homepage,/<form id="official-reporter-form" class="official-reporter-form" hidden inert style="display:none" aria-hidden="true">/);',
   '  assert.match(homepage,/<section class="breaking-news" id="top-story" hidden aria-live="polite">/);'
  ].join('\n'));
 approved=replaceOnce(approved,'assert.match(homepage,/जमा नहीं होगी/);',
  [
    'assert.match(homepage,/यहाँ कोई जानकारी जमा नहीं होती।/);',
    '  assert.match(homepage,/ऑनलाइन आवेदन अभी स्वीकार नहीं किया जा रहा है।/);'
  ].join('\n'));
 approved=replaceOnce(approved,
  "'b12-safe-nav.js':'ede5edac22f85759facb72b189c0b90a245f0d6c'",
  "'b12-safe-nav.js':'a2107140321c2e099e785c678213ad278cbcfd5f'");
 approved=replaceOnce(approved,
  "'backend-client.js':'0789934809c91a39d73a6d2570d0938fb6fbb47a'",
  "'backend-client.js':'fb2c60d241ef772d4990536b577acc3c7d70fad7'");
 approved=replaceOnce(approved,
  "'c4b515325b5766489e4af90a143887d98f8aaa8a','vercel route baseline'",
  "'ae086ea344cc704d279973740defe4d9374c6b6b','vercel route baseline'");
 assert.equal(now.replace(heading,''),approved,'original tests changed beyond Founder approval');
});
test('T086-A04 historic V3 official tests remain in archive, not silently deleted',()=>{
 assert(doc.includes(frozenPath));
 assert(doc.includes('byte-for-byte'));
 assert(old.includes('V3 uses published-only RPC'));
 assert(old.includes('Protected Founder/Auth source files remain byte-identical'));
});
test('T086-A05 strict disabled form guards and private/public exclusions preserved',()=>{
 for(const marker of [
 'id="citizen-news-form" hidden inert style="display:none" aria-hidden="true"',
 'id="official-reporter-form" class="official-reporter-form" hidden inert',
 'id="top-story" hidden aria-live="polite"',
 'verification_evidence,undefined','owner_email,undefined',
 'PUBLIC_C1_RPC_UNAVAILABLE','PUBLIC_C1_INVALID_PROJECTION',
 'Published News action','adminPreview'
 ])assert(now.includes(marker),marker);
});
test('T086-A06 published-route private headers and old Founder Auth pins intact',()=>{
 const vercel=JSON.parse(read('vercel.json'));
 const h=vercel.headers.find(x=>x.source.includes('|published|'));
 assert(h);
 assert(h.headers.some(x=>x.key==='Cache-Control'&&x.value==='private, no-store, max-age=0'));
 for(const [p,sha] of [
 ['JANTA_BOL_PHASE_3C_WORKING/admin-auth.js','e0c751cbaa6582aa00ffd82d23f03c01956142f7'],
 ['JANTA_BOL_PHASE_3C_WORKING/admin-login.html','2254f94ce40d49cda0ed0076311d511685036fc3'],
 ['JANTA_BOL_PHASE_3C_WORKING/admin-security.html','b4dcaf30fb4a64a4848e772928a3bb8d15415534']
 ])assert.equal(gitblob(p),sha);
});
test('T086-A07 reviewed safe-nav and T080 Article CAS pins match tested current source',()=>{
 assert.equal(gitblob('JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js'),
  'a2107140321c2e099e785c678213ad278cbcfd5f');
 assert.equal(gitblob('JANTA_BOL_PHASE_3C_WORKING/backend-client.js'),
  'fb2c60d241ef772d4990536b577acc3c7d70fad7');
 assert.equal(gitblob('vercel.json'),
  'ae086ea344cc704d279973740defe4d9374c6b6b');
});
test('T086-A08 governance never upgrades Android/Provider E3-E5 to fake Final PASS',()=>{
 for(const marker of ['T086_REAL_ANDROID_ARTICLE_E3=NOT_RUN',
 'T086_REAL_SAME_ARTICLE_PURL_CORRECT_UNPUBLISH_REPUBLISH_E4=NOT_RUN',
 'T086_REAL_PROVIDER_LIVE_E5=NOT_RUN',
 'T086_OFFICIAL_FINAL_PASS_LOCK=HOLD',
 'T086_CURRENT_MFA_CORRECTION_DEEP_LINK=KNOWN_LIMITATION_NOT_FIXED'])
 assert(doc.includes(marker),marker);
 assert(!doc.includes('T086_OFFICIAL_FINAL_PASS_LOCK=PASS'));
});
