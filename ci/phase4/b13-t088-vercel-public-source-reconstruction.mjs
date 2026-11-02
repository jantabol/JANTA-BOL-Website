// P4-T088 E8 scoped Vercel public-source disaster reconstitution, ZERO production writes.
// Reconstructs the currently DEPLOYED public static website from its exact GitHub SHA,
// NOT main. Does NOT deploy, recover secrets, Auth, Edge, Storage or DNS.
import assert from 'node:assert/strict';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const sourceSha='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const prefix='JANTA_BOL_PHASE_3C_WORKING/';
const paths=['index.html','article.html','b8-staff-login.html','script.js','supabase-config.js'];
const git=(args)=>execFileSync('git',args,{maxBuffer:5*1024*1024,timeout:30000});
assert.equal(git(['rev-parse',sourceSha]).toString().trim(),sourceSha,'T088_DEPLOYED_SOURCE_SHA_NOT_FETCHED');
const vercel=JSON.parse(git(['show',sourceSha+':vercel.json']).toString('utf8'));
assert.ok(vercel.redirects.some(x=>x.source==='/' &&
 x.destination==='/'+prefix+'index.html' && x.permanent===false),
 'T088_VERCEL_CONFIG_ROOT_REDIRECT_DRIFT');
const assets=new Map(paths.map(n=>['/'+prefix+n,git(['show',sourceSha+':'+prefix+n])]));
assert.ok(assets.get('/'+prefix+'index.html').length>5000,'T088_SITE_SOURCE_EMPTY');
const hash=(bytes)=>createHash('sha256').update(bytes).digest('hex');
const local=http.createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 if(path==='/'){res.writeHead(307,{location:'/'+prefix+'index.html'});res.end();return;}
 const bytes=assets.get(path);
 if(!bytes){res.writeHead(404);res.end();return;}
 res.setHeader('content-type',path.endsWith('.js')?'application/javascript; charset=utf-8':'text/html; charset=utf-8');
 res.setHeader('x-content-type-options','nosniff');
 res.setHeader('referrer-policy','strict-origin-when-cross-origin');
 res.setHeader('x-frame-options','SAMEORIGIN');
 if(/\/(article|admin|admin-login|admin-security|admin-recovery|admin-recovery-setup|add-news|published)\.html$/.test(path))
  res.setHeader('cache-control','private, no-store, max-age=0');
 res.writeHead(200);res.end(bytes);
});
await new Promise((resolve,reject)=>{local.once('error',reject);local.listen(0,'127.0.0.1',resolve)});
const endpoint='http://127.0.0.1:'+local.address().port;
try{
 const root=await fetch(endpoint+'/',{redirect:'manual',signal:AbortSignal.timeout(20000)});
 assert.equal(root.status,307);
 assert.equal(root.headers.get('location'),'/'+prefix+'index.html');
 for(const [path,bytes] of assets){
   const sandbox=await fetch(endpoint+path,{redirect:'error',signal:AbortSignal.timeout(15000)});
   assert.equal(sandbox.status,200,'T088_RECOVERED_LOCAL_HTTP:'+path);
   assert.equal(hash(Buffer.from(await sandbox.arrayBuffer())),hash(bytes),
    'T088_LOCAL_RESTORE_BYTES_DIFFER:'+path);
   const live=await fetch('https://jantabol.in'+path,{redirect:'error',signal:AbortSignal.timeout(22000)});
   assert.equal(live.status,200,'T088_LIVE_PUBLIC_HTTP:'+path);
   const actual=Buffer.from(await live.arrayBuffer());
   assert.equal(hash(actual),hash(bytes),'T088_LIVE_PUBLIC_SHA_DRIFT:'+path);
   for(const h of ['x-content-type-options','referrer-policy','x-frame-options'])
     assert.equal(live.headers.get(h),sandbox.headers.get(h),
      'T088_LIVE_STATIC_SECURITY_HEADER_DRIFT:'+path+':'+h);
   if(path.endsWith('/article.html'))
     assert.match(live.headers.get('cache-control')||'',/no-store/,
      'T088_LIVE_ARTICLE_NOSTORE_GUARD_DRIFT');
 }
 console.log('T088_E8_DEPLOYED_SHA_STATIC_BYTES_RECONSTRUCTED=PASS_SCOPED_5_OF_5');
 console.log('T088_E8_DEPLOYED_STATIC_HEADERS_RECONCILED=PASS_SCOPED_5_OF_5');
 console.log('T088_E8_VERCEL_ROUTING_STATIC_ROOT_REPRODUCED=PASS_SCOPED');
 console.log('T088_E8_SOURCE_SHA_REFERENCED='+sourceSha.slice(0,12));
 console.log('T088_E8_INDEPENDENT_VERCEL_DEPLOY_ENV_DNS_PROD_RESTORE=NOT_RUN');
 console.log('T088_FULL_GOTRUE_EDGE_VERCEL_RECOVERY=NOT_RUN');
}finally{
 await new Promise(resolve=>local.close(resolve));
}
