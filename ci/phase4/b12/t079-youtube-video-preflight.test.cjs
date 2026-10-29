'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-preflight/index.ts');
test('readiness is explicit-only, never upload, post, schedule, or status write',()=>{
 assert.match(src,/body\.action!=="article_preflight"/);
 assert.match(src,/Object\.keys\(body\)\.some\(k=>!\["action","article_id"\]\.includes\(k\)\)/);
 assert.match(src,/state:"NOT_READY_DUE"/);
 assert.match(src,/uploaded:false,posted:false,public_video_created:false/);
 assert.doesNotMatch(src,/fetch\(|\.update\(|\.insert\(|\.upsert\(|\.delete\(|youtube\/v3\/videos|videos:insert|uploadType=|\/upload\/youtube\//);
 assert.doesNotMatch(src,/setInterval\(|setTimeout\(|cron\.schedule/);
});
test('Founder owner only: active session + AAL2 and backend-verified identity',()=>{
 for(const marker of ['userClient.auth.getUser(jwt)','claim.aal!=="aal2"','jb_live_actor_context_internal',
  'p_user_id:user.data.user.id','p_session_id:claim.session_id','actor?.session_active!==true','actor?.app_role!=="owner"']){
  assert.ok(src.includes(marker),marker);
 }
 assert.match(src,/req\.method!=="POST"/);
 assert.match(src,/ORIGIN_DENIED/);
 assert.match(src,/allowedOrigins = new Set\(\["https:\/\/jantabol\.in", "https:\/\/www\.jantabol\.in"\]\)/);
});
test('Same valid OAuth env pair, secure channel and real token health',()=>{
 for(const marker of ['"development","test","production"','mode!==credentialMode','OAUTH_ENVIRONMENT_MISMATCH','expected_channel_id',
  'verified_channel_id','last_refresh_status!=="OK"','credential_incident_state!=="CLEAR"','control_auth_state!=="OK"','youtube.force-ssl']){
  assert.ok(src.includes(marker),marker);
 }
 assert.match(src,/channelIdPattern\.test\(expected\)/);
});
test('Published/undeleted news, global + per-news YouTube/API flags, no raw URL fetch',()=>{
 for(const marker of ['"articles"','"social_settings"','"social_distribution"','a.status!=="published"','a.deleted_at',
  's.enabled!==true','s.youtube!==true','s.provider_mode!=="API"',
  '"YOUTUBE_CHANNEL_NOT_READY"','"SOCIAL_GLOBAL_OFF"','"ARTICLE_NOT_PUBLISHED"',
  '"YOUTUBE_PER_ARTICLE_NOT_API_SELECTED"','"NO_VIDEO_FILE"','"VIDEO_MEDIA_PROVENANCE_UNVERIFIED"']){
  assert.ok(src.includes(marker),marker);
 }
 assert.doesNotMatch(src,/window\.|document\.|location\.href|signedURL|createSignedUrl|supabase\.storage/);
});
test('Durable ledger and real positive external receipt are unavoidable',()=>{
 assert.match(src,/blockers\.push\("DURABLE_UPLOAD_LEDGER_NOT_APPROVED"\)/);
 assert.match(src,/blockers\.push\("REAL_PROVIDER_UPLOAD_E6_NOT_RUN"\)/);
 assert.doesNotMatch(src,/\bPosted\b.*await|\bpublic_video_created:true\b/);
 const truth=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/b12/b12-release-truth.json'));
 assert.equal(truth.tests['P4-T079'].status,'IN_PROGRESS');
 assert.deepEqual(truth.tests['P4-T079'].evidence,[]);
});
test('YouTube original video uploader is NOT present in production yet',()=>{
 const report=read('JANTA_BOL_PHASE_4_WORKING/b12/P4_T079_YOUTUBE_VIDEO_DISTRIBUTION_BACKEND_20261029.md');
 for(const marker of ['REAL_UPLOAD_E6_DUE','NO ACTUAL UPLOAD','No MP4','PRIVATE','DUPLICATE','Founder','T079','NO PRODUCTION VIDEO WRITE'])assert.ok(report.includes(marker),'missing '+marker);
});
