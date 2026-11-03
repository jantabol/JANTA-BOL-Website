// T090 E5 actual production HTTPS negative on BOTH Supabase PostgREST and GoTrue Auth.
// 100% GET-only. Uses only public publishable key from deployed website and deliberately
// forged, unsigned/bogus tokens; NEVER a valid Owner/Reporter user, session or JWT.
// No response payload, credentials, keys or user data are printed or saved.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const proof=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PUBLIC_ANON_RLS_AND_DEFINER_SCOPED_20261103.json','utf8'));
const root='https://jantabol.in';
const authOrigin='https://vrffsnkycvjithwtiylt.supabase.co';
const privateTables=proof.sensitive_table_role_snapshot.map(x=>x.table_name).sort();
const expected=['ad_campaigns','ad_portal_credentials','ad_portal_sessions','articles','audit_logs','compliance_tasks','grievance_history','grievance_issues','grievance_private_identity','grievances','user_roles'].sort();
const b64=obj=>Buffer.from(JSON.stringify(obj),'utf8').toString('base64url');
const claims=role=>({sub:'00000000-0000-4000-8000-000000000090',session_id:'00000000-0000-4000-8000-000000000091',role,aud:'authenticated',aal:'aal2',exp:4102444800});
const tokens=[
 {kind:'unsigned_fake_owner',value:b64({alg:'none',typ:'JWT'})+'.'+b64(claims('owner'))+'.'},
 {kind:'invalid_signature_fake_reporter',value:b64({alg:'HS256',typ:'JWT'})+'.'+b64(claims('reporter'))+'.ZmFrZS1pbnZhbGlkLXNpZw'}
];
let publishable;
test('T090-HTTP-FORGE01 strict 11 existing sensitive table boundaries and original final HOLD',()=>{
 assert.deepEqual(privateTables,expected);
 assert.equal(proof.actual_signed_owner_reporter_e5_verified,false);
 assert.equal(proof.original_t090_final,'HOLD');
 assert.ok(proof.sensitive_table_role_snapshot.every(x=>x.rls_on&&!x.anon_select));
});
test('T090-HTTP-FORGE02 fetch only public sb_publishable_ key from actual deployed static config',async()=>{
 const response=await fetch(root+'/JANTA_BOL_PHASE_3C_WORKING/supabase-config.js',{
  method:'GET',redirect:'follow',signal:AbortSignal.timeout(16000)
 });
 assert.equal(new URL(response.url).origin,root);
 assert.equal(response.status,200);
 const match=(await response.text()).match(/publishableKey:\s*['"](sb_publishable_[A-Za-z0-9_-]+)['"]/);
 assert.ok(match,'PUBLIC_SHIPPED_KEY_NOT_FOUND');
 publishable=match[1];
});
test('T090-HTTP-FORGE03 22 LIVE private PostgREST requests with unsigned fake Owner and forged fake Reporter tokens DENIED',async()=>{
 assert.ok(publishable?.startsWith('sb_publishable_'));
 let checked=0;
 for(const {kind,value} of tokens){
  for(const table of privateTables){
   const url=authOrigin+'/rest/v1/'+encodeURIComponent(table)+'?select=*&limit=1';
   const response=await fetch(url,{
    method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(16000),
    headers:{apikey:publishable,Authorization:'Bearer '+value,Accept:'application/json'}
   });
   assert.equal(new URL(response.url).origin,authOrigin,'OFF_ORIGIN_'+table);
   assert.ok([401,403,404].includes(response.status),'INVALID_JWT_PRIVATE_HTTP_NOT_DENIED_'+kind+'_'+table+'_'+response.status);
   checked++;
   // Do not parse private responses or log tokens.
  }
 }
 assert.equal(checked,22);
});
test('T090-HTTP-FORGE04 LIVE GoTrue /auth/v1/user rejects 2 invalid Owner/Reporter JWTs without leaking account details',async()=>{
 assert.ok(publishable?.startsWith('sb_publishable_'));
 let checked=0;
 for(const {kind,value} of tokens){
  const response=await fetch(authOrigin+'/auth/v1/user',{
   method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(16000),
   headers:{apikey:publishable,Authorization:'Bearer '+value,Accept:'application/json'}
  });
  assert.equal(new URL(response.url).origin,authOrigin);
  assert.ok([401,403].includes(response.status),'INVALID_JWT_GOTRUE_USER_NOT_DENIED_'+kind+'_'+response.status);
  checked++;
 }
 assert.equal(checked,2);
});
test('T090-HTTP-FORGE05 no genuine signed Owner/Reporter, authorized actions or disaster recovery claimed',()=>{
 assert.equal(tokens.length,2);
 assert.equal(proof.actual_signed_owner_reporter_e5_verified,false);
 assert.equal(proof.independent_full_e8_backup_restore_verified,false);
 assert.equal(proof.original_t090_final,'HOLD');
});
console.log('T090_REAL_HTTPS_GOTRUE_AND_POSTGREST_24_FORGED_OWNER_REPORTER_DENIAL=PASS_SCOPED_ONLY');
console.log('T090_GENUINE_SIGNED_OWNER_REPORTER_HTTP=HOLD');
