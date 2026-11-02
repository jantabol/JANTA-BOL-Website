import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const path='JANTA_BOL_PHASE_4_WORKING/review/P4_T088_EDGE_SOURCE_LINEAGE_MANIFEST_20261102.json';
const data=JSON.parse(readFileSync(path,'utf8'));
const runGit=(args)=>execFileSync('git',args,{encoding:'utf8',timeout:30000});
const tree=runGit(['ls-tree','-r','--name-only','HEAD']).split('\n').filter(Boolean);
const prefix='CODEX_CURRENT_SUPABASE/functions/';
const slugs=new Set(data.functions.map(x=>x.slug));
const present=data.functions.filter(x=>x.gitSourcePath);
const absent=data.functions.filter(x=>!x.gitSourcePath);

test('T088-EDGE-01 exact 15 active live slugs, 18 source files; no fake full recovery',()=>{
 assert.equal(data.project,'JANTA BOL');
 assert.equal(data.supabase_project_ref,'vrffsnkycvjithwtiylt');
 assert.equal(data.functions.length,15);
 assert.equal(slugs.size,15);
 assert.equal(data.functions.reduce((a,b)=>a+b.liveSourceFiles,0),18);
 assert.ok(data.functions.every(x=>x.status==='ACTIVE'));
 assert.equal(data.limits.matched_existing_source_slugs,10);
 assert.equal(data.limits.missing_deployed_source_slugs,5);
 assert.equal(data.limits.final_e8,'HOLD');
 assert.equal(data.limits.full_offsite_copy_verified,false);
 assert.equal(data.limits.original_gotrue_edge_vercel_restore_tested,false);
});

test('T088-EDGE-02 all ten recovered source files have immutable LIVE-matched blob identities',()=>{
 assert.equal(present.length,10);
 for(const f of present){
  const p=prefix+f.slug+'/index.ts';
  assert.equal(f.gitSourcePath,p,'incorrect function provenance path');
  assert.ok(tree.includes(p),'missing source '+f.slug);
  assert.match(f.gitSourceBlobSha,/^[a-f0-9]{40}$/);
  assert.equal(runGit(['rev-parse','HEAD:'+p]).trim(),f.gitSourceBlobSha,
   'source changed since real Supabase LIVE byte equality review: '+f.slug);
  assert.equal(f.liveMatchesGitIndexByteForByte,true);
  assert.equal(f.offsiteEncryptedSourceRestored,false);
 }
});

test('T088-EDGE-03 five deployed functions absent across the full repository tree, no fake recovered source',()=>{
 assert.equal(absent.length,5);
 const missing=new Set([
  'jb-recovery-delete-mfa','jb-grievance-assets','jb-b11-t069-media-backup',
  'jb-youtube-oauth-health','jb-youtube-video-preflight'
 ]);
 assert.deepEqual(new Set(absent.map(f=>f.slug)),missing);
 for(const f of absent){
  assert.equal(f.gitSourcePath,null);
  assert.equal(f.gitSourceBlobSha,null);
  assert.equal(f.liveMatchesGitIndexByteForByte,null);
  assert.equal(f.offsiteEncryptedSourceRestored,false);
  assert.equal(f.source_restore_proof,'ABSENT_FROM_REPO_HOLD');
  assert.equal(tree.some(p=>p.split('/').includes(f.slug)),false,
   'a missing source appeared: review actual code before claiming recovery');
 }
});

test('T088-EDGE-04 metadata manifest contains no source content, tokens, private environment values or identity records',()=>{
 const allowedTop=new Set(['kind','observed_date','project','supabase_project_ref',
 'github_repository','github_checked_branch','verification_method','limits','functions']);
 for(const k of Object.keys(data))assert.ok(allowedTop.has(k),'unexpected data field '+k);
 const allowedFunc=new Set(['slug','liveVersion','status','verifyJwt','liveSourceFiles',
 'gitSourcePath','gitSourceBlobSha','liveMatchesGitIndexByteForByte',
 'offsiteEncryptedSourceRestored','source_restore_proof']);
 for(const f of data.functions){
  for(const k of Object.keys(f))assert.ok(allowedFunc.has(k),'unexpected function data '+k);
  assert.ok(Number.isSafeInteger(f.liveVersion)&&f.liveVersion>0);
  assert.ok(typeof f.verifyJwt==='boolean');
 }
 assert.ok(!JSON.stringify(data).includes('sb_secret_'));
 assert.ok(!JSON.stringify(data).includes('-----BEGIN PRIVATE KEY-----'));
});

test('T088-EDGE-05 original full-system E8 remains explicit HOLD, not a reconstructed Edge deployment',()=>{
 assert.equal(data.limits.original_gotrue_edge_vercel_restore_tested,false);
 assert.ok(data.functions.every(x=>x.offsiteEncryptedSourceRestored===false));
 assert.equal(data.limits.final_e8,'HOLD');
});

console.log('T088_EDGE_SOURCE_BLOB_VALIDATIONS=SEE_NODE_TEST_EXIT_STATUS');
console.log('T088_EDGE_FIVE_LIVE_SOURCES_UNBACKED_IN_GIT=HOLD_5');
console.log('T088_EDGE_FULL_INDEPENDENT_OFFSITE_RUNTIME_RESTORE=NOT_RUN');
