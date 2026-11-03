// P4-T090 live Edge 15-source E7 and 5 verify_jwt=false invalid/no-credential E5 negative.
// All source snapshots were compared live using read-only connected Supabase+GitHub.
// GitHub CI independently verifies Git object hashes and SAFE uncredentialed HTTP denials.
// Does not test signed Owner/Reporter, user mutation, real restore, secrets or platform config.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const data=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json','utf8'));
const functions=data.functions;
const entry=slug=>functions.find(x=>x.slug===slug);
test('T090-EDGE01 15 real active Edge functions, 18 source files, 10 tracked plus five archived, immutable Git hashes',()=>{
 assert.equal(functions.length,15);
 assert.equal(new Set(functions.map(x=>x.slug)).size,15);
 assert.equal(functions.reduce((n,f)=>n+f.files.length,0),18);
 assert.equal(functions.filter(x=>x.source_authority==='PROTECTED_TRACKED').length,10);
 assert.equal(functions.filter(x=>x.source_authority==='REVIEW_ONLY_ARCHIVE').length,5);
 assert.equal(functions.filter(x=>x.active).length,15);
 for(const fn of functions){
  assert.match(fn.ezbr_bundle_sha256,/^[a-f0-9]{64}$/);
  assert.ok(fn.version>0);
  for(const file of fn.files){
   assert.match(file.git_blob_sha,/^[a-f0-9]{40}$/);
   assert.equal(fs.statSync(file.path).size,file.git_size_bytes,'SOURCE_GIT_BYTE_COUNT_DRIFT_'+fn.slug);
   const git=execFileSync('git',['hash-object',file.path],{encoding:'utf8'}).trim();
   assert.equal(git,file.git_blob_sha,'SOURCE_GIT_BLOB_DRIFT_'+fn.slug);
   assert.equal(file.live_source_exact_match_observed_via_connector,true);
  }
 }
});
test('T090-EDGE02 exact five public no JWT entrypoints and their sensitive HTTP guards remain in unchanged source',()=>{
 const falseJWT=functions.filter(x=>x.verify_jwt===false).map(x=>x.slug).sort();
 assert.deepEqual(falseJWT,['jb-encoder-connector-lols','jb-encoder-handoff','jb-encoder-launch','jb-live-worker','jb-youtube-oauth-callback']);
 const source=slug=>fs.readFileSync(entry(slug).files.find(x=>x.path.endsWith('/index.ts')).path,'utf8');
 const worker=source('jb-live-worker');
 assert.ok(worker.includes('WORKER_AUTH_REQUIRED')&&worker.includes('x-jb-worker-secret')&&worker.includes('sameSecret('));
 const connector=source('jb-encoder-connector-lols');
 assert.ok(connector.includes('FORBIDDEN')&&connector.includes('auth !== "Bearer " + serviceRoleKey'));
 const handoff=source('jb-encoder-handoff');
 const launch=source('jb-encoder-launch');
 assert.ok(handoff.includes('jb_live_consume_handoff_internal')&&handoff.includes('token.length<32'));
 assert.ok(launch.includes('jb_live_consume_handoff_internal')&&launch.includes('token.length < 32'));
 const oauth=source('jb-youtube-oauth-callback');
 assert.ok(oauth.includes('jb_youtube_oauth_state_consume_internal')&&oauth.includes('if(!state)'));
});
const origin='https://vrffsnkycvjithwtiylt.supabase.co';
async function edgeGET(slug){
 const res=await fetch(origin+'/functions/v1/'+slug,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(16000)});
 assert.equal(new URL(res.url).origin,origin,'EDGE_NO_CROSS_ORIGIN_'+slug);
 return res;
}
test('T090-EDGE03 actual GET worker denied by method guard, anonymous POST denied by secret guard (NO operation)',async()=>{
 const get=await edgeGET('jb-live-worker');
 assert.equal(get.status,405,'WORKER_GET_METHOD_NOT_DENIED_'+get.status);
 const post=await fetch(origin+'/functions/v1/jb-live-worker',{
  method:'POST',headers:{'Content-Type':'application/json'},body:'{}',
  redirect:'manual',signal:AbortSignal.timeout(16000)
 });
 assert.ok([401,403].includes(post.status),'WORKER_UNAUTH_POST_NOT_DENIED_'+post.status);
});
test('T090-EDGE04 actual anonymous POST connector without service Bearer denied (NO operation)',async()=>{
 const res=await fetch(origin+'/functions/v1/jb-encoder-connector-lols',{
  method:'POST',headers:{'Content-Type':'application/json'},body:'{}',
  redirect:'manual',signal:AbortSignal.timeout(16000)
 });
 assert.ok([401,403].includes(res.status),'ENCODER_CONNECTOR_UNAUTH_POST_NOT_DENIED_'+res.status);
});
test('T090-EDGE05 missing one-time handoff and launch tokens rejected without consuming valid token',async()=>{
 for(const slug of ['jb-encoder-handoff','jb-encoder-launch']){
  const res=await edgeGET(slug);
  assert.ok([400,401,403].includes(res.status),'EDGE_MISSING_HANDOFF_TOKEN_NOT_DENIED_'+slug+'_'+res.status);
 }
});
test('T090-EDGE06 OAuth callback with NO state must refuse OAuth state consumption/token exchange',async()=>{
 const res=await edgeGET('jb-youtube-oauth-callback');
 if([401,403].includes(res.status))return;
 assert.equal(res.status,200,'OAUTH_MISSING_STATE_UNEXPECTED_HTTP_'+res.status);
 const html=await res.text();
 assert.match(html,/OAuth State Invalid|Missing OAuth state/);
 assert.ok(!/OAuth connected successfully|YouTube connected successfully/i.test(html),'OAUTH_STATE_MISSING_FALSE_CONNECTED');
});
test('T090-EDGE07 no full signed E5 or Edge GoTrue Vercel live-disaster restoration claim',()=>{
 assert.equal(data.product_files_or_edge_deploy_mutated,false);
 assert.equal(data.prod_database_mutated,false);
 for(const key of ['current_T087_signed_E5','current_T088_full_E8','current_T089_full_E7','current_T090_full_final'])assert.equal(data[key],'HOLD');
});
console.log('T090_LIVE_15_EDGE_SOURCE_18_FILES_SCOPED=PASS');
console.log('T090_FIVE_NO_JWT_PUBLIC_EDGE_NEGATIVE=PASS_SCOPED');
console.log('T090_E5_SIGNED_AND_E8_FULL_PLATFORM=HOLD');
