'use strict';
// JANTA BOL CP12 P4-T034: LIVE read-only anonymous REST negative check.
// ONLY five GET requests, no credentials/user JWT, no RPC, no mutation, no PII logs.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const config=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const url=config.match(/\burl:\s*'([^']+)'/)?.[1];
const key=config.match(/\bpublishableKey:\s*'([^']+)'/)?.[1];
assert.equal(url,'https://vrffsnkycvjithwtiylt.supabase.co',
 'EXPECTED_JANTA_BOL_PROJECT_URL_REQUIRED');
assert.ok(key?.startsWith('sb_publishable_')&&key.length>20,
 'NO_PUBLIC_PUBLISHABLE_KEY_IN_REVIEWED_SOURCE');
assert.ok(!process.env.SUPABASE_SERVICE_ROLE_KEY&&!process.env.SUPABASE_ACCESS_TOKEN,
 'MUST_NOT_HAVE_LIVE_PRIVILEGED_CREDENTIALS');
const paths=[
 ['advertisers','/rest/v1/advertisers?select=id&limit=1'],
 ['ad_campaigns','/rest/v1/ad_campaigns?select=id&limit=1'],
 ['ad_history','/rest/v1/ad_history?select=id&limit=1'],
 ['ad_creatives','/rest/v1/ad_creatives?select=id&limit=1'],
 ['ad_payments','/rest/v1/ad_payments?select=id&limit=1']
];
function verdict(resp,obj){
 // No row data ever printed, even on a dangerous response.
 const dbCode=typeof obj?.code==='string'?obj.code:'';
 return {http_status:resp.status,db_code:dbCode||'(missing)'};
}
(async()=>{
 let seen=0;
 for(const [table,path] of paths){
  const target=new URL(path,url);
  assert.equal(target.origin,url);
  const response=await fetch(target,{method:'GET',
   headers:{apikey:key,Accept:'application/json','Cache-Control':'no-store'},
   redirect:'error',cache:'no-store',
   signal:AbortSignal.timeout(10000)});
  const body=await response.text();
  let obj=null;
  try{obj=JSON.parse(body);}catch{}
  const v=verdict(response,obj);
  // Requirement: denial must come from PostgreSQL role permission, not simply
  // missing API key, SQL table absent, 200 empty RLS, or server failure.
  const isCatalogDenied=(response.status===401||response.status===403)&&v.db_code==='42501';
  if(!isCatalogDenied){
   console.error('CP12 LIVE REST GATE HOLD table='+table+
    ' HTTP='+v.http_status+' database_code='+v.db_code+
    ' (body omitted; no private row fields logged)');
   process.exitCode=1;
   continue;
  }
  seen++;
  console.log('PASS CP12 ADS009 LIVE anon GET /'+table+
   ' HTTP='+v.http_status+' sqlstate='+v.db_code+' no_auth_jwt; no_rows_read');
 }
 if(seen===paths.length){
  console.log('PASS CP12 LIVE ANON DATA REST 5/5 strict catalog DENIAL');
  console.log('HTTP_METHODS=GET_ONLY; JWT=ABSENT; MUTATIONS=ZERO; PII_LOGGED=ZERO');
  console.log('REAL_AUTHENTICATED_USERS_E5=HOLD; T034_FINAL_LOCK=HOLD');
 }else throw Error('CP12_LIVE_ANON_REST_NOT_FULLY_DENIED: '+seen+'/5');
})().catch(e=>{console.error('FAIL CP12 READ-ONLY HTTP CHECK: '+e.message);process.exitCode=1;});
