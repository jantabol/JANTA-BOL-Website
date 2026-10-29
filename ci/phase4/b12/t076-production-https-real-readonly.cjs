'use strict';
/* JANTA BOL P4-T076 one-shot production HTTP smoke. READ-ONLY, NO LOGIN, NO DB WRITES.
 * Exact Vercel project first-party production hostname, NOT custom DNS pending cutover.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const ORIGIN='https://shubham-pichhore-2028.vercel.app';
const P='/JANTA_BOL_PHASE_3C_WORKING/';
const root=path.resolve(__dirname,'../../..');
function digest(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
async function fetchResponse(name,route){
 const u=ORIGIN+route;
 const r=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(18000),headers:{'user-agent':'JANTA-BOL-T076-READONLY-CI/1.0'}});
 assert.equal(r.url,u,name+' must not change origin');
 return r;
}
test('production root redirects ONLY to exact reviewed V3 home via HTTPS',async()=>{
 const r=await fetchResponse('root','/');
 assert.ok([307,308,302,301].includes(r.status),'root status='+r.status);
 const loc=r.headers.get('location')||'';
 const dest=new URL(loc,ORIGIN);
 assert.equal(dest.origin,ORIGIN);
 assert.equal(dest.pathname,P+'index.html');
});
test('production V3 homepage shell loads on verified TLS, not old Main 404',async()=>{
 const r=await fetchResponse('homepage',P+'index.html');
 assert.equal(r.status,200);
 const html=await r.text();
 assert.match(html,/JANTA.BOL/);
 assert.match(html,/public-c1-projection\.js/);
 assert.doesNotMatch(html,/शिवपुरी में भारी बारिश • करैरा में सड़क हादसा/);
});
test('production V3 script is identical to frozen Git reviewed source',async()=>{
 const r=await fetchResponse('V3 script',P+'website-v3.js');
 assert.equal(r.status,200);
 const actual=Buffer.from(await r.arrayBuffer());
 const expected=fs.readFileSync(path.join(root,'JANTA_BOL_PHASE_3C_WORKING/website-v3.js'));
 assert.equal(digest(actual),digest(expected),'Unexpected production JS bytes');
});
test('production public published-only RPC bridge is source-identical',async()=>{
 const r=await fetchResponse('public bridge',P+'public-c1-projection.js');
 assert.equal(r.status,200);
 const actual=Buffer.from(await r.arrayBuffer());
 const expected=fs.readFileSync(path.join(root,'JANTA_BOL_PHASE_3C_WORKING/public-c1-projection.js'));
 assert.equal(digest(actual),digest(expected),'Published-only bridge JS drift');
});
test('production Founder login shell: HTTPS 200 and no-store security guard',async()=>{
 const r=await fetchResponse('admin login',P+'admin-login.html');
 assert.equal(r.status,200);
 assert.match(r.headers.get('cache-control')||'',/no-store/);
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.match(await r.text(),/Super Admin Login/);
});
test('production article shell remains 200 and sensitive no-store',async()=>{
 const r=await fetchResponse('article shell',P+'article.html');
 assert.equal(r.status,200);
 assert.match(r.headers.get('cache-control')||'',/no-store/);
 assert.match(await r.text(),/Permanent Article ID/);
});
