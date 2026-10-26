import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const wf=readFileSync('.github/workflows/b11-storage-media-MANUAL.yml','utf8');
const script=readFileSync('ci/phase4/b11/storage-media-encrypted-b2-MANUAL.sh','utf8');
test('T069 manual Founder, main, matching SHA, environment, exact confirmation only',()=>{
 for(const term of ["github.actor == 'jantabol'","github.ref == 'refs/heads/main'",
 'github.run_attempt == 1','github.event.inputs.reviewed_sha == github.sha',
 'janta-bol-production-backup','JANTA_BOL_MEDIA_EXPORT_ONLY'])
 assert.ok(wf.includes(term),term);
 assert.match(wf,/^on:\n  workflow_dispatch:/m);
 assert.doesNotMatch(wf,/^  (push|schedule|pull_request):/m);
});
test('T069 key material limited to final step, not initial checkout/install',()=>{
 assert.doesNotMatch(wf.split('    steps:')[0],/secrets\./);
 const s=wf.substring(wf.indexOf('Read original 3 buckets'));
 assert.ok(s.includes('secrets.JB_B11_SERVICE_ROLE_KEY'));
 assert.ok(s.includes('secrets.JB_BACKUP_B2_APPLICATION_KEY'));
});
test('T069 no direct DB export, media provider destructive methods or GitHub artifact exposure',()=>{
 assert.doesNotMatch(script,/pg_dump|supabase db dump|rclone sync|--delete|rm -rf\s+\$src/);
 assert.doesNotMatch(wf,/upload-artifact|supabase db dump/);
 for(const t of ['rclone --config "$tmp/rclone.conf" copyto --immutable',
 'age -d -i "$tmp/ephemeral-age.key"',
 'storage-media-manual-cli.mjs verify-offline --root "$tmp/disposable-restored"',
 'B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS'])
 assert.ok(script.includes(t),t);
});
test('T069 unauthorized shell execution rejected before contacting backend',()=>{
 // Never inherit privileged CI runner GITHUB_* environment into a negative test.
 // An isolated, unprivileged subprocess cannot access backup keys or production.
 const env={
  PATH:process.env.PATH||'/usr/bin:/bin', HOME:process.env.HOME||'/tmp',
  GITHUB_ACTIONS:'false', GITHUB_REPOSITORY:'untrusted/fork',
  GITHUB_EVENT_NAME:'pull_request', GITHUB_ACTOR:'untrusted',
  GITHUB_REF:'refs/heads/unsafe', GITHUB_RUN_ATTEMPT:'2',
  GITHUB_WORKFLOW_REF:'untrusted/fork/.github/workflows/b11-storage-media-MANUAL.yml@refs/heads/unsafe',
  GITHUB_RUN_ID:'0', B11_FOUNDER_APPROVED_MEDIA_OFFSITE:''
 };
 const r=spawnSync('bash',['ci/phase4/b11/storage-media-encrypted-b2-MANUAL.sh','/tmp'],{
  encoding:'utf8',env,timeout:5000
 });
 assert.equal(r.status,3);
 assert.match(r.stderr,/Founder\/main\/manual protected release missing/);
 assert.doesNotMatch(r.stderr,/age encryption recipient missing|Backblaze protected scoped secret absent/);
});
test('T069 spoofed GitHub Actions context cannot authorize media export',()=>{
 const env={PATH:process.env.PATH||'/usr/bin:/bin',HOME:process.env.HOME||'/tmp',
  GITHUB_ACTIONS:'true', GITHUB_REPOSITORY:'untrusted/fork',
  GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_ACTOR:'untrusted',
  GITHUB_REF:'refs/heads/main', GITHUB_RUN_ATTEMPT:'1',
  GITHUB_WORKFLOW_REF:'untrusted/fork/.github/workflows/b11-storage-media-MANUAL.yml@refs/heads/main',
  GITHUB_RUN_ID:'123', B11_FOUNDER_APPROVED_MEDIA_OFFSITE:'JANTA_BOL_MEDIA_EXPORT_ONLY'};
 const r=spawnSync('bash',['ci/phase4/b11/storage-media-encrypted-b2-MANUAL.sh','/tmp'],{
  encoding:'utf8',env,timeout:5000
 });
 assert.equal(r.status,3);
 assert.match(r.stderr,/Founder\/main\/manual protected release missing/);
});
