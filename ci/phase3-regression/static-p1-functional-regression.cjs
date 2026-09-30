#!/usr/bin/env node
'use strict';
const path=require('path');
const E=require('./functional-live-evidence.cjs');
const {fs,ROOT,reporter,admin,mobileFirst,requestForm,submitFlow,offlineSafe,reporterSimple,approvalUx,fakeLiveGate,providerReadySeparate,publicUi,masterPage,multiLive,reconnect,interruptionUi,endFlow,noArchiveDelete,fallbackTruth,separateModule,backendMapping}=E;
const results=[],seen=new Set();
function record(id,ok,detail){if(seen.has(id))throw new Error('DUPLICATE_P1_ID '+id);seen.add(id);const r={test_id:id,ok:Boolean(ok),detail,layer:'p1-functional-static'};results.push(r);console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail)}
function many(ids,ok,detail){for(const id of ids)record(id,ok,detail)}

many(['3A-P1-T003'],mobileFirst,'Reporter/Admin/viewer surfaces are viewport-responsive and mobile-first without a desktop-only dependency.');
many(['3A-P1-T006'],publicUi&&backendMapping,'Public Viewer and internal backend/provider actors exist as separate operational surfaces.');
many(['3A-P1-T009','3A-P1-T010','3A-P1-T011','3A-P1-T012'],requestForm&&!/Stream Key|Broadcast ID/.test(reporter),'Reporter Live screen contains required field-friendly request inputs and duration presets without provider jargon.');
many(['3A-P1-T016','3A-P1-T017'],submitFlow,'Request submission reports success only after backend confirmation and then shows Waiting for Super Admin approval.');
many(['3A-P1-T020','3A-P1-T021'],offlineSafe,'Request draft survives offline/network failure and false submitted success is explicitly prevented.');
many(['3A-P1-T034','3A-P1-T035'],masterPage&&multiLive,'Live keeps canonical Article/Permanent URL identity separate from replaceable provider generation identity.');
many(['3A-P1-T036'],approvalUx,'Approved Reporter state exposes LIVE APPROVED and Open Live Camera path.');
many(['3A-P1-T037','3A-P1-T039'],reporterSimple,'Reporter launches authorized camera handoff without manually entering provider IDs/RTMP credentials.');
many(['3A-P1-T043','3A-P1-T044'],reporterSimple&&/openCamera\(/.test(reporter),'Approved flow exposes a deliberate Open Live Camera action before encoder Start while security gates remain separate.');
many(['3A-P1-T045','3A-P1-T046','3A-P1-T047','3A-P1-T048','3A-P1-T049','3A-P1-T050'],fakeLiveGate&&providerReadySeparate,'Approval/READY/Reporter Start are not public LIVE; public LIVE waits for provider signal and lifecycle confirmation.');
many(['3A-P1-T051','3A-P1-T052','3A-P1-T053','3A-P1-T054','3A-P1-T055','3A-P1-T056'],publicUi&&masterPage,'Public Live is discoverable without JANTA BOL login and routes to canonical JANTA BOL page rather than provider URL as master identity.');
many(['3A-P1-T057','3A-P1-T058','3A-P1-T059','3A-P1-T060','3A-P1-T061'],multiLive,'Multiple independent Live records keep per-session provider/generation identity instead of one global stream state.');
many(['3A-P1-T062','3A-P1-T063','3A-P1-T064','3A-P1-T065'],reconnect&&interruptionUi,'Temporary interruption preserves same Session/generation path and reconciles back to LIVE instead of recreating identity.');
many(['3A-P1-T066','3A-P1-T067','3A-P1-T068'],endFlow&&noArchiveDelete,'Safe technical End removes public LIVE, starts cleanup and avoids unnecessary replay/archive deletion.');
many(['3A-P1-T069'],requestForm&&submitFlow,'Reporter request is one compact form plus submit rather than provider configuration workflow.');
many(['3A-P1-T070'],/approveRequest/.test(admin)&&/Pending Live Requests/.test(admin),'Admin approval is directly available from pending request review.');
many(['3A-P1-T071'],reporterSimple,'Post-approval Reporter path is compact Open Live Camera handoff followed by encoder Start.');
many(['3A-P1-T072'],publicUi,'Viewer discovery links directly from a Live card to canonical watch/article page.');
many(['3A-P1-T075'],fallbackTruth,'Realtime is an accelerator only; canonical fetch remains recovery path.');
many(['3A-P1-T076','3A-P1-T077'],backendMapping&&fallbackTruth,'Live/provider problems remain isolated from normal article feed/backend path.');
many(['3A-P1-T079','3A-P1-T080','3A-P1-T081','3A-P1-T082','3A-P1-T083','3A-P1-T084','3A-P1-T085','3A-P1-T086'],separateModule,'Advanced Phase-3B operations are isolated from Phase-3A Reporter UI and Drone is not exposed there.');
many(['3A-P1-T090'],masterPage&&backendMapping,'JANTA BOL Article/Session identities remain canonical while YouTube/provider IDs are technical mappings.');

const fail=results.filter(r=>!r.ok),OUT=path.join(ROOT,'ci-results');
const payload={generated_at:new Date().toISOString(),checks:results.length,pass:results.length-fail.length,fail:fail.length,results};
fs.writeFileSync(path.join(OUT,'static-p1-functional-results.json'),JSON.stringify(payload,null,2));
let md='# Phase 3A P1 functional regression\n\n';
md+='Exact register checks: **'+payload.checks+'**  PASS: **'+payload.pass+'**  FAIL: **'+payload.fail+'**\n\n';
for(const r of results)md+='- '+(r.ok?'✅':'❌')+' **'+r.test_id+'** — '+r.detail+'\n';
fs.writeFileSync(path.join(OUT,'static-p1-functional-summary.md'),md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+md);
if(fail.length)process.exit(1);
