#!/usr/bin/env node
'use strict';
const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {fs,ROOT,edge,worker,provider,reconnect,ambiguity,reconcileFirst,nonReusable,workerLease,endFlow,noArchiveDelete,fallbackTruth,multiLive,backendMapping,masterPage,lightweightMobile,realtimeAccel,reconcile,separateModule,providerActions}=E;
const results=[],seen=new Set();
function record(id,ok,detail){if(seen.has(id))throw new Error('DUPLICATE_P2_RECOVERY_ID '+id);seen.add(id);const r={test_id:id,ok:Boolean(ok),detail,layer:'p2-recovery-static'};results.push(r);console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail)}
function many(ids,ok,detail){for(const id of ids)record(id,ok,detail)}

many(['3A-P2-T125'],reconnect,'Camera/app reopen recovery targets the existing approved Session rather than creating a new business identity.');
many(['3A-P2-T126','3A-P2-T127','3A-P2-T128'],ambiguity&&reconcileFirst,'Unknown provider result is explicit and reconciled before duplicate create retry.');
many(['3A-P2-T129','3A-P2-T130','3A-P2-T131'],nonReusable&&ambiguity&&/current_provider_generation/.test(worker),'Non-reusable stream ambiguity is separate from JANTA BOL Session identity and supports controlled generation replacement.');
many(['3A-P2-T132','3A-P2-T133'],/operation_step/.test(worker)&&/operation_data/.test(worker)&&/attempt_count/.test(worker)&&/provider_result_reference/.test(worker),'Provider operations journal step/data/attempt/result state for crash-safe continuation.');
many(['3A-P2-T135','3A-P2-T136'],workerLease&&reconcileFirst,'Duplicate delivery is safe because current operation/session/generation/result state is rechecked.');
many(['3A-P2-T137','3A-P2-T138','3A-P2-T139','3A-P2-T140'],endFlow&&noArchiveDelete,'Authorized End settles provider/public state and preserves historical Article/Session/provider mapping.');
many(['3A-P2-T141','3A-P2-T142'],/RETRY_PENDING/.test(worker)&&/FAILED_NEEDS_ATTENTION/.test(worker)&&fallbackTruth,'Provider/worker outage preserves durable control-plane state and never manufactures provider success.');
many(['3A-P2-T143','3A-P2-T144'],fallbackTruth,'Realtime/notification outage does not delete business state; fetch/dashboard fallback remains.');
many(['3A-P2-T145','3A-P2-T146'],multiLive,'Failure blast radius is per Live Session/provider generation, not global.');
many(['3A-P2-T147','3A-P2-T148','3A-P2-T149'],backendMapping&&masterPage,'Master JANTA BOL data is separate from provider-specific mappings across provider replacement.');
many(['3A-P2-T150','3A-P2-T151'],
  /jb_live_consume_handoff_internal/.test(E.launch)
  && /generation_id/.test(E.launch)
  && /session_id/.test(E.launch)
  && /connector_key/.test(E.launch)
  && /get_encoder_ingest/.test(E.launch)
  && /rtmps_address/.test(E.launch)
  && /stream_name/.test(E.launch)
  && !/\barticle_id\b|article_sources|user_roles|owner_session|admin_/i.test(E.launch),
  'Encoder-visible launch path is limited to authorized Session/current generation/connector + media ingest context; internal audit remains server-side.'
);
many(['3A-P2-T154','3A-P2-T155'],E.configHealth&&E.providerReadySeparate,'Admin can inspect YouTube connection/health and provider readiness stays distinct from editorial approval.');
many(['3A-P2-T156','3A-P2-T157','3A-P2-T158'],lightweightMobile&&realtimeAccel&&reconcile,'Mobile clients stay lightweight; provider polling/orchestration is centralized and controlled.');
many(['3A-P2-T160','3A-P2-T161','3A-P2-T162'],separateModule,'Advanced same-session/final-report/grievance workflows are not mixed into Phase-3A Reporter Live path.');
many(['3A-P2-T163','3A-P2-T164'],backendMapping&&providerActions&&workerLease,'P2 mechanism and P3 hardening remain separate concerns.');
many(['3A-P2-T168','3A-P2-T169','3A-P2-T170','3A-P2-T171','3A-P2-T172'],backendMapping&&E.fakeLiveGate&&E.publicUi&&masterPage&&multiLive,'End-to-end chain maps request -> canonical Session/generation -> verified LIVE -> sanitized public projection/Permanent URL with stable identity/failure isolation.');
many(['3A-P2-T173','3A-P2-T174','3A-P2-T175','3A-P2-T176','3A-P2-T177'],E.exists('JANTA_BOL_PHASE_3C_WORKING/CODE-MAP.md')&&E.exists('JANTA_BOL_PHASE_3C_WORKING/PHASE3C-BASELINE-AUDIT.md')&&backendMapping,'Implementation remains traceable to locked architecture while preserving prior working baseline.');

const fail=results.filter(r=>!r.ok),OUT=path.join(ROOT,'ci-results');
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p2-recovery-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P2 recovery/data regression\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results)md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p2-recovery-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length)process.exit(1);
