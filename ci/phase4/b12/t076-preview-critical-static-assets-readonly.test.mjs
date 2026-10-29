/**
 * B12 / T076 — READ-ONLY static integrity / no broken references on the
 * exact approved Hobby Preview deployment. NO login, POST, secrets or writes.
 * A successful check is scoped public assets proof, not a Production PASS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';

const HOST='shubham-pichhore-2028-larldsm6o-shubhamshrivastava295-9848.vercel.app';
const URL_BASE='https://'+HOST+'/JANTA_BOL_PHASE_3C_WORKING/';
const EXPECTED_DEPLOY='dpl_EQC399BieUgUaLN8Xi4wB2fNijLz';
const PAGES=['index.html','admin-login.html','admin.html','add-news.html',
 'published.html','article.html','b9-search.html','b9-analytics.html','grievances.html'];
const maxBytes=450000;
const assertScope=()=>{
 assert.equal(process.env.GITHUB_ACTIONS,'true');
 assert.equal(process.env.GITHUB_REPOSITORY,'jantabol/JANTA-BOL-Website');
 assert.equal(process.env.GITHUB_REF,'refs/heads/codex/b12-b0-b12-reconcile-20261028');
};
function publicGet(path){
 assertScope();
 assert(/^\/JANTA_BOL_PHASE_3C_WORKING\/[a-z0-9-]+\.(?:html|js|css)(?:\?[a-zA-Z0-9=._-]+)?$/.test(path),'outside reviewed static file scope');
 const u=new URL(path,'https://'+HOST);
 assert.equal(u.hostname,HOST);
 return new Promise((resolve,reject)=>{
  const req=https.request(u,{method:'GET',timeout:16000,
   headers:{'User-Agent':'JB-B12-T076-Hobby-Static-Integrity-Readonly','Accept':'text/html,text/css,application/javascript,*/*','Cache-Control':'no-cache'}},
   res=>{
    const status=res.statusCode,ctype=String(res.headers['content-type']||'');
    const validTLS=res.socket.authorized===true;
    let size=0,chunks=[];
    res.on('data',x=>{size+=x.length;if(size>maxBytes){req.destroy(new Error('TOO_LARGE_PUBLIC_ASSET'));return;}chunks.push(x);});
    res.on('end',()=>resolve({status,ctype,validTLS,data:Buffer.concat(chunks)}));
   });
  req.on('timeout',()=>req.destroy(new Error('PUBLIC_ASSET_TIMEOUT')));
  req.on('error',reject);req.end();
 });
}
const dir='JANTA_BOL_PHASE_3C_WORKING/';
test('T076 preview: 9 essential pages resolve with real TLS + 200, no old fake headline',async()=>{
 for(const page of PAGES){
  const r=await publicGet('/'+dir+page);
  assert.equal(r.validTLS,true,'TLS '+page);
  assert.equal(r.status,200,'Missing critical page '+page);
  assert.match(r.ctype,/text\/html/i);
  assert.match(r.data.toString('utf8'),/<html\b/i);
  assert(!r.data.toString('utf8').includes('शिवपुरी अस्पताल में भ्रष्टाचार का आरोप'));
  console.log('T076_PREVIEW_PAGE='+page+';HTTP=200;TLS=true');
 }
 console.log('T076_PREVIEW_9_CRITICAL_PUBLIC_SHELLS=PASS_SCOPED');
});
test('T076 preview: all first-party JS/CSS loaded by 9 pages actually exist, unmodified',async()=>{
 const paths=new Map();
 for(const page of PAGES){
  const html=readFileSync(dir+page,'utf8');
  const regex=/(?:src|href)\s*=\s*["']([^"']+\.(?:js|css)(?:\?[^"'?#]*)?)["']/gi;
  for(const m of html.matchAll(regex)){
   const ref=m[1];
   if(/^[a-z][a-z0-9+.-]*:|^\/\//i.test(ref))continue; // no external domains contacted
   const url=new URL(ref,URL_BASE+page);
   assert.equal(url.hostname,HOST,'cross-host script link '+page);
   assert(url.pathname.startsWith('/'+dir),'first-party reference escaped allowed folder');
   const file=url.pathname.substring(('/'+dir).length);
   assert(/^[a-z0-9-]+\.(js|css)$/.test(file),'unexpected static resource '+file);
   paths.set(url.pathname+(url.search||''),file);
  }
 }
 assert(paths.size>=12 && paths.size<=45,'unexpected source asset count '+paths.size);
 for(const [path,file] of paths){
  const r=await publicGet(path);
  assert.equal(r.validTLS,true,'TLS asset '+file);
  assert.equal(r.status,200,'404/500 in critical first-party asset '+file);
  assert(r.data.length>20,'empty resource '+file);
  if(file.endsWith('.css'))assert.match(r.ctype,/text\/css/i,'MIME '+file);
  else assert.match(r.ctype,/javascript|ecmascript|text\/plain/i,'MIME '+file);
  assert(r.data.equals(readFileSync(dir+file)),'Preview served wrong/altered source asset '+file);
  console.log('T076_PREVIEW_ASSET='+file+';HTTP=200;ORIGINAL_BYTES=true');
 }
 console.log('T076_PREVIEW_FIRST_PARTY_ASSET_COUNT='+paths.size);
 console.log('T076_PREVIEW_FIRST_PARTY_ASSETS=PASS_SCOPED');
 console.log('T076_EXACT_PINNED_DEPLOY='+EXPECTED_DEPLOY);
 console.log('T076_AUTH_API_PURL_PUBLISH_ROLLBACK=NOT_TESTED');
 console.log('T076_PRODUCTION_FINAL_PASS_LOCK=false');
});
