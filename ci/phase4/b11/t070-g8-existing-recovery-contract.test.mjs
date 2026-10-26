// G8 is a structural audit of EXISTING T069 full-original-Storage recovery workflow.
// It does NOT invoke production, read credentials or touch grievance evidence.
// PASS means recovery prerequisites are implemented, NOT that actual T070 E8 ran.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const mainWorkflow=readFileSync('.github/workflows/b11-storage-media-MANUAL.yml','utf8');
const backupShell=readFileSync('ci/phase4/b11/storage-media-encrypted-b2-MANUAL.sh','utf8');
const exporter=readFileSync('ci/phase4/b11/storage-readonly-export.mjs','utf8');
const cli=readFileSync('ci/phase4/b11/storage-media-manual-cli.mjs','utf8');

test('G8 existing original-media recovery is Founder/main/manual/environment gated',()=>{
 assert.match(mainWorkflow,/workflow_dispatch:/);
 assert.match(mainWorkflow,/github.actor == 'jantabol'/);
 assert.match(mainWorkflow,/github.ref == 'refs\/heads\/main'/);
 assert.match(mainWorkflow,/github.event.inputs.reviewed_sha == github.sha/);
 assert.match(mainWorkflow,/environment: janta-bol-production-backup/);
 assert.match(mainWorkflow,/github.run_attempt == 1/);
 assert.match(backupShell,/B11_FOUNDER_APPROVED_MEDIA_OFFSITE/);
 assert.doesNotMatch(mainWorkflow,/^\s+(?:schedule|pull_request|push):/m);
});
test('G8 original byte workflow includes grievance-private, cannot run under current exclusion without fresh Founder decision',()=>{
 assert.match(exporter,/export const BUCKETS=Object\.freeze\(\['grievance-private','private-editorial','public-media'\]\)/);
 assert.match(exporter,/for\(const bucket of BUCKETS\)/);
 assert.match(exporter,/sha\.update\(chunk\)/);
 assert.match(mainWorkflow,/export-manual --root/);
 assert.match(cli,/capture_method:'MANUAL_OWNER_SERVICE_ROLE_READ_ONLY'/);
});
test('G8 immutable encrypted Backblaze offsite readback is separately decrypted and hash-verified on disposable disk',()=>{
 assert.match(backupShell,/age -r "\$JB_BACKUP_AGE_RECIPIENT" -r "\$secondary"/);
 assert.match(backupShell,/rclone .*copyto --immutable/);
 assert.match(backupShell,/cmp -s "\$tmp\/owner-encrypted\.age" "\$tmp\/readback\.age"/);
 assert.match(backupShell,/age -d -i "\$tmp\/ephemeral-age\.key"/);
 assert.match(backupShell,/mkdir -m 700 "\$tmp\/disposable-restored"/);
 assert.match(backupShell,/verify-offline --root "\$tmp\/disposable-restored"/);
 assert.match(backupShell,/B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false/);
});
test('G8 original Storage export limits, source double-scan and no production PUT/Delete',()=>{
 assert.match(exporter,/guardManual\(env\)/);
 assert.match(exporter,/const before=await listing/);
 assert.match(exporter,/const after=await listing/);
 assert.match(exporter,/SOURCE_CHANGED_DURING_EXPORT/);
 assert.match(exporter,/MAX_TOTAL=2\*1024\*1024\*1024/);
 assert.match(exporter,/createWriteStream\(save,\{flags:'wx',mode:0o600\}\)/);
 assert.doesNotMatch(exporter,/fetchImpl\([^\n]+\{method:'(?:PUT|DELETE|PATCH)'/);
 assert.match(exporter,/actual_files_exported:true,db_snapshot_bound:false/);
});
test('G8 full system restoration and atomic database+media snapshot are NOT falsely asserted by existing T069 workflow',()=>{
 assert.match(cli,/db_snapshot_bound:false/);
 assert.match(exporter,/source_atomic_with_database:false/);
 assert.match(backupShell,/B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false/);
 assert.doesNotMatch(mainWorkflow,/T070_FINAL_PASS|T070_FINAL_LOCK|T071_START/);
});
