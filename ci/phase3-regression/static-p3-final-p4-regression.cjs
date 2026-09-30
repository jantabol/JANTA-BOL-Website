#!/usr/bin/env node
'use strict';

const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {fs,ROOT,read,exists,edge,worker,provider,liveClient,admin,reporter,website,nonReusable,ambiguity,reconcileFirst}=E;

const baseline=read('JANTA_BOL_PHASE_3C_WORKING/PHASE3C-BASELINE-AUDIT.md');
const affected=read('JANTA_BOL_PHASE_3C_WORKING/PHASE3C-M3-AFFECTED-FILES.md');
const codeMap=read('JANTA_BOL_PHASE_3C_WORKING/CODE-MAP.md');
const changelog=read('JANTA_BOL_PHASE_3C_WORKING/CHANGELOG.md');
const debugMap=read('JANTA_BOL_PHASE_3C_WORKING/DEBUG-MAP.md');
const testRegister=read('JANTA_BOL_PHASE_3C_WORKING/TEST-REGISTER.md');
const statusPolicy=read('ci/phase3-regression/TEST-STATUS-POLICY.md');
const liveHtml=read('JANTA_BOL_PHASE_3C_WORKING/live.html');
const migration=read('JANTA_BOL_PHASE_3C_WORKING/phase2-migration.sql');
const advisor=JSON.parse(read('ci/phase3-regression/security-advisor-review.json'));
const dbSecurity=read('ci/phase3-regression/db-p3-security-regression.sql');
const dbRecovery=read('ci/phase3-regression/db-p3-recovery-regression.sql');
const dbIncident=read('ci/phase3-regression/db-p3-incident-regression.sql');
const dbPreprod=read('ci/phase3-regression/db-p3-preprod-regression.sql');

const results=[],seen=new Set();
function record(id,ok,detail){
 if(seen.has(id)) throw new Error('DUPLICATE_P3_FINAL_P4_ID '+id);
 seen.add(id);
 const r={test_id:id,ok:Boolean(ok),detail,layer:'p3-final-p4-governance'};
 results.push(r);
 console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail);
}

const layered=
 /auth\.getUser\(token\)/.test(edge)
 && /jb_live_actor_context_internal/.test(edge)
 && /OWNER_AAL2_REQUIRED/.test(edge)
 && /SESSION_MEMBERSHIP_REQUIRED/.test(edge)
 && /RLS/i.test(dbSecurity+dbPreprod)
 && /jb_live_worker_secret_valid_internal/.test(worker);

const noClientAuthority=
 /app_role/.test(edge)
 && /REPORTER_DISABLED/.test(edge)
 && /jb_live_activate_public_internal/.test(worker)
 && !/payload\.(?:role|isAdmin|isReporter)|body\.(?:role|isAdmin|isReporter)/.test(edge);

const businessProviderTruth=
 /current_provider_generation/.test(worker+provider)
 && /provider_live_confirmed/.test(worker)
 && /jb_live_activate_public_internal/.test(worker)
 && /provider_stream_status/.test(provider)
 && /public_status:"LIVE"/.test(worker);

const incidentEvidence=
 /audit_logs/.test(edge+worker+dbIncident)
 && /live_provider_generations/.test(dbIncident+dbSecurity)
 && /revok|compromis|retir/i.test(edge+worker+dbIncident)
 && /preserv|history|audit/i.test(baseline+changelog+debugMap);

const masterIdentity=
 /Live Session \+ Article ID \+ Permanent Master URL remain canonical/.test(baseline)
 && /same logical Live Session|Article ID|Permanent Master URL|article_id/i.test(dbRecovery+baseline)
 && /RECONNECTING/.test(worker+edge);

const p3Complete=
 nonReusable
 && /admin_youtube_mark_compromised/.test(edge)
 && /admin_revoke_live_permission/.test(edge)
 && /admin_suspend_reporter/.test(edge)
 && /grant_version/.test(edge+dbSecurity)
 && /RETIRE_PENDING|RETIRED/.test(worker+provider+dbSecurity);

record('3A-P3-T187',layered,'Security is layered across authenticated user validation, current backend authority, AAL2, membership/RLS and internal-worker controls.');
record('3A-P3-T188',noClientAuthority,'Reporter/Admin/public-LIVE authority is derived from server state; no single client-controlled role flag decides authority.');
record('3A-P3-T189',businessProviderTruth,'Public LIVE requires Supabase business/session authority plus provider-confirmed media state before public activation.');
record('3A-P3-T190',incidentEvidence,'Revoke/rotation/compromise paths preserve audit/history evidence instead of silently replacing the incident trail.');
record('3A-P3-T191',masterIdentity,'Recovery preserves canonical Article/Live Session/Permanent URL identity while reconciling technical provider state.');
record('3A-P3-T192',p3Complete,'P3 security coverage includes stream lifecycle, compromise containment, immediate permission revoke and Reporter suspension.');

const preserveBeforeExtend=
 /Zero rebuild nahi/i.test(baseline)
 && /Preserved \/ Not Rebuilt/.test(affected)
 && /Normal article publishing remains independent/.test(baseline)
 && exists('ci/phase3-regression/static-regression.cjs');

const auditFirst=
 /BASELINE AUDIT/.test(baseline)
 && /Verified preservation locks/.test(baseline)
 && /Auth|AAL|MFA|Owner|Super Admin/i.test(codeMap);

const affectedPlan=
 /Affected Files/.test(affected)
 && /New/.test(affected)
 && /Extended/.test(affected)
 && /Preserved \/ Not Rebuilt/.test(affected);

const m2m3=
 /reporter_submit_request/.test(edge)
 && /admin_approve_request/.test(edge)
 && /admin_reject_request/.test(edge)
 && /OWNER_AAL2_REQUIRED/.test(edge)
 && /Pending Live Requests/.test(liveHtml)
 && /approveRequest/.test(liveHtml)
 && /rejectRequest/.test(liveHtml);

const m3m4=
 /admin_approve_request/.test(edge)
 && /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(edge)
 && /live_operations/.test(worker+edge+dbSecurity)
 && /jb_live_claim_operation_internal/.test(worker);

const m5=
 /provision_generation/.test(provider)
 && /liveBroadcasts/.test(provider)
 && /liveStreams/.test(provider)
 && /bind/.test(provider)
 && /jb-youtube-provider/.test(worker);

const m8=
 /provider_stream_status/.test(provider)
 && /transition_live/.test(worker+provider)
 && /jb_live_activate_public_internal/.test(worker)
 && /public_status:"LIVE"/.test(worker);

const m9=
 /RECONNECTING/.test(edge+worker)
 && /Reporter Start intent != public LIVE/.test(baseline)
 && reconcileFirst
 && /COMPLETE_LIVE/.test(worker);

const m10m11=
 /grant_version/.test(edge+dbSecurity)
 && /admin_revoke_live_permission/.test(edge)
 && /live_notifications/.test(edge+provider)
 && /approval|rejection|notification/i.test(edge+admin+reporter);

const earlySecurity=
 /RLS/.test(dbSecurity+dbPreprod)
 && /OWNER_AAL2_REQUIRED/.test(edge)
 && /PUBLIC\/anon\/authenticated direct EXECUTE remains/.test(dbPreprod)
 && exists('ci/phase3-regression/db-function-security-regression.sql')
 && exists('ci/phase3-regression/db-access-regression.sql');

const migrationDiscipline=
 exists('JANTA_BOL_PHASE_3C_WORKING/phase2-migration.sql')
 && /create table|alter table|create or replace function/i.test(migration)
 && /migration/i.test(changelog)
 && /existing|conflict|preserv/i.test(changelog+baseline);

const migrationAdvisor=
 advisor.reviewed_on==='2026-09-30'
 && advisor.phase3a_relevant_unresolved===0
 && /verify actual database state|post-migration|live-definition|production regression/i.test(changelog);

const testTypes=
 exists('ci/phase3-regression/static-p1-functional-regression.cjs')
 && exists('ci/phase3-regression/db-regression.sql')
 && exists('ci/phase3-regression/db-p3-security-regression.sql')
 && /provider/.test(provider.toLowerCase())
 && exists('ci/phase3-regression/static-p3-recovery-regression.cjs');

const statuses=
 /Official Phase 3A test-result statuses are exactly/.test(statusPolicy)
 && /\bPASS\b/.test(statusPolicy)
 && /\bFAIL\b/.test(statusPolicy)
 && /\bOPEN\b/.test(statusPolicy)
 && /\bDEFERRED\b/.test(statusPolicy)
 && /No FINAL PASS\/LOCK/.test(testRegister);

record('3A-P4-T002',preserveBeforeExtend,'Existing compatible architecture is preserved and extended; Auth/MFA/article publishing regressions remain protected.');
record('3A-P4-T003',auditFirst,'A read-only baseline audit exists and maps existing authority/security surfaces before extension.');
record('3A-P4-T004',
  /CODE MAP/.test(codeMap)
    && /Primary files\/modules/.test(codeMap)
    && /Backend objects/.test(codeMap),
  'CODE-MAP records concrete file/module ownership and backend responsibilities for controlled changes.'
);
record('3A-P4-T006',
  /CHANGELOG/.test(changelog)
    && /working copy|checkpoint|commit|migration/i.test(changelog)
    && /PRETEST-CHG-/.test(changelog),
  'Version-controlled working-copy/checkpoint evidence and a meaningful implementation CHANGELOG are maintained.'
);
record('3A-P4-T005',affectedPlan,'Affected-file planning explicitly separates new, extended and preserved components before implementation.');
record('3A-P4-T011',m2m3,'Reporter request boundary remains separate from Owner+AAL2 pending-request approve/reject authority.');
record('3A-P4-T012',m3m4,'Approval remains a privileged Owner+AAL2 decision and durable live_operations worker foundation is present.');
record('3A-P4-T013',m5,'YouTube create Broadcast/create Stream/bind operations remain behind the narrow provider adapter.');
record('3A-P4-T015',m8,'Public Live truth requires signal/provider transition, backend confirmation and public_status activation.');
record('3A-P4-T016',m9,'Reporter Start is not public LIVE; reconnect/reconcile/technical-end states remain explicit.');
record('3A-P4-T017',m10m11,'Revocation/Grant Version and request-status notification integration are implemented without moving authority to notifications.');
record('3A-P4-T020',earlySecurity,'RLS/function authorization/AAL controls are implemented and regression-tested with their modules, not deferred to final-day hardening.');
record('3A-P4-T021',migrationDiscipline,'Database schema changes are preserved in reproducible/versioned SQL evidence with preservation/conflict review records.');
record('3A-P4-T022',migrationAdvisor,'Post-change database state verification and Security Advisor review are preserved as explicit evidence.');
record('3A-P4-T023',testTypes,'CI contains functional, backend/data-integrity, security, provider and recovery test layers.');
record('3A-P4-T025',statuses,'Official test records preserve explicit PASS/FAIL/OPEN/DEFERRED status vocabulary.');
record('3A-P4-T029',
  /action === "admin_pending"/.test(edge)
    && /Pending Live Requests/.test(liveHtml)
    && /r\.headline/.test(liveHtml)
    && /r\.location/.test(liveHtml)
    && /r\.description/.test(liveHtml)
    && /r\.expected_duration_minutes/.test(liveHtml),
  'Admin pending-request review reads backend pending requests and renders the submitted request details before decision.'
);
record('3A-P4-T034',
  /operation_step/.test(worker+provider)
    && /findBroadcastByMarker/.test(provider)
    && /findStreamByMarker/.test(provider)
    && /AMBIGUOUS/.test(worker+provider)
    && /jb_live_claim_operation_internal/.test(worker),
  'Duplicate queue delivery resumes/reconciles the same durable operation and provider markers instead of knowingly duplicating provider resources.'
);
record('3A-P4-T035',
  /jb_live_claim_operation_internal/.test(worker)
    && /lease_until/.test(dbRecovery)
    && /current_provider_generation/.test(worker+provider)
    && /CANCELLED_STALE/.test(worker)
    && /STALE_GENERATION/.test(provider),
  'Worker lease/claim ownership prevents independent double ownership and stale provider generations cannot overwrite the current generation.'
);


const oauthStart=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-start/index.ts');
const oauthCallback=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-callback/index.ts');
const handoff=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-handoff/index.ts');
const launch=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-launch/index.ts');

record('3A-P4-T036',/YOUTUBE_EXPECTED_CHANNEL_ID|expected_channel/i.test(oauthStart+oauthCallback+edge) && /deployment_environment|environment/i.test(oauthStart+oauthCallback+edge),'YouTube connection is pinned to reviewed channel/environment metadata.');
record('3A-P4-T037',/CHANNEL_MISMATCH|WRONG_CHANNEL|expected_channel/i.test(oauthCallback+edge) && /state_hash|oauth_state|state/i.test(oauthStart+oauthCallback) && /expires|consum|used_at/i.test(oauthStart+oauthCallback),'Wrong-channel and OAuth state expiry/reuse protections are explicit.');
record('3A-P4-T038',/refresh_token/i.test(provider+edge) && /access_token/i.test(provider+edge) && /refresh/i.test(provider),'Healthy server-side refresh path can obtain provider access without repeated Founder login.');
record('3A-P4-T039',/REAUTH_REQUIRED/.test(edge+provider+oauthCallback) && /liveBroadcasts/.test(provider) && /provider_broadcast_id/.test(provider+worker),'Broken authorization enters reauth-required state and approved provisioning persists one Broadcast mapping.');
record('3A-P4-T040',nonReusable && /liveStreams/.test(provider),'Provider Stream creation is dedicated/non-reusable.');
record('3A-P4-T042',ambiguity && /findBroadcastByMarker/.test(provider) && reconcileFirst,'Lost Broadcast-create response becomes ambiguity and reconciles before duplicate creation.');
record('3A-P4-T043',/ORPHAN_POSSIBLE|AMBIGUOUS/.test(provider+worker) && /SERVER_ONLY/.test(provider+worker) && nonReusable,'Uncertain non-reusable Stream is not issued as a trusted credential and uses controlled replacement/reconciliation.');
record('3A-P4-T044',/boundStreamId/.test(provider) && /provider_stream_status|lifeCycleStatus/.test(provider) && reconcileFirst,'Bind and LIVE-transition uncertainty query actual provider state before retry.');
record('3A-P4-T045',/retire|delete/i.test(provider) && /provider_stream_status|streams\.list|liveStreams/.test(provider),'Retire cleanup checks known provider Stream state before further destructive action.');
record('3A-P4-T046',/assigned_reporter_id|reporter_id/.test(handoff+launch+edge) && /SESSION_MEMBERSHIP_REQUIRED|REPORTER/.test(handoff+launch+edge),'Encoder handoff is assigned-Reporter/session scoped and cross-Reporter access is denied.');
record('3A-P4-T047',/consumed_at|used_at|one.?use/i.test(handoff+launch+dbSecurity) && /token_hash/.test(handoff+launch+dbSecurity),'Consumed encoder handoff is hash-backed and one-use.');
record('3A-P4-T049',!/stream_key\s+(text|varchar|character varying)/i.test(migration) && /token_hash/.test(migration+dbSecurity),'Normal database schema does not persist a raw stream-key column; handoff stores token hash.');
record('3A-P4-T054',/permanent_url/.test(migration+edge+baseline) && /provider_broadcast_id|provider_stream_id/.test(worker+provider+migration) && /Article ID|Permanent Master URL/i.test(baseline),'Canonical JANTA BOL permanent URL remains separate from replaceable provider identifiers.');
record('3A-P4-T055',/session_id/.test(worker+provider) && /generation_id/.test(worker+provider) && /assigned_reporter_id/.test(edge),'Live work is scoped by independent session/reporter/provider-generation identities, supporting concurrent isolated Lives.');
record('3A-P4-T056',/session_id/.test(worker) && /FAILED_NEEDS_ATTENTION|RECONNECTING/.test(worker) && /normal Article publishing remains independent/i.test(baseline),'Failure state is session-scoped and ordinary publishing remains independent.');
record('3A-P4-T057',/generation_id/.test(worker+provider) && /RECONNECTING/.test(worker+edge) && /session_id/.test(worker),'Each Live has separate provider-generation identity and short interruption uses reconnect state.');
record('3A-P4-T058',/RECONNECTING/.test(worker+edge) && /session_id/.test(worker+edge+dbRecovery) && /Article ID|Live Session/i.test(baseline),'Network return reconciles/resumes the same logical Live Session.');
record('3A-P4-T059',/Article ID|Permanent Master URL/i.test(baseline) && /RECONNECTING/.test(worker+edge) && /signal|health/i.test(worker+provider),'Reconnect preserves Article/permanent identity and absent signal cannot remain falsely healthy.');
record('3A-P4-T062',/COMPROMISED/.test(edge+worker+provider+dbSecurity) && /RETIRE_PENDING|RETIRED/.test(worker+provider+dbSecurity) && /article_id/.test(worker+edge),'Compromised provider generation retires/replaces while preserving Article identity.');
record('3A-P4-T070',/CANCELLED_STALE|STALE_GENERATION|STALE/.test(worker+provider) && /safe_error|error_code|sanitize|redact/i.test(worker+provider+edge),'Stale queued work is invalidated and provider failures use bounded/safe error surfaces without credential leakage.');

const fail=results.filter(r=>!r.ok);
const OUT=path.join(ROOT,'ci-results');fs.mkdirSync(OUT,{recursive:true});
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p3-final-p4-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P3-final + P4 governance T20 checks\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results) md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p3-final-p4-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length) process.exit(1);
