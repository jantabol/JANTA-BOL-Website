#!/usr/bin/env node
// P4 B11 G0: read-only source & original test reconciliation. Never launches a backup,
// decrypts ciphertext, contacts production, reads credentials, or claims B11 PASS.
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const reg=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
const rows=[...reg.matchAll(/^\|\s*(P4-T\d{3})\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/gm)];
const ids=new Map(rows.map(x=>[x[1],{name:x[3].trim(),topic:x[2].trim(),block:x[4].trim(),status:x[5].trim()}]));
if(rows.length!==109||ids.size!==109)throw Error('B11_ORIGINAL_REGISTER_NOT_109_UNIQUE');
const names={
 'P4-T069':'Backup Layers + Security + Health',
 'P4-T070':'Real Restore Drill + Identity Preservation',
 'P4-T071':'RPO/RTO + Cross-Module Failure-Isolation Matrix',
 'P4-T072':'DB Partial Write + Fail-Closed + Retry/Idempotency',
 'P4-T073':'Corruption + Deletion + Security Incident + Credential/Config/Deployment Recovery',
 'P4-T074':'Post-Restore Verification + Independent Backup + Founder Device Loss',
 'P4-T075':'Automatic Recovery Operations + Implementation/Test Coverage + Final Lock'
};
for(const [id,name] of Object.entries(names)){
 const row=ids.get(id);
 if(!row||row.block!=='B11'||row.name!==name||row.status!=='NOT RUN')
 throw Error('B11_ORIGINAL_TEST_RENUMBER_OR_STATUS_DRIFT_'+id);
}
const locked=id=>/^PASS\s*\+\s*LOCK\b/.test(ids.get(id)?.status??'');
const stillOpen=['P4-T060','P4-T063','P4-T064','P4-T065','P4-T066','P4-T068'].filter(id=>!locked(id));
if(stillOpen.length<1)throw Error('B11_REQUIRE_REVIEW_OF_CHANGING_B10_RELEASE_AUTHORITY');
const expected=[
 'ci/backup/jb-free-offsite-backup.sh',
 'ci/backup/jb-t034-offline-full-pg-restore.sh',
 'ci/backup/jb-t034-security-parity.sql',
 'ci/backup/jb-t034-sequence-nextvalue-safety.sql',
 'ci/backup/jb-t034-shared-snapshot.sh',
 'ci/backup/jb-t034-restore-diagnostics.py',
 'ci/backup/jb-t034-deep-parity-diagnostics.py',
 'ci/backup/jb-b2-rclone-config.py',
 'ci/backup/OWNER_RELEASE_GATES.md',
 '.github/workflows/b7-production-free-encrypted-backup-MANUAL.yml',
 'evidence/T034_CP06_REAL_RESTORE_PASS_FINAL_ADS_GATES_20261015.md'
];
for(const path of expected)if(!existsSync(resolve(root,path)))throw Error('B11_REUSE_BASELINE_MISSING_'+path);
const manual=read('.github/workflows/b7-production-free-encrypted-backup-MANUAL.yml');
if(!/^on:\n  workflow_dispatch:/m.test(manual)||
/^\s*(push|schedule|pull_request):/m.test(manual)||
!manual.includes("github.ref == 'refs/heads/main'")||
!manual.includes("github.event.inputs.confirmation == 'JANTA_BOL_BACKUP_ONLY'")||
!manual.includes('janta-bol-production-backup')||
!manual.includes('contents: read'))
 throw Error('B11_EXISTING_BACKUP_FOUNDER_MANUAL_GUARDS_CHANGED');
const report=read('evidence/T034_CP06_REAL_RESTORE_PASS_FINAL_ADS_GATES_20261015.md');
for(const marker of ['38778388127','T034_FULL_PG17_DATABASE_RESTORED=true',
 'STORAGE_FILE_BYTES_RESTORED=false','PLATFORM_SETTINGS_RESTORED=false'])
 if(!report.includes(marker))throw Error('B11_REAL_RESTORE_SCOPE_EVIDENCE_MISSING_'+marker);
const outcome={
 schema:'jb-b11-g0-scope-readonly-v1',total_original_tests:109,
 b11_test_count:Object.keys(names).length,b11_original_ids:Object.keys(names),
 previous_b10_official_open_tests:stillOpen,
 original_b11_official_status:'NOT RUN',
 historic_real_db_restore:'EXISTING_SCOPED_PASS_20261015',
 historic_scope_gaps:['storage-media-original-bytes','full-platform-settings','new-real-run-as-of-20261024'],
 existing_backup_manual_trigger_locked:true,
 b11_g0_technical_readiness:'SOURCE_MAPPED_PRECHECK_ONLY',
 b11_final_lock:'NOT_RUN',
 release_authorized:false,production_backup_dispatched:false,
 independent_cricket_resources_untouched:true
};
console.log(JSON.stringify(outcome,null,2));
if(process.argv.includes('--require-b11-lock')){
 console.error('B11_RELEASE_BLOCKED: prior B10 official final HOLD; original B11 T069-T075 are NOT RUN and full media/config recoverability unproved.');
 process.exitCode=3;
}
