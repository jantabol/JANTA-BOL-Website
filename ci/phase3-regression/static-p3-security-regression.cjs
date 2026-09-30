#!/usr/bin/env node
'use strict';
const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {fs,ROOT,edge,worker,provider,handoff,launch,liveClient,website,article,nonReusable,transport,ambiguity,reconcileFirst,backendMapping,masterPage}=E;
const results=[],seen=new Set();
function record(id,ok,detail){if(seen.has(id))throw new Error('DUPLICATE_P3_SECURITY_ID '+id);seen.add(id);const r={test_id:id,ok:Boolean(ok),detail,layer:'p3-security-static'};results.push(r);console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail)}
function hasAll(text,parts){return parts.every(x=>text.includes(x))}
const serverText=edge+'\n'+worker+'\n'+provider+'\n'+handoff+'\n'+launch;
const noCredentialLogging=
  !/console\.(?:log|error|warn)\([^\n]*(?:streamName|ingestUrl|rtmps_address|clipboardText|refresh_token|access_token|clientSecret)/i.test(serverText)
  && !/console\.(?:log|error|warn)\([^\n]*authorization/i.test(serverText);
const currentAuth=
  /auth\.getUser\(token\)/.test(edge)
  && /claims\.session_id/.test(edge)
  && /jb_live_actor_context_internal/.test(edge)
  && /!ctx\?\.session_active/.test(edge)
  && /reporterActive: ctx\.reporter_active !== false/.test(edge);
const approvalAction=
  /approvalActionIds=new Map\(\)/.test(liveClient)
  && /crypto\?\.randomUUID\?\.\(\)/.test(liveClient)
  && /client_action_id:approvalActionId\(requestId,stateVersion\)/.test(liveClient)
  && /const clientActionId = String\(payload\.client_action_id/.test(edge)
  && /!validUuid\(clientActionId\)/.test(edge)
  && /live_request_approval_action/.test(edge)
  && /client_action_id: clientActionId/.test(edge);
const breakGlass=
  /admin_break_glass_provider_stop/.test(edge)
  && /OWNER_AAL2_REQUIRED/.test(edge)
  && /FAILED_NEEDS_ATTENTION/.test(edge)
  && /BREAK_GLASS_NOT_ALLOWED_AUTOMATION_NOT_FAILED/.test(edge)
  && /break_glass_provider_stop_requested/.test(edge)
  && /break_glass_provider_stop_failed/.test(edge)
  && /break_glass_provider_stop_succeeded/.test(edge);
const immediateProviderIds=
  /await updateGen\(\{provider_broadcast_id:broadcastId/.test(provider)
  && /await updateGen\(\{provider_stream_id:streamId/.test(provider)
  && /PROVIDER_IDS_MISSING/.test(provider);

record('3A-P3-T005',nonReusable&&/current_provider_generation/.test(edge+worker)&&/generation_id/.test(provider),'Each Live/provider generation uses an isolated non-reusable provider stream rather than a shared permanent key.');
record('3A-P3-T006',backendMapping&&masterPage&&/provider_stream_id/.test(provider),'Provider stream identity is replaceable mapping data while Article/Session/Permanent URL remain master identities.');
record('3A-P3-T014',noCredentialLogging,'Server logging paths do not intentionally print stream/RTMPS/OAuth credential material.');
record('3A-P3-T015',transport,'Encoder contribution path uses RTMPS as the secure/default ingest transport where supported.');
record('3A-P3-T023',currentAuth,'Live authorization does not rely on logout alone; each request revalidates token user plus current backend session state.');
record('3A-P3-T024',currentAuth&&/!a\.reporterActive/.test(edge)&&/REPORTER_DISABLED/.test(edge),'Sensitive Reporter actions chain authenticated user, current app session and current ACTIVE Reporter state.');
record('3A-P3-T032',breakGlass,'Break-glass provider stop is Owner+AAL2 protected, allowed only after automation failure, and fully audited.');
record('3A-P3-T059',approvalAction,'Admin approval carries a stable client action ID across retry, validates it server-side and records it in audit evidence.');
record('3A-P3-T065',immediateProviderIds,'Confirmed provider Broadcast/Stream IDs are persisted immediately during provisioning before the workflow completes.');
record('3A-P3-T066',ambiguity&&reconcileFirst,'Provider create/transition timeout is treated as ambiguous and reconciled before any retry/replace path.');

const fail=results.filter(r=>!r.ok),OUT=path.join(ROOT,'ci-results');
fs.mkdirSync(OUT,{recursive:true});
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p3-security-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P3 security batch\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results)md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p3-security-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length)process.exit(1);
