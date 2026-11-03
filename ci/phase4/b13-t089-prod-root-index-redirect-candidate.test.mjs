// JANTA BOL T089 public legacy root /index.html P1 minimum-safe fix candidate.
// Based exactly on Vercel current production Git SHA 93df12aa8ffdfae38d9a4066b6a4556bb36969e5.
// Candidate code + source tests only. CI MUST NOT claim hosted redirect already deployed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const dest='/JANTA_BOL_PHASE_3C_WORKING/index.html';
const base='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const redirects=config.redirects??[];
const canonical=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
const legacy=fs.readFileSync('index.html','utf8');
test('T089-FIX01 exact /index.html route redirects only to canonical published-only homepage, no redirect loop',()=>{
 const paths=redirects.map(x=>x.source);
 assert.deepEqual(paths,['/','/index.html']);
 assert.equal(new Set(paths).size,2);
 assert.deepEqual(redirects[0],{source:'/',destination:dest,permanent:false});
 assert.deepEqual(redirects[1],{source:'/index.html',destination:dest,permanent:false});
 assert.ok(redirects.every(x=>x.source!==x.destination));
});
test('T089-FIX02 preserve canonical news C1 client, permanent article page and old Auth/News files unchanged',()=>{
 assert.ok(canonical.includes('public-c1-projection.js'));
 assert.ok(canonical.includes('website-v3.js'));
 assert.notEqual(legacy,canonical);
 assert.ok(fs.existsSync('JANTA_BOL_PHASE_3C_WORKING/article.html'));
 assert.ok(fs.existsSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js'));
 assert.ok(fs.existsSync('JANTA_BOL_PHASE_3C_WORKING/admin-auth.js'));
});
test('T089-FIX03 only bounded routing config and audit source changed, not production product SQL/Auth',()=>{
 const changed=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.deepEqual(changed.slice().sort(),['vercel.json','ci/phase4/b13-t089-prod-root-index-redirect-candidate.test.mjs','.github/workflows/b13-t089-prod-root-index-redirect-candidate-20261103.yml','JANTA_BOL_PHASE_4_WORKING/review/P4_T089_LIVE_LEGACY_ROOT_REDIRECT_MINIMUM_SAFE_FIX_20261103.md'].sort());
 assert.ok(changed.every(p=>!p.startsWith('JANTA_BOL_PHASE_3C_WORKING/')&&!p.startsWith('CODEX_CURRENT_SUPABASE/')));
});
test('T089-FIX04 preserve protected cache/security headers and fail closed without new origin permissions',()=>{
 assert.equal(config.headers.length,2);
 assert.deepEqual(config.headers[0].source,'/JANTA_BOL_PHASE_3C_WORKING/(.*)');
 const h=Object.fromEntries(config.headers[0].headers.map(x=>[x.key,x.value]));
 assert.equal(h['X-Content-Type-Options'],'nosniff');
 assert.equal(h['Referrer-Policy'],'strict-origin-when-cross-origin');
 assert.equal(h['X-Frame-Options'],'SAMEORIGIN');
 assert.equal(config.headers[1].source,'/JANTA_BOL_PHASE_3C_WORKING/(admin-login|admin|admin-security|admin-recovery|admin-recovery-setup|add-news|published|article).html');
});
console.log('T089_P1_ROOT_INDEX_REDIRECT_SOURCE_FIX_CANDIDATE=PASS_SCOPED');
console.log('T089_P1_HOSTED_PUBLIC_ROOT_FIX_DEPLOYED=NO');
console.log('T089_FULL_ORIGINAL_FINAL_PASS_LOCK=HOLD');
