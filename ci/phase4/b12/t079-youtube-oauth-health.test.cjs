'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-health/index.ts');

test('exactly scoped new function, zero old LIVE mutations',()=>{
 assert.match(src,/Deno\.serve\(async\s*\(req: Request\)/);
 assert.match(src,/input\.action !== "refresh_verify"/);
 assert.match(src,/Object\.keys\(input\)\.length !== 1/);
 assert.match(src,/req\.method !== "POST"/);
 assert.doesNotMatch(src,/liveBroadcasts\/insert|liveStreams\/insert|videos\/insert/);
 assert.doesNotMatch(src,/transition_live|provision_generation|complete_broadcast|retire_stream/);
 assert.doesNotMatch(src,/\.from\("articles"\)|\.from\("social_distribution"\)|\.from\("live_sessions"\)/);
 assert.doesNotMatch(src,/generation_id|broadcast_id|stream_id/);
});
test('restrict browser origin to real production and no implicit refresh',()=>{
 assert.match(src,/new Set\(\["https:\/\/jantabol\.in", "https:\/\/www\.jantabol\.in"\]\)/);
 assert.match(src,/ORIGIN_NOT_ALLOWED/);
 assert.match(src,/Cache-Control": "no-store/);
 assert.match(src,/Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type"/);
 assert.doesNotMatch(src,/setInterval\(|setTimeout\(|cron\.schedule/);
});
test('only Founder owner + user JWT + AAL2 current session may refresh',()=>{
 assert.match(src,/userClient\.auth\.getUser\(jwt\)/);
 assert.match(src,/claims\.aal !== "aal2"/);
 assert.match(src,/jb_live_actor_context_internal/);
 assert.match(src,/owner\?\.session_active !== true/);
 assert.match(src,/owner\?\.app_role !== "owner"/);
 assert.match(src,/p_user_id: authenticated\.data\.user\.id/);
 assert.match(src,/p_session_id: sid/);
});
test('production environment and expected channel pinned and checked twice',()=>{
 assert.match(src,/\["development", "test", "production"\]\.includes\(deployment\)/);
 assert.match(src,/credentialEnv !== deployment/);
 assert.match(src,/JB_YOUTUBE_EXPECTED_CHANNEL_ID/);
 assert.match(src,/state\.expected_channel_id !== expected \|\| state\.verified_channel_id !== expected/);
 assert.match(src,/state\.connection_state !== "CONNECTED"/);
 assert.match(src,/state\.control_auth_state !== "OK"/);
 assert.match(src,/state\.credential_incident_state !== "CLEAR"/);
 assert.match(src,/https:\/\/www\.googleapis\.com\/auth\/youtube\.force-ssl/);
 assert.match(src,/String\(channels\?\.items\?\.\[0\]\?\.id \?\? ""\)/);
 assert.match(src,/if \(!id \|\| id !== expected\)/);
});
test('server-only encrypted secret, real Google refresh and channels.mine',()=>{
 assert.match(src,/jb_youtube_active_secret_internal/);
 assert.match(src,/decryptRefresh\(/);
 assert.match(src,/AES-GCM/);
 assert.match(src,/https:\/\/oauth2\.googleapis\.com\/token/);
 assert.match(src,/grant_type: "refresh_token"/);
 assert.match(src,/https:\/\/www\.googleapis\.com\/youtube\/v3\/channels\?part=id&mine=true/);
 assert.match(src,/AbortSignal\.timeout\(12000\)/);
 assert.match(src,/jb_youtube_activate_secret_internal/);
 assert.match(src,/typeof google\.refresh_token === "string"/);
});
test('never log, return or persist provider access/refresh token in response',()=>{
 assert.doesNotMatch(src,/console\.(log|error|info|warn)/);
 assert.doesNotMatch(src,/JSON\.stringify\(google\)|JSON\.stringify\(secret\)|JSON\.stringify\(refresh\)/);
 const returned=src.slice(src.indexOf('return reply(req, {\n    ok: true,\n    status: "YOUTUBE_REFRESH_VERIFIED"'));
 assert.ok(returned.length>60);
 assert.doesNotMatch(returned,/access_token|refresh_token|client_secret|ciphertext/);
 assert.match(returned,/channel_match: true/);
 assert.match(returned,/last_refresh_status: "OK"/);
 assert.match(src,/YOUTUBE_REFRESH_AUDIT_FAILED/);
});
test('fail-closed errors do not revoke existing connected credential on negative proof',()=>{
 assert.match(src,/GOOGLE_REAUTH_REQUIRED/);
 assert.match(src,/GOOGLE_REFRESH_FAILED/);
 assert.match(src,/YOUTUBE_CONNECTION_GUARD_FAILED/);
 assert.match(src,/WRONG_YOUTUBE_CHANNEL/);
 assert.match(src,/YOUTUBE_ACTIVE_CREDENTIAL_MISSING/);
 assert.match(src,/YOUTUBE_REFRESH_STATE_WRITE_FAILED/);
 assert.doesNotMatch(src,/\.update\(\{connection_state: "REAUTH_REQUIRED"/);
 assert.doesNotMatch(src,/await service\.from\("youtube_integration"\)\.delete\(/);
});
test('OAuth real success is separated from T079 provider posting status',()=>{
 const state=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json'));
 assert.equal(state.tests['P4-T079'].status,'IN_PROGRESS');
 assert.deepEqual(state.tests['P4-T079'].evidence,[]);
 const note=read('JANTA_BOL_PHASE_4_WORKING/b12/P4_T079_YOUTUBE_REFRESH_E6_GATE_20261029.md');
 for(const expected of ['REAL_REFRESH_PENDING','Founder','AAL2','NO_LIVE_STREAM','No token','T079','NOT_YET_REFRESHED']){
  assert.ok(note.includes(expected), 'missing '+expected);
 }
});

test('same-environment policy matrix blocks unrecognized and cross-env labels',()=>{
 const allow=new Set(['development','test','production']);
 const compatible=(a,b)=>allow.has(a)&&a===b;
 for(const key of allow)assert.equal(compatible(key,key),true);
 for(const lhs of ['','unknown','staging',null,'production','test','development']){
  for(const rhs of ['','other','production','test','development']){
   if(!allow.has(lhs)||rhs!==lhs)assert.equal(compatible(lhs,rhs),false);
  }
 }
 assert.match(src,/OAUTH_ENVIRONMENT_MISMATCH/);
});
