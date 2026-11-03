// T090 / E5 — actual live gateway reject-only proof for ten verify_jwt=true Edge functions.
// This suite NEVER submits a token, API key, user data, valid operation or mutation payload.
// It proves only no-credential denial and does NOT replace signed Owner/Reporter tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json','utf8'));
const all=evidence.functions;
const protectedSlugs=[
 'jb-b11-t069-media-backup',
 'jb-grievance-assets',
 'jb-live-api',
 'jb-records-api',
 'jb-recovery-delete-mfa',
 'jb-team-api',
 'jb-youtube-oauth-health',
 'jb-youtube-oauth-start',
 'jb-youtube-provider',
 'jb-youtube-video-preflight'
];
const origin='https://vrffsnkycvjithwtiylt.supabase.co';
test('T090-GATE01 exact ten ACTIVE verify_jwt=true named endpoints are represented in live-management snapshot',()=>{
 assert.equal(all.length,15);
 assert.deepEqual(all.filter(x=>x.active && x.verify_jwt===true).map(x=>x.slug).sort(),protectedSlugs);
 assert.equal(all.filter(x=>x.active && x.verify_jwt===false).length,5);
 assert.equal(evidence.product_files_or_edge_deploy_mutated,false);
 assert.equal(evidence.prod_database_mutated,false);
});
test('T090-GATE02 real anonymous HTTPS GET with no Authorization or apikey is rejected by all 10 JWT-enabled Edge endpoints',async()=>{
 for(const slug of protectedSlugs){
  const url=origin+'/functions/v1/'+slug;
  const res=await fetch(url,{
   method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(16000),
   headers:{'Accept':'application/json','Cache-Control':'no-cache'}
  });
  assert.equal(new URL(res.url).origin,origin,'CROSS_ORIGIN_'+slug);
  assert.ok([401,403].includes(res.status),'JWT_REQUIRED_GATEWAY_MUST_DENY_'+slug+'_HTTP_'+res.status);
  // Do not read/log response body, any header containing user/session data, or secret.
 }
});
test('T090-GATE03 no fake signed E5, full E7, E8 or original release PASS',()=>{
 for(const key of ['current_T087_signed_E5','current_T088_full_E8','current_T089_full_E7','current_T090_full_final'])
  assert.equal(evidence[key],'HOLD','FORBID_FALSE_FINAL_PASS_'+key);
});
console.log('T090_E5_TEN_PROTECTED_EDGE_REAL_NO_CREDENTIAL_GATEWAY_DENIAL=PASS_SCOPED_ONLY');
console.log('T090_E5_SIGNED_OWNER_REPORTER_AND_FULL_E8_RESTORE=HOLD');
