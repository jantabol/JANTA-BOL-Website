import test from 'node:test';
import assert from 'node:assert/strict';

const ROOT='https://api.github.com/repos/jantabol/JANTA-BOL-Website';
const token=process.env.GITHUB_TOKEN;
const DB={run:40223103797,job:121258741884};
const MEDIA={run:40274621191,job:121414622988};
let observed={};

async function github(endpoint){
 assert(token&&token.length>10,'Read-only GitHub Actions token required');
 const res=await fetch(ROOT+endpoint,{headers:{
   authorization:'Bearer '+token,
   accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28',
   'user-agent':'JANTABOL-T074-INDEPENDENT-READONLY-CHECK'
 },signal:AbortSignal.timeout(35000)});
 assert.equal(res.status,200,'actual GitHub API error for '+endpoint+' HTTP'+res.status);
 return endpoint.endsWith('/logs')?res.text():res.json();
}
function witnessed(log,marker){
 return log.split('\n').some(line=>
  /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z /.test(line)
  && line.trim().endsWith(marker)
  && !line.includes('echo ')
  && !line.includes('\x1b[36;1m'));
}
test('T074 old T034 ORIGINAL JANTA BOL offsite DB backup was restored on genuine isolated PG17, deep security verified',async()=>{
 const [run,job,log]=await Promise.all([
  github('/actions/runs/'+DB.run),github('/actions/jobs/'+DB.job),github('/actions/jobs/'+DB.job+'/logs')
 ]);
 assert.equal(run.id,DB.run);
 assert.equal(job.id,DB.job);
 assert.equal(job.run_id,run.id);
 assert.equal(run.conclusion,'success');
 assert.equal(job.conclusion,'success');
 for(const marker of [
  'T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS; OWNER_PRIVATE_KEY_NOT_USED=true',
  'T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH',
  'T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH',
  'T034_ANON_REAL_ROLE_ARTICLE_READ_AND_PAYMENT_DENIAL=PASS',
  'T034_FULL_PG17_DATABASE_RESTORED=true',
  'STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false'
 ])assert(witnessed(log,marker),'Missing real DB restoration marker: '+marker);
 observed.db_time=Date.parse(run.run_started_at||run.created_at);
 observed.db_sha=run.head_sha;
 console.log('T074_HISTORICAL_REAL_DB_OFFSITE_PG17_RESTORE_26_DATA_16_SECURITY=PASS_COMPONENT');
},{timeout:70000});
test('T074 T069 original 5 offsite private/public Storage media bytes hash independently restored, not database',async()=>{
 const [run,job,log]=await Promise.all([
  github('/actions/runs/'+MEDIA.run),github('/actions/jobs/'+MEDIA.job),github('/actions/jobs/'+MEDIA.job+'/logs')
 ]);
 assert.equal(run.id,MEDIA.run);
 assert.equal(job.id,MEDIA.job);
 assert.equal(job.run_id,run.id);
 assert.equal(run.conclusion,'success');
 assert.equal(job.conclusion,'success');
 for(const marker of [
  'B11_T069_ENCRYPTED_ORIGINAL_MEDIA_B2_READBACK=PASS',
  'B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS',
  'B11_T069_ORIGINAL_MEDIA_FILES_RESTORED=5',
  'B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false',
  'T069_SOURCE_ONLY=YES; NO_LIVE_MODIFICATION_OR_GITHUB_MEDIA_ARTIFACT'
 ])assert(witnessed(log,marker),'Missing real media restoration marker: '+marker);
 observed.media_time=Date.parse(run.run_started_at||run.created_at);
 observed.media_sha=run.head_sha;
 console.log('T074_HISTORICAL_REAL_MEDIA_FIVE_BYTES_OFFSITE_RESTORED=PASS_COMPONENT');
},{timeout:70000});
test('T074 independent freshness: distinct historical backup jobs are NOT a proven single snapshot or combined postrestore',()=>{
 assert(Number.isFinite(observed.db_time)&&Number.isFinite(observed.media_time));
 assert(observed.media_time-observed.db_time>3600000,'two captures falsely treated as same moment');
 assert.notEqual(observed.db_sha,observed.media_sha);
 console.log('T074_REAL_DB_MEDIA_DISTINCT_CAPTURE_TIMES_JOINT_POSTRESTORE=NOT_PROVEN');
});
test('T074 actual Founder phone+tablet prior SYNCED v2 sample does not prove real device loss/restore',()=>{
 const exact_manual_observation='SAME_DRAFT_SYNCED_VERSION_2_TWO_ANDROID_SCREENSHOTS';
 assert.equal(exact_manual_observation,'SAME_DRAFT_SYNCED_VERSION_2_TWO_ANDROID_SCREENSHOTS');
 console.log('T074_ANDROID_TWO_DEVICE_SAMPLED_DRAFT_VISIBILITY=REVIEWED_ONLY_NOT_DEVICE_LOSS');
});
test('T074 independent acceptance refuses missing real Auth/Edge/Vercel configured same-point clone, production restore and premature final lock',()=>{
 const authentic={db:true,media:true,one_point:false,auth_platform:false,founder_device_loss:false,full_e8:false};
 assert(authentic.db&&authentic.media);
 assert(!authentic.one_point&&!authentic.auth_platform&&!authentic.founder_device_loss&&!authentic.full_e8);
 console.log('T074_REAL_COMBINED_DB_STORAGE_AUTH_EDGE_VERCEL_RESTORE=HOLD');
 console.log('T074_FINAL_PASS_LOCK=false');
 console.log('T075_B11_FINAL_PASS_LOCK=false');
});
