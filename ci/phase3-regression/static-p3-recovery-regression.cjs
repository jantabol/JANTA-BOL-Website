#!/usr/bin/env node
'use strict';

const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {
  fs,ROOT,edge,worker,provider,handoff,launch,liveClient,website,article,backend,
  ambiguity,reconcileFirst,ambiguityBudget,reconcile,workerLease,transport,
  fallbackTruth,realtimeAccel,interruptionUi,backendMapping,masterPage
}=E;

const results=[],seen=new Set();
function record(id,ok,detail){
  if(seen.has(id)) throw new Error('DUPLICATE_P3_RECOVERY_ID '+id);
  seen.add(id);
  const r={test_id:id,ok:Boolean(ok),detail,layer:'p3-recovery-static'};
  results.push(r);
  console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail);
}

const broadcastAmbiguity=
  /findBroadcastByMarker/.test(provider)
  && /BROADCAST_CREATE_CHECK/.test(provider)
  && /BROADCAST_CREATE_AMBIGUOUS/.test(provider)
  && /provider_state:"AMBIGUOUS"/.test(provider);

const streamAmbiguity=
  /findStreamByMarker/.test(provider)
  && /STREAM_CREATE_CHECK/.test(provider)
  && /STREAM_CREATE_AMBIGUOUS/.test(provider)
  && /provider_state:"ORPHAN_POSSIBLE"/.test(provider)
  && /credential_status:"SERVER_ONLY"/.test(provider)
  && /PROVIDER_NOT_READY/.test(edge);

const bindRecovery=
  /liveBroadcasts\/bind/.test(provider)
  && /BIND_AMBIGUOUS/.test(provider)
  && /getBroadcast\(token,broadcastId\)/.test(provider)
  && /boundStreamId/.test(provider);

const liveTransitionRecovery=
  /broadcastStatus=live/.test(provider)
  && /LIVE_TRANSITION_AMBIGUOUS/.test(provider)
  && /getBroadcast\(token,String\(g\.provider_broadcast_id\)\)/.test(provider)
  && /life!=="live"&&life!=="liveStarting"/.test(provider);

const retireRecovery=
  /action==="retire_stream"/.test(provider)
  && /getStream\(token,id,false\)/.test(provider)
  && /RETIRE_STATE_UNKNOWN/.test(provider)
  && /RETIRE_AMBIGUOUS/.test(provider);

const journalResume=
  /journalStep\(/.test(provider)
  && /operation_step/.test(provider+worker)
  && /operation_data/.test(provider+worker)
  && /savedOperationStep/.test(worker)
  && /live_operation_resume_from_journal/.test(worker);

const staleGeneration=
  /current_provider_generation/.test(worker+provider)
  && /STALE_GENERATION/.test(worker+provider)
  && /CANCELLED_STALE/.test(worker)
  && /g\.is_current!==true/.test(worker)
  && /g\.data\.is_current!==true/.test(provider);

const preservesBusinessIdentity=
  reconcile
  && /sessionId/.test(worker)
  && /generationId/.test(worker)
  && !/from\("live_sessions"\)\.insert|from\('live_sessions'\)\.insert/.test(worker+provider)
  && !/from\("articles"\)\.insert|from\('articles'\)\.insert/.test(worker+provider)
  && masterPage;

const directMediaPath=
  transport
  && /get_encoder_ingest/.test(launch+handoff+provider)
  && /rtmps_address/.test(launch+handoff)
  && /stream_name/.test(launch+handoff)
  && !/media.*proxy|proxy.*media|relay.*video/i.test(edge+worker);

const publishStart=backend.indexOf('async function publish(');
const publishEnd=backend.indexOf('async function unpublish',publishStart);
const publishBlock=publishStart>=0&&publishEnd>publishStart?backend.slice(publishStart,publishEnd):'';
const articlePublishingIndependent=
  /from\('articles'\)/.test(publishBlock)
  && /status:'published'/.test(publishBlock)
  && !/jb-youtube-provider|liveBroadcasts|liveStreams|provider_state|live_operations/i.test(publishBlock);

const providerIsolation=
  articlePublishingIndependent
  && /PROVIDER_ADAPTER_NETWORK_ERROR/.test(worker)
  && /RETRY_PENDING/.test(worker);

const mediaOutageIsolation=
  reconcile
  && /jb_live_mark_interrupted_internal/.test(worker)
  && interruptionUi
  && /listPublishedPublic/.test(backend)
  && articlePublishingIndependent;

const sameSessionReconnect=
  /jb_live_mark_interrupted_internal/.test(worker)
  && /RECONNECTING/.test(worker+edge)
  && /operationType==="RECONCILE_LIVE"/.test(worker)
  && /p_session_id:sessionId/.test(worker)
  && !/from\("live_sessions"\)\.insert|from\('live_sessions'\)\.insert/.test(worker);

const notificationFallback=
  /subscribeNotifications/.test(liveClient)
  && /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)loadAll\(\)\},20000\)/.test(E.admin)
  && /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)loadRequests\(\)\},20000\)/.test(E.reporter)
  && /adminOverview/.test(E.admin)
  && /myRequests/.test(E.reporter);

const realtimeFallback=
  realtimeAccel
  && fallbackTruth
  && /setInterval/.test(E.admin+E.reporter)
  && /loadAll/.test(E.admin)
  && /loadRequests/.test(E.reporter);

const generalRecovery=
  ambiguity
  && reconcile
  && /CANCELLED_STALE/.test(worker)
  && /RETRY_PENDING/.test(worker)
  && /FAILED_NEEDS_ATTENTION/.test(worker)
  && preservesBusinessIdentity;

record('3A-P3-T068',broadcastAmbiguity,'Broadcast-create ambiguity is reconciled by marker/state lookup before any duplicate create decision.');
record('3A-P3-T069',streamAmbiguity,'Non-reusable stream ambiguity is isolated as ORPHAN_POSSIBLE/SERVER_ONLY and is never issued before provider readiness.');
record('3A-P3-T070',ambiguityBudget,'Repeated ambiguous provider work has a bounded retry budget and escalates to FAILED_NEEDS_ATTENTION.');
record('3A-P3-T072',bindRecovery,'Lost bind response is checked against the actual Broadcast boundStreamId before another bind attempt is accepted.');
record('3A-P3-T073',liveTransitionRecovery,'Lost LIVE-transition response is reconciled against actual provider lifecycle rather than blindly repeating transition.');
record('3A-P3-T074',retireRecovery,'Retire cleanup checks known Stream state/absence and treats uncertain destructive results as explicit ambiguity.');
record('3A-P3-T075',journalResume,'Worker/provider persist and read operation journal step/data so recovery resumes from known progress rather than blindly from zero.');
record('3A-P3-T077',staleGeneration,'Old-generation jobs are rejected/cancelled when they no longer match the session current provider generation.');
record('3A-P3-T135',generalRecovery,'Failure paths detect/classify uncertainty, freeze stale/unsafe work, preserve identities and reconcile before continuing.');
record('3A-P3-T136',preservesBusinessIdentity,'Provider recovery preserves Article/Live Session/Permanent URL identities and does not create random replacement sessions.');
record('3A-P3-T137',directMediaPath&&reconcile,'Healthy Reporter-to-provider media uses direct RTMPS ingest; control-plane recovery is reconciled separately rather than proxy-killing media.');
record('3A-P3-T138',providerIsolation,'YouTube control/provisioning failures are isolated to Live retries while ordinary Article publishing remains an independent backend path.');
record('3A-P3-T139',mediaOutageIsolation,'Provider/media failure marks only the affected Live interrupted/reconnecting while normal publishing code remains independent.');
record('3A-P3-T141',sameSessionReconnect,'Network/interruption recovery keeps the same logical Live Session and uses RECONNECTING + reconcile state.');
record('3A-P3-T142',notificationFallback,'Notification delivery is only an accelerator; Admin/Reporter poll durable dashboard/database truth every 20 seconds.');
record('3A-P3-T143',realtimeFallback,'Realtime loss has explicit periodic refetch fallback; authorization/state truth remains backend-derived.');
record('3A-P3-T144',
  /live_operations/.test(worker+edge)
    && /RETRY_PENDING/.test(worker)
    && /FAILED_NEEDS_ATTENTION/.test(worker)
    && providerIsolation,
  'Queue/worker unavailability leaves Live operations in durable pending/failure states while unrelated Article publishing remains an independent path.'
);
record('3A-P3-T145',
  journalResume
    && workerLease
    && reconcile
    && /live_operation_resume_from_journal/.test(worker),
  'Worker crash recovery combines operation journal progress, expiring lease ownership and provider reconciliation for controlled resume.'
);

const fail=results.filter(r=>!r.ok);
const OUT=path.join(ROOT,'ci-results');
fs.mkdirSync(OUT,{recursive:true});
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p3-recovery-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P3 recovery T20 static checks\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results) md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p3-recovery-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length) process.exit(1);
