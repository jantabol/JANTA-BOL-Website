/**
 * JANTA BOL Phase-4 B12 T076 READ-ONLY PROD HTTPS smoke.
 * Only three SMALL public GET requests. No auth, private data, writes, redirect,
 * secrets, raw HTML body or session information are sent to CI logs.
 * Cannot certify Admin/Auth, PURL, Android, or whole-platform Recovery.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:https';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const ORIGIN='https://shubham-pichhore-2028.vercel.app';
const HOST='shubham-pichhore-2028.vercel.app';
const SAFE_PATHS=['/','/style.css','/script.js'];
const MAX=350_000;
const digest=b=>createHash('sha256').update(b).digest('hex').slice(0,16);
function getPublic(path){
 assert(SAFE_PATHS.includes(path),'arbitrary path forbidden');
 assert.equal(process.env.GITHUB_ACTIONS,'true');
 assert.equal(process.env.GITHUB_REPOSITORY,'jantabol/JANTA-BOL-Website');
 assert.equal(process.env.GITHUB_REF,'refs/heads/codex/b12-t076-production-hosting-readonly-20261028');
 const url=new URL(path,ORIGIN);
 assert.equal(url.hostname,HOST);
 return new Promise((resolve,reject)=>{
  let chunks=[],size=0;
  const req=request(url,{method:'GET',timeout:12000,headers:{
    'User-Agent':'JANTABOL-B12-T076-Public-ReadOnly-Evidence',
    'Accept':'text/html,text/css,application/javascript,*/*',
    'Cache-Control':'no-cache'
   }},res=>{
    const authorized=res.socket.authorized;
    const cert=res.socket.getPeerCertificate();
    const status=res.statusCode;
    res.on('data',part=>{
     size+=part.length;
     if(size>MAX){req.destroy(new Error('B12_T076_RESPONSE_TOO_LARGE'));return;}
     chunks.push(part);
    });
    res.on('end',()=>resolve({
     status,authorized,certName:cert.subject?.CN??'',
     contentType:String(res.headers['content-type']??''),
     redirect:res.headers.location??null,body:Buffer.concat(chunks)
    }));
   });
   req.on('timeout',()=>req.destroy(new Error('B12_T076_HTTPS_TIMEOUT')));
   req.on('error',reject);
   req.end();
 });
}
test('T076 actual current PROD Vercel TLS verified and home HTTP 200',async()=>{
 const r=await getPublic('/');
 assert.equal(r.authorized,true,'HTTPS certificate chain must be trusted');
 assert.equal(r.status,200,'public home must return 200, no SSO auth wall');
 assert.equal(r.redirect,null);
 assert.match(r.contentType,/text\/html/i);
 const body=r.body.toString('utf8');
 assert.match(body,/<title>\s*JANTA BOL\s*<\/title>/i);
 assert.match(body,/<html\b/i);
 assert(!/<title>Authentication Required/i.test(body));
 console.log('T076_REAL_HTTPS_PRODUCTION_HOME=PASS_SCOPED HTTP=200 TLS_AUTHORIZED=true SHA16='+digest(r.body));
});
test('T076 real public original CSS and JS assets, not HTML fallback',async()=>{
 for(const [path,type] of [['/style.css','CSS'],['/script.js','JS']]){
  const r=await getPublic(path);
  assert.equal(r.authorized,true);
  assert.equal(r.status,200,path+' not 200');
  assert.equal(r.redirect,null);
  assert(r.body.length>250,path+' unexpectedly empty');
  if(type==='CSS')assert.match(r.contentType,/text\/css/i);
  else assert.match(r.contentType,/javascript|ecmascript|text\/plain/i);
  assert(!r.body.toString('utf8').includes('<!DOCTYPE html>'),path+' is homepage fallback');
  console.log('T076_REAL_PRODUCTION_ASSET_'+type+'=PASS_SCOPED HTTP=200 SHA16='+digest(r.body));
 }
});
test('T076 CURRENT MAIN has pre-existing placeholder text; editorial soft-launch needs verified content',()=>{
 const html=readFileSync('index.html','utf8');
 assert.match(html,/<title>\s*JANTA BOL\s*<\/title>/i);
 const known=[
  'शिवपुरी अस्पताल में भ्रष्टाचार का आरोप।',
  'picsum.photos'
 ];
 const found=known.filter(x=>html.includes(x));
 assert(found.length>0,'static source changed, repeat independent editorial review');
 console.log('T076_MAIN_SOURCE_PLACEHOLDERS_FOUND='+found.length);
 console.log('T076_EDITORIAL_PUBLICATION_RELEASE=HOLD');
});
test('T076 Public home HTTPS is NOT a production Auth, Canonical PURL or B11 full-recovery proof',()=>{
 assert.deepEqual(SAFE_PATHS,['/','/style.css','/script.js']);
 const js=readFileSync('script.js','utf8');
 const hint=/\bsupabase\.auth\b|createClient\(/i.test(js);
 console.log('T076_SOURCE_RUNTIME_AUTH_CLIENT_HINT='+String(hint));
 console.log('T076_ADMIN_AUTH_PURL_NOT_TESTED=HOLD');
 console.log('T076_B11_FULL_E8_NOT_TESTED=HOLD');
 console.log('T076_FINAL_PASS_LOCK=false; T083_FINAL_PASS_LOCK=false');
});
