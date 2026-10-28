/* B12 T076: genuine exact Vercel HOBBY PREVIEW network checks.
 * Three/four bounded public GETs only, no bearer token/cookie/admin action.
 * This job never changes Vercel Project, source branch, Git Main or Supabase.
 * A protected Preview is an explicit HOLD, never a reason to disable protection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const HOST='shubham-pichhore-2028-larldsm6o-shubhamshrivastava295-9848.vercel.app';
const ORIGIN='https://'+HOST;
const reviewedDeploy='dpl_EQC399BieUgUaLN8Xi4wB2fNijLz';
const reviewedSha='cfd5a64661e834c801c30325b97b5a4d72dfb49f';
const PATHS=['/','/JANTA_BOL_PHASE_3C_WORKING/index.html','/JANTA_BOL_PHASE_3C_WORKING/website-v3.js','/JANTA_BOL_PHASE_3C_WORKING/admin-login.html'];
const fp=b=>createHash('sha256').update(b).digest('hex').slice(0,16);
function fetchOnly(path){
 assert(PATHS.includes(path),'private/auth path not authorized');
 assert.equal(process.env.GITHUB_ACTIONS,'true');
 assert.equal(process.env.GITHUB_REPOSITORY,'jantabol/JANTA-BOL-Website');
 assert.equal(process.env.GITHUB_REF,'refs/heads/codex/b12-b0-b12-reconcile-20261028');
 return new Promise((resolve,reject)=>{
  const url=new URL(path,ORIGIN);
  assert.equal(url.hostname,HOST);
  let bytes=0,parts=[];
  const q=https.request(url,{method:'GET',timeout:15000,headers:{
   'User-Agent':'JB-B12-T076-Scoped-Hobby-PREVIEW-ReadOnly',
   'Accept':'text/html,application/javascript,*/*',
   'Cache-Control':'no-cache'
  }},r=>{
   const status=r.statusCode,ctype=String(r.headers['content-type']||'');
   const redirect=r.headers.location||null,validTLS=r.socket.authorized===true;
   r.on('data',c=>{
    bytes+=c.length;
    if(bytes>400000){q.destroy(new Error('T076_EXCESSIVE_PUBLIC_RESPONSE'));return;}
    parts.push(c);
   });
   r.on('end',()=>resolve({status,ctype,redirect,validTLS,body:Buffer.concat(parts)}));
  });
  q.on('timeout',()=>q.destroy(new Error('T076_PREVIEW_HTTP_TIMEOUT')));
  q.on('error',reject);q.end();
 });
}
function assertPublic(r,path,expected){
 console.log('T076_PREVIEW_SCOPE='+reviewedDeploy+'/'+reviewedSha.slice(0,12)+';PATH='+path+';HTTP='+r.status+';TLS='+r.validTLS+';SHA16='+fp(r.body));
 assert.equal(r.validTLS,true,'preview must have valid public TLS');
 assert(![401,403].includes(r.status),'PREVIEW_PROTECTED_AUTH_REQUIRED; DO NOT DISABLE PROTECTION, LIVE PROOF HOLD');
 assert.equal(r.status,expected,path+' must have real expected status');
}
test('T076 actual reviewed PR61 exact preview V3 index available with public TLS and no mock story',async()=>{
 const r=await fetchOnly('/JANTA_BOL_PHASE_3C_WORKING/index.html');
 assertPublic(r,'/JANTA_BOL_PHASE_3C_WORKING/index.html',200);
 assert.match(r.ctype,/text\/html/i);
 assert.match(r.body.toString('utf8'),/<title>\s*JANTA BOL\s*<\/title>/i);
 assert(r.body.toString('utf8').includes('website-v3.js'));
 assert(!r.body.toString('utf8').includes('शिवपुरी अस्पताल में भ्रष्टाचार का आरोप'));
 const local=readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html');
 assert(r.body.equals(local),'PREVIEW_HTML_NOT_EQUAL_REVIEWED_BRANCH_BYTE_SOURCE');
 console.log('T076_PREVIEW_V3_HTML_BYTES_MATCH_PR61=PASS_SCOPED');
});
test('T076 actual reviewed Preview JS equals original reviewed PR61 source bytes',async()=>{
 const r=await fetchOnly('/JANTA_BOL_PHASE_3C_WORKING/website-v3.js');
 assertPublic(r,'/JANTA_BOL_PHASE_3C_WORKING/website-v3.js',200);
 assert.match(r.ctype,/javascript|ecmascript|text\/plain/i);
 assert(!r.body.toString('utf8').startsWith('<!DOCTYPE html>'));
 assert(r.body.equals(readFileSync('JANTA_BOL_PHASE_3C_WORKING/website-v3.js')),'PREVIEW_JS_BYTES_DONT_MATCH_CANDIDATE');
 console.log('T076_PREVIEW_V3_JS_MATCHED_PR61=PASS_SCOPED');
});
test('T076 actual Preview Founder login page is public shell, never tests protected login',async()=>{
 const r=await fetchOnly('/JANTA_BOL_PHASE_3C_WORKING/admin-login.html');
 assertPublic(r,'/JANTA_BOL_PHASE_3C_WORKING/admin-login.html',200);
 assert.match(r.ctype,/text\/html/i);
 const html=r.body.toString('utf8');
 assert(html.includes('b12-safe-nav.js'),'expected reviewed B12 redirect safety helper in public login shell');
 assert(!/SUPABASE_SERVICE_ROLE_KEY\s*=/.test(html),'secret-bearing source must not leak');
 console.log('T076_PREVIEW_ADMIN_SHELL_HTTP200=PASS_SCOPED_NO_LOGIN_ATTEMPT');
});
test('T076 Preview root redirect has valid TLS, remains inside same site or returns verified home',async()=>{
 const r=await fetchOnly('/');
 console.log('T076_PREVIEW_ROOT_HTTP='+r.status+';TLS='+r.validTLS+';LOCATION='+String(r.redirect||'none').slice(0,128));
 assert.equal(r.validTLS,true);
 assert(![401,403].includes(r.status),'PREVIEW_PROTECTED_AUTH_REQUIRED; keep preview protected');
 if([301,302,307,308].includes(r.status)){
  assert(r.redirect,'redirect must have location');
  const dest=new URL(r.redirect,ORIGIN);
  assert.equal(dest.origin,ORIGIN,'no cross-site redirect');
  assert.equal(dest.pathname,'/JANTA_BOL_PHASE_3C_WORKING/index.html');
 }else{
  assert.equal(r.status,200);
  assert.match(r.body.toString('utf8'),/<title>\s*JANTA BOL\s*<\/title>/i);
 }
 console.log('T076_PREVIEW_ROOT_ROUTE=PASS_SCOPED');
 console.log('T076_LIVE_FOUNDER_AUTH_PUBLISH_ROLLBACK=NOT_TESTED');
 console.log('T076_FULL_PASS_LOCK=false');
});
