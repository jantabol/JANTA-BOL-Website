'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {evaluate,checkRepo}=require('./t079-softlaunch-release-split.cjs');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const proof=json('JANTA_BOL_PHASE_4_WORKING/b12/t079-youtube-manual-proof.json');
const truth=json('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json');
const flags={
 productionUploaderEnabled:false,independentRollbackE8Verified:false,
 durableLedgerProductionVerified:false,serverOnlyFounderMediaRightsApproved:false,
 providerPrivateVideoReceiptVerified:false,publicSiteReleaseApproved:false,
 independentPublicSecurityAndNewsE1:false
};
test('actual Founder Android YouTube test is manual only, real playback, delete, video ID',()=>{
 assert.equal(proof.video_id,'4sBF6bdJ1dA');
 assert.equal(proof.channel_handle,'@jantabolnews');
 assert.equal(proof.video_length_seconds,392);
 assert.equal(proof.deletion_date_time_local,'2026-10-30T10:11:00+05:30');
 const x=evaluate({manual:proof,truth,flags});
 assert.equal(x.manual_app_lane,'PASS_SCREENSHOT_SCOPE_ONLY');
 assert.equal(x.automatic_youtube_backend,'E6_DUE');
 assert.equal(x.b12_full_release,'HOLD');
 assert.equal(x.public_soft_launch,'INDEPENDENT_SITE_NEWS_SECURITY_PROOFS_REQUIRED');
});
test('refuse signed provider/backend proof constructed from manual channel/app screenshots',()=>{
 for(const fake of [
  {...proof,google_data_api_signed_receipt:true},
  {...proof,backend_videos_insert_executed:true},
  {...proof,automatic_social_post_verified:true},
  {...proof,evidence_class:'PROVIDER_RECEIPT'},
  {...proof,deletion_toast_observed:'fake'},
  {...proof,video_id:'invented'},
 ])assert.throws(()=>evaluate({manual:fake,truth,flags}),/MANUAL_EVIDENCE_MISCLASSIFIED/);
});
test('automatic YouTube release fail-closed until ALL four release/receipt predicates',()=>{
 for(const single of [
  {productionUploaderEnabled:true},
  {productionUploaderEnabled:true,durableLedgerProductionVerified:true},
  {productionUploaderEnabled:true,independentRollbackE8Verified:true},
  {productionUploaderEnabled:true,providerPrivateVideoReceiptVerified:true},
  {productionUploaderEnabled:true,serverOnlyFounderMediaRightsApproved:true},
 ])assert.throws(()=>evaluate({manual:proof,truth,flags:{...flags,...single}}),/UNSAFE_PRODUCTION_YOUTUBE_UPLOADER/);
});
test('public soft launch is NEVER certified by manual YouTube upload alone',()=>{
 assert.throws(()=>evaluate({manual:proof,truth,flags:{...flags,publicSiteReleaseApproved:true}}),/PUBLIC_SOFT_LAUNCH_FALSE_PASS/);
});
test('B12 T079 and T078 remain honest after actual manual Founder video success',()=>{
 assert.equal(truth.tests['P4-T079'].status,'IN_PROGRESS');
 assert.equal(truth.tests['P4-T078'].status,'BLOCKED');
 const changed=structuredClone(truth);
 changed.tests['P4-T079'].status='PASS_LOCK';
 assert.throws(()=>evaluate({manual:proof,truth:changed,flags}),/AUTOMATIC_YOUTUBE_FALSE_PASS/);
 const stale=structuredClone(truth);
 stale.tests['P4-T078'].status='PASS_LOCK';
 assert.throws(()=>evaluate({manual:proof,truth:stale,flags}),/ROLLBACK_FALSE_PASS/);
});
test('original Owner social UI still guards fake Posted, protected automatic upload source OFF',()=>{
 const observed=checkRepo(root);
 assert.equal(observed.production_uploader,'DISABLED_UNTIL_RELEASE_GATES');
});
