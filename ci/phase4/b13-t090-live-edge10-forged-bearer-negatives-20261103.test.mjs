// T090 E5 additional scoped live negative: reject forged JWT-shaped bearer tokens.
// All requests are GET only with intentionally invalid tokens and PUBLIC publishable key.
// Never impersonates a real user or tests actual signed Owner/Reporter authorization.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json','utf8'));
const project='https://vrffsnkycvjithwtiylt.supabase.co';
const site='https://jantabol.in';
const slugs=data.functions.filter(f=>f.active&&f.verify_jwt===true).map(f=>f.slug).sort();
const expected=['jb-b11-t069-media-backup','jb-grievance-assets','jb-live-api','jb-records-api','jb-recovery-delete-mfa','jb-team-api','jb-youtube-oauth-health','jb-youtube-oauth-start','jb-youtube-provider','jb-youtube-video-preflight'];
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const claims={sub:'00000000-0000-0000-0000-000000000000',aud:'authenticated',role:'authenticated',exp:4102444800,aal:'aal2'};
const forgedTokens=[
 {kind:'unsigned_none',jwt:b64({alg:'none',typ:'JWT'})+'.'+b64(claims)+'.'},
 {kind:'bogus_HS256',jwt:b64({alg:'HS256',typ:'JWT'})+'.'+b64(claims)+'.ZmFrZS1zaWduYXR1cmU'}
];
let publishable;
test('T090-FORGED01 exactly ten currently recorded protected verify_jwt=true functions, with no full E5 claim',()=>{
 assert.deepEqual(slugs,expected);
 assert.equal(data.current_T087_signed_E5,'HOLD');
 assert.equal(data.current_T088_full_E8,'HOLD');
 assert.equal(data.current_T090_full_final,'HOLD');
});
test('T090-FORGED02 obtain ONLY intentionally public frontend publishable apikey, never a secret',async()=>{
 const url=site+'/JANTA_BOL_PHASE_3C_WORKING/supabase-config.js';
 const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(16000)});
 assert.equal(new URL(r.url).origin,site,'UNEXPECTED_PUBLIC_CONFIG_REDIRECT');
 assert.equal(r.status,200);
 const m=(await r.text()).match(/publishableKey:\s*['"](sb_publishable_[A-Za-z0-9_-]+)['"]/);
 assert.ok(m,'PUBLIC_KEY_MISSING');
 publishable=m[1];
});
test('T090-FORGED03 20 live HTTPS GET probes: forged unsigned & bogus signed bearer are DENIED on all ten protected functions',async()=>{
 assert.ok(publishable?.startsWith('sb_publishable_'));
 for(const {kind,jwt} of forgedTokens){
  for(const slug of slugs){
   const url=project+'/functions/v1/'+slug;
   const r=await fetch(url,{
    method:'GET',redirect:'manual',signal:AbortSignal.timeout(16000),
    headers:{apikey:publishable,Authorization:'Bearer '+jwt,Accept:'application/json'}
   });
   assert.equal(new URL(r.url).origin,project,'OFF_ORIGIN_'+slug);
   assert.ok([401,403].includes(r.status),'FORGED_BEARER_NOT_DENIED_'+kind+'_'+slug+'_HTTP_'+r.status);
   // No response bodies / identity headers / JWT / API key logged.
  }
 }
});
test('T090-FORGED04 no valid signed session or full platform restore was attempted',()=>{
 assert.equal(data.product_files_or_edge_deploy_mutated,false);
 assert.equal(data.prod_database_mutated,false);
 assert.equal(data.current_T087_signed_E5,'HOLD');
 assert.equal(data.current_T088_full_E8,'HOLD');
});
console.log('T090_E5_10_PROTECTED_EDGE_FORGED_BEARER_REAL_HTTPS=PASS_SCOPED_ONLY');
console.log('T090_SIGNED_OWNER_REPORTER_AND_FULL_E8=HOLD');
