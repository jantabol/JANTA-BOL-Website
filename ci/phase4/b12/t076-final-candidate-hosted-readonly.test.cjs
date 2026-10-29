'use strict';
// B12 T076 -- pinned exact staged Vercel preview, public GET only, no credentials/writes.
// Do not confuse preview PASS with Production DNS/rollback/recovery approval.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const host='https://shubham-pichhore-2028-1co3h32kj-shubhamshrivastava295-9848.vercel.app';
const root=process.cwd();
const v3='/JANTA_BOL_PHASE_3C_WORKING';
const pages=['index.html','admin-login.html','admin.html','published.html','article.html','b9-search.html','b9-analytics.html','grievances.html'];
const assets=['website-v3.js','public-c1-projection.js','admin-auth.js','b12-safe-nav.js','backend-client.js'];
async function get(p){
 const r=await fetch(host+p,{method:'GET',credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'user-agent':'JANTA-BOL-B12-T076-readonly-http-gate'}});
 assert.equal(new URL(r.url).origin,host,'wrong origin');
 return {response:r,data:Buffer.from(await r.arrayBuffer())};
}
test('exact stage commit is pinned by reviewed workflow and public HTTPS',()=>{
  assert.match(host,/^https:\/\/[a-z0-9-]+\.vercel\.app$/);
  assert.equal(process.env.JB_STAGE_VERIFIED_SHA,'2623bfe17e70c9618821199b4b4f09b1c34e41c1');
});
test('root redirects only inside staged V3 host',async()=>{
 const {response}=await get('/');
 assert.equal(response.status,307);
 const next=new URL(response.headers.get('location'),host);
 assert.equal(next.origin,host);
 assert.equal(next.pathname,v3+'/index.html');
});
for(const page of pages){
 test('V3 preview HTML + HTTPS: '+page,async()=>{
  const {response,data}=await get(v3+'/'+page);
  assert.equal(response.status,200,page);
  assert.match(response.headers.get('content-type')||'',/text\/html/i);
  assert.ok(data.length>100,page+' empty body');
  assert.match(data.toString('utf8').slice(0,5000),/JANTA.?BOL|JANTA BOL|<html/i);
  if(['admin-login.html','admin.html','article.html'].includes(page)){
   const cache=response.headers.get('cache-control')||'';
   assert.match(cache,/no-store/i,'protected shell caching must be off');
   assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  }
 });
}
for(const asset of assets){
 test('first-party JS matches exact committed staged bytes: '+asset,async()=>{
  const {response,data}=await get(v3+'/'+asset);
  assert.equal(response.status,200,asset);
  const local=fs.readFileSync(path.join(root,'JANTA_BOL_PHASE_3C_WORKING',asset));
  assert.deepEqual(data,local,'unexpected JS injection/old preview: '+asset);
 });
}
test('no public screenshot/API token request; only 200/redirect guest shells',()=>{
 assert.ok(pages.every(x=>!['delete.html','publish.html','unpublish.html'].includes(x)));
 assert.ok(assets.every(x=>!x.includes('service-role')));
});
