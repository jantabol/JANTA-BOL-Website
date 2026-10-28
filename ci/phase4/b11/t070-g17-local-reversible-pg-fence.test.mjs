import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path='ci/phase4/b11/t070-g17-local-reversible-pg-fence.sh';
const s=readFileSync(path,'utf8');
const g15=readFileSync('ci/phase4/b11/t070-g15-local-synthetic-joint-rehearsal.sh','utf8');
const workflow=readFileSync('.github/workflows/b11-t070-identity-preflight-CANDIDATE.yml','utf8');
test('G17 real database lock probe is only synthetic project Docker container, no production credentials',()=>{
 assert.match(s,/refs\/heads\/codex\/b11-t070-real-restore-identity-preflight-20261025/);
 assert.match(s,/G17_LOCAL_SYNTHETIC_ONLY/);
 assert.match(s,/SYNTHETIC_FIXTURE_MISSING/);
 assert.match(s,/REAL_CREDENTIAL_PRESENT/);
 assert.doesNotMatch(s,/rclone|supabase\.co|s3\.backblazeb2|age -d|JB_BACKUP_REMOTE_PREFIX/);
 assert.match(s,/docker exec "\$db"/);
});
test('G17 lock blocks fake writer yet keeps fake read, no privilege GRANT or live table alteration',()=>{
 assert.match(s,/LOCK TABLE t070_fixture\.articles IN SHARE MODE/);
 assert.match(s,/SELECT count\(\*\) FROM t070_fixture\.articles/);
 assert.match(s,/SET lock_timeout='400ms'/);
 assert.match(s,/WRITER_WAS_NOT_FENCED/);
 assert.match(s,/BLOCKED_ROW_PRESENT/);
 assert.doesNotMatch(s,/\bALTER\s+(?:ROLE|TABLE|DATABASE)|\bREVOKE\b|\bGRANT\b|cron\.unschedule/);
});
test('G17 rollback success and crash disconnection both exercise physical PG session lock release',()=>{
 assert.match(s,/printf 'ROLLBACK;/);
 assert.match(s,/EXPLICIT_ROLLBACK_FAILED/);
 assert.match(s,/pg_terminate_backend\(\$pid\)/);
 assert.match(s,/CRASH_LOCK_DID_NOT_AUTO_RELEASE/);
 assert.match(s,/G17_LOCAL_PG_FORCED_CONNECTION_LOSS_AUTO_ROLLBACK=PASS/);
});
test('G17 fixture release drill leaves real media and full-system E8 unclaimed',()=>{
 assert.match(s,/G17_STORAGE_WRITE_FENCE_VERIFIED=false/);
 assert.match(s,/G17_SOURCE_CRON_5_SECOND_JOB_PAUSED=false/);
 assert.match(s,/G17_REAL_PRODUCTION_MAINTENANCE_PERFORMED=false/);
 assert.match(s,/G17_REAL_JOINT_DB_MEDIA_RESTORE=NOT_RUN/);
 assert.match(s,/T070_REAL_JOINT_E8=NOT_RUN/);
});
test('G17 isolated exercise is command-marker gated, not run by every PR push or secret workflow',()=>{
 assert.match(g15,/repo_root="\$\(pwd\)"/);
 assert.match(g15,/\$\{G17_LOCAL_SYNTHETIC_ONLY:-\}/);
 assert.match(workflow,/\[G17-local-fence\]/);
 assert.match(workflow,/G17_LOCAL_SYNTHETIC_ONLY: \$\{\{/);
 assert.match(workflow,/bash -n ci\/phase4\/b11\/t070-g17-local-reversible-pg-fence\.sh/);
});
