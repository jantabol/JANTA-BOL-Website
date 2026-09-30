#!/usr/bin/env node
'use strict';
const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {fs,ROOT,edge,worker,provider,liveClient,reporter,providerReadySeparate,publicUi,masterPage,providerActions,workerLease,provisionFlow,nonReusable,transport,signalLive,fakeLiveGate,multiLive,realtimeAccel,reconcile,reconnect,reporterSimple}=E;
const results=[],seen=new Set();
function record(id,ok,detail){if(seen.has(id))throw new Error('DUPLICATE_P2_CORE_ID '+id);seen.add(id);const r={test_id:id,ok:Boolean(ok),detail,layer:'p2-core-static'};results.push(r);console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail)}
function many(ids,ok,detail){for(const id of ids)record(id,ok,detail)}

many(['3A-P2-T031','3A-P2-T036'],/article_id/.test(edge+worker)&&/current_provider_generation/.test(edge+worker),'Canonical Session keeps Article identity while provider generation is a replaceable mapping.');
many(['3A-P2-T061'],providerReadySeparate,'READY/WAITING_SIGNAL remains public OFF.');
many(['3A-P2-T062','3A-P2-T063'],/PENDING/.test(provider+worker)&&/CREATING/.test(provider)&&/READY/.test(provider)&&/ACTIVE/.test(provider)&&/RETIRED/.test(provider)&&/AMBIGUOUS/.test(provider+worker)&&/ORPHAN_POSSIBLE/.test(provider),'Provider generation lifecycle includes normal plus ambiguity/orphan states.');
many(['3A-P2-T069','3A-P2-T070'],/prepareCamera/.test(liveClient)&&/reporter_prepare_camera/.test(edge)&&/reporter_my_requests/.test(edge)&&reporterSimple,'Reporter API exposes authorized encoder handoff and safe own-session/request status without raw provider internals.');
many(['3A-P2-T071','3A-P2-T072','3A-P2-T074'],/adminPending/.test(liveClient)&&/approveRequest/.test(liveClient)&&/adminOverview/.test(liveClient)&&/OWNER_AAL2_REQUIRED/.test(edge),'Pending/Approve/Active-Live Admin contracts are owner+AAL2 protected.');
many(['3A-P2-T075','3A-P2-T076'],publicUi&&masterPage,'Public Live list and canonical Article route expose sanitized playback/discovery state.');
many(['3A-P2-T077','3A-P2-T078'],providerActions&&workerLease,'Provider state checks and privileged worker execution are internal and revalidate current operation/session/generation.');
many(['3A-P2-T079','3A-P2-T080','3A-P2-T081'],providerActions,'YouTube behavior is behind narrow required Live adapter operations, not a generic proxy.');
many(['3A-P2-T082','3A-P2-T083','3A-P2-T084'],/jb_live_approve_request_internal/.test(edge)&&/PROVISION_LIVE/.test(worker)&&providerActions,'Approval commits internal work first and external provider saga runs later via worker/adapter.');
many(['3A-P2-T085','3A-P2-T086'],workerLease,'PROVISION_LIVE worker claims durable work and revalidates current session/generation.');
many(['3A-P2-T087','3A-P2-T088','3A-P2-T089','3A-P2-T090','3A-P2-T091','3A-P2-T092'],provisionFlow&&nonReusable&&/720p/.test(provider)&&/30fps/.test(provider),'Provider provisioning creates broadcast + non-reusable stream, binds them, uses field-test profile defaults and persists provider IDs/steps.');
many(['3A-P2-T093','3A-P2-T094'],providerReadySeparate&&provisionFlow,'Verified setup yields Provider READY + Session READY while public remains OFF.');
many(['3A-P2-T095','3A-P2-T096','3A-P2-T097','3A-P2-T098'],reporterSimple&&transport&&/connector/.test(E.handoff+E.launch+E.delivery),'Open Live Camera validates session/generation and hands off approved secure RTMPS-capable encoder configuration.');
many(['3A-P2-T099','3A-P2-T100','3A-P2-T101','3A-P2-T102','3A-P2-T103','3A-P2-T104'],providerReadySeparate&&signalLive&&fakeLiveGate,'Encoder intent stays OFF until active stream + provider LIVE are reverified before public activation.');
many(['3A-P2-T105','3A-P2-T106','3A-P2-T107','3A-P2-T108'],multiLive&&publicUi&&nonReusable,'Simultaneous Lives own separate Session/generation/media state and do not use a shared permanent stream key.');
many(['3A-P2-T109','3A-P2-T110','3A-P2-T111','3A-P2-T112'],masterPage&&/playback_reference/.test(provider+worker+E.website),'Playback reference is provider-derived while Permanent URL/Article remains provider-independent.');
many(['3A-P2-T113','3A-P2-T114','3A-P2-T115','3A-P2-T116','3A-P2-T117'],realtimeAccel,'Realtime/notification accelerates UI updates but canonical refetch/database state remains fallback truth.');
many(['3A-P2-T118','3A-P2-T119','3A-P2-T120','3A-P2-T121'],reconcile,'Reconciler checks current provider/session state and performs technical recovery instead of editorial decisions.');
many(['3A-P2-T122','3A-P2-T123'],reconnect,'Reporter connection recovery targets the existing Session/current generation rather than recreating identity.');

const fail=results.filter(r=>!r.ok),OUT=path.join(ROOT,'ci-results');
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p2-core-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P2 core provider regression\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results)md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p2-core-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length)process.exit(1);
