/**
 * Phase4 B12 P4-T076 live PUBLIC hosting/domain/HTTPS test only.
 * Three bounded GETs to one exact verified Vercel domain; no cookies, token,
 * Founder routes, service keys, writes, log of response bytes, or paid deploy.
 * Green tests imply only actual PUBLIC historical-production baseline scope.
 * New PR #61 candidate is NOT deployed; T076 full PASS must stay HOLD.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:https';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const HOST='shubham-pichhore-2028.vercel.app';
const SITE='https://'+HOST;
const ALLOWED=['/','/JANTA_BOL_PHASE_3C_WORKING/index.html','/JANTA_BOL_PHASE_3C_WORKING/website-v3.js'];
const fp=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
function requireScope(){
 assert.equal(process.env.GITHUB_ACTIONS,'true','only isolated Actions, no ad-hoc local live runner');
 assert.equal(process.env.GITHUB_REPOSITORY,'jantabol/JANTA-BOL-Website');
 assert.equal(process.env.GITHUB_REF,'refs/heads/codex/b12-b0-b12-reconcile-20261028');
}
function publicGET(path){
 requireScope();
 assert(ALLOWED.includes(path),'not an approved public URL');
 const url=new URL(path,SITE);
 assert.equal(url.protocol,'https:');
 assert.equal(url.hostname,HOST);
 return new Promise((resolve,reject)=>{
  let chunks=[],size=0;
  const req=request(url,{
    method:'GET',timeout:15000,
    headers:{
     'User-Agent':'JANTA-BOL-B12-T076-Readonly-Baseline',
     'Accept':'text/html,application/javascript,*/*',
     'Cache-Control':'no-cache'
    }
   },res=>{
     const ok=res.socket.authorized===true;
     const status=res.statusCode;
     const type=String(res.headers['content-type']||'');
     const location=res.headers.location||null;
     res.on('data',chunk=>{
       size+=chunk.length;
       if(size>350000){req.destroy(new Error('T076_PUBLIC_RESPONSE_TOO_LARGE'));return;}
       chunks.push(chunk);
     });
     res.on('end',()=>resolve({ok,status,type,location,body:Buffer.concat(chunks)}));
   });
  req.on('timeout',()=>req.destroy(new Error('T076_PUBLIC_TLS_TIMEOUT')));
  req.on('error',reject);
  req.end();
 });
}
test('T076 E6: current ORIGINAL Production default domain real HTTPS, trusted TLS and JANTA BOL homepage',async()=>{
 const r=await publicGET('/');
 assert.equal(r.ok,true,'real trusted TLS chain expected');
 assert.equal(r.status,200,'current Production homepage must remain publicly available');
 assert.match(r.type,/text\/html/i);
 assert.match(r.body.toString('utf8'),/<title>\s*JANTA BOL\s*<\/title>/i);
 console.log('T076_OLD_PROD_TLS_HOME=PASS_SCOPED;HTTP=200;SHA16='+fp(r.body));
 console.log('T076_OLD_MAIN_STATIC_RELEASE_NOT_EQUAL_B12_CANDIDATE=HOLD_UNTIL_EXACT_SHA_DEPLOYED');
});
test('T076 E1/E6: real public V3 document accessibility and comparison with exact review candidate',async()=>{
 const r=await publicGET('/JANTA_BOL_PHASE_3C_WORKING/index.html');
 assert.equal(r.ok,true);
 const same=r.status===200 && r.body.equals(readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html'));
 console.log('T076_LIVE_V3_INDEX_HTTP='+r.status+';TLS_VALID='+r.ok+';SHA16='+fp(r.body));
 console.log('T076_LIVE_V3_BYTES_EQUAL_PR61_CANDIDATE='+String(same));
 if(r.status!==200){
  console.log('T076_LIVE_V3_ROUTE_UNAVAILABLE=TRUE');
  throw new Error('T076 real Production V3 index unavailable: must NOT claim candidate-hosting PASS');
 }
 assert.match(r.type,/text\/html/i);
 assert.match(r.body.toString('utf8'),/<title>\s*JANTA BOL\s*<\/title>/i);
 const html=r.body.toString('utf8');
 assert(html.includes('website-v3.js'),'current V3 path does not load the expected publishing JS');
 console.log('T076_PUBLIC_V3_DOCUMENT_REACHABLE=PASS_SCOPED');
 if(!same)console.log('T076_PR61_NEW_SOURCE_NOT_SERVED_AT_PRODUCTION_V3_URL=HOLD');
});
test('T076 E6: real public V3 JS route reachable, no HTML fallback',async()=>{
 const r=await publicGET('/JANTA_BOL_PHASE_3C_WORKING/website-v3.js');
 assert.equal(r.ok,true);
 console.log('T076_LIVE_V3_JS_HTTP='+r.status+';SHA16='+fp(r.body));
 assert.equal(r.status,200,'V3 publishing JS unavailable in existing Production');
 assert.match(r.type,/javascript|ecmascript|text\/plain/i);
 assert(!r.body.toString('utf8').startsWith('<!DOCTYPE html>'));
 const same=r.body.equals(readFileSync('JANTA_BOL_PHASE_3C_WORKING/website-v3.js'));
 console.log('T076_LIVE_V3_JS_BYTES_EQUAL_PR61_CANDIDATE='+String(same));
 if(!same)console.log('T076_PR61_NEW_V3_JS_NOT_SERVED_AT_PRODUCTION=HOLD');
});
test('T076 E7: candidate host config is syntactically safe and release status remains fail-closed',()=>{
 requireScope();
 const v=JSON.parse(readFileSync('vercel.json','utf8'));
 const dest='/JANTA_BOL_PHASE_3C_WORKING/index.html';
 assert(v.redirects?.some(x=>x.source==='/'&&x.destination===dest&&x.permanent===false));
 assert(!v.rewrites?.some(x=>/https?:\/\//.test(x.destination)),'no unreviewed offsite rewrite');
 const h=JSON.stringify(v.headers||[]);
 assert(h.includes('nosniff')&&h.includes('no-store'));
 const t=JSON.parse(readFileSync('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json','utf8'));
 assert.equal(t.release_mode,'REVIEW_ONLY_NOT_PRODUCTION');
 assert.equal(t.production_merged,false);
 assert.equal(t.production_deployed,false);
 assert.equal(t.b11_full_recovery_locked,false);
 console.log('T076_CANDIDATE_DOMAIN_CONFIG_SOURCE=PASS_SCOPED_NO_DEPLOY');
 console.log('T076_FULL_PROD_AUTH_FOUNDER_CANDIDATE_E7=HOLD');
 console.log('T076_FINAL_PASS_LOCK=false');
});
