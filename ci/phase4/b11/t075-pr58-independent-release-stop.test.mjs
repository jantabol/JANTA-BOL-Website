/**
 * P4-B11/T075 independent read-only release stop checks.
 * Successful tests document a safety HOLD, NEVER a live release PASS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const REPO='jantabol/JANTA-BOL-Website';
const SHA_MAIN_LOCKED='f447231c0677644ca5a44cc19f12cf0314ff38ea';
const URL='https://api.github.com/repos/'+REPO;
const BRANCH='codex/b11-t075-scheduled-encrypted-joint-backup-safety-20261028';
const WF='.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml';
const token=process.env.GH_REVIEW_ONLY;
async function request(path){
 assert.equal(process.env.GITHUB_ACTIONS,'true');
 assert.equal(process.env.GITHUB_REPOSITORY,REPO,'wrong repo');
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+BRANCH,'wrong branch');
 assert(token&&token.length>10,'no read-only GitHub token');
 const r=await fetch(URL+path,{
  method:'GET',redirect:'error',
  headers:{authorization:'Bearer '+token,
    accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    'user-agent':'JANTA-BOL-T075-ZERO-PAID-READONLY'},
  signal:AbortSignal.timeout(12000)
 });
 assert.equal(r.status,200,'GitHub read-only API unavailable '+path);
 return r.json();
}
test('T075 real Main and PR #58 remain unchanged DRAFT review-only',async()=>{
 const [ref,pr,meta]=await Promise.all([
  request('/git/ref/heads/main'),request('/pulls/58'),request('')
 ]);
 assert.equal(ref.object?.sha,SHA_MAIN_LOCKED,'Main moved: re-audit deployment');
 assert.equal(pr.number,58);assert.equal(pr.state,'open');
 assert.equal(pr.draft,true);assert.equal(pr.merged,false);
 assert.equal(pr.base?.ref,'main');assert.equal(pr.head?.ref,BRANCH);
 assert.equal(pr.head?.sha,process.env.GITHUB_SHA);
 assert.equal(meta.private,false,'free public CI scope changed');
 assert.equal(meta.default_branch,'main');
 console.log('T075_REAL_GITHUB_RELEASE_NOT_MERGED=PASS_SAFETY_HOLD');
});
test('T075 schedule needs two independent Founder release variables plus protected environment',()=>{
 const s=readFileSync(WF,'utf8');
 assert.match(s,/^\s*schedule:\s*$/m);
 assert.match(s,/cron: '45 21 \* \* 6'/);
 assert.match(s,/vars\.JB_T075_SCHEDULED_BACKUP_ENABLED == 'YES_FOUNDER_RELEASED'/);
 assert.match(s,/vars\.JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED == 'YES_FOUNDER_VERIFIED_ZERO'/);
 assert.match(s,/environment: janta-bol-production-backup/);
 assert.match(s,/concurrency:\s*\n\s*group: janta-bol-free-backup/);
 assert.doesNotMatch(s,/^\s*workflow_dispatch:/m);
 assert.doesNotMatch(s,/^\s*pull_request:/m);
 assert.doesNotMatch(s,/^\s*push:/m);
 assert.match(s,/T075_AUTH_EDGE_VERCEL_RUNTIME_RESTORE=NOT_TESTED/);
 assert.match(s,/T075_FULL_E8_FINAL_LOCK=HOLD/);
 console.log('T075_SCHEDULED_ZERO_PAID_DEFAULT_OFF=PASS_STATIC_SCOPE');
});
test('T075 original Founder/manual permission gates and B2 combined cap still protected',()=>{
 for(const path of [
  '.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml',
  '.github/workflows/b11-storage-media-MANUAL.yml',
  '.github/workflows/b11-t070-real-joint-restore-MANUAL.yml'
 ]){
  const s=readFileSync(path,'utf8');
  assert.match(s,/workflow_dispatch:/);
  assert.match(s,/github.actor == 'jantabol'/);
  assert.match(s,/github.ref == 'refs\/heads\/main'/);
 }
 const identity=readFileSync('ci/phase4/b11/t075-scheduled-backup-identity.mjs','utf8');
 assert.match(identity,/GITHUB_WORKFLOW_REF:SCHEDULED_WORKFLOW/);
 assert.match(identity,/GITHUB_EVENT_NAME:'schedule'/);
 const cap=readFileSync('ci/phase4/b11/t075-scheduled-budget.py','utf8');
 assert.match(cap,/remote_bytes \+ new_size > MAX_PREFIX_BYTES/);
 assert.match(cap,/MAX_NEW_CIPHERTEXT = 512 \* 1024\*\*2/);
 console.log('T075_OLD_FOUNDER_MANUAL_BACKUP_SOURCE_STILL_GUARDED=PASS_SCOPED');
});
test('T075 no $0 future billing assertion or fake full E8 PASS',()=>{
 const doc=readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_B11_T075_E3_NO_PAID_SYSTEM_FOUNDER_POLICY_AND_53_PASS_20261028.md','utf8');
 assert.match(doc,/account-wide/);
 assert.match(doc,/(?:does not guarantee zero spend|not an absolute zero-billing guarantee)/i);
 assert.match(doc,/Some transaction categories are not fully subject to data caps/i);
 const s=readFileSync(WF,'utf8');
 assert.match(s,/JB_BACKUP_B2_APPLICATION_KEY: \$\{\{ secrets.JB_BACKUP_B2_APPLICATION_KEY \}\}/);
 assert.match(s,/T075_SCHEDULED_ORIGINAL_JOINT_BACKUP_RUN_PASS=SCOPED_GENUINE_OFFSITE_AFTER_REAL_EXECUTION/);
 assert.doesNotMatch(s,/T075_FINAL_PASS_LOCK=PASS/);
 console.log('T075_ACCOUNT_WIDE_ZERO_FUTURE_B2_COST_UNPROVEN');
 console.log('T075_LIVE_AUTOMATIC_BACKUP=NOT_RUN');
 console.log('T075_E3_LIVE_PASS_LOCK=false');
 console.log('T075_B11_FINAL_PASS_LOCK=false');
});
