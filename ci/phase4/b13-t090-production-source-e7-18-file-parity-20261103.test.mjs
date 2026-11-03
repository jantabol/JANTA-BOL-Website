// JANTA BOL P4 T090 E7: immutable production source SHA vs live canonical
// 18 exact critical asset byte equality. No authentication, no database writes,
// no privileged endpoints, and no contents logged.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PRODUCTION_18_CRITICAL_ASSET_BYTE_PARITY_AND_AD_RPC_DUPLICATE_20261103.json','utf8'));
const base='JANTA_BOL_PHASE_3C_WORKING/';
const prodSha='60970abdacf560815b9db3bd819eb467ef984616';
const domain='https://jantabol.in';
const names=manifest.exact_verified_by_connected_readonly_git_and_vercel_pairs_20261103;
test('T090-PARITY01 18 critical static bytes from exact pinned production SHA match live domain, fail hard if any drift',async()=>{
 assert.equal(manifest.source_git_revision,prodSha);
 assert.equal(manifest.live_deployment_id,'dpl_7YhVGAh758YvZq6HmteERdyCKtMb');
 assert.equal(names.length,18);
 assert.equal(new Set(names).size,18);
 const allGit=execFileSync('git',['rev-parse',prodSha+'^{tree}'],{encoding:'utf8'}).trim();
 assert.match(allGit,/^[a-f0-9]{40}$/);
 for(const file of names){
  assert.match(file,/^[a-z0-9-]+\.(html|js)$/);
  const original=execFileSync('git',['show',prodSha+':'+base+file],{maxBuffer:1<<22});
  const requestURL=domain+'/'+base+file;
  const response=await fetch(requestURL,{redirect:'follow',signal:AbortSignal.timeout(15000)});
  assert.equal(new URL(response.url).origin,domain,'CROSS_ORIGIN_ROUTE_'+file);
  assert.equal(response.status,200,'MISSING_DEPLOYMENT_ASSET_'+file+'_'+response.status);
  const live=Buffer.from(await response.arrayBuffer());
  assert.equal(original.length,live.length,'DEPLOYED_ASSET_BYTE_LENGTH_DRIFT_'+file);
  assert.equal(Buffer.compare(original,live),0,'DEPLOYED_ASSET_BYTE_DRIFT_'+file);
 }
});
test('T090-PARITY02 original Git published path remains source-only and old canonical article/auth security elements still exist',()=>{
 const article=execFileSync('git',['show',prodSha+':'+base+'article.html'],{encoding:'utf8'});
 const back=execFileSync('git',['show',prodSha+':'+base+'backend-client.js'],{encoding:'utf8'});
 const owner=execFileSync('git',['show',prodSha+':'+base+'admin-auth.js'],{encoding:'utf8'});
 assert.ok(article.includes('public-c1-projection.js'));
 assert.ok(back.includes('requireOwner()'));
 assert.ok(owner.includes('aal'));
});
test('T090-PARITY03 all 32 current canonical JS have no direct legacy duplicate public Ad Event RPC caller, modern ticket gateway retained',()=>{
 const jsNames=fs.readdirSync(base).filter(x=>x.endsWith('.js')).sort();
 assert.equal(jsNames.length,32);
 const unused=jsNames.filter(n=>/\bjb_ad_(?:event|record_event)\b/.test(fs.readFileSync(base+n,'utf8')));
 assert.deepEqual(unused,[]);
 const modern=fs.readFileSync(base+'ad-analytics-client.js','utf8');
 for(const name of manifest.anon_public_ad_duplicate.modern_client_uses)assert.ok(modern.includes(name));
 assert.deepEqual(manifest.anon_public_ad_duplicate.signatures,[
  'public.jb_ad_event(uuid,text) RETURNS void','public.jb_ad_record_event(uuid,text) RETURNS boolean'
 ]);
 assert.equal(manifest.anon_public_ad_duplicate.both_anon_executable,true);
 assert.equal(manifest.anon_public_ad_duplicate.both_have_explicit_rate_limit_or_ticket_dedupe,false);
 assert.equal(manifest.anon_public_ad_duplicate.production_fix_started,false);
});
test('T090-PARITY04 do not call scoped 18/64 + duplicate public ad RPC a complete E5/E7/E8 PASS',()=>{
 assert.equal(manifest.all_32_js_and_32_html_proven,false);
 assert.deepEqual(manifest.unverified_due_to_tool_policy,['index.html','published.html']);
 assert.equal(manifest.anon_public_ad_duplicate.public_paid_ad_report_ready,'HOLD_PER_OWNER_POLICY');
 assert.equal(manifest.signed_2role_e5,'NOT_RUN');
 assert.equal(manifest.independent_E8_full,'HOLD');
 assert.equal(manifest.original_full_T090,'HOLD');
});
console.log('T090_18_CRITICAL_PRODUCTION_BYTE_PARITY=PASS_SCOPED');
console.log('T090_PUBLIC_AD_DUPLICATE_RPC_2_ANON_CALLABLE=REVIEW_P2_NOT_DEPLOYED');
console.log('T090_SIGNED_E5_E8_FULL_FINAL=HOLD');
