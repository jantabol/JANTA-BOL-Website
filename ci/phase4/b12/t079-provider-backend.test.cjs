'use strict';
/* P4-T079: offline, no-provider, no-production-change backend preflight.
 * Never interpret these tests as a real social post, money receipt or
 * WhatsApp/email/push notification. E2/E6 remains DUE pending actual accounts.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const mod=require('./t079-external-provider-failclosed.cjs');

test('T079 four exactly-scoped OPTIONAL provider domains; core News independence',()=>{
 assert.deepEqual(Object.keys(mod.OPTIONS),['social','ads_payment','advertiser_messaging','notifications']);
 for(const domain of Object.values(mod.OPTIONS)){
  assert.equal(domain.required,false);
  assert.equal(domain.configured,false);
 }
 assert.deepEqual(Object.keys(mod.summarize()),Object.keys(mod.OPTIONS));
 for(const [name,value] of Object.entries(mod.summarize())){
  assert.equal(value.status,'NOT_AVAILABLE_DUE_CANDIDATE',name);
  assert.equal(value.canonical_publishing_dependent,false);
 }
});

test('Even when provider is reportedly available it never becomes E2E PASS',()=>{
 for(const name of Object.keys(mod.OPTIONS)){
  const on=mod.summarize({[name]:true});
  assert.equal(on[name].status,'PROVIDER_AVAILABLE_NOT_E2E_TESTED');
  assert.equal(on[name].canonical_publishing_dependent,false);
  const off=mod.summarize({[name]:false});
  assert.equal(off[name].status,'NOT_AVAILABLE_DUE_CANDIDATE');
  for(const illegal of ['true',1,{},null,[]]){
   assert.throws(()=>mod.summarize({[name]:illegal}),/B12_INVALID_PROVIDER_STATE/);
  }
 }
});

test('False Founder approval, fake run ID, fake E6 receipts cannot authorize success',()=>{
 for(const name of Object.keys(mod.OPTIONS)){
  for(const evidence of [null,{}, {approved_by_founder:true},{approved_by_founder:true,run_id:'FAKE',production_verified:true},{approved_by_founder:false,run_id:'40879348307',production_verified:true},{approved_by_founder:true,run_id:'40879348307',production_verified:false}]){
   assert.throws(()=>mod.requireExplicitProviderEvidence(name,evidence),/B12_PROVIDER_E6_HOLD/);
  }
  const result=mod.requireExplicitProviderEvidence(name,{approved_by_founder:true,run_id:'40879348307',production_verified:true});
  assert.equal(result.status,'E6_RECORDED_NOT_P4_T079_PASS');
 }
 assert.throws(()=>mod.requireExplicitProviderEvidence('random',{approved_by_founder:true,run_id:'40879348307',production_verified:true}),/B12_UNKNOWN_PROVIDER_DENY/);
});

test('All four social channels have account-independent fail-closed preparation, never Posted',()=>{
 assert.deepEqual(mod.SOCIAL_CHANNELS,['facebook','instagram','whatsapp','youtube']);
 const metadata={account_exists:true,founder_controls_account:true,provider_permissions_approved:true,server_only_token_storage:true,production_callback_verified:true};
 for(const channel of mod.SOCIAL_CHANNELS){
  const absent=mod.socialAccountReadiness(channel);
  assert.equal(absent.state,'ACCOUNT_OR_APPROVAL_DUE');
  assert.equal(absent.missing.length,5);
  const incomplete=mod.socialAccountReadiness(channel,{account_exists:true});
  assert.equal(incomplete.missing.length,4);
  const ready=mod.socialAccountReadiness(channel,metadata);
  assert.equal(ready.state,'REAL_PROVIDER_E2E_DUE');
  assert.equal(ready.confirmed_posted,false);
  assert.equal(ready.canonical_publishing_dependent,false);
  assert.equal(ready.credentials_requested_in_chat,false);
  assert.deepEqual(ready.missing,[]);
  assert.equal(Object.isFrozen(ready),true);
 }
});

test('Social metadata injection, invalid platform and forged boolean fail closed',()=>{
 for(const wrong of ['telegram','FACEBOOK','','payment',null]){
  assert.throws(()=>mod.socialAccountReadiness(wrong),/B12_UNKNOWN_SOCIAL_CHANNEL_DENY/);
 }
 for(const bad of [null,[],true,5,'any']){
  assert.throws(()=>mod.socialAccountReadiness('facebook',bad),/B12_INVALID_SOCIAL_ACCOUNT_METADATA/);
 }
 assert.throws(()=>mod.socialAccountReadiness('facebook',{access_token:'DO_NOT_USE'}),/B12_UNKNOWN_SOCIAL_ACCOUNT_METADATA_DENY/);
 assert.throws(()=>mod.socialAccountReadiness('youtube',{provider_permissions_approved:'true'}),/B12_INVALID_SOCIAL_ACCOUNT_METADATA/);
});

test('Existing Social UI and B4 SQL preserve MANUAL or Pending, never fake API Posted',()=>{
 const page=read('JANTA_BOL_PHASE_3C_WORKING/social.html');
 const client=read('JANTA_BOL_PHASE_3C_WORKING/phase2-client.js');
 const sql=read('CODEX_CURRENT_SUPABASE/migrations/20261003000800_phase4_b4_social_distribution_foundation.sql');
 assert.match(page,/if\(value==='Posted'\) throw new Error/);
 assert.match(page,/statuses\.filter\(s=>s!=='Posted'\)/);
 assert.match(page,/navigator\.share/);
 assert.match(page,/JBPhase2\.socialAttempt/);
 assert.match(client,/jb_social_record_attempt_internal/);
 assert.match(client,/jb_social_set_global_internal/);
 assert.match(sql,/MANUAL provider mode rejects fake Posted state/);
 assert.match(sql,/article must already be published before a distribution attempt/);
 assert.match(sql,/global and per-article switches must be ON/);
});

test('Existing Ads + Advertiser Portal do not shortcut payment or accept fake success',()=>{
 const source=read('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js');
 const portal=read('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html');
 assert.match(source,/B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE/);
 assert.match(source,/jb_ad_confirm_manual_payment_internal/);
 assert.match(source,/adTransition/);
 assert.match(portal,/jb_ad_portal_login/);
 assert.match(portal,/jb_ad_portal_campaign/);
 assert.match(portal,/jb_ad_portal_submit/);
 assert.match(portal,/sessionStorage/);
 assert.match(portal,/Owner/);
 assert.doesNotMatch(portal,/\.innerHTML\s*=/);
});

test('Notification external outbox is optional, isolated and service-role protected',()=>{
 const sql=read('CODEX_CURRENT_SUPABASE/migrations/20261003000700_phase4_b3_external_delivery_outbox.sql');
 assert.match(sql,/In-app state remains authoritative/);
 assert.match(sql,/state text not null default 'PENDING'/);
 assert.match(sql,/unique\(notification_id,channel\)/);
 assert.match(sql,/revoke all on function public\.jb_notification_external_enqueue_internal/);
 assert.match(sql,/grant execute on function public\.jb_notification_external_enqueue_internal.*to service_role/i);
 assert.match(sql,/revoke all on function public\.jb_notification_external_result_internal/);
 assert.match(sql,/grant execute on function public\.jb_notification_external_result_internal.*to service_role/i);
});

test('Existing YouTube LIVE provider is not equivalent to news-social API posting',()=>{
 const src=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-provider/index.ts');
 assert.match(src,/JB_DEPLOYMENT_ENV/);
 assert.match(src,/JB_GOOGLE_CREDENTIAL_ENV/);
 assert.match(src,/OAUTH_ENVIRONMENT_MISMATCH/);
 assert.match(src,/PROVIDER_AUTH_REQUIRED/);
 assert.match(src,/YOUTUBE_NOT_CONNECTED/);
 assert.match(src,/PROVIDER_NETWORK_UNKNOWN/);
 assert.doesNotMatch(read('ci/phase4/b12/t079-external-provider-failclosed.cjs'),/\bfetch\(/);
});

test('T079 remains evidence-gated and does not auto-approve first social provider',()=>{
 const state=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json'));
 const a=state.tests['P4-T079'];
 assert.equal(a.status,'IN_PROGRESS');
 assert.deepEqual(a.evidence,[]);
 assert.equal(a.manual_required,false);
 assert.equal(state.protected.no_fake_pass,true);
 const report=read('JANTA_BOL_PHASE_4_WORKING/b12/P4_T079_BACKEND_PROVIDER_PREFLIGHT_20261029.md');
 for(const marker of ['P4-T079','E2','E6','E7','REAL_PROVIDER_DUE','Social','Ads','Messaging','Notifications','NO_PRODUCTION_MUTATION','No actual provider post'])assert.ok(report.includes(marker),'report missing '+marker);
});
