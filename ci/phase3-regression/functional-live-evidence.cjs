'use strict';
const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),OUT=path.join(ROOT,'ci-results');
fs.mkdirSync(OUT,{recursive:true});
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const results=[],seen=new Set();
function record(id,ok,detail){if(seen.has(id))throw new Error('DUPLICATE_FUNCTIONAL_ID '+id);seen.add(id);const r={test_id:id,ok:Boolean(ok),detail,layer:'functional-provider-static'};results.push(r);console.log((r.ok?'PASS':'FAIL')+' ['+id+'] '+detail)}
function many(ids,ok,detail){for(const id of ids)record(id,ok,detail)}

const reporter=read('JANTA_BOL_PHASE_3C_WORKING/reporter-live.html');
const admin=read('JANTA_BOL_PHASE_3C_WORKING/live.html');
const liveClient=read('JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js');
const website=read('JANTA_BOL_PHASE_3C_WORKING/website-v3.js');
const article=read('JANTA_BOL_PHASE_3C_WORKING/article.html');
const backend=read('JANTA_BOL_PHASE_3C_WORKING/backend-client.js');
const edge=read('CODEX_CURRENT_SUPABASE/functions/jb-live-api/index.ts');
const worker=read('CODEX_CURRENT_SUPABASE/functions/jb-live-worker/index.ts');
const provider=read('CODEX_CURRENT_SUPABASE/functions/jb-youtube-provider/index.ts');
const handoff=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-handoff/index.ts');
const launch=read('CODEX_CURRENT_SUPABASE/functions/jb-encoder-launch/index.ts');
const delivery=exists('JANTA_BOL_PHASE_3C_WORKING/phase3c-live-delivery.js')?read('JANTA_BOL_PHASE_3C_WORKING/phase3c-live-delivery.js'):'';
const admin3b=read('JANTA_BOL_PHASE_3C_WORKING/phase3b-admin-ui.js');
const reporter3b=read('JANTA_BOL_PHASE_3C_WORKING/phase3b-reporter-ui.js');

const mobileFirst=/meta name="viewport"/.test(reporter)&&/meta name="viewport"/.test(admin)&&/meta name="viewport"/.test(article)&&/@media/.test(reporter+admin+article+website);
const requestForm=/START A LIVE REQUEST/.test(reporter)&&/Event \/ Live Headline/.test(reporter)&&/Location/.test(reporter)&&/Short Description/.test(reporter)&&/Expected Duration/.test(reporter)&&/30 Minutes/.test(reporter)&&/1 Hour/.test(reporter)&&/2 Hours/.test(reporter);
const submitFlow=/SUBMIT LIVE REQUEST/.test(reporter)&&/JBLive\.submitRequest/.test(reporter)&&/Live Request Sent/.test(reporter)&&/Waiting for Super Admin approval/.test(reporter)&&/BACKEND_CONFIRMATION_MISSING/.test(reporter);
const offlineSafe=/localStorage\.setItem\(\s*DRAFT_KEY/.test(reporter)&&/restoreDraft/.test(reporter)&&/navigator\.onLine/.test(reporter)&&/OFFLINE \/ NOT SUBMITTED/.test(reporter)&&/false success nahi dikhaya jayega/.test(reporter);
const reporterSimple=/OPEN LIVE CAMERA|LIVE SHURU KAREIN/.test(reporter)&&!/Stream Key|Broadcast ID|RTMP server|YouTube Broadcast ID/.test(reporter)&&/prepareCamera/.test(liveClient)&&/handoff_url/.test(reporter);
const approvalUx=/LIVE APPROVED/.test(reporter)&&/Live Setup in Progress/.test(reporter)&&/Camera setup provider READY hone ke baad/.test(reporter)&&/Pending Live Requests/.test(admin)&&/approveRequest/.test(admin)&&/rejectRequest/.test(admin);
const fakeLiveGate=/operationType==="TRANSITION_LIVE"/.test(worker)&&/jb_live_activate_public_internal/.test(worker)&&/if\(p\.ok\)/.test(worker)&&/streamStatus!=="active"/.test(provider)&&/waiting_signal:true/.test(provider)&&/life!=="live"/.test(provider)&&/LIVE_TRANSITION_PENDING/.test(provider);
const providerReadySeparate=/session_status:"READY",public_status:"OFF"/.test(worker)&&/provider_state:"READY"/.test(provider)&&/WAITING_SIGNAL/.test(reporter+worker+edge);
const publicUi=/from\('public_live_feed'\)/.test(website)&&/v3-public-live-card/.test(website)&&/LIVE देखें/.test(website)&&/article\.html\?id=/.test(website)&&/permanent_url/.test(website)&&!/requireOwner|auth\.getUser/.test(website);
const masterPage=/Permanent Article ID/.test(article)&&/Headline\/correction update hone par ye identity same rahegi/.test(article)&&/youtube/.test(article.toLowerCase())&&/status!=='published'/.test(article);
const multiLive=/\.limit\(50\)/.test(website)&&/liveRows\.forEach/.test(website)&&/current_provider_generation/.test(edge+worker)&&/session_id/.test(provider)&&/generation_id/.test(provider)&&!/GLOBAL_STREAM_KEY|shared permanent.*key/i.test(edge+worker+provider);
const reconnect=/RECONNECTING/.test(reporter+worker+edge)&&/operationType==="RECONCILE_LIVE"/.test(worker)&&/jb_live_mark_interrupted_internal/.test(worker)&&/jb_live_activate_public_internal/.test(worker)&&/current_provider_generation/.test(worker);
const interruptionUi=/Live temporarily interrupted/.test(website)&&/TEMPORARILY_INTERRUPTED/.test(website)&&/INTERRUPTED/.test(website);
const endFlow=/reporter_end_live/.test(edge)&&/admin_end_live/.test(edge)&&/jb_live_request_end_internal/.test(edge)&&/operationType==="COMPLETE_LIVE"/.test(worker)&&/jb_live_finalize_end_internal/.test(worker)&&/operationType==="RETIRE_STREAM"/.test(worker);
const noArchiveDelete=!/videos\?id=.*DELETE|liveBroadcasts\?id=.*DELETE/i.test(provider)&&/retire_stream/.test(provider)&&/liveStreams\?id=/.test(provider);
const fallbackTruth=/subscribeNotifications/.test(reporter+admin)&&/setInterval/.test(reporter)&&/loadRequests/.test(reporter)&&/setInterval/.test(admin)&&/loadAll/.test(admin)&&/listPublishedPublic/.test(website+backend);
const separateModule=exists('JANTA_BOL_PHASE_3C_WORKING/phase3b-admin-ui.js')&&exists('JANTA_BOL_PHASE_3C_WORKING/phase3b-reporter-ui.js')&&!/DRONE/.test(reporter)&&!/Reporter Name|Force Stop|Priority/.test(reporter);
const providerActions=/action==="provision_generation"/.test(provider)&&/action==="get_state"/.test(provider)&&/action==="get_encoder_ingest"/.test(provider)&&/action==="transition_live"/.test(provider)&&/action==="complete_broadcast"/.test(provider)&&/action==="retire_stream"/.test(provider)&&/ACTION_NOT_ALLOWED/.test(provider);
const provisionFlow=/liveBroadcasts\?part=id,snippet,status,contentDetails/.test(provider)&&/liveStreams\?part=id,snippet,cdn,status,contentDetails/.test(provider)&&/liveBroadcasts\/bind/.test(provider)&&/BIND_CONFIRMED/.test(provider)&&/provider_state:"READY"/.test(provider);
const nonReusable=/isReusable:false/.test(provider)&&/JANTA BOL isolated non-reusable stream/.test(provider)&&!/reusable.*true/i.test(provider);
const transport=/rtmpsIngestionAddress/.test(provider)&&/rtmps:\/\//i.test(handoff+launch+provider);
const signalLive=/streamStatus!=="active"/.test(provider)&&/broadcastStatus=live/.test(provider)&&/getBroadcast/.test(provider)&&/life!=="live"/.test(provider)&&/jb_live_activate_public_internal/.test(worker);
const realtimeAccel=/postgres_changes/.test(liveClient)&&/subscribePublicLive/.test(liveClient)&&fallbackTruth;
const reconcile=/operationType==="RECONCILE_LIVE"/.test(worker)&&/provider\("get_state"\)/.test(worker)&&/jb_live_finalize_end_internal/.test(worker)&&/jb_live_activate_public_internal/.test(worker)&&/jb_live_mark_interrupted_internal/.test(worker);
const ambiguity=/PROVIDER_NETWORK_UNKNOWN/.test(provider)&&/ambiguous:true/.test(provider)&&/BROADCAST_CREATE_AMBIGUOUS/.test(provider)&&/STREAM_CREATE_AMBIGUOUS/.test(provider)&&/BIND_AMBIGUOUS/.test(provider)&&/LIVE_TRANSITION_AMBIGUOUS/.test(provider)&&/COMPLETE_AMBIGUOUS/.test(provider)&&/RETIRE_AMBIGUOUS|RETIRE_STATE_UNKNOWN/.test(provider);
const reconcileFirst=/findBroadcastByMarker/.test(provider)&&/findStreamByMarker/.test(provider)&&/BROADCAST_CREATE_CHECK/.test(provider)&&/STREAM_CREATE_CHECK/.test(provider)&&/BIND_CHECK/.test(provider)&&/savedOperationStep/.test(worker);
const ambiguityBudget=/maxAmbiguousAttempts=3/.test(worker)&&/AMBIGUOUS_RETRY_BUDGET_EXHAUSTED/.test(worker)&&/FAILED_NEEDS_ATTENTION/.test(worker);
const workerLease=/jb_live_claim_operation_internal/.test(worker)&&/lease_until/.test(worker)&&/attempt_count/.test(worker)&&/CANCELLED_STALE/.test(worker)&&/current_provider_generation/.test(worker);
const lightweightMobile=/JBLive\./.test(reporter)&&!/jb-youtube-provider|liveBroadcasts|liveStreams/.test(reporter)&&/JBLive\./.test(admin)&&!/liveBroadcasts|liveStreams/.test(admin);
const configHealth=/youtubeStatus/.test(liveClient)&&/connection_state/.test(edge)&&/verified_channel_id/.test(edge)&&/provider_health_status/.test(edge+worker+provider);
const backendMapping=/live_requests/.test(edge)&&/live_sessions/.test(edge+worker)&&/live_provider_generations/.test(edge+worker+provider)&&/live_operations/.test(edge+worker)&&/public_live_feed/.test(worker+website);

module.exports={fs,ROOT,read,exists,results,reporter,admin,liveClient,website,article,backend,edge,worker,provider,handoff,launch,delivery,admin3b,reporter3b,mobileFirst,requestForm,submitFlow,offlineSafe,reporterSimple,approvalUx,fakeLiveGate,providerReadySeparate,publicUi,masterPage,multiLive,reconnect,interruptionUi,endFlow,noArchiveDelete,fallbackTruth,separateModule,providerActions,provisionFlow,nonReusable,transport,signalLive,realtimeAccel,reconcile,ambiguity,reconcileFirst,ambiguityBudget,workerLease,lightweightMobile,configHealth,backendMapping};
