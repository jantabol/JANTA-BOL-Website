import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createSafeRollbackPlan}=require('./t081-rollout-rollback-guard.cjs');
const guardSource=readFileSync('ci/phase4/b12/t081-rollout-rollback-guard.cjs','utf8');
const manual=readFileSync('.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml','utf8');
const joint=readFileSync('.github/workflows/b11-t070-real-joint-restore-MANUAL.yml','utf8');
const scheduled=readFileSync('.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml','utf8');
const current='93df12aa8ffdfae38d9a4066b6a4556bb36969e5';
const baseline='14a929180d99088e950475eeee609cae8e3f01c8';
const original={
  project_id:'prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI',
  repo:'jantabol/JANTA-BOL-Website',
  current_git_sha:current,baseline_git_sha:baseline,
  current_vercel_deployment:'dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF',
  baseline_vercel_deployment:'dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx',
  backup_restore_e8_verified:false,founder_aal2_approved:false,
  captured_current_write_fence:false,changed_article_ids:[],
  current_data_newer_than_baseline:true,verified_read_only_restore_identity:false
};
function denied(patch,expected){
  const x=createSafeRollbackPlan({...original,...patch});
  assert.equal(x.state,'HOLD');
  assert.equal(x.code,expected);
  assert.equal(x.operation_permitted,false);
  assert.equal(x.db_restore,false);
}
test('T081 known actual current release fails closed without current coherent E8',()=>{
  denied({},'E8_RECOVERY_NOT_VERIFIED');
});
test('T081 wrong project or Cricket repo never shares release authority',()=>{
  denied({project_id:'prj_cricket'},'WRONG_PROJECT_DENY');
  denied({repo:'jantabol/Cricket-Prediction-Research'},'WRONG_PROJECT_DENY');
});
test('T081 unverified current or baseline SHA fails closed',()=>{
  denied({current_git_sha:'f447231'},'UNKNOWN_GIT_BASELINE');
  denied({baseline_git_sha:'abcdef'},'UNKNOWN_GIT_BASELINE');
});
test('T081 deployment ID must be full known locator',()=>{
  denied({current_vercel_deployment:'dpl_bad'},'DEPLOYMENT_ID_UNVERIFIED');
  denied({baseline_vercel_deployment:'missing'},'DEPLOYMENT_ID_UNVERIFIED');
});
test('T081 no Founder AAL2 => stop even after synthetic E8 is marked',()=>{
  denied({backup_restore_e8_verified:true},'FOUNDER_AUTHORITY_NOT_VERIFIED');
});
test('T081 new writers not fenced => stop, no live restore',()=>{
  denied({backup_restore_e8_verified:true,founder_aal2_approved:true},'CURRENT_WRITERS_NOT_FENCED');
});
test('T081 missing or malformed changed article UUID inventory => stop',()=>{
  const a={backup_restore_e8_verified:true,founder_aal2_approved:true,captured_current_write_fence:true};
  denied({...a,changed_article_ids:null},'ARTICLE_IDS_UNVERIFIED');
  denied({...a,changed_article_ids:['untrusted']},'ARTICLE_IDS_UNVERIFIED');
});
test('T081 newer production changes => stop with no overwrite',()=>{
  const a={backup_restore_e8_verified:true,founder_aal2_approved:true,captured_current_write_fence:true};
  denied(a,'NEWER_PRODUCTION_DATA_AMBIGUOUS');
});
test('T081 absent verified read-only restore identity => stop',()=>{
  const a={backup_restore_e8_verified:true,founder_aal2_approved:true,captured_current_write_fence:true,current_data_newer_than_baseline:false};
  denied(a,'RESTORE_IDENTITY_UNPROVEN');
});
test('T081 even synthetic all-green requires separate explicit authorization; never auto-restore',()=>{
  const a={...original,backup_restore_e8_verified:true,founder_aal2_approved:true,
    captured_current_write_fence:true,current_data_newer_than_baseline:false,
    verified_read_only_restore_identity:true};
  const x=createSafeRollbackPlan(a);
  assert.equal(x.state,'PRECONDITIONS_RECORDED_FOR_FOUNDER_REVIEW');
  assert.equal(x.operation_permitted,false);
  assert.equal(x.db_restore,false);
  assert.match(x.data_rule,/NEVER_AUTOMATICALLY_OVERWRITE_NEWER_PRODUCTION_RECORDS/);
  assert.match(x.restore_rule,/EXPLICIT_SEPARATE_AUTHORIZED_RECOVERY_WORKFLOW_REQUIRED/);
});
test('T081 original Founder-only manual DB+joint backup source remains gated',()=>{
  assert.match(manual,/workflow_dispatch:/);
  assert.match(manual,/github\.actor == 'jantabol'/);
  assert.match(manual,/github\.ref == 'refs\/heads\/main'/);
  assert.match(manual,/environment: janta-bol-production-backup/);
  assert.match(joint,/workflow_dispatch:/);
  assert.match(joint,/refs\/heads\/main/);
  assert.match(joint,/janta-bol-production-backup/);
});
test('T081 T075 scheduled candidate remains Founder + zero-spend gates, no release by this PR',()=>{
  assert.match(scheduled,/JB_T075_SCHEDULED_BACKUP_ENABLED/);
  assert.match(scheduled,/JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED/);
  assert.match(scheduled,/YES_FOUNDER_RELEASED/);
  assert.match(scheduled,/YES_FOUNDER_VERIFIED_ZERO/);
  assert.match(scheduled,/environment: janta-bol-production-backup/);
});
test('T081 rollback guard is proposal-only, with no database/traffic write functions',()=>{
  assert.doesNotMatch(guardSource,/\b(?:DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM|UPDATE\s+public\.|INSERT\s+INTO)\b/i);
  assert.match(guardSource,/REVIEW_ONLY_VERCEL_ROUTING_ROLLBACK_PROPOSAL/);
  assert.match(guardSource,/operation_permitted:false/);
});
