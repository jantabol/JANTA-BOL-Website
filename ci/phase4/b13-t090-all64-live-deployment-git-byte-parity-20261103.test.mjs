// T090 Original E7: 32 HTML + 32 JS canonical product production source
// exact deployed-byte verification. PUBLIC FILES ONLY. No client tokens, secrets,
// API keys, cookies, user records, paid accounts, database mutation or redirects off-origin.
// This checks actual hosted bytes, NOT interactive app or E5/E8 full disaster recovery.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const review=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_ALL_64_CANONICAL_ASSETS_LIVE_BYTE_PARITY_20261103.json','utf8'));
const prod='60970abdacf560815b9db3bd819eb467ef984616';
const base='JANTA_BOL_PHASE_3C_WORKING/';
const origin='https://jantabol.in';
const files=fs.readdirSync(base).filter(n=>/^[a-z0-9-]+\.(html|js)$/.test(n)).sort();
test('T090-ALL64-01 exactly 32 HTML + 32 JS canonical product targets, no extras/omissions',()=>{
 assert.equal(review.source_prod_sha,prod);
 assert.equal(review.expected_total,64);
 assert.equal(files.length,64);
 assert.equal(files.filter(n=>n.endsWith('.html')).length,32);
 assert.equal(files.filter(n=>n.endsWith('.js')).length,32);
 assert.equal(new Set(files).size,64);
 assert.equal(review.all64_exact_byte_parity_proven,false,'SOURCE_ONLY_LEDGER_MUST_NOT_PRECLAIM_RUNNING_CI');
});
test('T090-ALL64-02 64/64 exact LIVE HTTPS files equal immutable Git production source bytes, not just HEAD SHA',async()=>{
 assert.equal(files.length,64);
 const gitTree=execFileSync('git',['rev-parse',prod+'^{tree}'],{encoding:'utf8'}).trim();
 assert.match(gitTree,/^[a-f0-9]{40}$/);
 let verified=0;
 const concurrency=5;
 for(let offset=0;offset<files.length;offset+=concurrency){
  const batch=files.slice(offset,offset+concurrency);
  const results=await Promise.all(batch.map(async file=>{
   const original=execFileSync('git',['show',prod+':'+base+file],{maxBuffer:4<<20});
   const requested=origin+'/'+base+file;
   const response=await fetch(requested,{redirect:'follow',signal:AbortSignal.timeout(18000)});
   assert.equal(new URL(response.url).origin,origin,'OFF_DOMAIN_REDIRECT_'+file);
   assert.equal(response.status,200,'PRODUCTION_MISSING_'+file+'_HTTP_'+response.status);
   const live=Buffer.from(await response.arrayBuffer());
   assert.equal(live.length,original.length,'DEPLOYED_BYTE_COUNT_DRIFT_'+file);
   assert.equal(Buffer.compare(live,original),0,'DEPLOYED_BYTE_CONTENT_DRIFT_'+file);
   return file;
  }));
  verified+=results.length;
 }
 assert.equal(verified,64);
});
test('T090-ALL64-03 no fake claim that source parity proves signed account behavior, edge or full restore',()=>{
 assert.equal(review.semantic_requirements_1_339_proven,false);
 assert.equal(review.signed_owner_reporter_E5_run,false);
 assert.equal(review.full_independent_E8_hosted_runtime_restored,false);
 assert.equal(review.original_t090_final_pass_lock,'HOLD');
});
console.log('T090_E7_ALL64_PRODUCTION_GIT_TO_HOST_BYTE_PARITY=PASS_SCOPED');
console.log('T090_E5_SIGNED_ACCOUNTS_AND_E8_FULL_DISASTER_RESTORE=HOLD');
