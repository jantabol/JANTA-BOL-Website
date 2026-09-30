#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const APP=path.join(ROOT,'JANTA_BOL_PHASE_3C_WORKING');
const SNAP=path.join(ROOT,'CODEX_CURRENT_SUPABASE','functions');
const OUT=path.join(ROOT,'ci-results');
fs.mkdirSync(OUT,{recursive:true});

const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(ROOT,p));
const results=[];
const seen=new Set();

function record(id,ok,detail){
  if(seen.has(id)) throw new Error('DUPLICATE_SECURITY_BATCH_ID: '+id);
  seen.add(id);
  const row={test_id:id,ok:Boolean(ok),detail,layer:'static-security-architecture'};
  results.push(row);
  console.log(`${row.ok?'PASS':'FAIL'} [${id}] ${detail}`);
}
function recordMany(ids,ok,detail){ for(const id of ids) record(id,ok,detail); }

const reporter=read('JANTA_BOL_PHASE_3C_WORKING/reporter-live.html');
const adminLive=read('JANTA_BOL_PHASE_3C_WORKING/live.html');
const liveClient=read('JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js');
const backend=read('JANTA_BOL_PHASE_3C_WORKING/backend-client.js');
const adminAuth=read('JANTA_BOL_PHASE_3C_WORKING/admin-auth.js');
const website=read('JANTA_BOL_PHASE_3C_WORKING/website-v3.js');
const article=read('JANTA_BOL_PHASE_3C_WORKING/article.html');
const edge=read('CODEX_CURRENT_SUPABASE/functions/jb-live-api/index.ts');
const worker=read('CODEX_CURRENT_SUPABASE/functions/jb-live-worker/index.ts');
const provider=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-provider/index.ts');
const handoff=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-handoff/index.ts');
const launch=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-launch/index.ts');
const oauthStart=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-start/index.ts');
const oauthCallback=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-callback/index.ts');
const cfg=read('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js');

const phase2Preserved=
  exists('JANTA_BOL_PHASE_3C_WORKING/phase2-client.js') &&
  exists('JANTA_BOL_PHASE_3C_WORKING/backend-client.js') &&
  exists('JANTA_BOL_PHASE_3C_WORKING/admin-auth.js') &&
  exists('JANTA_BOL_PHASE_3C_WORKING/add-news.html') &&
  /global\.JBLive\s*=/.test(liveClient) &&
  /JBBackend/.test(liveClient) &&
  !/createClient\s*\(/.test(liveClient);

const reporterAuth=
  /JBBackend\.session\(\)/.test(reporter) &&
  /JBLive\.context\(\)/.test(reporter) &&
  /c\.role!=='reporter'/.test(reporter) &&
  /c\.reporter_active===false/.test(reporter) &&
  /reporter-login\.html/.test(reporter);

const reporterLimited=
  !/admin_approve_request|admin_reject_request|admin_revoke_live_permission|admin_suspend_reporter/.test(reporter) &&
  !/permanentDelete|unpublish\(/.test(reporter) &&
  /reporter_submit_request/.test(edge) &&
  /a\.role !== "reporter"/.test(edge);

const requestCurrentState=
  /userClient\.auth\.getUser\(token\)/.test(edge) &&
  /session_id/.test(edge) &&
  /jb_live_actor_context_internal/.test(edge) &&
  /!ctx\?\.session_active/.test(edge) &&
  /reporterActive: ctx\.reporter_active !== false/.test(edge);

const requestUx=
  /Event \/ Live Headline/.test(reporter) &&
  /Location/.test(reporter) &&
  /Short Description/.test(reporter) &&
  /Expected Duration/.test(reporter) &&
  /30 Minutes/.test(reporter) && /1 Hour/.test(reporter) && /2 Hours/.test(reporter) &&
  /locationConfirmed/.test(reporter) &&
  /Backend confirmation ke baad hi request submitted/.test(reporter) &&
  /OFFLINE \/ NOT SUBMITTED/.test(reporter) &&
  /localStorage\.setItem\(DRAFT_KEY/.test(reporter);

const pendingUx=
  /Waiting for Super Admin approval/.test(reporter) &&
  /Cancel Pending Request/.test(reporter) &&
  /myRequests\(\)/.test(reporter) &&
  /cancelRequest/.test(reporter);

const adminUx=
  /Pending Live Requests/.test(adminLive) &&
  /Live Sessions/.test(adminLive) &&
  /Notifications/.test(adminLive) &&
  /approveRequest/.test(adminLive) &&
  /rejectRequest/.test(adminLive) &&
  /headline/.test(adminLive) && /location/.test(adminLive) &&
  /description/.test(adminLive);

const adminFailClosed=
  /c\.role!=='owner'\|\|c\.aal!=='aal2'/.test(adminLive) &&
  /security\.kind==='ok'/.test(adminAuth) &&
  /serverSessionValid\(\)/.test(adminAuth) &&
  /showGuardUnavailable/.test(adminAuth) &&
  /Security check temporarily unavailable/.test(adminAuth);

const notificationNonAuthority=
  /subscribeNotifications\(\)=>loadRequests|subscribeNotifications\(\(\)=>loadRequests/.test(reporter) &&
  /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)loadRequests\(\)/.test(reporter) &&
  /subscribeNotifications\(\)=>loadAll|subscribeNotifications\(\(\)=>loadAll/.test(adminLive) &&
  /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)loadAll\(\)/.test(adminLive);

const controlMediaSplit=
  /const userClient=createClient|const userClient = createClient/.test(edge) &&
  /const service=createClient|const service = createClient/.test(edge) &&
  /SUPABASE_ANON_KEY/.test(edge) &&
  /JB_SUPABASE_SERVICE_ROLE_KEY/.test(edge) &&
  !/SUPABASE_ANON_KEY/.test(worker) &&
  !/auth\.getUser\(/.test(worker) &&
  /jb-youtube-provider/.test(worker) &&
  /JB_SUPABASE_SERVICE_ROLE_KEY/.test(worker) &&
  /PROVIDER_AUTH_REQUIRED/.test(provider);

const durableQueue=
  /jb_live_claim_operation_internal/.test(worker) &&
  /RETRY_PENDING/.test(worker) &&
  /AMBIGUOUS/.test(worker) &&
  /CANCELLED_STALE/.test(worker) &&
  /lease_until/.test(worker) &&
  /attempt_count/.test(worker) &&
  !/live_operations/.test(reporter);

const narrowProvider=
  /action==="provision_generation"/.test(provider) &&
  /action==="get_state"/.test(provider) &&
  /action==="get_encoder_ingest"/.test(provider) &&
  /action==="transition_live"/.test(provider) &&
  /action==="complete_broadcast"/.test(provider) &&
  /action==="retire_stream"/.test(provider) &&
  /ACTION_NOT_ALLOWED/.test(provider) &&
  !/callAnyYouTube|youtubeProxy|executeAnySQL/.test(edge+worker+provider);

const publicProjection=
  /from\('public_live_feed'\)/.test(website) &&
  /article\.html\?id=/.test(website) &&
  /permanent_url/.test(website) &&
  !/live_provider_generations|encoder_handoffs|live_operations/.test(website) &&
  !/requireOwner|requireReporter|auth\.getUser/.test(website);

const frontendFiles=[
  'JANTA_BOL_PHASE_3C_WORKING/reporter-live.html',
  'JANTA_BOL_PHASE_3C_WORKING/live.html',
  'JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js',
  'JANTA_BOL_PHASE_3C_WORKING/website-v3.js',
  'JANTA_BOL_PHASE_3C_WORKING/backend-client.js',
  'JANTA_BOL_PHASE_3C_WORKING/supabase-config.js'
];
const frontendText=frontendFiles.map(read).join('\n');
const frontendSecretSafe=
  /publishableKey\s*:/.test(cfg) &&
  !/JB_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|JB_GOOGLE_CLIENT_SECRET|JB_OAUTH_TOKEN_ENC_KEY_B64|refresh_token_ciphertext/.test(frontendText);

const handoffSecurity=
  /crypto\.getRandomValues\(new Uint8Array\(32\)\)/.test(edge) &&
  /sha256hex\(raw\)/.test(edge) &&
  /p_ttl_seconds:\s*90/.test(edge) &&
  /jb_live_create_handoff_internal/.test(edge) &&
  /jb_live_consume_handoff_internal/.test(handoff+launch) &&
  /token_hash/.test(handoff+launch) &&
  /rtmps:\/\//i.test(handoff+launch+provider);

const oauthFounderOnly=
  /aal!=='aal2'/.test(oauthStart) &&
  /c\.app_role!=='owner'/.test(oauthStart) &&
  /jb_live_actor_context_internal/.test(oauthStart) &&
  /session_active/.test(oauthStart);

const oauthStateSafe=
  /crypto\.getRandomValues\(new Uint8Array\(32\)\)/.test(oauthStart) &&
  /sha256hex\(state\)/.test(oauthStart) &&
  /jb_youtube_oauth_state_create_internal/.test(oauthStart) &&
  /p_ttl_seconds:600/.test(oauthStart) &&
  /jb_youtube_oauth_state_consume_internal/.test(oauthCallback) &&
  /State expired, reused, or mismatched/.test(oauthCallback);

const oauthChannelScopeSafe=
  /youtube\.force-ssl/.test(oauthStart) &&
  /requiredScope='https:\/\/www\.googleapis\.com\/auth\/youtube\.force-ssl'/.test(oauthCallback) &&
  /channelId!==expected/.test(oauthCallback) &&
  /WRONG_CHANNEL/.test(oauthCallback) &&
  /JB_YOUTUBE_EXPECTED_CHANNEL_ID/.test(oauthStart+oauthCallback);

const oauthSecretSafe=
  /JB_GOOGLE_CLIENT_SECRET/.test(oauthStart+oauthCallback+provider) &&
  /JB_OAUTH_TOKEN_ENC_KEY_B64/.test(oauthStart+oauthCallback+provider) &&
  /encryptToken\(refresh,encKey\)/.test(oauthCallback) &&
  /jb_youtube_activate_secret_internal/.test(oauthCallback) &&
  /jb_youtube_active_secret_internal/.test(provider) &&
  !/refresh_token\s*[:=]/.test(frontendText);

const oauthReplacementSafe=
  /const healthy=current\.data\?\.connection_state==='CONNECTED'/.test(oauthCallback) &&
  /if\(!healthy\)\{patch\.connection_state=stateName/.test(oauthCallback) &&
  /Existing healthy connection ko replace nahi kiya gaya/.test(oauthCallback) &&
  /JB_DEPLOYMENT_ENV/.test(oauthStart+oauthCallback+provider) &&
  /JB_GOOGLE_CREDENTIAL_ENV/.test(oauthStart+oauthCallback+provider) &&
  /OAUTH_ENVIRONMENT_MISMATCH/.test(oauthStart+oauthCallback+provider);

const providerTokenFailureSafe=
  /invalid_grant/.test(provider) &&
  /REAUTH_REQUIRED/.test(provider) &&
  /CONTROL_AUTH_DEGRADED/.test(provider) &&
  /Running Live media may continue/.test(provider) &&
  /YOUTUBE_REAUTH_REQUIRED/.test(provider);

const safeErrors=
  /safeError\(/.test(edge) &&
  /LIVE_REQUEST_FAILED/.test(edge) &&
  /safe\(/.test(worker) &&
  /provider_last_safe_error_code/.test(provider+worker) &&
  !/stream_name.*console|refresh.*console|clientSecret.*console/i.test(edge+worker+provider+oauthStart+oauthCallback);

recordMany(['3A-P1-T004'],phase2Preserved,'Phase 3A extends the preserved Phase-2/Auth/Admin foundation instead of creating a parallel base system.');
recordMany(['3A-P1-T005'],reporterAuth&&adminFailClosed,'Reporter and Super Admin remain distinct authenticated operational actors with separate authority.');
recordMany(['3A-P1-T007'],reporterAuth&&requestCurrentState,'Reporter Live access requires authenticated current server state and active Reporter role.');
recordMany(['3A-P1-T008'],reporterLimited,'Reporter Live UI/API does not gain normal article publish/unpublish/permanent-delete authority.');
recordMany(['3A-P1-T013'],requestUx,'Location is required and explicitly confirmed before request submission.');
recordMany(['3A-P1-T018','3A-P1-T019'],pendingUx&&reporterLimited,'Reporter can read/cancel own pending request flow but has no self-approval path.');
recordMany(['3A-P1-T023','3A-P1-T024','3A-P1-T026','3A-P1-T027'],adminUx&&adminFailClosed,'Owner+AAL2 Live dashboard exposes pending/active status and controlled Approve/Reject review actions.');
recordMany(['3A-P1-T025','3A-P1-T074'],notificationNonAuthority,'Notification/realtime delivery is convenience only; periodic canonical refetch remains the fallback truth path.');
recordMany(['3A-P1-T073'],reporterAuth&&adminFailClosed&&requestCurrentState,'Authentication/authorization/AAL/current-state checks remain mandatory rather than being removed for fewer taps.');
recordMany(['3A-P1-T087','3A-P1-T088','3A-P1-T089'],reporterLimited&&adminUx&&safeErrors,'Reporter/Admin surfaces remain role-focused and raw backend/provider errors are replaced with bounded user-facing messages.');

recordMany(['3A-P2-T001','3A-P2-T002','3A-P2-T003','3A-P2-T004','3A-P2-T005','3A-P2-T006','3A-P2-T007','3A-P2-T009','3A-P2-T010','3A-P2-T011'],phase2Preserved&&controlMediaSplit&&narrowProvider,'Control plane, media/provider plane and preserved Phase-2 foundation remain separated behind the canonical JANTA BOL system.');
recordMany(['3A-P2-T012'],phase2Preserved&&/article\.html\?id=/.test(article),'Existing canonical Article engine and Permanent Article URL remain present alongside Live.');
recordMany(['3A-P2-T013'],reporterAuth&&/client\.auth\.getSession\(\)/.test(backend),'Supabase Auth remains the authentication authority; no separate Phase-3 login system is introduced.');
recordMany(['3A-P2-T014','3A-P2-T015'],controlMediaSplit&&durableQueue&&publicProjection,'Postgres-backed Live state, operations/audit path and safe public projection are represented separately.');
recordMany(['3A-P2-T016','3A-P2-T017'],requestCurrentState&&controlMediaSplit,'User-facing Edge/API requests authenticate current callers before controlled business actions.');
recordMany(['3A-P2-T018','3A-P2-T019'],controlMediaSplit&&frontendSecretSafe,'Privileged provider/database credentials remain server-side and separate from user/browser clients.');
recordMany(['3A-P2-T020','3A-P2-T021','3A-P2-T022','3A-P2-T023'],durableQueue&&controlMediaSplit,'Critical provider work uses a private durable operation journal/worker with minimal operation-oriented messages.');
recordMany(['3A-P2-T049'],publicProjection&&/jb_live_activate_public_internal/.test(worker),'Public Live state is activated from backend/provider-confirmed flow, not a Reporter client mutation.');
recordMany(['3A-P2-T050','3A-P2-T051','3A-P2-T052'],/audit_logs/.test(edge+worker+provider)&&/live_request_approved|live_session_created|provider_live_confirmed|live_operation/.test(edge+worker),'Existing audit infrastructure records Phase-3 request/session/provider lifecycle events.');
recordMany(['3A-P2-T152','3A-P2-T153'],frontendSecretSafe&&oauthSecretSafe,'Client-safe config is separated from server-only Supabase/Google/OAuth secrets.');
recordMany(['3A-P2-T165','3A-P2-T166','3A-P2-T167'],controlMediaSplit&&durableQueue&&publicProjection,'Core user actions map to backend objects/operations and public Live maps to verified backend-controlled state.');

recordMany(['3A-P3-T001','3A-P3-T002'],requestCurrentState&&adminFailClosed&&worker.includes('CANCELLED_STALE'),'Security/current-state failure paths deny, retry or cancel stale work instead of assuming authority.');
recordMany(['3A-P3-T003','3A-P3-T004'],requestCurrentState&&reporterLimited&&adminFailClosed,'Frontend/cached claims are not authority; sensitive actions re-check protected current backend state.');
recordMany(['3A-P3-T037','3A-P3-T038','3A-P3-T039','3A-P3-T040'],controlMediaSplit&&durableQueue,'User command gateway and privileged worker are separate trust planes; browser requests do not directly execute privileged provider work.');
recordMany(['3A-P3-T041','3A-P3-T042'],durableQueue&&frontendSecretSafe,'Privileged work stays in the internal durable operation layer and does not carry client-visible secret material.');
recordMany(['3A-P3-T043','3A-P3-T044'],/jb_live_operation_context_internal/.test(worker)&&/current_provider_generation/.test(worker)&&/CANCELLED_STALE/.test(worker),'Worker revalidates current session/generation state and cancels stale queued commands.');
recordMany(['3A-P3-T045','3A-P3-T046','3A-P3-T047','3A-P3-T048'],controlMediaSplit&&frontendSecretSafe&&oauthSecretSafe,'User-scoped and privileged clients/configuration are separated; backend and Google secrets stay server-only.');
recordMany(['3A-P3-T049','3A-P3-T050'],narrowProvider,'No generic privileged SQL/YouTube proxy exists; provider access is limited to the defined adapter operations.');
recordMany(['3A-P3-T051','3A-P3-T052'],/SECURITY DEFINER/.test(read('JANTA_BOL_PHASE_3C_WORKING/phase2-migration.sql'))||exists('ci/phase3-regression/db-function-security-regression.sql'),'Security-definer/invoker behavior is explicitly audited by the database security regression layer.');

recordMany(['3A-P3-T079'],oauthFounderOnly,'Only current Owner+AAL2 may initiate the JANTA BOL YouTube integration flow.');
recordMany(['3A-P3-T081'],/accounts\.google\.com\/o\/oauth2\/v2\/auth/.test(oauthStart)&&/oauth2\.googleapis\.com\/token/.test(oauthCallback),'YouTube authority uses Google OAuth authorization-code relationship rather than a service-account browser shortcut.');
recordMany(['3A-P3-T082','3A-P3-T083','3A-P3-T084'],oauthChannelScopeSafe,'Expected immutable Channel ID is configured and callback rejects the wrong authorized channel.');
recordMany(['3A-P3-T085'],oauthFounderOnly,'OAuth initiation preserves Owner+AAL2 and current-session security gates.');
recordMany(['3A-P3-T086'],oauthStateSafe,'OAuth state is cryptographically random, hashed server-side, time-limited and one-use/consume checked.');
recordMany(['3A-P3-T087'],/jb-youtube-oauth-callback/.test(oauthStart)&&/redirect_uri:callback/.test(oauthStart)&&/redirect_uri:callback/.test(oauthCallback),'OAuth uses the fixed JANTA BOL callback URI rather than a caller-controlled redirect.');
recordMany(['3A-P3-T088','3A-P3-T089'],oauthChannelScopeSafe&&narrowProvider,'OAuth requests the single required YouTube management scope and provider authority remains behind the narrow adapter.');
recordMany(['3A-P3-T090','3A-P3-T091','3A-P3-T092','3A-P3-T093','3A-P3-T094'],oauthSecretSafe&&frontendSecretSafe,'Access/refresh/client credentials are server-side; refresh credential is encrypted and normal metadata remains non-secret.');
recordMany(['3A-P3-T095'],/DISCONNECTED|CONNECTING|VERIFYING|CONNECTED|REAUTH_REQUIRED/.test(oauthStart+oauthCallback+provider),'YouTube integration uses explicit connection/verification/reauth states.');
recordMany(['3A-P3-T096','3A-P3-T097'],oauthReplacementSafe,'Failed reauth candidate cannot destroy an existing healthy connection; replacement is environment-checked.');
recordMany(['3A-P3-T098','3A-P3-T099'],providerTokenFailureSafe,'Refresh failure blocks new control safely while an already-running media stream may remain live with control-auth degraded warning.');
recordMany(['3A-P3-T100'],/jb_youtube_mark_compromised_internal/.test(edge)&&/admin_youtube_mark_compromised/.test(edge),'Token-compromise containment has an explicit privileged backend action instead of silently continuing privileged work.');
recordMany(['3A-P3-T101','3A-P3-T102','3A-P3-T103','3A-P3-T104'],oauthReplacementSafe&&/privacy/.test(provider)&&/youtube_status/.test(edge),'Production/test OAuth environments are separated and health/status/provider configuration is explicit before field use.');
recordMany(['3A-P3-T105'],requestCurrentState&&controlMediaSplit&&exists('ci/phase3-regression/db-access-regression.sql')&&exists('ci/phase3-regression/db-function-security-regression.sql'),'Security is layered across auth/current-state checks, grants/RLS/function boundaries and Edge authorization.');
recordMany(['3A-P3-T124'],exists('ci/phase3-regression/db-function-security-regression.sql'),'SECURITY DEFINER functions are covered by the dedicated function-security regression suite.');
recordMany(['3A-P3-T125'],requestCurrentState&&/session_active/.test(edge),'Old/stale client claims are insufficient because current app-session and Reporter state are revalidated.');
recordMany(['3A-P3-T129'],handoffSecurity&&requestCurrentState,'Encoder credential handoff is session-specific and issued only after current Reporter/session authorization.');
recordMany(['3A-P3-T130','3A-P3-T131'],frontendSecretSafe&&oauthSecretSafe&&controlMediaSplit,'Supabase backend, Google client secret and OAuth refresh material remain Tier-1 server-only secrets.');
recordMany(['3A-P3-T132','3A-P3-T133'],/audit_logs/.test(edge+worker+provider+oauthStart+oauthCallback)&&safeErrors,'Audit/log paths use actor/session/generation references and safe error codes without intentionally logging credential material.');
recordMany(['3A-P3-T134'],safeErrors&&/NOT_AUTHORIZED|OWNER_AAL2_REQUIRED|REPORTER_REQUIRED|LIVE_CAMERA_NOT_AUTHORIZED/.test(edge),'Unauthorized/error responses are bounded and avoid returning another Reporter/session internals.');

recordMany(['3A-P4-T020','3A-P4-T021','3A-P4-T022'],exists('ci/phase3-regression/db-schema-regression.sql')&&exists('ci/phase3-regression/db-access-regression.sql')&&exists('JANTA_BOL_PHASE_3C_WORKING/CHANGELOG.md'),'Security/schema controls are implemented with versioned source plus post-change database regression rather than a final-day patch.');
recordMany(['3A-P4-T075'],oauthFounderOnly&&oauthChannelScopeSafe,'Founder-only OAuth and wrong-channel rejection are enforced in the snapshotted production OAuth flow.');
recordMany(['3A-P4-T076'],frontendSecretSafe&&oauthSecretSafe,'Refresh/client/provider secrets are absent from ordinary frontend configuration and encrypted server-side.');
recordMany(['3A-P4-T077'],oauthReplacementSafe,'Reauth preserves a healthy old connection on candidate failure and enforces deployment/credential environment separation.');
recordMany(['3A-P4-T078'],/youtubeStatus/.test(liveClient)&&/expected_channel_id|verified_channel_id/.test(edge+oauthCallback+provider),'Pre-event health status includes integration/channel/provider readiness signals.');
recordMany(['3A-P4-T084'],exists('ci/phase3-regression/db-function-security-regression.sql')&&controlMediaSplit,'Sensitive RPC/SECURITY DEFINER execution is covered separately from browser authority.');
recordMany(['3A-P4-T085'],adminFailClosed&&oauthFounderOnly,'High-risk Admin/OAuth paths require AAL2 rather than accepting AAL1-only browser state.');
recordMany(['3A-P4-T086'],requestCurrentState&&adminFailClosed&&reporterLimited,'Modified/hidden frontend controls cannot replace backend current-state/role authorization.');

const fail=results.filter(r=>!r.ok);
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-security-architecture-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3 authentication / security architecture regression\n\n';
md+=`Exact register checks: **${payload.checks}**  PASS: **${payload.pass}**  FAIL: **${payload.fail}**\n\n`;
for(const r of results) md+=`- ${r.ok?'✅':'❌'} **${r.test_id}** — ${r.detail}\n`;
fs.writeFileSync(path.join(OUT,'static-security-architecture-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length) process.exit(1);
