import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('ci/phase4/b11/t071-c4-e5-thirteen-executed-evidence-log-register-20261027.json','utf8'));
const names=['social','analytics','notifications','grievance','compliance','advertising','search','accountability','live','provider','payments','messaging','database'];
const prefix="T071_C4_E5_";
function invariant(x){
 assert.equal(x.schema,'JANTA_BOL_T071_C4_E5_LOG_REGISTER_V1');
 assert.equal(x.gate,'C4');
 assert.equal(x.master,'Phase4 T071 RECOV-019..026 p304');
 assert.equal(x.candidate.source_sha,'ddd80abbec0abd4f60e1e4556334365f599005ef');
 assert.equal(x.candidate.pull_request,47);
 assert.equal(x.candidate.hosted_preview_same_sha,false);
 assert.equal(x.candidate.sql_rpc_review_only_not_deployed,true);
 assert.equal(x.source_ancestry.original_b8_sha,'658f474d6ee0f24efac60f069979e8adee1e9221');
 assert.equal(x.events.length,13);
 assert.deepEqual(x.events.map(e=>e.index),Array.from({length:13},(_,i)=>i+1));
 assert.deepEqual(x.events.map(e=>e.module),names);
 for(const e of x.events){
  assert.equal(e.actual_integrated_full_release,false);
  assert.match(e.run_sha,/^[a-f0-9]{40}$/);
  assert(e.markers.length>=2 && e.markers.every(m=>!m.includes('\n')));
  assert.match(String(e.run_id),/^\d{11}$/);
  assert.match(String(e.job_id),/^\d{12}$/);
 }
 assert.equal(x.fake_production_faults_forbidden,true);
 assert.equal(x.founder_policy_approved,true);
 assert.equal(x.founder_numeric_rpo_rto_approved,false);
 assert.equal(x.regression_real_founder_hosted_authentication,'NOT_RUN');
 assert.equal(x.regression_full_guest_live_hosted_article_body,'NOT_PROVEN');
 assert.equal(x.c4_final_pass_lock,false);
 assert.equal(x.c3_final_pass_lock,false);
 assert.equal(x.t071_final_pass_lock,false);
 assert.equal(x.t072_started,false);
 assert.equal(x.domain,'JANTABOL.in');
 return true;
}
test('C4 exact 13 families, source identities and limits cannot be promoted to full E8',()=>invariant(structuredClone(data)));
const cheats=[
 ['premature C4 PASS',d=>d.c4_final_pass_lock=true],
 ['premature T071 PASS',d=>d.t071_final_pass_lock=true],
 ['erase payment family',d=>d.events.splice(10,1)],
 ['fourteenth DNS gate',d=>d.events.push(structuredClone(d.events[0]))],
 ['invent hosted integration',d=>d.events[0].actual_integrated_full_release=true],
 ['swap Cricket source',d=>d.candidate.source_sha='aaa'],
 ['fake hosted preview',d=>d.candidate.hosted_preview_same_sha=true],
 ['fake deployed reviewed SQL',d=>d.candidate.sql_rpc_review_only_not_deployed=false],
 ['fake actual owner auth',d=>d.regression_real_founder_hosted_authentication='PASS'],
 ['fake article body',d=>d.regression_full_guest_live_hosted_article_body='PASS'],
 ['fake Founder numerical SLA',d=>d.founder_numeric_rpo_rto_approved=true],
 ['start T072',d=>d.t072_started=true],
 ['wrong public hostname',d=>d.domain='jantaboli.in']
];
for(const [name,mutate] of cheats)test('C4 rejects forged outcome: '+name,()=>{
 const d=structuredClone(data);mutate(d);assert.throws(()=>invariant(d));
});
const api=async(endpoint,textMode=false)=>{
 const tok=process.env.GITHUB_TOKEN;assert(tok && tok.length>10,'Actions READ-ONLY token missing');
 const r=await fetch('https://api.github.com'+endpoint,{headers:{
  authorization:'Bearer '+tok,accept:'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28',
  'user-agent':'JANTABOL-T071-C4-replay-real-E5'
 },signal:AbortSignal.timeout(40000)});
 assert.equal(r.status,200,'Read only GitHub endpoint failed '+endpoint+' HTTP '+r.status);
 return textMode?r.text():r.json();
};
const cache=new Map();
async function fetched(e){
 if(cache.has(e.run_id))return cache.get(e.run_id);
 const [run,job,log]=await Promise.all([
  api('/repos/jantabol/JANTA-BOL-Website/actions/runs/'+e.run_id),
  api('/repos/jantabol/JANTA-BOL-Website/actions/jobs/'+e.job_id),
  api('/repos/jantabol/JANTA-BOL-Website/actions/jobs/'+e.job_id+'/logs',true)
 ]);
 assert.equal(run.id,e.run_id);
 assert.equal(run.conclusion,'success');
 assert.equal(run.head_sha,e.run_sha);
 assert.equal(run.head_branch,'codex/b11-t071-failure-isolation-preflight-20261027');
 assert.equal(job.run_id,e.run_id);
 assert.equal(job.id,e.job_id);
 assert.equal(job.conclusion,'success');
 assert(log.length>200);
 const obj={run,job,log};
 cache.set(e.run_id,obj);
 return obj;
}
const observed=[];
test('C4 independent E5: read ACTUAL historical GH Actions 13 family job logs and their timestamps and original source SHA',async()=>{
 for(const entry of data.events){
  const {log}=await fetched(entry);
  const rows=log.split('\n').filter(s=>/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z /.test(s) && !s.includes('echo '));
  const found=[];
  for(const marker of entry.markers){
   const line=rows.find(s=>s.trim().endsWith(marker));
   assert(line,'E5 actual log missing '+entry.module+' '+marker);
   const timestamp=line.split(' ')[0];
   assert(!Number.isNaN(Date.parse(timestamp)),'Invalid E5 UTC timestamp');
   found.push({timestamp,marker});
  }
  observed.push({index:entry.index,module:entry.module,run_id:entry.run_id,
   job_id:entry.job_id,run_sha:entry.run_sha,fault_class:entry.fault_class,
   observed:first(found),markers:found});
  console.log(prefix+String(entry.index).padStart(2,'0')+'_'+entry.module.toUpperCase()+'=ACTUAL_'+entry.fault_class+'_RUN_'+entry.run_id);
 }
 assert.equal(observed.length,13);
 console.log('C4_HISTORICAL_LOGS_INDDEPENDENTLY_VERIFIED=13_OF_13_SCOPED');
 console.log('C4_LIVE_PROVIDER_OUTAGE_OR_PUBLIC_CANDIDATE_E8=NOT_PROVEN');
},{timeout:210000});
function first(found){return found[0].timestamp;}
test('C4 E5 actual chronological original business action persisted across messaging failure',async()=>{
 const e=data.events.find(e=>e.index===12);
 const {log}=await fetched(e);
 const rows=log.split('\n').filter(s=>!s.includes('echo '));
 const times=e.markers.map(m=>{
  const found=rows.find(s=>s.trim().endsWith(m));assert(found);
  return Date.parse(found.split(' ')[0]);
 });
 assert(times[0]<times[1]&&times[1]<times[2],'Committed case temporal order wrong');
 console.log('C4_BUSINESS_CASE_COMMIT_BEFORE_HTTP_503_AND_READBACK_AFTER=ACTUAL_PG17_GH_LOG_PASS');
},{timeout:30000});
test('C4 original candidate PR47 pinned SHA, open and unmerged; independent source intent not production',async()=>{
 const pr=await api('/repos/jantabol/JANTA-BOL-Website/pulls/47');
 assert.equal(pr.number,47);
 assert.equal(pr.head.sha,data.candidate.source_sha);
 assert.equal(pr.head.ref,data.candidate.branch);
 assert.equal(pr.state,'open');assert.equal(pr.merged,false);
 const main=await api('/repos/jantabol/JANTA-BOL-Website/branches/main');
 assert.notEqual(main.commit.sha,pr.head.sha);
 console.log('C4_PR47_CANDIDATE_IMMUTABLE_SOURCE_SHA='+pr.head.sha);
 console.log('C4_JANTA_BOL_MAIN_UNMERGED=true');
 console.log('C4_FINAL_E5_HOSTED_INTEGRATION=HOLD');
},{timeout:40000});
