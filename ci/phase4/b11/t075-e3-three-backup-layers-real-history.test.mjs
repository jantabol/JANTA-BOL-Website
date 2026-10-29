import test from 'node:test';
import assert from 'node:assert/strict';
import {auditActualRunHistory,fetchReadOnlyHistory,SOURCES,REPO}
 from './t075-e3-three-backup-layers-real-history.mjs';
const now='2026-10-28T13:00:00Z';
const old='2026-10-21T12:49:11Z';
const mk=(family,id,at=old,props={})=>({
 id,repository:{full_name:REPO},path:'.github/workflows/'+SOURCES[family],
 head_branch:'main',head_sha:'f'.repeat(40),event:'workflow_dispatch',
 actor:{login:'jantabol'},run_attempt:1,status:'completed',conclusion:'success',
 created_at:at,...props
});
const db=mk('db',101);
const media=mk('media',102);
const joint=mk('joint',103);
const all={db:[db],media:[media],joint:[joint]};
test('T075 E3 missing Founder freshness policy always HOLD, even when all original runs succeeded',()=>{
 const a=auditActualRunHistory(all,{observedAt:now});
 for(const l of Object.values(a.layers))assert.equal(l.state,'HOLD_FOUNDER_RECENCY_POLICY_MISSING');
 assert.equal(a.finalE3,'HOLD');
 assert.equal(a.finalT075,'HOLD');
 assert.equal(a.automaticEncryptedDbMediaBackupsDeployed,false);
});
test('T075 E3 30-day demonstrative freshness can pass GitHub history ONLY, never real current B2/platform',()=>{
 const a=auditActualRunHistory(all,{observedAt:now,approvedMaxAgeHours:720});
 for(const l of Object.values(a.layers))assert.equal(l.state,'PASS_METADATA_ONLY');
 assert.equal(a.allThreeRunHistoriesWithApprovedRecency,true);
 assert.equal(a.samePointCaptureVerified,false);
 assert.equal(a.originalMediaBytesVerifiedNow,false);
 assert.equal(a.encryptedB2BytesAndRetentionVerifiedNow,false);
 assert.equal(a.hostedAuthEdgeVercelRestored,false);
 assert.equal(a.finalE8,'HOLD');
});
test('T075 E3 distinct time points must never be treated as one coherent snapshot',()=>{
 const shifted={...all,media:[mk('media',202,'2026-10-27T00:00:00Z')],joint:[mk('joint',203,'2026-10-26T00:00:00Z')]};
 const a=auditActualRunHistory(shifted,{observedAt:now,approvedMaxAgeHours:720});
 assert.equal(a.allThreeRunHistoriesWithApprovedRecency,true);
 assert.equal(a.samePointCaptureVerified,false);
});
test('T075 E3 no actual joint successful job keeps E8 HOLD regardless of DB and Media',()=>{
 const a=auditActualRunHistory({...all,joint:[]},{observedAt:now,approvedMaxAgeHours:720});
 assert.equal(a.layers.joint.state,'HOLD_NO_TRUSTED_RUN');
 assert.equal(a.finalT075,'HOLD');
});
test('T075 E3 newest failed original job overrides older historical success',()=>{
 const bad=mk('db',204,'2026-10-28T11:00:00Z',{conclusion:'failure'});
 const a=auditActualRunHistory({...all,db:[db,bad]},{observedAt:now,approvedMaxAgeHours:720});
 assert.equal(a.layers.db.state,'ALERT_NEWEST_JOB_FAILURE');
 assert.equal(a.layers.db.lastGoodRunId,101);
 assert.equal(a.anyAlert,true);
});
test('T075 E3 no response 403/404/corrupt JSON means HOLD, not invented green',async()=>{
 const request=[];
 const result=await fetchReadOnlyHistory({
 token:'t'.repeat(40),env:{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:REPO},
 fetchImpl:async(url,opts)=>{
  request.push({url,opts});
  return {status:403};
 }});
 assert.deepEqual(result,{db:null,media:null,joint:null});
 assert.equal(auditActualRunHistory(result,{observedAt:now}).layers.joint.state,
  'HOLD_GITHUB_HISTORY_UNAVAILABLE');
 assert.equal(request.length,3);
 for(const r of request){assert.equal(r.opts.method,'GET');assert.equal(r.opts.redirect,'error');}
});
test('T075 E3 wrong repository/branch/manual actor/schedule/fake SHA never trusted',()=>{
 for(const mod of [
 {repository:{full_name:'jantabol/Cricket-Prediction-Research'}},
 {head_branch:'feature'}, {actor:{login:'some-other-user'}},
 {event:'schedule'}, {head_sha:'1234'}, {run_attempt:2},
 {path:'.github/workflows/not-real.yml'}
 ]){
  const a=auditActualRunHistory({...all,db:[{...db,...mod}]},
   {observedAt:now,approvedMaxAgeHours:720});
  assert.equal(a.layers.db.state,'HOLD_NO_TRUSTED_RUN');
 }
});
test('T075 E3 future timestamp ignored; duplicates and malformed max-age rejected',()=>{
 const future=mk('db',200,'2026-10-29T13:00:00Z');
 assert.equal(auditActualRunHistory({...all,db:[future]},{
  observedAt:now,approvedMaxAgeHours:720
 }).layers.db.state,'HOLD_NO_TRUSTED_RUN');
 assert.throws(()=>auditActualRunHistory({...all,db:[db,db]},{
  observedAt:now
 }),/DUPLICATE_TRUSTED_RUN_IDS/);
 for(const value of [0,-1,731,1.5,NaN])
  assert.throws(()=>auditActualRunHistory(all,{observedAt:now,
   approvedMaxAgeHours:value}),/FOUNDER_RECENCY_NOT_VALID/);
});
test('T075 E3 freshness explicitly says historical backup stale (never changes Production)',()=>{
 const a=auditActualRunHistory(all,{observedAt:now,approvedMaxAgeHours:24});
 for(const l of Object.values(a.layers))assert.equal(l.state,'ALERT_GITHUB_RUN_HISTORY_STALE');
 assert.equal(a.noProductionChange,true);
 assert.equal(a.anyAlert,true);
});
test('T075 E3 no GH Actions context stops network access entirely',async()=>{
 let called=false;
 await assert.rejects(fetchReadOnlyHistory({token:'t'.repeat(40),env:{},
 fetchImpl:()=>{called=true;}}),/GH_CONTEXT_REQUIRED/);
 assert.equal(called,false);
});
test('T075 E3 real GitHub metadata transport never sees files, storage or service secrets',async()=>{
 const observed=[];
 const result=await fetchReadOnlyHistory({token:'t'.repeat(40),
 env:{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:REPO},
 fetchImpl:async(url,options)=>{
  observed.push({url,options});
  const fam=Object.entries(SOURCES).find(([,name])=>url.includes(encodeURIComponent(name)))[0];
  return {status:200,json:async()=>({workflow_runs:all[fam]})};
 }});
 assert.equal(result.db.length,1);
 assert.equal(result.media.length,1);
 assert.equal(result.joint.length,1);
 for(const o of observed){
  assert(o.url.startsWith('https://api.github.com/repos/'+REPO+'/actions/workflows/'));
  assert(!/storage\/v1|backblaze|supabase.co/.test(o.url));
  assert.equal(o.options.method,'GET');
 }
});
