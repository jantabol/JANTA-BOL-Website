// B13 T085: immutable integration source-parity sentinels, never a FINAL lock.
// Explicitly pin current B12 candidate and baseline to prevent accidental
// old-Main or isolated-preview sources from masquerading as prod-ready.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const LIVE='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const PR94='4678fc504971fc6b9eee0c1ee810c5a2ba2296ba';
const PR84='2becde178080c493e59cfb99743ee043532aabf9';
const PR96='51b3f5fa46708bfeb357b0b61076583e19b04383';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',timeout:12000,maxBuffer:512*1024}).trim();
const blob=(ref,p)=>git('rev-parse',ref+':'+p);
const doc=readFileSync('JANTA_BOL_PHASE_4_WORKING/b13/P4_T085_B12_B13_CROSSMODULE_SOURCE_HANDOFF_20261101.md','utf8');

test('T085-00: exact B12 current integration commit rests on PR94 source without rebuilding',()=>{
  for(const ref of [LIVE,PR84,PR94,PR96])assert.equal(git('rev-parse',ref),ref);
  assert.equal(git('merge-base',PR94,PR96),PR94);
  assert.equal(git('merge-base',PR96,'HEAD'),PR96);
  assert.notEqual(PR96,LIVE);
});
const modules=[
 ['Founder role, MFA and session guards',root+'admin-auth.js','e0c751cbaa6582aa00ffd82d23f03c01956142f7',PR94],
 ['Backend durable same-article primary key retry',root+'backend-client.js','fb2c60d241ef772d4990536b577acc3c7d70fad7',PR84],
 ['Founder edit/new article form recovery',root+'add-news.html','813d00fbf96b31214cce1f4147d14615c3de4be1',PR84],
 ['Public permanent Article read boundary',root+'article.html','98dca1e26f32846b6fba722731acd6d14f0aed41',PR94],
 ['C1 safe published-only projection',root+'public-c1-projection.js','5a09b9442d9ea93a2e06df8524c17fcd2021e62e',PR94],
 ['B9 public archive search',root+'b9-search-ui.js','98b785cc3029aaa70e83b13d7133a69439c67e20',PR94],
 ['B9 Founder analytics and privacy',root+'b9-analytics-ui.js','c07f3cf6005b1f4ab022f9eb3da58b57f2df10d9',PR94],
 ['LIVE admin moderation control',root+'phase3c-live-engine-admin.js','da0777c622acce09e3f251af8c16c2748d33f322',PR94],
 ['Public Ads guarded display',root+'public-ads.js','a450cc3158c4c72692e848d3044ee00e53582082',PR94],
 ['Published news Android nonstuck list',root+'published.html','39fb346dee0e2046f8a833dcd652dd743b911777',PR94],
 ['Public homepage JS safety',root+'script.js','bb91e922d51b4579242cacbc96e62f8a7d9b1075',PR94],
 ['Homepage shell and citizen CTA boundary',root+'index.html','b073e8053955f3c30b3fe8e3fcbc5bdb86ece1ff',PR94],
 ['V3 only-published homepage feed',root+'website-v3.js','716f509578c35f0606eebc6e7292aa8cfcb7bf48',PR94],
 ['Vercel host and route configuration','vercel.json','ae086ea344cc704d279973740defe4d9374c6b6b',PR94],
];
for(const [description,path,expected,origin] of modules){
 test('T085-SOURCE: '+description,()=>{
  assert.equal(blob('HEAD',path),expected,'B13_T085_HEAD_SOURCE_DRIFT:'+path);
  assert.equal(blob(PR96,path),expected,'B13_T085_B12_BRIDGE_DRIFT:'+path);
  assert.equal(blob(origin,path),expected,'B13_T085_ORIGIN_SOURCE_DRIFT:'+path);
 });
}
test('T085-16: original official final-closure order preserved',()=>{
 const reg=readFileSync('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md','utf8');
 assert.match(reg,/P4-T001–P4-T083 -> P4-T092–P4-T109 -> P4-T084–P4-T091 FINAL CLOSURE/);
 assert.match(doc,/T001–T083 → T092–T109 → T084–T091 Final Closure/);
});
test('T085-17: zero fake B12/B13 FINAL LOCK and real E4/E8 no-go remain visible',()=>{
 assert.match(doc,/T085_FORMAL_FINAL=NOT_RUN/);
 assert.match(doc,/B12_FULL_PASS_LOCK=HOLD/);
 assert.match(doc,/B13_FINAL_PASS_LOCK=HOLD/);
 assert.match(doc,/current-point Auth\+Edge\+DB\+Media\+Vercel restore and real traffic rollback \*\*NOT_RUN\*\*/);
});
test('T085-18: integration candidate real no-loss source identity, not a prod release',()=>{
 const diff=git('diff','--name-only',PR94,PR96).split('\n').filter(Boolean);
 for(const p of [root+'backend-client.js',root+'add-news.html'])assert(diff.includes(p),'MISSING_T080_REAL_CHANGE:'+p);
 assert(doc.includes('dpl_D89qkkR5TdjX2GNfB1fsKybXf9ve'));
 assert(doc.includes('NOT real Founder acceptance'));
});
