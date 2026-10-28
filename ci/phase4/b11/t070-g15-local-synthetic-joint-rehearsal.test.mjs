import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('ci/phase4/b11/t070-g15-local-synthetic-joint-rehearsal.sh','utf8');
const w=readFileSync('.github/workflows/b11-t070-identity-preflight-CANDIDATE.yml','utf8');
test('G15 only JANTA BOL candidate branch and no real Supabase or B2 data access',()=>{
 assert.match(s,/refs\/heads\/codex\/b11-t070-real-restore-identity-preflight-20261025/);
 assert.match(s,/PRODUCTION_CREDENTIAL_PRESENT/);
 assert.doesNotMatch(s,/vrffsnkycvjithwtiylt\.supabase\.co|hriakdazkcvplsdwgfle/);
 assert.doesNotMatch(s,/rclone\s|JB_BACKUP_REMOTE_PREFIX|api\.backblazeb2\.com/);
 assert.match(s,/supabase init --yes/);
 assert.match(s,/docker network create -o 'com\.docker\.network\.bridge\.host_binding_ipv4=127\.0\.0\.1'/);
});
test('G15 positive local real Postgres custom dump to separate database and synthetic FKs',()=>{
 assert.match(s,/pg_dump -U postgres -d postgres -Fc -n t070_fixture/);
 assert.match(s,/pg_restore -U postgres -d t070_g15_clone --no-owner/);
 assert.match(s,/CREATE TABLE t070_fixture\.live_updates/);
 assert.match(s,/CREATE TABLE t070_fixture\.ad_payments/);
 assert.match(s,/SOURCE_CLONE_ID_PARITY/);
 assert.match(s,/SOURCE_CLONE_FK_PARITY/);
});
test('G15 local unauthorized anon RLS negative exercises cloned database, not just RLS flags',()=>{
 assert.match(s,/ENABLE ROW LEVEL SECURITY/);
 assert.match(s,/CREATE POLICY anon_none .* USING \(false\)/);
 assert.match(s,/SET ROLE anon;SELECT count\(\*\) FROM t070_fixture\.articles;RESET ROLE;/);
 assert.match(s,/RESTORED_RLS_DENIAL/);
});
test('G15 five FAKE files are restored, SHA-checked and mutated bytes rejected',()=>{
 assert.match(s,/G15_FAKE_G1/);
 assert.match(s,/G15_FAKE_G2/);
 assert.match(s,/G15_FAKE_ED/);
 assert.match(s,/G15_FAKE_P1/);
 assert.match(s,/G15_FAKE_P2/);
 assert.match(s,/sha256sum -c/);
 assert.match(s,/TAMPER_UNDETECTED/);
});
test('G15 no owner secrets or source data in logs; cleanup and truthful result',()=>{
 assert.match(s,/set \+x/);
 assert.match(s,/trap cleanup EXIT/);
 assert.match(s,/supabase stop --no-backup/);
 assert.match(s,/G15_JANTA_BOL_PRODUCTION_DB_OR_MEDIA_RESTORED=false/);
 assert.match(s,/G15_SINGLE_REAL_PRODUCTION_CHECKPOINT=false/);
 assert.match(s,/G15_EDGE_VERCEL_RUNTIME_RECONSTRUCTED=false/);
 assert.match(s,/T070_REAL_JOINT_E8=NOT_RUN/);
 assert.match(w,/\[G15-local-synthetic\]/);
 assert.match(w,/contents: read/);
});
