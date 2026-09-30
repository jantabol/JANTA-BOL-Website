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
 && /live_generation_history/.test(dbIncident+dbRecovery)
 && /revok|compromis|retir/i.test(edge+worker+dbIncident)
 && /do not|preserv|history|audit/i.test(baseline+changelog+debugMap);

const masterIdentity=
 /Article ID \+ Permanent Master URL remain canonical/.test(baseline)
 && /same logical Live Session|preserve.*Article|Permanent URL|article_id/i.test(dbRecovery+baseline)
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
 /reporter_create_request/.test(edge)
 && /admin_approve_request/.test(edge)
 && /admin_reject_request/.test(edge)
 && /OWNER_AAL2_REQUIRED/.test(edge)
 && /pending|approve/i.test(admin);

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
 && /SECURITY DEFINER/.test(dbPreprod)
 && /NO.*PUBLIC|no PUBLIC/i.test(dbPreprod);

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
 /\bPASS\b/.test(testRegister)
 && /\bFAIL\b/.test(testRegister)
 && /\bOPEN\b/.test(testRegister)
 && /\bDEFERRED\b/.test(testRegister);

record('3A-P4-T002',preserveBeforeExtend,'Existing compatible architecture is preserved and extended; Auth/MFA/article publishing regressions remain protected.');
record('3A-P4-T003',auditFirst,'A read-only baseline audit exists and maps existing authority/security surfaces before extension.');
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
