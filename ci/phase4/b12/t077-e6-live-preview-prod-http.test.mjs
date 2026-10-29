/* T077 E6 — GET-only actual deployed Preview versus production. No secret/API token/session/mutation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const PREVIEW='shubham-pichhore-2028-lxbei8b24-shubhamshrivastava295-9848.vercel.app';
const PROD='jantabol.in';
const DIR='/JANTA_BOL_PHASE_3C_WORKING/';
const FILE='supabase-config.js';
const ROOT='JANTA_BOL_PHASE_3C_WORKING/';
const LEGACY_BLOB='ceb2d5d3a5ccd1b31f561a2511f92d39c9bfdfff';
const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length)).update(Buffer.from([0])).update(b).digest('hex');
async function read(host,file){
  assert([PREVIEW,PROD].includes(host));
  assert(['supabase-config.js','backend-client.js','admin-login.html'].includes(file));
  return await new Promise((resolve,reject)=>{
    const u=new URL('https://'+host+DIR+file);
    const req=https.request(u,{method:'GET',timeout:16000,headers:{
      'User-Agent':'JB-T077-E6-GET-ONLY','Accept':'*/*','Cache-Control':'no-cache'
    }},res=>{
      const chunks=[];let bytes=0;
      res.on('data',b=>{bytes+=b.length;if(bytes>120000){req.destroy(new Error('response too large'));return;}chunks.push(b);});
      res.on('end',()=>resolve({status:res.statusCode,tls:res.socket.authorized===true,body:Buffer.concat(chunks),headers:res.headers}));
    });
    req.on('timeout',()=>req.destroy(new Error('timeout')));
    req.on('error',reject);req.end();
  });
}
function safeVm(code,host){
  let created=0;
  const window={location:{protocol:'https:',hostname:host,href:'https://'+host+'/JANTA_BOL_PHASE_3C_WORKING/admin-login.html'},
    supabase:{createClient:()=>{created++;return {auth:{}};}}};
  const document={readyState:'complete',body:{innerHTML:''},documentElement:{style:{}}};
  const ctx=vm.createContext({window,document});
  vm.runInContext(code,ctx,{timeout:1000});
  return {window,document,ctx,createCount:()=>created};
}
test('T077 E6 LIVE deployed Preview blocks database and Founder login without credentials',async()=>{
  const [cfg,back,html]=await Promise.all([read(PREVIEW,FILE),read(PREVIEW,'backend-client.js'),read(PREVIEW,'admin-login.html')]);
  for(const [name,r] of [[FILE,cfg],['backend-client.js',back],['admin-login.html',html]]){
    assert.equal(r.status,200,name+' Preview HTTP');
    assert.equal(r.tls,true,name+' Preview invalid TLS');
  }
  assert(cfg.body.equals(readFileSync(ROOT+FILE)),'deployed preview guard not byte-identical to reviewed source');
  assert(back.body.equals(readFileSync(ROOT+'backend-client.js')),'preview backend JS not byte-identical');
  assert.match(html.body.toString('utf8'),/supabase-config\.js/);
  const v=safeVm(cfg.body.toString('utf8'),PREVIEW);
  assert.equal(v.window.JB_PREVIEW_NO_PRODUCTION_BACKEND,true);
  assert.equal(v.window.JB_SUPABASE_CONFIG,null);
  assert.match(v.document.body.innerHTML,/Isolated Preview/);
  assert.throws(()=>vm.runInContext(back.body.toString('utf8'),v.ctx,{timeout:1000}),/Supabase client\/config missing/);
  assert.equal(v.createCount(),0,'Preview must never instantiate privileged production backend');
  assert.equal(v.window.JBBackend,undefined,'Preview must not expose Founder auth module');
  console.log('T077_E6_LIVE_PREVIEW_FAIL_CLOSED=PASS; NO_API_LOGIN_OR_DB_CLIENT');
});
test('T077 E6 LIVE production remains the ORIGINAL config with working canonical host',async()=>{
  const cfg=await read(PROD,FILE);
  assert.equal(cfg.status,200);
  assert.equal(cfg.tls,true);
  assert.equal(gitBlob(cfg.body),LEGACY_BLOB,'production config unexpectedly modified');
  const v=safeVm(cfg.body.toString('utf8'),PROD);
  assert.equal(v.window.JB_SUPABASE_CONFIG.url,'https://vrffsnkycvjithwtiylt.supabase.co');
  assert.match(v.window.JB_SUPABASE_CONFIG.publishableKey,/^sb_publishable_/);
  assert.equal(v.createCount(),0,'config inspection must not initialize client');
  console.log('T077_E6_LIVE_PRODUCTION_CONFIG_UNCHANGED=PASS');
});
