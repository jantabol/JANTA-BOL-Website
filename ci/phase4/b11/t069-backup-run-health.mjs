#!/usr/bin/env node
// B11 T069: read-only GitHub manual-backup run history. No DB, B2, Storage access.
import {readFileSync} from 'node:fs';
const REPO='jantabol/JANTA-BOL-Website';
const WORKFLOW='b7-t034-dual-recipient-real-MANUAL.yml';
const FILE='.github/workflows/'+WORKFLOW;
const fail=x=>{throw Error('B11_T069_'+x)};
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
export function inspectBackupRuns(runs,{observed_at,approved_max_age_hours=null}={}){
 if(!date(observed_at)||!Array.isArray(runs)||runs.length>100)fail('INVALID_INPUT');
 if(approved_max_age_hours!==null&&(!Number.isSafeInteger(approved_max_age_hours)||
 approved_max_age_hours<1||approved_max_age_hours>720))fail('INVALID_FOUNDER_MAX_AGE');
 const now=Date.parse(observed_at);
 const found=runs.filter(r=>r&&r.repository?.full_name===REPO&&
  [FILE,FILE+'@refs/heads/main'].includes(r.path)&&r.head_branch==='main'&&
  r.event==='workflow_dispatch'&&r.actor?.login==='jantabol'&&r.run_attempt===1&&
  Number.isSafeInteger(r.id)&&date(r.created_at)&&Date.parse(r.created_at)<=now)
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 if(found.length!==new Set(found.map(x=>x.id)).size)fail('DUPLICATE_RUN_IDS');
 const latest=found[0]??null;
 const previous=found.find(x=>x.status==='completed'&&x.conclusion==='success')??null;
 let status='HOLD_NO_TRUSTED_RUN';
 if(latest?.status==='completed'&&latest.conclusion!=='success')status='ALERT_LATEST_BACKUP_RUN_FAILED';
 else if(latest&&latest.status!=='completed')status='HOLD_RUN_IN_PROGRESS';
 else if(previous&&approved_max_age_hours===null)status='HOLD_FOUNDER_RECENCY_UNAPPROVED';
 else if(previous&&(now-Date.parse(previous.created_at)>approved_max_age_hours*3600000))status='ALERT_BACKUP_STALE';
 else if(previous)status='PASS_RUN_HISTORY_ONLY';
 return {schema:'janta-bol-t069-gh-readonly-monitor-v1',source_repo:REPO,
  observed_at,status,approved_max_age_hours,
  newest_trusted_run_id:latest?.id??null,last_good_run_id:previous?.id??null,
  last_good_backup_run_at:previous?.created_at??null,
  last_good_age_hours:previous?Math.round((now-Date.parse(previous.created_at))/36000)/100:null,
  alarm:status.startsWith('ALERT_'),backup_layer:'GITHUB_MANUAL_DB_RUN_HISTORY',
  b2_object_retention_now_verified:false,all_storage_file_bytes_restored:false,
  final_t069:'HOLD',production_mutation:false};
}
export async function fetchTrustedRuns({token,fetchImpl=globalThis.fetch,env=process.env}={}){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==REPO||
 typeof token!=='string'||token.length<20)fail('UNAUTHORIZED_GITHUB_METADATA_FETCH');
 const res=await fetchImpl('https://api.github.com/repos/'+REPO+'/actions/workflows/'+WORKFLOW+
  '/runs?event=workflow_dispatch&per_page=100',{method:'GET',redirect:'error',
  signal:AbortSignal.timeout(18000),headers:{
   accept:'application/vnd.github+json',
   authorization:'Bearer '+token,'x-github-api-version':'2022-11-28'}});
 if(!res?.ok)fail('GITHUB_META_RETRIEVAL_FAILED');
 const data=await res.json();if(!Array.isArray(data?.workflow_runs))fail('GITHUB_META_INVALID');
 return data.workflow_runs;
}
if(process.argv[1]?.endsWith('t069-backup-run-health.mjs')){
 try{
  const arg=k=>{const i=process.argv.indexOf(k);return i<0?null:process.argv[i+1]};
  const hours=arg('--max-age-hours');
  const runs=process.argv.includes('--live-github')?
   await fetchTrustedRuns({token:process.env.GH_T069_TOKEN}):
   JSON.parse(readFileSync(arg('--fixture'),'utf8'));
  const report=inspectBackupRuns(runs,{observed_at:arg('--at')??new Date().toISOString(),
   approved_max_age_hours:hours===null?null:Number(hours)});
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.alarm)process.exitCode=2;
  else if(report.status!=='PASS_RUN_HISTORY_ONLY')process.exitCode=3;
 }catch(e){process.stderr.write(String(e?.message??'UNKNOWN')+'\n');process.exitCode=3}
}
