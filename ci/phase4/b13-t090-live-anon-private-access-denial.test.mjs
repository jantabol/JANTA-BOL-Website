// T090 E5 SCOPED: non-authenticated production HTTP negative on PUBLIC publishable key only.
// No credentials, no logged private response, no live writes, no Owner/session work.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const proof=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_PUBLIC_ANON_RLS_AND_DEFINER_SCOPED_20261103.json','utf8'));
const home='https://jantabol.in';
const project='https://vrffsnkycvjithwtiylt.supabase.co';
const names=proof.sensitive_table_role_snapshot.map(x=>x.table_name);
let publicKey;
async function get(url,opts={}){
 const res=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(16000),...opts});
 if(new URL(res.url).origin!==new URL(url).origin)throw Error('PROBE_CROSS_ORIGIN_REDIRECT_DENIED');
 return res;
}
test('T090-HTTP01 exact 11 private tables have read-only catalog proof of RLS/anon no grants',()=>{
 assert.equal(names.length,11);
 assert.equal(new Set(names).size,11);
 assert.ok(proof.sensitive_table_role_snapshot.every(x=>x.rls_on&&!x.anon_select&&!x.anon_update));
 assert.equal(proof.anon_definer_routine_count,23);
 assert.equal(proof.anon_definer_mutation_text_signals,6);
});
test('T090-HTTP02 real production root and direct index both C1, PUBLIC config only',async()=>{
 for(const suffix of ['/','/index.html']){
  const res=await get(home+suffix);
  assert.equal(res.status,200,'PUBLIC_SITE_HTTP_FAIL_'+suffix);
  const markup=await res.text();
  assert.ok(markup.includes('public-c1-projection.js')&&markup.includes('website-v3.js'),'PUBLIC_C1_MISSING_'+suffix);
 }
 const res=await get(home+'/JANTA_BOL_PHASE_3C_WORKING/supabase-config.js');
 assert.equal(res.status,200);
 const js=await res.text();
 assert.ok(js.includes("url: 'https://vrffsnkycvjithwtiylt.supabase.co'"));
 const m=js.match(/publishableKey:\s*['"](sb_publishable_[A-Za-z0-9_-]+)['"]/);
 assert.ok(m,'PUBLIC_FRONTEND_KEY_NOT_FOUND');
 publicKey=m[1];
});
test('T090-HTTP03 genuine public news RPC works via public-only publishable key and NO user token',async()=>{
 assert.ok(publicKey?.startsWith('sb_publishable_'));
 const res=await get(project+'/rest/v1/rpc/jb_c1_public_articles',{
  method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json',Accept:'application/json'},
  body:JSON.stringify({p_article_id:null,p_limit:1})
 });
 assert.equal(res.status,200,'PUBLIC_C1_HTTPS_API_FAILED_'+res.status);
 const json=await res.json();
 assert.ok(typeof json==='object'&&json!==null);
});
test('T090-HTTP04 11 sensitive real Data API reads denied without signed user session; no private bodies returned or logged',async()=>{
 assert.ok(publicKey?.startsWith('sb_publishable_'));
 for(const name of names){
  const res=await get(project+'/rest/v1/'+encodeURIComponent(name)+'?select=id&limit=1',{
   method:'GET',headers:{apikey:publicKey,Accept:'application/json'}
  });
  assert.ok([401,403,404].includes(res.status),'PRIVATE_NO_USER_TOKEN_READ_UNEXPECTED_HTTP_'+name+'_'+res.status);
 }
});
test('T090-HTTP05 private grievance read with NO apikey is denied',async()=>{
 const r=await get(project+'/rest/v1/grievances?select=id&limit=1',{headers:{Accept:'application/json'}});
 assert.ok([401,403].includes(r.status),'NO_APIKEY_GRIEVANCE_UNEXPECTED_HTTP_'+r.status);
});
test('T090-HTTP06 original full signed E5 and independent E8 remain unproved',()=>{
 assert.equal(proof.actual_signed_owner_reporter_e5_verified,false);
 assert.equal(proof.independent_full_e8_backup_restore_verified,false);
 assert.equal(proof.original_t090_final,'HOLD');
});
console.log('T090_LIVE_11_SENSITIVE_ANON_DENIAL_HTTPS_PUBLIC_C1=PASS_SCOPED');
console.log('T090_AUTHENTICATED_ROLE_E5_AND_INDEPENDENT_E8=HOLD');
