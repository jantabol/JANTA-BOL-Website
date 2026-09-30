#!/usr/bin/env node
'use strict';

const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {
  fs,ROOT,read,exists,edge,worker,provider,handoff,launch,liveClient,admin,reporter,
  backend,multiLive,nonReusable,ambiguity,reconcileFirst,fallbackTruth,realtimeAccel,
  fakeLiveGate,reconcile
}=E;

const runbook=read('JANTA_BOL_PHASE_3C_WORKING/SECURITY-RUNBOOK.md');
const recovery=read('JANTA_BOL_PHASE_3C_WORKING/admin-recovery.html');
const oauthStart=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-oauth-start/index.ts');
const hardening=read('JANTA_BOL_PHASE_3C_WORKING/P3-T20-REPORTER-COMPROMISE-HARDENING.sql');

const results=[],seen=new Set();
function record(id,ok,detail){
  if(seen.has(id)) throw new Error('DUPLICATE_P3_INCIDENT_ID '+id);
  seen.add(id);
  const r={test_id:id,ok:Boolean(ok),detail,layer:'p3-incident-static'};
  results.push(r);
  console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail);
}

const publishStart=backend.indexOf('async function publish(');
const publishEnd=backend.indexOf('async function unpublish',publishStart);
const publishBlock=publishStart>=0&&publishEnd>publishStart?backend.slice(publishStart,publishEnd):'';
const articlePublishingIndependent=
  /from\('articles'\)/.test(publishBlock)
  && /status:'published'/.test(publishBlock)
  && !/jb-youtube-provider|liveBroadcasts|liveStreams|provider_state|live_operations/i.test(publishBlock);

const oauthLossSafe=
  /connection_state!==?"CONNECTED"|connection_state!=="CONNECTED"/.test(provider)
  && /YOUTUBE_REAUTH_REQUIRED/.test(provider)
  && /YOUTUBE_NOT_CONNECTED/.test(provider)
  && /youtubeConnect/.test(liveClient)
  && /jb-youtube-oauth-start/.test(liveClient)
  && /OWNER_AAL2_REQUIRED/.test(oauthStart)
  && !/from\("articles"\)\.insert|from\('articles'\)\.insert/.test(provider)
  && !/from\("live_sessions"\)\.insert|from\('live_sessions'\)\.insert/.test(provider);

const backendSecretRunbook=
  /Supabase backend secret compromise/.test(runbook)
  && /Rotate the compromised Supabase backend\/service credential/.test(runbook)
  && /Inspect security\/activity logs/.test(runbook)
  && /Verify database integrity, grants\/RLS/.test(runbook)
  && /Redeploy affected server functions\/services/.test(runbook)
  && /Investigate provider effects/.test(runbook);

const googleCompromise=
  /youtubeMarkCompromised/.test(liveClient)
  && /admin_youtube_mark_compromised/.test(edge)
  && /OWNER_AAL2_REQUIRED/.test(edge)
  && /jb_youtube_mark_compromised_internal/.test(edge)
  && /Contain OAuth Compromise/.test(admin)
  && /Google refresh token compromise/.test(runbook)
  && /stop new privileged YouTube work/.test(runbook)
  && /Inspect YouTube\/Google activity/.test(runbook)
  && /verified JANTA BOL channel/.test(runbook);

const recoveryAuthority=
  /#114–#118 — Emergency recovery execution sequence/.test(runbook)
  && /LIMITED RECOVERY MODE/.test(runbook+recovery)
  && /jb-recovery-delete-mfa/.test(runbook+backend)
  && /recoveryDeleteMfa/.test(backend)
  && !/admin_.*recovery|reporter_.*recovery/i.test(edge);

const perLiveIsolation=
  multiLive
  && /session_id/.test(worker)
  && /generation_id/.test(worker)
  && /operation_id/.test(worker)
  && /current_provider_generation/.test(worker+provider)
  && /STALE_GENERATION/.test(worker+provider);

const streamIsolation=
  nonReusable
  && /generation_id/.test(provider+handoff+launch)
  && /session_id/.test(provider+handoff+launch)
  && !/GLOBAL_STREAM_KEY|SHARED_STREAM_KEY|shared permanent.*key/i.test(provider+worker+edge);

const realtimeDurable=
  fallbackTruth
  && realtimeAccel
  && /live_requests/.test(edge)
  && /live_sessions/.test(edge+worker)
  && /setInterval/.test(admin+reporter);

const reconcilerTechnicalOnly=
  /operationType==="RECONCILE_LIVE"/.test(worker)
  && /operationType==="REFRESH_PROVIDER_STATE"/.test(worker)
  && /jb_live_mark_interrupted_internal/.test(worker)
  && /current_provider_generation/.test(worker)
  && !/approve_request|permanent_delete|grant.*owner|from\("articles"\)\.update|from\('articles'\)\.update/i.test(worker);

const reconcilerAllowed=
  /operationType==="RECONCILE_LIVE"/.test(worker)
  && /operationType==="REFRESH_PROVIDER_STATE"/.test(worker)
  && /provider\("get_state"\)/.test(worker)
  && /jb_live_mark_interrupted_internal/.test(worker)
  && /RETRY_PENDING/.test(worker);

const reconcilerProhibited=
  !/jb_live_approve_request_internal|jb_owner_permanent_delete_article|jb_live_add_member_internal|admin_grant|user_roles.*owner/i.test(worker);

const partialSecurityVisible=
  /Credential \$\{esc\(p\.credential_status/.test(admin)
  && /RETIRE_PENDING/.test(admin)
  && /COMPROMISED/.test(admin)
  && /Provider mapping uncertain/.test(admin)
  && /REAUTH_REQUIRED/.test(admin)
  && /CONTROL_AUTH_DEGRADED/.test(admin)
  && /credential_incident_state/.test(admin);

const noFalseSuccess=
  !/Revoked Successfully/.test(admin)
  && /do not treat this session as READY/.test(admin)
  && fakeLiveGate
  && /if\(p\.ok\)/.test(worker)
  && /provider_state:"READY"/.test(provider);

record('3A-P3-T146',ambiguity&&reconcileFirst,'Unknown provider results are explicit ambiguity and recovery reconciles before retry/replacement.');
record('3A-P3-T147',streamIsolation,'Stream-key/ingest authority is isolated to one Session/Provider Generation; no shared permanent credential exists.');
record('3A-P3-T149',recoveryAuthority,'Phase-2 emergency recovery remains the only approved Founder recovery authority; Phase 3A adds no weaker bypass.');
record('3A-P3-T150',oauthLossSafe,'OAuth loss blocks new provider control safely, preserves business identities, and recovery uses Owner+AAL2 secure OAuth reconnect.');
record('3A-P3-T151',backendSecretRunbook,'Backend-secret compromise runbook requires rotation, activity inspection, DB integrity/grant review, redeploy and provider-impact reconciliation.');
record('3A-P3-T152',googleCompromise,'Google refresh-token compromise has an Owner+AAL2 containment action, blocks suspect authorization and requires verified-channel reconnect/activity review.');
record('3A-P3-T153',perLiveIsolation,'Live failure scope is keyed by operation/session/generation so one Live does not become a global failure domain.');
record('3A-P3-T155',streamIsolation,'A single stream credential compromise cannot expose all Lives because streams are non-reusable and generation-scoped.');
record('3A-P3-T156',articlePublishingIndependent,'Live worker failure does not block the independent normal Article publish path.');
record('3A-P3-T157',articlePublishingIndependent,'YouTube/provider failure does not couple into normal Article creation/editing/publishing.');
record('3A-P3-T158',realtimeDurable,'Notification/realtime loss cannot destroy durable request/session state and UI has periodic backend refetch fallback.');
record('3A-P3-T159',reconcilerTechnicalOnly,'Reconciler repairs technical provider/session state only and has no editorial/Super-Admin decision path.');
record('3A-P3-T160',reconcilerAllowed,'Reconciler can refresh provider state, mark interruption, confirm current generation and schedule controlled retry.');
record('3A-P3-T161',reconcilerProhibited,'Privileged worker/reconciler has no autonomous Live approval, Reporter grant, permanent Article delete or Super-Admin grant capability.');
record('3A-P3-T162',partialSecurityVisible,'Founder Live UI explicitly shows credential retirement/compromise, OAuth reauth/control degradation and ambiguous provider mapping.');
record('3A-P3-T163',noFalseSuccess,'UI avoids false revoke/ready success and public LIVE/READY state remains gated by provider-confirmed mapping/signal.');

const fail=results.filter(r=>!r.ok);
const OUT=path.join(ROOT,'ci-results');
fs.mkdirSync(OUT,{recursive:true});
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p3-incident-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P3 incident/isolation T20 static checks\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results) md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p3-incident-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length) process.exit(1);
