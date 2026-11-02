// T088 E6 subset — real production anonymous published-only API read over HTTPS.
// No production writes, credentials, user JWTs, auth cookies or data content logging.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const cfgSrc=readFileSync('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js','utf8');
const sandbox={window:{location:{protocol:'https:',hostname:'jantabol.in'}}};
runInNewContext(cfgSrc,sandbox,{timeout:2000});
const config=sandbox.window.JB_SUPABASE_CONFIG;
assert.equal(sandbox.window.JB_PREVIEW_NO_PRODUCTION_BACKEND,false,'Canonical site must allow public config');
assert.ok(config,'Missing reviewed public Supabase config');
assert.equal(config.url,'https://vrffsnkycvjithwtiylt.supabase.co','Unexpected project or endpoint');
assert.match(config.publishableKey,/^sb_publishable_[A-Za-z0-9_-]+$/,'Only anonymous public publishable key allowed');
assert.equal(process.env.SUPABASE_SERVICE_ROLE_KEY,undefined,'No privileged token in public HTTP probe');
assert.equal(process.env.SUPABASE_DB_PASSWORD,undefined,'No DB password in public HTTP probe');

const url=new URL('/rest/v1/rpc/jb_c1_public_articles',config.url);
url.searchParams.set('p_limit','5');
const response=await fetch(url,{
  method:'GET',
  redirect:'error',
  headers:{apikey:config.publishableKey,accept:'application/json'},
  signal:AbortSignal.timeout(20000)
});
assert.equal(response.status,200,'T088_REAL_PUBLIC_ANON_RPC_HTTP_STATUS='+response.status);
assert.match(response.headers.get('content-type')||'',/application\/json/i,'Public projection must be JSON');
const data=await response.json();
assert.ok(data && Array.isArray(data.items),'Expected canonical published-only C1 projection');
assert.ok(data.items.length>=1 && data.items.length<=5,'Unexpected public news count');
for(const row of data.items){
  assert.equal(row.status,'published','Private nonpublished article leaked in anon projection');
  assert.match(String(row.id),/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  assert.ok(typeof row.slug==='string' && row.slug.length>0);
}
console.log('T088_REAL_HOSTED_ANON_PUBLIC_NEWS_RPC_GET_TLS=PASS_SCOPED');
console.log('T088_PRODUCTION_PUBLIC_PUBLISHED_ROWS_SAMPLED='+data.items.length);
console.log('T088_REAL_AUTHENTICATED_ROLE_CROSS_ACCOUNT_OR_PROVIDER=NOT_TESTED');
console.log('T088_PRODUCTION_NEWS_OR_DB_MUTATION=NONE');


// E6/hosted security subset: anonymous HTTP reads must never return private
// tables, even though each is populated in the connected production DB.
// No row data, credentials, identifiers, errors' response bodies or PII logged.
const privateTables=[
 'article_versions','audit_logs','grievances','team_accounts',
 'user_roles','live_sessions','live_notifications'
];
for(const table of privateTables){
 const restricted=new URL('/rest/v1/'+table,config.url);
 restricted.searchParams.set('select',table==='user_roles'?'user_id':'id');
 restricted.searchParams.set('limit','1');
 const check=await fetch(restricted,{
   method:'GET',redirect:'error',
   headers:{apikey:config.publishableKey,accept:'application/json'},
   signal:AbortSignal.timeout(20000)
 });
 assert.ok([200,401,403].includes(check.status),
    'T088_ANON_PRIVATE_TABLE_UNEXPECTED_STATUS='+table+':'+check.status);
 if(check.status===200){
   const rows=await check.json();
   assert.ok(Array.isArray(rows),
      'T088_ANON_PRIVATE_TABLE_UNEXPECTED_PAYLOAD='+table);
   assert.equal(rows.length,0,
      'T088_ANON_PRIVATE_TABLE_ROW_LEAK='+table);
 }
}
console.log('T088_REAL_HOSTED_ANON_PRIVATE_SEVEN_TABLES_DENIED_OR_ZERO=PASS_SCOPED_7_OF_7');

// A UUID which cannot be a real Article must NOT fall back to the published feed.
const unknown=new URL('/rest/v1/rpc/jb_c1_public_articles',config.url);
unknown.searchParams.set('p_article_id','00000000-0000-0000-0000-000000000000');
unknown.searchParams.set('p_limit','1');
const absent=await fetch(unknown,{
 method:'GET',redirect:'error',
 headers:{apikey:config.publishableKey,accept:'application/json'},
 signal:AbortSignal.timeout(20000)
});
assert.equal(absent.status,200,'T088_UNKNOWN_PUBLIC_ARTICLE_API_STATUS='+absent.status);
const unknownResult=await absent.json();
assert.ok(unknownResult && Array.isArray(unknownResult.items),'Unknown UUID must be screened');
assert.equal(unknownResult.items.length,0,'T088_UNKNOWN_UUID_MUST_NOT_FALLBACK_TO_FEED');
console.log('T088_REAL_HOSTED_NONEXISTENT_ARTICLE_UUID_EMPTY=PASS_SCOPED');
console.log('T088_SIGNED_TWO_ACCOUNT_AUTH_PRIVATE_API_E2=NOT_RUN');
