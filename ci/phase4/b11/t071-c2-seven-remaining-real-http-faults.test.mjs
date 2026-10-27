// P4-T071 C2: seven additional families exercised through REAL loopback
// HTTP 503 on original repository source adapters. NO hosted E8 claim.
// Server 503 is intentionally synthetic; HTTP transport itself is real.
// Test never touches Git Main, PROD Supabase, social providers, or LIVE stream.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const b8=process.env.T071_C2_B8_SOURCE;
const news=process.env.T071_C2_NEWS_SOURCE;
assert(b8?.endsWith('/t071-c2-pinned-b8')&&!b8.includes('..'),'PINNED_B8_SOURCE_MISSING');
assert(news?.endsWith('/t071-c2-pinned-news')&&!news.includes('..'),'PINNED_NEWS_SOURCE_MISSING');
const from=(root,name)=>readFileSync(join(root,'JANTA_BOL_PHASE_3C_WORKING',name),'utf8');
const original=Object.freeze({
 domain:from(b8,'phase4-domain-client.js'),
 live:from(b8,'phase3a-live-client.js'),
 camera:from(b8,'phase3c-live-delivery.js'),
 social:from(b8,'social.html'),
 search:from(news,'b9-client.js'),
 news:from(news,'index.html'),
 article:from(news,'article.html'),
 livePage:from(news,'live.html')
});
let server,origin;
const hits=[];
before(async()=>{
  server=createServer((req,res)=>{
    const requestUrl=new URL(req.url,'http://127.0.0.1');
    const path=requestUrl.pathname;
    if(path.startsWith('/rpc/')||path.startsWith('/functions/v1/')||
       path==='/social/attempt'){
      hits.push({path,method:req.method});
      res.writeHead(503,{'content-type':'application/json','cache-control':'no-store'});
      res.end(JSON.stringify({ok:false,error:'T071_C2_ACTUAL_HTTP_503_DEPENDENCY_UNAVAILABLE'}));
      return;
    }
    let body;
    if(path==='/JANTA_BOL_PHASE_3C_WORKING/index.html')body=original.news;
    else if(path==='/JANTA_BOL_PHASE_3C_WORKING/article.html')body=original.article;
    else if(path==='/JANTA_BOL_PHASE_3C_WORKING/live.html')body=original.livePage;
    if(body){
      hits.push({path,method:req.method});
      res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
      res.end(body);
      return;
    }
    res.writeHead(404);res.end('NOT_FOUND');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
});
after(async()=>{if(server?.listening)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))});
async function request(url,body){
 const r=await fetch(origin+url,{method:body===undefined?'GET':'POST',
  headers:{'content-type':'application/json'},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),
  signal:AbortSignal.timeout(3000)});
 const payload=await r.json().catch(()=>({}));
 return {data:r.ok?payload:null,error:r.ok?null:new Error(
  'T071_C2_HTTP_'+r.status+'_DEPENDENCY_UNAVAILABLE')};
}
const id='30000000-0000-4000-8000-000000000001';
function runDomain(){
 const win={JBBackend:{requireOwner:async()=>true,client:{
  rpc:(name,args)=>request('/rpc/'+name,args)
 }}};
 vm.runInNewContext(original.domain,{window:win,Error,Date,URL},{timeout:1000});
 assert(win.JBPhase4);return win.JBPhase4;
}
function runLive(){
 const win={JBBackend:{client:{functions:{
  invoke:(name,{body}={})=>request('/functions/v1/'+name,body||{})
 }}}};
 vm.runInNewContext(original.live,{window:win,Error,Map},{timeout:1000});
 return win.JBLive;
}
test('core News/Article/LIVE routes continue serving original pinned HTML during 503 dependency faults',async()=>{
 for(const file of ['index.html','article.html','live.html']){
  const url=origin+'/JANTA_BOL_PHASE_3C_WORKING/'+file;
  const r=await fetch(url,{signal:AbortSignal.timeout(3000)});
  assert.equal(r.status,200,file);
  const txt=await r.text();
  assert.equal(txt,original[file==='index.html'?'news':file==='article.html'?'article':'livePage']);
  assert.match(txt,/<html\b/i);
 }
 const no=await fetch(origin+'/JANTA_BOL_PHASE_3C_WORKING/fabricated.html');
 assert.equal(no.status,404);
 console.log('C2_ORIGINAL_NEWS_ARTICLE_LIVE_STATIC_HTTP=3x200_SAFE_404');
});
test('01 SOCIAL original inline saveStatus: real HTTP provider 503 never marks Posted',async()=>{
 const scripts=[...original.social.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert(scripts.length>=1,'original social inline script');
 const el=()=>({textContent:'',checked:false,disabled:false,onchange:null});
 const doc={getElementById:el,documentElement:{dataset:{jbAuth:'loading'}}};
 const ctx=vm.createContext({window:{},document:doc,addEventListener:()=>{},navigator:{},alert:()=>{},
  encodeURIComponent,Error,URL,location:{href:'https://invalid.local/social.html'},
  JBPhase2:{socialAttempt:async(...args)=>{
    const r=await request('/social/attempt',{args});
    if(r.error)throw r.error;
    return r.data;
  }}
 });
 vm.runInContext(scripts.at(-1)[1],ctx,{timeout:1000});
 ctx.row={article_id:id,status:{facebook:'Pending'}};
 ctx.platform='facebook';ctx.value='Posted';
 await assert.rejects(vm.runInContext('saveStatus(row,platform,value)',ctx),/fake Posted allowed nahi/);
 assert.equal(ctx.row.status.facebook,'Pending');
 ctx.value='Failed';
 await assert.rejects(vm.runInContext('saveStatus(row,platform,value)',ctx),/T071_C2_HTTP_503/);
 assert.equal(ctx.row.status.facebook,'Pending');
 assert(hits.some(x=>x.path==='/social/attempt'));
 console.log('C2_01_SOCIAL_REAL_HTTP_503=FAIL_CLOSED_NO_FAKE_POSTED');
});
test('04 GRIEVANCE original protected transition rejects real local HTTP 503',async()=>{
 const x=runDomain();
 await assert.rejects(x.grievanceTransition(id,'UNDER_REVIEW','synthetic only'),
 /T071_C2_HTTP_503/);
 assert(hits.some(x=>x.path==='/rpc/jb_grievance_transition_internal'));
 console.log('C2_04_GRIEVANCE_REAL_HTTP_503=FAIL_CLOSED_SOURCE_ADAPTER');
});
test('05 COMPLIANCE original protected transition rejects actual local HTTP 503',async()=>{
 const x=runDomain();
 await assert.rejects(x.complianceTransition(id,'REVIEW_REQUIRED','synthetic only'),
 /T071_C2_HTTP_503/);
 assert(hits.some(x=>x.path==='/rpc/jb_compliance_transition_internal'));
 console.log('C2_05_COMPLIANCE_REAL_HTTP_503=FAIL_CLOSED_SOURCE_ADAPTER');
});
test('07 SEARCH original B9 search rejects local HTTP 503 without imaginary hits while Article GET still 200',async()=>{
 const win={JBBackend:{client:{rpc:(method,args)=>request('/rpc/'+method,args)}}};
 vm.runInNewContext(original.search,{window:win,Error},{timeout:1000});
 await assert.rejects(win.JBB9.search({query:'पिछोर',limit:5}),/T071_C2_HTTP_503/);
 assert(hits.some(x=>x.path==='/rpc/jb_b9_search'));
 const article=await fetch(origin+'/JANTA_BOL_PHASE_3C_WORKING/article.html');
 assert.equal(article.status,200);
 console.log('C2_07_SEARCH_REAL_HTTP_503=FAIL_CLOSED_ARTICLE_HTML_STILL_200');
});
test('09 LIVE original Edge adminOverview rejects real local HTTP 503 no false action success',async()=>{
 const api=runLive();
 await assert.rejects(api.adminOverview(),/T071_C2_HTTP_503/);
 assert(hits.some(x=>x.path==='/functions/v1/jb-live-api'));
 console.log('C2_09_LIVE_REAL_HTTP_503=NO_FALSE_LIVE_SUCCESS');
});
test('10 PROVIDER original camera handoff refuses failed LIVE Edge real 503 with unchanged navigation',async()=>{
 const live=runLive(),loc={href:'UNCHANGED'};
 const win={JBLive:live};
 vm.runInNewContext(original.camera,{window:win,Error,location:loc,URL},{timeout:1000});
 await assert.rejects(win.JB3CDelivery.openReporterCamera(id),/T071_C2_HTTP_503/);
 assert.equal(loc.href,'UNCHANGED');
 console.log('C2_10_CAMERA_PROVIDER_HTTP_503=NO_FALSE_REDIRECT');
});
test('12 MESSAGING original notification acknowledgement rejects genuine local HTTP 503',async()=>{
 const api=runLive();
 await assert.rejects(api.acknowledgeNotification(id),/T071_C2_HTTP_503/);
 assert(hits.some(x=>x.path==='/functions/v1/jb-live-api'));
 console.log('C2_12_MESSAGING_EDGE_HTTP_503=NO_FALSE_ACK');
});
