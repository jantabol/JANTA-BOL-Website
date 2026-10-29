'use strict';
// Production read-only probes. No user data, credentials or response bodies are logged.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const config=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const url=config.match(/url:\s*'([^']+)'/)?.[1];
const key=config.match(/publishableKey:\s*'([^']+)'/)?.[1];
assert(url?.startsWith('https://')&&key?.startsWith('sb_publishable_'));
(async()=>{
 let passed=0;
 for(const table of ['advertisers','ad_campaigns','ad_creatives','ad_payments','ad_portal_credentials','ad_portal_sessions','ad_history','ad_events']){
  // limit=0 tests the table access boundary without retrieving any real record.
  const r=await fetch(url+'/rest/v1/'+table+'?select=*&limit=0',{headers:{apikey:key,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  const body=await r.json();
  assert([401,403].includes(r.status),table+' must deny anon, got '+r.status);
  assert.equal(body.code,'42501',table+' must reject at permission boundary');
  console.log('PASS HTTP ANON DENIED',table,r.status);passed++;
 }
 console.log('Anonymous private-table access checks:',passed,'PASS');
})().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1});
