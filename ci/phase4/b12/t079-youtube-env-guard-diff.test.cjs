'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../../..');
const read=(p)=>fs.readFileSync(path.join(base,p),'utf8');
const start=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-start/index.ts');
const callback=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-callback/index.ts');
const health=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-health/index.ts');
test('original two OAuth functions require paired allowed labels, without exposing values',()=>{
 for(const src of [start,callback]){
  assert.match(src,/\["development","test","production"\]\.includes\(deploymentEnv\)/);
  assert.match(src,/credentialEnv!==deploymentEnv/);
  assert.match(src,/OAUTH_ENVIRONMENT_MISMATCH/);
 }
});
test('new health function currently blocks any non-production label',()=>{
 assert.match(health,/deployment !== "production" \|\| credentialEnv !== "production"/);
 assert.match(health,/OAUTH_ENVIRONMENT_MISMATCH/);
});
test('critical backend Owner+AAL2 + exact channel + encrypted secret gates preserved',()=>{
 for(const needle of ['userClient.auth.getUser(jwt)','claims.aal !== "aal2"','jb_live_actor_context_internal','state.expected_channel_id !== expected','state.verified_channel_id !== expected','jb_youtube_active_secret_internal','GOOGLE_REAUTH_REQUIRED'])assert.ok(health.includes(needle),'missing '+needle);
 assert.ok(!health.includes('liveBroadcasts/insert'));
 assert.ok(!health.includes('videos/insert'));
});
test('T079 current reporter document states HOLD, no secrets, no automatic relax',()=>{
 const report=read('JANTA_BOL_PHASE_4_WORKING/b12/P4_T079_YOUTUBE_OAUTH_ENV_PARITY_ROOT_CAUSE_20261029.md');
 for(const t of ['NOT PASS','NOT_YET_REFRESHED','One active encrypted','no source gate weakened','No Fake PASS','test/test'])assert.ok(report.includes(t),t);
});
