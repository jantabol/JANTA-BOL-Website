/**
 * P4-T076 E1/E6: authenticated Vercel metadata pin in the separate review log,
 * then REAL public HTTPS GET checks. Public GETs only: NO cookies, secrets,
 * writes, Vercel API token, Supabase mutation, or production operations.
 * Pin deployment dpl_4BojWuSUhLK5wuL4Th2MBTEZgSoQ, source 2623bfe1.
 * New CI files do not alter the reviewed product assets on that deployment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const HOST='shubham-pichhore-2028-8q3i9oxq9-shubhamshrivastava295-9848.vercel.app';
const DEPLOY='dpl_4BojWuSUhLK5wuL4Th2MBTEZgSoQ';
const REVIEWED_SOURCE='991495eb208f2fc1b165c7d6e8de844949b68eb8';
const ORIGIN='https://'+HOST;
const PREFIX='/JANTA_BOL_PHASE_3C_WORKING/';
const ROOT='JANTA_BOL_PHASE_3C_WORKING/';
const PAGES=['index.html','admin-login.html','admin.html','add-news.html',
 'published.html','article.html','b9-search.html','b9-analytics.html','grievances.html'];
const MAX=650000;
const sha=b=>createHash('sha256').update(b).digest('hex').slice(0,16);
function scope(){
 assert.equal(process.env.GITHUB_ACTIONS,'true');
 assert.equal(process.env.GITHUB_REPOSITORY,'jantabol/JANTA-BOL-Website');
 const branch='codex/b12-main-v3-integrated-review-20261029';
 if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  assert.equal(process.env.GITHUB_HEAD_REF,branch);
  assert.equal(process.env.GITHUB_BASE_REF,'main');
 }else{
  assert.equal(process.env.GITHUB_EVENT_NAME,'push');
  assert.equal(process.env.GITHUB_REF,'refs/heads/'+branch);
 }
 for(const key of ['SUPABASE_SERVICE_ROLE_KEY','SUPABASE_DB_PASSWORD','VERCEL_TOKEN','JB_BACKUP_B2_APPLICATION_KEY']){
  assert(!process.env[key],key+' must not be available in anonymous read-only HTTP test');
 }
}
async function get(path){
 scope();
 assert(path==='/' || /^\/JANTA_BOL_PHASE_3C_WORKING\/[a-z0-9-]+\.(?:html|js|css)(?:\?[a-zA-Z0-9=._-]+)?$/.test(path),
   'blocked path outside reviewed public static resources: '+path);
 const u=new URL(path,ORIGIN);
 assert.equal(u.hostname,HOST);
 return await new Promise((resolve,reject)=>{
  let size=0,parts=[];
  const req=https.request(u,{method:'GET',timeout:17000,headers:{
   'User-Agent':'JB-T076-Integrated-Candidate-GET-ONLY',
   'Accept':'text/html,text/css,application/javascript,*/*',
   'Cache-Control':'no-cache'
  }},res=>{
   const status=res.statusCode,tls=res.socket.authorized===true;
   const headers=res.headers,redirect=headers.location||null;
   res.on('data',chunk=>{size+=chunk.length;if(size>MAX){
     req.destroy(new Error('PUBLIC_RESPONSE_TOO_LARGE'));return;
   }parts.push(chunk);});
   res.on('end',()=>resolve({status,tls,headers,redirect,body:Buffer.concat(parts)}));
  });
  req.on('timeout',()=>req.destroy(new Error('PUBLIC_GET_TIMEOUT')));
  req.on('error',reject);
  req.end();
 });
}
function check(r,path,status=200){
 assert.equal(r.tls,true,'invalid TLS: '+path);
 assert(![401,403].includes(r.status),'PROTECTED_PREVIEW_AUTH_REQUIRED: hold; do not disable protection');
 assert.equal(r.status,status,'not real expected HTTP response: '+path);
}
test('T076 integrated candidate root has HTTPS and same-origin redirect',async()=>{
 const r=await get('/');
 assert.equal(r.tls,true);
 assert(![401,403].includes(r.status),'Preview protected; HOLD');
 if([301,302,307,308].includes(r.status)){
  const dst=new URL(r.redirect||'',ORIGIN);
  assert.equal(dst.origin,ORIGIN,'external redirect denied');
  assert.equal(dst.pathname,PREFIX+'index.html');
 }else{
  assert.equal(r.status,200);
  assert.match(r.body.toString(),/<title>\s*JANTA BOL\s*<\/title>/i);
 }
 console.log('T076_INTEGRATED_ROOT_TLS_AND_ROUTE=PASS');
});
test('T076 integrated candidate exact V3 homepage with no fake allegation',async()=>{
 const p=PREFIX+'index.html',r=await get(p);
 check(r,p);
 assert.match(String(r.headers['content-type']||''),/text\/html/);
 const local=readFileSync(ROOT+'index.html');
 assert(r.body.subarray(0,local.length).equals(local),'candidate product HTML source changed');
 const appended=r.body.subarray(local.length).toString('utf8');
 const approved='<script async data-explicit-opt-in="true" data-deployment-id="'+DEPLOY+'" src="https://vercel.live/_next-live/feedback/feedback.js"></script>';
 assert(appended==='' || appended===approved,'unreviewed HTML/script injection in deployed preview');
 assert(!r.body.toString('utf8').includes('शिवपुरी अस्पताल में भ्रष्टाचार का आरोप'),'mock defamation present');
 console.log('T076_INTEGRATED_HTML_SOURCE='+sha(local)+';PINNED_SHA='+REVIEWED_SOURCE.slice(0,12));
});
test('T076 integrated exact News C1 bridge and V3 JS are byte-identical',async()=>{
 for(const file of ['website-v3.js','public-c1-projection.js','admin-auth.js','b12-safe-nav.js']){
  const p=PREFIX+file,r=await get(p);
  check(r,p);
  assert.match(String(r.headers['content-type']||''),/javascript|ecmascript|text\/plain/i);
  assert(r.body.equals(readFileSync(ROOT+file)),'deployed source mismatch: '+file);
  console.log('T076_INTEGRATED_ASSET='+file+';SHA16='+sha(r.body));
 }
});
test('T076 nine critical HTML page shells exist with valid TLS and no cached admin shell',async()=>{
 for(const page of PAGES){
  const p=PREFIX+page,r=await get(p);
  check(r,p);
  assert.match(String(r.headers['content-type']||''),/text\/html/i);
  assert.match(r.body.toString('utf8'),/<html\b/i);
  if(['admin-login.html','admin.html','add-news.html','published.html'].includes(page)){
   assert.match(String(r.headers['cache-control']||''),/no-store/i,'private shell must not cache: '+page);
   assert.equal(String(r.headers['x-content-type-options']||''),'nosniff');
   assert.equal(String(r.headers['x-frame-options']||''),'SAMEORIGIN');
  }
  console.log('T076_INTEGRATED_PAGE='+page+';HTTP='+r.status+';TLS='+r.tls);
 }
});
test('T076 all first-party linked scripts/styles in nine essential pages serve exact bytes',async()=>{
 const files=new Map();
 for(const page of PAGES){
  const html=readFileSync(ROOT+page,'utf8');
  for(const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+\.(?:js|css)(?:\?[^"'?#]*)?)["']/gi)){
   const raw=m[1];
   if(/^[a-z][a-z0-9+.-]*:|^\/\//i.test(raw))continue;
   const u=new URL(raw,ORIGIN+PREFIX+page);
   assert.equal(u.hostname,HOST);
   assert(u.pathname.startsWith(PREFIX),'asset escaped V3 folder');
   const file=u.pathname.slice(PREFIX.length);
   assert(/^[a-z0-9-]+\.(js|css)$/.test(file),'unknown static file '+file);
   files.set(u.pathname+u.search,file);
  }
 }
 assert(files.size>=12 && files.size<=55,'unexpected asset count: '+files.size);
 for(const [p,file] of files){
  const r=await get(p);
  check(r,p);
  // This historical T076 URL pins immutable source 991495eb. The later T077
  // fail-closed config patch must NOT be compared with an earlier deployed asset.
  // Check the exact Git blob identity of that archived config instead.
  if(file==='supabase-config.js'){
    const blob=createHash('sha1').update(Buffer.from('blob '+r.body.length)).update(Buffer.from([0])).update(r.body).digest('hex');
    assert.equal(blob,'ceb2d5d3a5ccd1b31f561a2511f92d39c9bfdfff','historical T076 config source changed');
  }else{
    assert(r.body.equals(readFileSync(ROOT+file)),'deployed asset changed: '+file);
  }
 }
 console.log('T076_INTEGRATED_CRITICAL_ASSETS='+files.size+';BYTE_IDENTICAL=YES');
 console.log('T076_PRODUCTION_CUSTOM_DOMAIN_AND_RECOVERY=HOLD_NOT_TESTED');
});
