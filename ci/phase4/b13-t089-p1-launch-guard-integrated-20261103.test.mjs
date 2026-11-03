// JANTA BOL P4 T089: combined P1 release-candidate source gate.
// Built from exact current-production SHA, no release or DB writes.
// Hosted verification of built SHA must occur separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const root='JANTA_BOL_PHASE_3C_WORKING/';
const read=p=>fs.readFileSync(p,'utf8');
const cfg=JSON.parse(read('vercel.json'));
const legacy=read(root+'phase2-client.js');
const ui=read(root+'grievances.html');
const canonical=read(root+'index.html');
const article=read(root+'article.html');
const owner=read(root+'admin-auth.js');
const backend=read(root+'backend-client.js');
test('P4-T089-P1-01 both / and /index.html converge to existing canonical published-only homepage without loops',()=>{
 const routes=cfg.redirects;
 assert.deepEqual(routes,[
  {source:'/',destination:'/JANTA_BOL_PHASE_3C_WORKING/index.html',permanent:false},
  {source:'/index.html',destination:'/JANTA_BOL_PHASE_3C_WORKING/index.html',permanent:false}
 ]);
 assert.equal(new Set(routes.map(x=>x.source)).size,2);
 assert.ok(canonical.includes('public-c1-projection.js'));
 assert.ok(canonical.includes('website-v3.js'));
});
test('P4-T089-P1-02 old Owner Grievance method calls existing server FSM instead of direct UPDATE',()=>{
 const start=legacy.indexOf('async function setGrievanceStatus(id,status,note){');
 const end=legacy.indexOf('async function liveSessions()',start);
 assert.ok(start>0&&end>start);
 const body=legacy.slice(start,end);
 assert.ok(body.includes('await owner()'));
 assert.ok(body.includes(".rpc('jb_grievance_transition_internal'"));
 assert.ok(body.includes('p_id:id,p_status:status,p_note:note'));
 assert.ok(body.includes('GRIEVANCE_TRANSITION_UNCONFIRMED'));
 assert.equal(body.includes(".from('grievances').update("),false);
 assert.equal(legacy.includes(".from('grievances').update("),false);
 assert.ok(ui.includes('JBPhase2.setGrievanceStatus('),'existing UI still uses unchanged facade');
});
test('P4-T089-P1-03 public grievance submission stays unchanged, fail-closed server authority preserved',()=>{
 assert.ok(legacy.includes('async function createGrievance('));
 assert.ok(legacy.includes(".from('grievances').insert("));
 assert.ok(owner.includes('aal'));
 assert.ok(backend.includes('requireOwner()'));
});
test('P4-T089-P1-04 routing security headers, old Auth, C1 and immutable Article page stay present',()=>{
 assert.equal(cfg.headers.length,2);
 const h=Object.fromEntries(cfg.headers[0].headers.map(x=>[x.key,x.value]));
 assert.equal(h['X-Content-Type-Options'],'nosniff');
 assert.equal(h['X-Frame-Options'],'SAMEORIGIN');
 assert.equal(h['Referrer-Policy'],'strict-origin-when-cross-origin');
 assert.ok(article.includes('public-c1-projection.js'));
 assert.ok(backend.includes(".from('articles')"));
});
test('P4-T089-P1-05 no hidden SQL, Owner/auth, published-news, backup or Edge source changes',()=>{
 const allowed=['vercel.json',root+'phase2-client.js','ci/phase4/b13-t089-p1-launch-guard-integrated-20261103.test.mjs','.github/workflows/b13-t089-p1-combined-launch-guard-20261103.yml','JANTA_BOL_PHASE_4_WORKING/review/P4_T089_TWO_P1_COMBINED_SAFE_REVIEW_20261103.md'].sort();
 const current=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort();
 assert.deepEqual(current,allowed);
 assert.ok(!current.some(x=>x.includes('/db/')||x.startsWith('CODEX_CURRENT_SUPABASE/')));
});
console.log('T089_P1_INTEGRATED_SOURCE_AND_PROTECTED_PRODUCT_GATE=PASS_SCOPED');
console.log('T089_P1_PUBLIC_HOSTED_RELEASE_GATE=DUE_NOT_DEPLOYED');
console.log('T089_ORIGINAL_FULL_FINAL_PASS_LOCK=HOLD');
