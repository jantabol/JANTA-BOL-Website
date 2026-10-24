import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const path='ci/phase4/b11/media-offsite-companion.sh';
const content=readFileSync(path,'utf8');
test('T069/T074 approved JANTA BOL-only AGE+encrypted Backblaze companion without duplicate DB export',()=>{
 for(const marker of ['verify-trusted','jb-b2-rclone-config.py','copyto --immutable',
 'JB_BACKUP_REMOTE_PREFIX','JANTA_BOL_MEDIA_ONLY','disposable.age.key',
 'B11_MEDIA_EVIDENCE_KIND=SYNTHETIC_LOCAL_NOT_REAL_B2'])
 assert.ok(content.includes(marker),marker);
 assert.doesNotMatch(content,/supabase db dump|pg_dump/);
});
test('T073 Founder/manual protected main only; rejects scheduler and retry-based restore',()=>{
 for(const marker of ['GITHUB_EVENT_NAME','workflow_dispatch','GITHUB_REPOSITORY',
 'GITHUB_ACTOR','GITHUB_REF','refs/heads/main','GITHUB_RUN_ATTEMPT'])
 assert.ok(content.includes(marker),marker);
 assert.doesNotMatch(content,/--delete|--purge|--ignore-existing|rclone sync/);
});
test('T074 packaging and media decrypt readback SHA compare, never send plaintext to GitHub artifact',()=>{
 for(const marker of ['tar --append','zstd -q','age -r','age -d',
 'cmp -s "$tmp/source.tar.zst" "$tmp/recovered.tar.zst"',
 'sha256sum "$tmp/offsite-downloaded.age"'])
 assert.ok(content.includes(marker),marker);
 assert.doesNotMatch(content,/upload-artifact|artifact_tool/);
});
test('T074 Founder-only media backup workflow remains manual and never produces plaintext GitHub artifact',()=>{
 const s=readFileSync('.github/workflows/b11-storage-media-MANUAL.yml','utf8');
 assert.match(s,/^on:\n  workflow_dispatch:/m);
 assert.doesNotMatch(s,/^  (push|schedule|pull_request):/m);
 for(const required of ['github.actor == \'jantabol\'','github.ref == \'refs/heads/main\'',
   'github.run_attempt == 1','reviewed_sha == github.sha','janta-bol-production-backup',
   'JB_B11_SERVICE_ROLE_KEY','JANTA_BOL_MEDIA_EXPORT_ONLY'])
  assert.ok(s.includes(required),required);
 assert.doesNotMatch(s,/upload-artifact|pg_restore|supabase db dump/);
});
test('T073 refuse real media invocation without source or independent signer',()=>{
 const r=spawnSync('bash',[path,'manual-offsite','/not_found',
 '/not_found.sig','/not_found.pem'],{encoding:'utf8'});
 assert.equal(r.status,3);assert.match(r.stderr,/source offline folder required/);
});
