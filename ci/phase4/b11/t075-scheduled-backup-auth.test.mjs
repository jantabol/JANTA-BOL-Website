import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertScheduledBackupContext,SCHEDULED_WORKFLOW,SCHEDULED_AUTH}
 from './t075-scheduled-backup-identity.mjs';
import {guardManual} from './storage-readonly-export.mjs';
const ctx={
 GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'schedule',
 GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website',
 GITHUB_REF:'refs/heads/main',GITHUB_RUN_ATTEMPT:'1',
 GITHUB_WORKFLOW_REF:SCHEDULED_WORKFLOW,
 JB_T075_AUTO_JOINT_BACKUP:'1',
 JB_T075_SCHEDULED_RELEASE_AUTH:SCHEDULED_AUTH,
 JB_T034_DUAL_RESTORE_PROBE:'1',
 JB_T070_JOINT_PROBE:'1',
 B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_T075_SCHEDULED_JOINT_EXPORT'
};
const manual={
 GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',
 GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website',
 GITHUB_ACTOR:'jantabol',GITHUB_REF:'refs/heads/main',
 GITHUB_RUN_ATTEMPT:'1',
 GITHUB_WORKFLOW_REF:'jantabol/JANTA-BOL-Website/.github/workflows/b11-t070-real-joint-restore-MANUAL.yml@refs/heads/main',
 JB_T034_DUAL_RESTORE_PROBE:'1',JB_T070_JOINT_PROBE:'1',
 B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_T070_JOINT_EXPORT_ONLY'
};
test('T075 exact scheduled protected context independently validates success for genuine trusted workflow',()=>{
 assert.equal(assertScheduledBackupContext(ctx),true);
 assert.equal(guardManual(ctx),true);
});
test('T075 existing Founder original T070 manual context still valid unchanged',()=>{
 assert.equal(guardManual(manual),true);
});
test('T075 old media-only T069 and DB-only T034 guards remain protected and unchanged',()=>{
 const oldMedia={...manual,JB_T070_JOINT_PROBE:'0',
  GITHUB_WORKFLOW_REF:'jantabol/JANTA-BOL-Website/.github/workflows/b11-storage-media-MANUAL.yml@refs/heads/main',
  B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_MEDIA_EXPORT_ONLY'};
 assert.equal(guardManual(oldMedia),true);
 const oldDb=readFileSync('ci/backup/jb-free-offsite-backup.sh','utf8');
 assert.match(oldDb,/legacy T034 manual workflow identity required/);
 assert.match(oldDb,/real isolated clone verification denied: manual Founder\/main\/first attempt required/);
 assert.match(oldDb,/T070 requires a separate, protected, reviewed, Founder-only real joint workflow/);
});
test('T075 untrusted schedule, PR, push and feature branch always fail before secrets',()=>{
 for(const patch of [
  {GITHUB_EVENT_NAME:'push'},
  {GITHUB_EVENT_NAME:'workflow_dispatch'},
  {GITHUB_REF:'refs/heads/sandbox'},
  {GITHUB_REF:'refs/pull/7/merge'},
  {GITHUB_REPOSITORY:'jantabol/Cricket-Prediction-Research'},
  {GITHUB_WORKFLOW_REF:'jantabol/JANTA-BOL-Website/.github/workflows/hijacked.yml@refs/heads/main'},
  {GITHUB_WORKFLOW_REF:manual.GITHUB_WORKFLOW_REF},
  {GITHUB_ACTIONS:'false'},
  {GITHUB_RUN_ATTEMPT:'2'},
  {GITHUB_RUN_ATTEMPT:'0'}
 ]){
  assert.throws(()=>assertScheduledBackupContext({...ctx,...patch}),
    /SCHEDULED_PROTECTED_CONTEXT_DENIED/,JSON.stringify(patch));
  assert.throws(()=>guardManual({...ctx,...patch}),
    /SCHEDULED_PROTECTED_CONTEXT_DENIED/,JSON.stringify(patch));
 }
});
test('T075 no independent release marker, dual/real-storage verification, or private service role authorizer => HOLD',()=>{
 for(const patch of [
  {JB_T075_AUTO_JOINT_BACKUP:'0'},{JB_T075_AUTO_JOINT_BACKUP:''},
  {JB_T075_SCHEDULED_RELEASE_AUTH:'ALLOW'},
  {JB_T075_SCHEDULED_RELEASE_AUTH:''},
  {JB_T034_DUAL_RESTORE_PROBE:'0'},
  {JB_T070_JOINT_PROBE:'0'},
  {B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_T070_JOINT_EXPORT_ONLY'}
 ]){
  assert.throws(()=>assertScheduledBackupContext({...ctx,...patch}),/SCHEDULED_PROTECTED_CONTEXT_DENIED/);
 }
});
test('T075 manual event can never use schedule flag to bypass Founder identity',()=>{
 for(const patch of [
  {...manual,JB_T075_AUTO_JOINT_BACKUP:'1'},
  {...manual,GITHUB_ACTOR:'untrusted'},
  {...manual,GITHUB_REF:'refs/heads/feature'},
  {...manual,GITHUB_EVENT_NAME:'schedule'},
  {...manual,GITHUB_WORKFLOW_REF:SCHEDULED_WORKFLOW},
  {...manual,B11_MEDIA_EXPORT_CONFIRMATION:'WRONG'}
 ]){
  assert.throws(()=>guardManual(patch));
 }
});
test('T075 weekly schedule uses no push/pull_request or manual token bypass; default disabled until Founder repo variable',()=>{
 const source=readFileSync('.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml','utf8');
 const gate=readFileSync('ci/phase4/b11/t075-scheduled-backup-identity.mjs','utf8');
 assert.match(source,/cron: '45 21 \* \* 6'/);
 assert.match(source,/vars.JB_T075_SCHEDULED_BACKUP_ENABLED == 'YES_FOUNDER_RELEASED'/);
 assert.match(source,/vars\.JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED == 'YES_FOUNDER_VERIFIED_ZERO'/);
 assert.match(source,/environment: janta-bol-production-backup/);
 assert.match(source,/group: janta-bol-free-backup/);
 assert.match(source,/cancel-in-progress: false/);
 assert.doesNotMatch(source,/\bpush:\s*\n|\bpull_request:\s*\n/);
 assert.doesNotMatch(source,/\bpermissions:\s*\n\s+actions:\s+write/);
 assert.match(source,/version: 2\.120\.0/);
 assert.match(source,/JB_T075_AUTO_JOINT_BACKUP: '1'/);
 assert.match(source,/JB_T034_DUAL_RESTORE_PROBE: '1'/);
 assert.match(source,/JB_T070_JOINT_PROBE: '1'/);
 assert.match(source,/JB_BACKUP_AGE_RECIPIENT:/);
 assert.doesNotMatch(source,/AGE_PRIVATE|AGE_SECRET_KEY|AGE_IDENTITY/);
 assert.match(gate,/SCHEDULED_PROTECTED_CONTEXT_DENIED/);
});
test('T075 original manual source and recovery safety not substituted or silently downgraded',()=>{
 const db=readFileSync('ci/backup/jb-free-offsite-backup.sh','utf8');
 const restore=readFileSync('ci/backup/jb-t034-offline-full-pg-restore.sh','utf8');
 const exporter=readFileSync('ci/phase4/b11/storage-readonly-export.mjs','utf8');
 const cli=readFileSync('ci/phase4/b11/storage-media-manual-cli.mjs','utf8');
 const binder=readFileSync('ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs','utf8');
 assert.match(db,/node --input-type=module -e "import \{assertScheduledBackupContext\}/);
 assert.match(db,/T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS/);
 assert.match(db,/--immutable/);
 assert.match(db,/cmp -s "\$work\/backup.age" "\$work\/remote.age"/);
 assert.match(restore,/T070_RESTORED_PG17_AND_ORIGINAL_FIVE_FILE_UUIDS_METADATA=EXACT_MATCH/);
 assert.match(exporter,/const MAX_TOTAL=2\*1024\*1024\*1024/);
 assert.match(cli,/SCHEDULED_PROTECTED_SERVICE_ROLE_READ_ONLY/);
 assert.match(binder,/SCHEDULED_PROTECTED_SERVICE_ROLE_READ_ONLY/);
 assert.match(exporter,/MANUAL_OWNER_SERVICE_ROLE_READ_ONLY/);
 assert.match(restore,/T075 protected scheduled original DB\/Storage restore context denied/);
});
test('T075 new scheduled authorization does not imply offsite current-byte retention or full hosted E8',()=>{
 const w=readFileSync('.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml','utf8');
 assert.match(w,/T075_AUTH_EDGE_VERCEL_RUNTIME_RESTORE=NOT_TESTED/);
 assert.match(w,/T075_FULL_E8_FINAL_LOCK=HOLD/);
 assert.match(w,/do not merge without signed Founder/i);
});

test('T075 weekly cost exposure is bounded BEFORE original DB export and immutable offsite upload',()=>{
 const source=readFileSync('ci/backup/jb-free-offsite-backup.sh','utf8');
 const budget=source.indexOf('T075 scheduled offsite quota unreadable');
 const firstDb=source.indexOf('supabase db dump --db-url');
 const upload=source.indexOf('rclone --config "$work/rclone.conf" copyto --immutable');
 const cap=source.indexOf('python3 ci/phase4/b11/t075-scheduled-budget.py upload');
 assert(budget>0&&budget<firstDb,'remote metadata must be checked BEFORE live DB export');
 assert(cap>firstDb&&cap<upload,'single ciphertext cap must happen BEFORE B2 upload');
 assert.match(source,/t075-scheduled-budget\.py preflight/);
 assert.match(source,/t075-scheduled-budget\.py upload/);
 const validator=readFileSync('ci/phase4/b11/t075-scheduled-budget.py','utf8');
 assert.match(validator,/MAX_PREFIX_BYTES = 2 \* 1024\*\*3/);
 assert.match(validator,/MAX_NEW_CIPHERTEXT = 512 \* 1024\*\*2/);
 assert.match(validator,/remote_bytes \+ new_size > MAX_PREFIX_BYTES/);
 assert.match(source,/--immutable/);
 assert.doesNotMatch(source,/rclone.*(?:delete|purge|sync|moveto)/);
});

test('T075 ZERO PAID: two independent default-OFF release approvals AND actual environment required',()=>{
 const w=readFileSync('.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml','utf8');
 const job=w.match(/    if: (\$\{\{[^\n]+\}\})/);
 assert(job,'scheduled job must have explicit GitHub condition');
 const cond=job[1];
 assert(cond.includes("github.event_name == 'schedule'"));
 assert(cond.includes("github.ref == 'refs/heads/main'"));
 assert(cond.includes("vars.JB_T075_SCHEDULED_BACKUP_ENABLED == 'YES_FOUNDER_RELEASED'"));
 assert(cond.includes("vars.JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED == 'YES_FOUNDER_VERIFIED_ZERO'"));
 assert(cond.includes("github.run_attempt == 1"));
 assert(w.includes('environment: janta-bol-production-backup'));
 assert(!/permissions:\s*\n\s*contents: write/.test(w));
});

test('T075 prevent stale or wrong-subfolder quota: verify bucket-wide B2 cap twice before export and before upload',()=>{
 const s=readFileSync('ci/backup/jb-free-offsite-backup.sh','utf8');
 const command='rclone --config "$work/rclone.conf" --retries 1 size --json "jbbackup:jantabol-backup-euc-2026"';
 const start=s.indexOf('if [[ "$auto" == 1 ]]; then\n  # FREE-TIER COST CAP:');
 const pre=s.indexOf(command,start);
 const db=s.indexOf('supabase db dump --db-url');
 const cap=s.indexOf('python3 ci/phase4/b11/t075-scheduled-budget.py upload');
 const fresh=s.indexOf(command,db);
 const offsite=s.indexOf('copyto --immutable');
 assert(start>=0 && pre>start && pre<db);
 assert(fresh>db && fresh<cap && cap<offsite);
 assert.equal(s.split(command).length-1,2,'must check B2 whole bucket before DB and again before immutable upload');
 assert(!s.includes('size --json "${JB_BACKUP_REMOTE_PREFIX%/}"'));
 assert.match(s,/T075 fresh bucket-wide B2 quota unknown before upload/);
});
