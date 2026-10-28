import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const REPO='jantabol/JANTA-BOL-Website';
const API='https://api.github.com/repos/'+REPO;
const TOKEN=process.env.GITHUB_TOKEN;
const verified=[
 {type:'T034_REAL_ORIGINAL_ENCRYPTED_DB',run:40223103797,job:121258741884,
  markers:['T034_FULL_PG17_DATABASE_RESTORED=true',
   'T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH',
   'T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH',
   'STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false']},
 {type:'T069_REAL_ORIGINAL_MEDIA',run:40274621191,job:121414622988,
  markers:['B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS',
   'B11_T069_ORIGINAL_MEDIA_FILES_RESTORED=5',
   'B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false']},
 {type:'T070_REAL_REPRESENTATIVE_SINGLE_RUN_DB_PLUS_5_ORIGINAL_MEDIA',run:40452402698,job:122017925138,
  markers:['T070_REAL_SOURCE_DB_SNAPSHOT_FIVE_ORIGINAL_STORAGE_METADATA_BOUND=PASS',
   'T070_FRESH_READ_ONLY_PG_POST_MEDIA_ID_TIMESTAMP_PARITY=PASS',
   'T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS',
   'T070_DB_STORAGE_UNIVERSAL_ATOMIC_FREEZE_PROVEN=false',
   'T070_AUTH_EDGE_VERCEL_RUNTIME_REBUILT=false',
   'T070_ACTUAL_GO_TRUE_EDGE_VERCEL_CONFIG_RUNTIME=NOT_RESTORED',
   'T070_FINAL_INDEPENDENT_E8=NOT_RUN',
   'T070_FINAL_LOCK=HOLD']},
 {type:'T073_REAL_LOCAL_ORIGINAL_CORRUPTION_RESTORE',run:40643194778,job:122665886470,
  markers:['T073_PG17_SNAPSHOT_RESTORES_EXACT_CASE_ARTICLE_AD_IDENTITIES=PASS_SCOPED',
   'T073_RESTORED_AUTH_OWNER_PROTECTED_WRITE_FAIL_CLOSED=PASS_SCOPED',
   'T073_FINAL_E1_E5_E7_E8_PASS_LOCK=false']},
 {type:'T074_REAL_LOCAL_ORIGINAL_B8_POSTRESTORE_SECURITY',run:40647232466,job:122678784017,
  markers:['T074_RESTORED_CASE_GRANT_DRAFT_ARTICLE_AD_RLS_INTEGRITY=PASS',
   'T074_RESTORED_EFFECTIVE_AUTHENTICATED_RAW_PRIVATE_READ_DENIED=PASS',
   'T074_RESTORED_AAL1_OWNER_WRITE_DENIED=PASS',
   'T074_RESTORED_INACTIVE_OWNER_SESSION_DENIED=PASS',
   'T074_RESTORED_UNASSIGNED_REPORTER_DENIED=PASS',
   'T074_RESTORED_AUTHORIZED_REPORTER_POSTRESTORE_NEW_DRAFT=PASS',
   'T074_RESTORED_REPORTER_REVOKE_EFFECTIVE=PASS',
   'T074_REAL_PG17_POSTRESTORE_FUNCTIONAL_RLS_OWNER_REPORTER_REVOCATION=PASS_SCOPED',
   'T074_FULL_E8_FINAL_PASS_LOCK=false']}
];
function observed(log,marker){
 return log.split('\n').some(line=>
  /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z /.test(line)&&
  line.trim().endsWith(marker)&&!line.includes('echo ')&&
  !line.includes('\x1b[36;1m'));
}
async function github(path,kind='json'){
 assert.equal(process.env.GITHUB_ACTIONS,'true','actual GitHub Actions required');
 assert.equal(process.env.GITHUB_REPOSITORY,REPO,'wrong repository');
 assert(TOKEN&&TOKEN.length>15,'GitHub Actions read-only token required');
 const res=await fetch(API+path,{method:'GET',redirect:'follow',
  headers:{authorization:'Bearer '+TOKEN,accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28','User-Agent':'JANTABOL-T075-READONLY-ORIGINAL-EVIDENCE'},
  signal:AbortSignal.timeout(30000)});
 assert.equal(res.status,200,'Original GitHub evidence unavailable: '+path+' HTTP '+res.status);
 return kind==='text'?res.text():res.json();
}
test('T075/E1: independently recheck T034 T069 T070 T073 T074 original run IDs and executed markers; no reused fixture',async()=>{
 for(const e of verified){
  const [run,job,log]=await Promise.all([
   github('/actions/runs/'+e.run),
   github('/actions/jobs/'+e.job),
   github('/actions/jobs/'+e.job+'/logs','text')]);
  assert.equal(run.id,e.run);
  assert.equal(job.id,e.job);
  assert.equal(job.run_id,e.run);
  assert.equal(run.repository?.full_name,REPO);
  assert.equal(run.conclusion,'success');
  assert.equal(job.conclusion,'success');
  assert(run.head_sha&&/^[0-9a-f]{40}$/.test(run.head_sha),'missing bound source SHA');
  for(const marker of e.markers)assert(observed(log,marker),
   e.type+': missing true execution '+marker);
  console.log('T075_E1_ORIGINAL_RUN_LOG_VERIFIED='+e.type+':PASS_COMPONENT_ONLY');
 }
},{timeout:175000});
test('T075/E3 original backup and health still manually triggered; automatic-backup claim strictly denied',()=>{
 const files=[
 '.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml',
 '.github/workflows/b11-storage-media-MANUAL.yml',
 '.github/workflows/b11-t070-real-joint-restore-MANUAL.yml',
 '.github/workflows/b11-t069-backup-run-health-readonly.yml'];
 for(const path of files){
  const body=readFileSync(path,'utf8');
  assert.match(body,/workflow_dispatch:/,'manual original backup missing '+path);
  assert.doesNotMatch(body,/^\s+schedule:\s*$/m,'unexpected schedule; audit needed '+path);
  assert.doesNotMatch(body,/^\s+(?:push|pull_request):\s*$/m,'unsafe backup trigger '+path);
 }
 const health=readFileSync('ci/phase4/b11/t069-backup-run-health.mjs','utf8');
 assert.match(health,/PASS_RUN_HISTORY_ONLY/);
 assert.match(health,/HOLD_FOUNDER_RECENCY_UNAPPROVED/);
 assert.match(health,/b2_object_retention_now_verified:false/);
 console.log('T075_E3_EXISTING_AUTOMATIC_BACKUP=NOT_PROVEN_MANUAL_ONLY');
 console.log('T075_E3_EXISTING_HEALTH_DASHBOARD_AUTOMATED=NOT_PROVEN_MANUAL_ONLY');
});
test('T075/E7 original Phase-3A Live and recovery scripts are preserved, no rebuild or new production write',()=>{
 const manual=readFileSync('.github/workflows/b11-t070-real-joint-restore-MANUAL.yml','utf8');
 const db=readFileSync('ci/backup/jb-free-offsite-backup.sh','utf8');
 const originals=[
  'ci/phase4/b11/t070-g8-existing-recovery-contract.test.mjs',
  'ci/phase4/b11/t070-g17-maintenance-go-no-go.test.mjs',
  'ci/phase4/b11/t070-g18-edge-version-inventory.test.mjs',
  'ci/phase4/b11/t070-final-e8-gate.test.mjs'];
 for(const path of originals)assert(readFileSync(path,'utf8').includes('test('),path+' missing');
 assert.match(manual,/environment: janta-bol-production-backup/);
 assert.match(manual,/github.actor == 'jantabol'/);
 assert.match(manual,/github.ref == 'refs\/heads\/main'/);
 assert.match(db,/JB_T070_JOINT_PROBE:-0/);
 assert.match(db,/T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS/);
 assert.match(db,/T070_FINAL_LOCK=HOLD/);
 console.log('T075_E7_LEGACY_MANUAL_PROTECTED_RECOVERY_SOURCE=INTACT_PREVIEW_SOURCE_ONLY');
});
test('T075/E8 cross-component, independent scheduling, Auth/Edge/Vercel restore and device recovery remain UNPROVEN',()=>{
 const gate=readFileSync('ci/phase4/b11/t070-final-e8-gate.mjs','utf8');
 const backup=readFileSync('ci/phase4/b11/t069-backup-run-health.mjs','utf8');
 assert.match(gate,/READY_FOR_INDEPENDENT_FOUNDER_REVIEW/);
 assert.match(backup,/production_mutation:false/);
 const requirements={
  universal_atomic_single_point_db_and_media_capture_proven:false,
  representative_db_and_five_media_same_run_restored:true,
  recovered_hosted_auth_sessions:false,
  recovered_edge_runtime_and_secrets:false,
  restored_vercel_config_and_functional_release:false,
  founder_device_loss_test:false,
  automatic_backup_and_health_freshness:false,
  independent_full_recovery_E8:false,
  founder_final_release_acceptance:false
 };
 assert.equal(Object.values(requirements).every(x=>x===true),false);
 console.log('T075_E8_REQUIRED_PROOFS_NOT_AVAILABLE='+Object.entries(requirements).filter(([,proved])=>proved!==true).map(([name])=>name).join(','));
 console.log('T075_RUN10_FINAL_PASS_LOCK=HOLD');
 console.log('T075_SOFT_LAUNCH_DEPLOYED_BY_THIS_WORKFLOW=false');
});
