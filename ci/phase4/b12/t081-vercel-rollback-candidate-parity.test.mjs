// T081 READ-ONLY Vercel rollback eligibility and risk, zero production actions.
// GitHub metadata/Vercel LIVE attribution is documented in the associated
// report; these tests compare immutable exact source refs, not secret values.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const OLD='14a929180d99088e950475eeee609cae8e3f01c8';
const LIVE='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const JSBASE='JANTA_BOL_PHASE_3C_WORKING/';
const DOC=readFileSync('JANTA_BOL_PHASE_4_WORKING/b12/P4_T081_NOV01_VERCEL_ROLLBACK_CANDIDATE_SOURCE_RISK.md','utf8');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024}).trim();
const sha=(commit,path)=>git('rev-parse',commit+':'+path);
const src=(commit,path)=>git('show',commit+':'+path);
const app=JSBASE+'add-news.html';
const old=src(OLD,app),live=src(LIVE,app);
const diff=git('diff','--name-only',OLD,LIVE).split('\n').filter(Boolean);
const protectedApps=[
 'vercel.json',JSBASE+'article.html',JSBASE+'admin-auth.js',
 JSBASE+'backend-client.js',JSBASE+'public-c1-projection.js',
 JSBASE+'website-v3.js',JSBASE+'index.html',JSBASE+'published.html',
 JSBASE+'public-ads.js'
];
test('T081-C1: both rollback SHA and served LIVE source really exist',()=>{
 assert.equal(git('rev-parse',OLD),OLD);
 assert.equal(git('rev-parse',LIVE),LIVE);
 assert.equal(git('merge-base',OLD,LIVE),OLD);
});
test('T081-C2: old candidate is exactly three commits behind served live',()=>{
 assert.equal(Number(git('rev-list','--count',OLD+'..'+LIVE)),3);
 assert.equal(Number(git('rev-list','--count',LIVE+'..'+OLD)),0);
});
test('T081-C3: exact three-file delta (one Add News behavior and two CI-only)',()=>{
 assert.deepEqual(diff.sort(),[
 '.github/workflows/b12-t080-admin-retry-review.yml',
 JSBASE+'add-news.html',
 'ci/phase4/b12/t080-admin-ack-failclosed.test.mjs'
 ].sort());
});
test('T081-C4: all nine core Founder/Article/C1/Ads/routes source blobs unchanged across rollback candidate',()=>{
 for(const path of protectedApps){
  const a=sha(OLD,path),b=sha(LIVE,path);
  assert.equal(a,b,'EMERGENCY_ROLLBACK_CORE_SOURCE_DRIFT:'+path);
 }
});
test('T081-C5: Add News page has non-equivalent hashes, cannot silently waive Owner retry hardening',()=>{
 assert.equal(sha(OLD,app),'573c52a8c3c83455af1f3cbd05c26f951ae3b8ff');
 assert.equal(sha(LIVE,app),'7903f3a116da8e217807042a987f556c5a776adb');
 assert.notEqual(old,live);
 assert(live.length>old.length);
});
test('T081-C6: old candidate should NOT be represented as complete T080 retry fidelity',()=>{
 assert.match(DOC,/OLDER_CANDIDATE_FULLY_EQUIVALENT=NO/);
 assert.match(DOC,/T080 Admin Add News retry behavior differs/);
 assert.match(DOC,/may intentionally discard T080 retry hardening/);
});
test('T081-C7: exact Vercel provider deployment IDs and states recorded as candidates only',()=>{
 assert.match(DOC,/dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF/);
 assert.match(DOC,/dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx/);
 assert.match(DOC,/isRollbackCandidate=true/);
 assert.match(DOC,/not that a rollback was executed/);
});
test('T081-C8: release blocked if current-point E8 or Founder traffic signoff missing',()=>{
 assert.match(DOC,/T081 Live rollback NOT_RUN/);
 assert.match(DOC,/T081 current full E8 HOLD/);
 assert.match(DOC,/Do not move an alias just because a candidate is marked READY/);
});
test('T081-C9: no database/user media backup or Vercel secret-value evidence claimed',()=>{
 assert.match(DOC,/not.*restorable secrets\/production configuration backup/i);
 assert.match(DOC,/Supabase development branches list was \*\*empty\*\*/);
 assert.match(DOC,/no values retrieved or exposed/);
});
test('T081-C10: source candidate check cannot authorize old protected Main cutover',()=>{
 assert.match(DOC,/CURRENT_MAIN_SAFE_TO_DEPLOY=NO/);
 assert.match(DOC,/Full E8 HOLD|full E8 HOLD/);
 assert(!DOC.includes('FULL_E8_REAL_RESTORE=PASS'));
});
