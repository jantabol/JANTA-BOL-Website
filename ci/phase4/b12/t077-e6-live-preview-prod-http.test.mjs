/* T077 E6 — PUBLIC GET ONLY: Vercel standard protection must cover every historic
 * preview / production .vercel.app alias; canonical custom domain stays public.
 * No cookie, no auth, no keys, no writes and no redirects followed.
 * Historic pre-protection E6 tests remain immutable in GitHub Actions 40841074439.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const HOSTS=[
 'shubham-pichhore-2028-8q3i9oxq9-shubhamshrivastava295-9848.vercel.app',
 'shubham-pichhore-2028-lxbei8b24-shubhamshrivastava295-9848.vercel.app'
];
const PROD='jantabol.in';
const PROD_ALIAS='shubham-pichhore-2028.vercel.app'; // Explicit production domain, not a Preview.
const DIR='/JANTA_BOL_PHASE_3C_WORKING/';
async function get(host,file){
 assert(HOSTS.includes(host)||host===PROD||host===PROD_ALIAS);
 assert(['supabase-config.js','admin-login.html','article.html'].includes(file));
 return await new Promise((resolve,reject)=>{
  const u=new URL('https://'+host+DIR+file);
  const req=https.request(u,{method:'GET',timeout:15000,headers:{
    'User-Agent':'JB-T077-E6-ANONYMOUS-PROTECTION-PROBE','Accept':'*/*',
    'Cache-Control':'no-cache'
  }},res=>{
    const tls=res.socket?.authorized===true,chunks=[];let n=0;
    res.on('data',x=>{n+=x.length;if(n>120000){req.destroy(new Error('Response too large'));return;}chunks.push(x)});
    res.on('end',()=>resolve({status:res.statusCode,tls,location:res.headers.location||'',body:Buffer.concat(chunks)}));
  });
  req.on('timeout',()=>req.destroy(new Error('GET_TIMEOUT')));
  req.on('error',reject);req.end();
 });
}
test('T077 E6 LIVE: Vercel Authentication denies public access to old and new Preview and deployment aliases',async()=>{
 for(const host of HOSTS){
  const r=await get(host,'supabase-config.js');
  assert.equal(r.tls,true,'TLS problem '+host);
  if([301,302,303,307,308].includes(r.status)){
   const dst=new URL(r.location,'https://'+host);
   assert(dst.hostname==='vercel.com'||dst.hostname.endsWith('.vercel.com') ||
     /(?:sso|auth|login|protect)/i.test(dst.pathname),
     'preview redirect was not to authentication: '+host);
  }else{
   assert([401,403].includes(r.status),
     'Preview/legacy alias unexpectedly publicly accessible: '+host+' HTTP '+r.status);
  }
  console.log('T077_E6_VERCEL_PROTECTION=PASS; HOST='+host+'; HTTP='+r.status);
 }
});
test('T077 E6 LIVE: canonical jantabol.in and assigned production alias serve unchanged production config',async()=>{
 const [cfg,html,alias]=await Promise.all([get(PROD,'supabase-config.js'),get(PROD,'article.html'),get(PROD_ALIAS,'supabase-config.js')]);
 assert.equal(cfg.status,200);assert.equal(html.status,200);assert.equal(alias.status,200);
 assert.equal(cfg.tls,true);assert.equal(html.tls,true);assert.equal(alias.tls,true);
 assert(alias.body.equals(cfg.body),'public production alias not same deployed code');
 const gitBlob=createHash('sha1').update(Buffer.from('blob '+cfg.body.length)).update(Buffer.from([0])).update(cfg.body).digest('hex');
 assert.equal(gitBlob,'ceb2d5d3a5ccd1b31f561a2511f92d39c9bfdfff','unexpected production config change');
 const context={window:{},document:{}};
 vm.runInNewContext(cfg.body.toString('utf8'),context,{timeout:1000});
 assert.equal(context.window.JB_SUPABASE_CONFIG.url,'https://vrffsnkycvjithwtiylt.supabase.co');
 assert.match(html.body.toString('utf8'),/JANTA\s*BOL/);
 console.log('T077_E6_CANONICAL_PUBLIC_TLS_AND_PUBLISHED_CODE_UNCHANGED=PASS');
});
