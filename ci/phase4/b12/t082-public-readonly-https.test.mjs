// JANTA BOL P4-T082: publicly reachable shell-only HTTP GETs. No login,
// Supabase credentials, publication, file upload or private content fetch.
import test from 'node:test';
import assert from 'node:assert/strict';

const origin='https://jantabol.in';
const prefix='/JANTA_BOL_PHASE_3C_WORKING/';
async function publicGet(path,{redirect='manual'}={}){
 assert(path.startsWith('/') && !path.startsWith('//'),'same-site path only');
 const url=new URL(path,origin);
 assert.equal(url.origin,origin);
 const response=await fetch(url,{method:'GET',redirect,
  headers:{'Accept':'text/html','User-Agent':'JANTA-BOL-T082-READONLY-HTTPS-AUDIT'},
  signal:AbortSignal.timeout(18000)});
 return response;
}
test('T082 real custom domain root has a safe same-site home location',async()=>{
 const r=await publicGet('/');
 assert([200,301,302,307,308].includes(r.status),'unexpected root HTTP '+r.status);
 if(r.status!==200){
  const loc=new URL(r.headers.get('location')||'',origin);
  assert.equal(loc.origin,origin,'cross-domain redirect denied');
  assert.equal(loc.pathname,prefix+'index.html','unexpected home redirect');
 }else{
  const t=await r.text();assert.match(t,/JANTA\s*BOL/i);
 }
});
test('T082 public home page serves branded HTML without login',async()=>{
 const r=await publicGet(prefix+'index.html');
 assert.equal(r.status,200,'home page cannot be publicly fetched');
 const t=await r.text();
 assert.match(t,/JANTA\s*BOL/i);
 assert.match(r.headers.get('content-type')||'',/text\/html/i);
 assert.match(r.headers.get('x-content-type-options')||'',/nosniff/i);
});
test('T082 canonical permanent article shell responds publicly (no mutation)',async()=>{
 const uuid='f17f6507-02a3-4881-ad37-0b02cadf3d3f';
 const r=await publicGet(prefix+'article.html?id='+uuid);
 assert.equal(r.status,200,'canonical article shell unavailable');
 const t=await r.text();
 assert.match(t,/JANTA\s*BOL/i);
 assert.match(t,/(?:article|खबर|समाचार)/i);
 assert.match(r.headers.get('x-content-type-options')||'',/nosniff/i);
 // Article shell GET is NOT proof of the specific live article's JS rendering.
});
