/**
 * B11/T075 E3: independent metadata-only history of DB, Media and joint Backup.
 * No secret, DB, Storage, B2 or postrestore media access. *Never* claims actual
 * encrypted offsite objects were retained, fresh, decrypted or restored.
 *
 * Branch is REVIEW ONLY. No automatic scheduling or production mutation.
 */
export const REPO='jantabol/JANTA-BOL-Website';
export const SOURCES=Object.freeze({
  db:'b7-t034-dual-recipient-real-MANUAL.yml',
  media:'b11-storage-media-MANUAL.yml',
  joint:'b11-t070-real-joint-restore-MANUAL.yml'
});
const fullPath=x=>'.github/workflows/'+x;
const validTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const isIntegerPositive=n=>Number.isSafeInteger(n)&&n>0;
const fatal=code=>{throw Error('B11_T075_E3_'+code)};
export function auditActualRunHistory(input,{observedAt,approvedMaxAgeHours=null}={}){
 if(!input||typeof input!=='object'||!validTime(observedAt))
  fatal('INVALID_INPUT');
 if(approvedMaxAgeHours!==null&&(!Number.isSafeInteger(approvedMaxAgeHours)||
    approvedMaxAgeHours<1||approvedMaxAgeHours>720))
  fatal('FOUNDER_RECENCY_NOT_VALID');
 const at=Date.parse(observedAt);
 const layers={};
 for(const [family,workflow] of Object.entries(SOURCES)){
  const list=input[family];
  // Null means GitHub API failed/unavailable; distinguish it from no runs.
  if(list===null){
   layers[family]={state:'HOLD_GITHUB_HISTORY_UNAVAILABLE',lastGoodRunId:null,
     lastGoodAt:null,ageHours:null};
   continue;
  }
  if(!Array.isArray(list)||list.length>100)fatal('BAD_HISTORY_'+family);
  const trustworthy=list.filter(r=>
   r&&r.repository?.full_name===REPO&&r.path===fullPath(workflow)&&
   r.head_branch==='main'&&r.actor?.login==='jantabol'&&
   r.event==='workflow_dispatch'&&r.run_attempt===1&&isIntegerPositive(r.id)&&
   typeof r.head_sha==='string'&&/^[a-f0-9]{40}$/.test(r.head_sha)&&
   validTime(r.created_at)&&Date.parse(r.created_at)<=at
  ).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
  if(new Set(trustworthy.map(r=>r.id)).size!==trustworthy.length)
   fatal('DUPLICATE_TRUSTED_RUN_IDS_'+family);
  const newest=trustworthy[0]??null;
  const good=trustworthy.find(r=>r.status==='completed'&&r.conclusion==='success')??null;
  const age=good?Math.max(0,Math.round((at-Date.parse(good.created_at))/36000)/100):null;
  let state='HOLD_NO_TRUSTED_RUN';
  if(newest&&newest.status==='completed'&&newest.conclusion!=='success')
   state='ALERT_NEWEST_JOB_FAILURE';
  else if(newest&&newest.status!=='completed')
   state='HOLD_LATEST_IN_PROGRESS';
  else if(!newest)state='HOLD_NO_TRUSTED_RUN';
  else if(!good)state='HOLD_NO_SUCCESS';
  else if(approvedMaxAgeHours===null)state='HOLD_FOUNDER_RECENCY_POLICY_MISSING';
  else if(age>approvedMaxAgeHours)state='ALERT_GITHUB_RUN_HISTORY_STALE';
  else state='PASS_METADATA_ONLY';
  layers[family]={
   state,lastGoodRunId:good?.id??null,lastGoodAt:good?.created_at??null,
   ageHours:age,newestTrustedRunId:newest?.id??null,
   latestRunId:newest?.id??null,source:fullPath(workflow)
  };
 }
 const allMetaCurrent=Object.values(layers).every(x=>x.state==='PASS_METADATA_ONLY');
 const samePointCaptureVerified=false; // Separate GitHub workflow runs can NEVER establish this.
 return Object.freeze({
  schema:'JANTA_BOL_B11_T075_E3_DUAL_HISTORY_READONLY_V1',
  repo:REPO,observedAt,approvedMaxAgeHours,
  layers,
  anyAlert:Object.values(layers).some(x=>x.state.startsWith('ALERT_')),
  allThreeRunHistoriesWithApprovedRecency:allMetaCurrent,
  samePointCaptureVerified,
  originalMediaBytesVerifiedNow:false,
  encryptedB2BytesAndRetentionVerifiedNow:false,
  hostedAuthEdgeVercelRestored:false,
  automaticEncryptedDbMediaBackupsDeployed:false,
  automaticLiveBackupHealthMonitoringDeployed:false,
  finalE3:'HOLD',finalE8:'HOLD',finalT075:'HOLD',
  noProductionChange:true
 });
}
export async function fetchReadOnlyHistory({token,fetchImpl=globalThis.fetch,env=process.env}={}){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==REPO||
    typeof token!=='string'||token.length<20)fatal('GH_CONTEXT_REQUIRED');
 const result={};
 for(const [family,name] of Object.entries(SOURCES)){
  let response;
  try{
   response=await fetchImpl('https://api.github.com/repos/'+REPO+
    '/actions/workflows/'+encodeURIComponent(name)+'/runs?event=workflow_dispatch&per_page=100',{
     method:'GET',redirect:'error',signal:AbortSignal.timeout(15000),
     headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json',
       'x-github-api-version':'2022-11-28'}
    });
   if(response?.status!==200){result[family]=null;continue;}
   const data=await response.json();
   result[family]=Array.isArray(data?.workflow_runs)?data.workflow_runs:null;
  }catch{
   result[family]=null;
  }
 }
 return result;
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const policy=process.env.B11_E3_APPROVED_MAX_AGE_HOURS;
  const approved=policy?Number(policy):null;
  const inputs=await fetchReadOnlyHistory({token:process.env.GH_T075_READONLY});
  const report=auditActualRunHistory(inputs,{
   observedAt:new Date().toISOString(),approvedMaxAgeHours:approved
  });
  // Safe whitelist: no records, keys, media or private IDs leave this runner.
  console.log('T075_E3_GITHUB_DB_HISTORY='+report.layers.db.state);
  console.log('T075_E3_GITHUB_MEDIA_HISTORY='+report.layers.media.state);
  console.log('T075_E3_GITHUB_JOINT_HISTORY='+report.layers.joint.state);
  console.log('T075_E3_LAST_GOOD_DB_JOB='+String(report.layers.db.lastGoodRunId));
  console.log('T075_E3_LAST_GOOD_MEDIA_JOB='+String(report.layers.media.lastGoodRunId));
  console.log('T075_E3_LAST_GOOD_JOINT_JOB='+String(report.layers.joint.lastGoodRunId));
  console.log('T075_E3_DB_MEDIA_COHERENT_FULL_RESTORE=UNVERIFIED');
  console.log('T075_E3_AUTOMATIC_ENCRYPTED_BACKUP=NOT_DEPLOYED');
  console.log('T075_E3_FULL_FINAL_LOCK=HOLD');
  if(report.anyAlert)console.log('::warning::T075 backup run-history layer reports an ALERT; genuine B2-current and recovery checks still required');
  else console.log('::notice::T075 only read-only historical metadata inspected; production storage/auth not touched');
 }catch(err){
  console.error('T075_E3_READONLY_HEALTH_CHECK_FAILED_CLOSED');
  process.exitCode=3;
 }
}
