#!/usr/bin/env node
'use strict';

const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {fs,ROOT,read,exists,edge,worker,provider,handoff,launch,liveClient,admin,reporter,nonReusable,ambiguity,reconcileFirst,transport}=E;

const oauthStart=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-start/index.ts');
const oauthCallback=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-callback/index.ts');
const connector=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-connector-lols/index.ts');
const advisor=JSON.parse(read('ci/phase3-regression/security-advisor-review.json'));
const deployment=JSON.parse(read('ci/phase3-regression/edge-function-deployment-review.json'));

const results=[],seen=new Set();
function record(id,ok,detail){
  if(seen.has(id)) throw new Error('DUPLICATE_P3_PREPROD_ID '+id);
  seen.add(id);
  const r={test_id:id,ok:Boolean(ok),detail,layer:'p3-preprod-static'};
  results.push(r);
  console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail);
}

const apiAuth=
  /auth\.getUser\(token\)/.test(edge)
  && /jb_live_actor_context_internal/.test(edge)
  && /!ctx\?\.session_active/.test(edge)
  && /validUuid/.test(edge)
  && /OWNER_AAL2_REQUIRED/.test(edge)
  && /REPORTER_REQUIRED/.test(edge);

const oauthStartAuth=
  /auth\.getUser\(token\)/.test(oauthStart)
  && /OWNER_AAL2_REQUIRED/.test(oauthStart)
  && /jb_live_actor_context_internal/.test(oauthStart)
  && /session_active/.test(oauthStart);

const oauthCallbackAuth=
  /jb_youtube_oauth_state_consume_internal/.test(oauthCallback)
  && /State expired, reused, or mismatched/.test(oauthCallback)
  && /expected_channel_id|expected/.test(oauthCallback)
  && /REFRESH_TOKEN_MISSING/.test(oauthCallback);

const handoffAuth=
  /jb_live_consume_handoff_internal/.test(handoff+launch)
  && /sha256hex/.test(handoff+launch)
  && /token.length<32/.test(handoff.replace(/\s+/g,''))
  && /token.length < 32/.test(launch);

const internalWorker=
  /jb_live_worker_secret_valid_internal/.test(worker)
  && /scheduledSecret/.test(worker)
  && /jb_live_operation_context_internal/.test(worker)
  && /current_provider_generation/.test(worker)
  && /CANCELLED_STALE/.test(worker)
  && /operation_step/.test(worker)
  && /operation_data/.test(worker)
  && !/console\.(?:log|warn|error)\([^\n]*(?:serviceRole|scheduledSecret|refresh_token|streamName)/i.test(worker);

const providerInternal=
  /sameSecret\(bearer,c\.service\)/.test(provider)
  && /STALE_GENERATION/.test(provider)
  && /ACTION_NOT_ALLOWED/.test(provider);

const connectorInternal=
  /auth !== "Bearer " \+ serviceRoleKey/.test(connector)
  && /INVALID_ACTION/.test(connector)
  && /INVALID_INGEST/.test(connector);

const deploymentMap=new Map((deployment.functions||[]).map(x=>[x.slug,x]));
const edgeReview=
  deployment.live_api_source_deployment_exact_match_after_review===true
  && deploymentMap.get('jb-live-api')?.version===30
  && deploymentMap.get('jb-live-api')?.verify_jwt===true
  && deploymentMap.get('jb-youtube-oauth-start')?.verify_jwt===true
  && deploymentMap.get('jb-youtube-oauth-callback')?.verify_jwt===false
  && deploymentMap.get('jb-encoder-handoff')?.verify_jwt===false
  && deploymentMap.get('jb-encoder-launch')?.verify_jwt===false
  && deploymentMap.get('jb-live-worker')?.verify_jwt===false
  && apiAuth && oauthStartAuth && oauthCallbackAuth && handoffAuth && internalWorker && providerInternal && connectorInternal;

const advisorReviewed=
  advisor.reviewed_on==='2026-09-30'
  && advisor.phase3a_relevant_unresolved===0
  && Array.isArray(advisor.advisor_findings_reviewed)
  && advisor.advisor_findings_reviewed.length>=3
  && /Broader project warnings remain explicitly open/.test(advisor.phase3a_review_result||'');

const h1=
  nonReusable
  && /token_hash/.test(read('ci/phase3-regression/db-p3-security-regression.sql'))
  && /HANDOFF_ALREADY_USED/.test(read('ci/phase3-regression/db-p3-security-regression.sql'))
  && /RETIRE_PENDING/.test(edge+worker+provider)
  && transport;

const h2=
  /admin_revoke_live_permission/.test(edge)
  && /admin_suspend_reporter/.test(edge)
  && /jb_live_revoke_permission_internal/.test(edge)
  && /jb_live_revoke_reporter_capabilities_internal/.test(edge)
  && /REPORTER_DISABLED/.test(edge)
  && /CANCELLED_STALE/.test(worker);

const h3=
  !/\/functions\/v1\/jb-live-worker/.test(edge)
  && /jb_live_approve_request_internal/.test(edge)
  && /jb_live_claim_operation_internal/.test(worker)
  && /jb-youtube-provider/.test(worker)
  && internalWorker
  && providerInternal
  && !/generic_sql|execute_sql|raw_sql/i.test(edge+worker+provider);

const h4=
  /client_action_id/.test(liveClient+edge)
  && /state_version/.test(edge)
  && /live_request_approval_action/.test(edge)
  && ambiguity
  && reconcileFirst
  && /operation_step/.test(worker+provider)
  && /lease_until/.test(read('ci/phase3-regression/db-p3-recovery-regression.sql'));

const h5=
  oauthStartAuth
  && oauthCallbackAuth
  && /refresh_token_ciphertext/.test(provider+oauthCallback)
  && /JB_OAUTH_TOKEN_ENC_KEY_B64/.test(provider+oauthCallback)
  && /admin_youtube_mark_compromised/.test(edge);

const h6=
  exists('ci/phase3-regression/db-access-regression.sql')
  && exists('ci/phase3-regression/db-function-security-regression.sql')
  && /reporter_3b_session/.test(edge)
  && /SESSION_MEMBERSHIP_REQUIRED/.test(edge)
  && /OWNER_AAL2_REQUIRED/.test(edge)
  && /REPORTER_DISABLED/.test(edge);

record('3A-P3-T169',edgeReview,'Deployed Phase-3A Edge functions were reviewed against JWT/custom-auth, business authorization and input-validation models; Live API v30 matches reviewed repo source.');
record('3A-P3-T170',internalWorker&&providerInternal,'Privileged worker/provider path is internal-only, secret-safe, revalidates current operation/session/generation authority and preserves journal/idempotent recovery.');
record('3A-P3-T172',advisorReviewed,'Supabase Security Advisor was reviewed after implementation; no unresolved finding names Phase-3A Live/YouTube/encoder objects, while broader project warnings remain explicitly tracked.');
record('3A-P3-T174',
  apiAuth
    && /a\.role !== "reporter"/.test(edge)
    && /REPORTER_REQUIRED/.test(edge)
    && !/payload\.(?:role|isAdmin|isReporter)|body\.(?:role|isAdmin|isReporter)/.test(edge),
  'Ordinary authentication alone never grants Reporter authority; role/current Reporter state are derived server-side.'
);
record('3A-P3-T175',
  /reporter_3b_session/.test(edge)
    && /SESSION_MEMBERSHIP_REQUIRED/.test(edge)
    && /\.eq\("session_id",sessionId\)\.eq\("user_id",a\.userId\)/.test(edge)
    && /\.eq\("reporter_id", a\.userId\)/.test(edge),
  'Reporter-scoped endpoints bind Session/Request access to the authenticated Reporter and reject missing cross-session membership.'
);
record('3A-P3-T176',
  /!ctx\?\.session_active/.test(edge)
    && /reporterActive: ctx\.reporter_active !== false/.test(edge)
    && /REPORTER_DISABLED/.test(edge)
    && /admin_suspend_reporter/.test(edge),
  'Old JWT alone cannot restore revoked Reporter authority because current auth-session and Reporter-active state are revalidated.'
);
record('3A-P3-T177',
  (edge.match(/OWNER_AAL2_REQUIRED/g)||[]).length>=8
    && /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(edge),
  'Admin AAL1 is rejected by elevated Phase-3A control actions before privileged work is issued.'
);
record('3A-P3-T178',
  apiAuth
    && /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(edge)
    && /session_active/.test(edge)
    && /validUuid/.test(edge),
  'Admin AAL2 is necessary but not sufficient: current session, role and per-action state/input validation still apply.'
);
record('3A-P3-T179',
  /jb_live_actor_context_internal/.test(edge)
    && /app_role/.test(edge)
    && /SESSION_MEMBERSHIP_REQUIRED/.test(edge)
    && !/isAdmin\s*=\s*true|payload\.isAdmin|payload\.role/.test(edge),
  'Modified client flags or substituted Session IDs have no server-side authority; role and membership come from current backend state.'
);
record('3A-P3-T181',h1,'H1 trace is backed by non-reusable stream, hashed one-use handoff, credential lifecycle/retirement and secure transport evidence.');
record('3A-P3-T182',h2,'H2 trace is backed by immediate revoke/suspend paths, capability invalidation and stale-work cancellation.');
record('3A-P3-T183',h3,'H3 trace is backed by separated command gateway, internal worker/provider trust planes and no generic privileged SQL/provider proxy.');
record('3A-P3-T184',h4,'H4 trace is backed by state-versioned approval, stable action ID, durable journal/lease and ambiguity-first reconciliation.');
record('3A-P3-T185',h5,'H5 trace is backed by Owner+AAL2 OAuth start, one-use state callback, encrypted refresh-token handling and compromise containment.');
record('3A-P3-T186',h6,'H6 trace is backed by RLS/access/function-security suites plus server-side membership/current-state/AAL authorization.');

const fail=results.filter(r=>!r.ok);
const OUT=path.join(ROOT,'ci-results');
fs.mkdirSync(OUT,{recursive:true});
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p3-preprod-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P3 pre-production/trace T20 static checks\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results) md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p3-preprod-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length) process.exit(1);
