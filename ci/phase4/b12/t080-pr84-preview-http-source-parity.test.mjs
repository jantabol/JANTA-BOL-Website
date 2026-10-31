// P4-T080 PR84 READY preview exact static source identity, NO Founder login,
// NO article request, NO DB write or auth token. 401/403 -> DUE (not PASS).
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const liveSha='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const candidate='fe66e5732c65b72af4e75d8d8342a62561371fd0';
const preview='https://shubham-pichhore-2028-834z9v4vq-shubhamshrivastava295-9848.vercel.app';
const paths=['JANTA_BOL_PHASE_3C_WORKING/add-news.html','JANTA_BOL_PHASE_3C_WORKING/backend-client.js'];
const hash=b=>createHash('sha256').update(b).digest('hex');

test('T080 exact preview static source integrity OR explicit not-accessible DUE', {timeout:55000},async t=>{
 const stats=[];
 for(const path of paths){
  const gitBytes=execFileSync('git',['show',candidate+':'+path],{timeout:8000,maxBuffer:4*1024*1024});
  const baseline=execFileSync('git',['show',liveSha+':'+path],{timeout:8000,maxBuffer:4*1024*1024});
  assert.notEqual(hash(gitBytes),hash(baseline),'T080_CANDIDATE_NOT_CHANGED_FROM_LIVE_BASE');
  const url=new URL('/'+path,preview);
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(18000),headers:{Accept:'text/html, application/javascript'}});
  if([301,302,307,308].includes(r.status)){
   const raw=r.headers.get('location');
   assert(raw,'PREVIEW_HTTP_REDIRECT_WITHOUT_LOCATION');
   const destination=new URL(raw,url);
   const host=destination.hostname.toLowerCase();
   // Only known deployment-auth challenges are deferred. A redirect to
   // another news domain, unrecognised login or arbitrary host is NOT PASS.
   const vercelAuthHost=host==='vercel.com'||host.endsWith('.vercel.com');
   const vercelAuthPath=/\/(_vercel|auth|authentication|sso|login)(\/|\?|$)/i.test(destination.pathname);
   assert(vercelAuthHost||vercelAuthPath,'T080_PREVIEW_UNEXPECTED_REDIRECT_NOT_AUTH');
   console.log('T080_PR84_PREVIEW_REDIRECT_ASKS_AUTH; HTTP='+r.status+'; NOT_VERIFIED; DUE; no access bypass');
   t.skip('PR84 preview is access-protected; cannot certify remote source without authorized preview session');
   return;
  }
  if([401,403,404,429].includes(r.status)){
   console.log('T080_PR84_PREVIEW_HTTP='+r.status+'; NOT VERIFIED; DUE; no bypass attempted');
   t.skip('PR84 preview not accessible to anonymous review; Owner-only manual approval required');
   return;
  }
  assert.equal(r.status,200,'PREVIEW_HTTP_UNEXPECTED_STATUS_'+r.status);
  const remote=Buffer.from(await r.arrayBuffer());
  assert.equal(hash(remote),hash(gitBytes),'REMOTE_PREVIEW_SOURCE_BYTES_MISMATCH_'+path);
  stats.push(path);
 }
 assert.equal(stats.length,paths.length);
 console.log('T080_PR84_PREVIEW_REAL_HTTP_SOURCE_PARITY='+stats.length+'/'+paths.length+'_PASS_SCOPED');
 console.log('T080_PR84_REAL_FOUNDER_ANDROID_LIVE_SAVE=NOT_RUN');
});
