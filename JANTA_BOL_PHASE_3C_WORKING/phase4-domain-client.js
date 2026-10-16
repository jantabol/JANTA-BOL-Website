(function(g){'use strict';
const b=()=>g.JBBackend,c=()=>{if(!b()?.client)throw Error('BACKEND_NOT_READY');return b().client},owner=()=>b().requireOwner();
async function rpc(n,a){const {data,error}=await c().rpc(n,a||{});if(error)throw error;return data}
async function grievanceRows(status=''){await owner();let q=c().from('grievances').select('*').order('created_at',{ascending:false});if(status)q=q.eq('status',status);const {data,error}=await q;if(error)throw error;return data||[]}
const grievanceTransition=(id,status,note='')=>rpc('jb_grievance_transition_internal',{p_id:id,p_status:status,p_note:note});
const grievanceReopen=(id,note)=>rpc('jb_grievance_reopen_internal',{p_id:id,p_note:note});
const grievanceDuplicate=(id,original,note='')=>rpc('jb_grievance_link_duplicate_internal',{p_id:id,p_original:original,p_note:note});
const grievanceIssueAdd=(id,text)=>rpc('jb_grievance_add_issue_internal',{p_grievance:id,p_issue:text});
async function grievanceHistory(id){await owner();const {data,error}=await c().from('grievance_history').select('*').eq('grievance_id',id).order('created_at');if(error)throw error;return data||[]}
async function complianceRows(){await owner();const {data,error}=await c().from('compliance_tasks').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[]}
const complianceMonth=m=>rpc('jb_compliance_generate_month_internal',{p_month:m});
const complianceApproveMonth=(m,summary)=>rpc('jb_compliance_approve_month_internal',{p_month:m,p_summary:summary||'',p_publish:false});
const complianceTransition=(id,status,ack='')=>rpc('jb_compliance_transition_internal',{p_id:id,p_status:status,p_ack:ack||null});
const publicAdRequest=x=>rpc('jb_ad_public_request',{p_name:x.name,p_contact:x.contact,p_package:x.package||null,p_placement:x.placement||'homepage',p_scope:x.scope||'global',p_risk:x.risk||'normal',p_kind:x.kind||'standard'});
const publicAdPackages=()=>rpc('jb_ad_public_packages',{});
async function adPackages(){
 await owner();
 const {data,error}=await c().from('ad_packages')
  .select('id,name,placement,price_minor,currency,duration_days,weight,active,version')
  .order('name',{ascending:true});
 if(error)throw error;
 // Actual zero inventory is an [] response, NOT null (failed/missing
 // backend result). A malformed Owner record cannot become a priced offer.
 if(!Array.isArray(data)||!data.every(p=>p&&typeof p==='object'&&
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(p.id||''))&&
   typeof p.name==='string'&&p.name.trim().length>=2&&
   ['homepage','article'].includes(p.placement)&&
   Number.isSafeInteger(p.price_minor)&&p.price_minor>0&&
   p.currency==='INR'&&Number.isSafeInteger(p.duration_days)&&p.duration_days>=1&&
   Number.isSafeInteger(p.weight)&&p.weight>=1&&p.weight<=100&&
   Number.isSafeInteger(p.version)&&p.version>=1&&
   typeof p.active==='boolean'))
  throw Error('B7_OWNER_PACKAGE_RESPONSE_INVALID');
 return data;
}
async function adSavePackage(x){
 await owner();
 const name=String(x?.name||'').trim(),placement=String(x?.placement||'');
 if(x?.priceMinor===''||x?.durationDays===''||x?.weight==='')throw Error('INVALID_PACKAGE');
 const price=Number(x?.priceMinor),duration=Number(x?.durationDays),weight=Number(x?.weight);
 if(name.length<2||name.length>200||!['homepage','article'].includes(placement)||!Number.isSafeInteger(price)||price<=0||!Number.isSafeInteger(duration)||duration<1||!Number.isSafeInteger(weight)||weight<1||weight>100)throw Error('INVALID_PACKAGE');
 const id=x?.id||null;
 if(id!==null&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error('INVALID_PACKAGE_ID');
 return rpc('jb_ad_save_package_internal',{p_id:id,p_name:name,p_placement:placement,p_price:price,p_duration:duration,p_weight:weight});
}
async function adRows(){await owner();const {data,error}=await c().from('ad_campaigns').select('*,advertisers(name,contact,verification_state,risk_level),ad_creatives(*)').order('created_at',{ascending:false});if(error)throw error;return data||[]}
async function adVerifyAdvertiser(id,state,note,evidence){
 await owner();
 if(!id||!['verified','rejected','pending'].includes(state)||String(note||'').trim().length<8)
   throw Error('INVALID_VERIFICATION_DECISION');
 return rpc('jb_ad_verify_advertiser_internal',{
   p_advertiser:id,p_state:state,p_note:String(note).trim(),p_evidence_ref:String(evidence||'').trim()||null
 });
}
// Fail closed: an unavailable or corrupt Owner RPC is NOT a zero-item queue.
// Existing private B3, ad_renewal_requests and ad_change_requests remain
// canonical single homes. No browser fallback or new authority.
const ownerUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validatedOwnerQueue(rows,kind){
 if(!Array.isArray(rows))throw Error('B7_OWNER_QUEUE_INVALID_RESPONSE');
 for(const row of rows){
  if(!row||typeof row!=='object'||Array.isArray(row))
   throw Error('B7_OWNER_QUEUE_INVALID_RESPONSE');
  if(kind==='notification'){
   if(!Number.isSafeInteger(Number(row.audit_id))||Number(row.audit_id)<=0||
      !ownerUuid.test(String(row.record_id||'')))
    throw Error('B7_OWNER_QUEUE_INVALID_RESPONSE');
  }else if(!ownerUuid.test(String(row.id||''))||
            !ownerUuid.test(String(row.campaign_id||'')))
   throw Error('B7_OWNER_QUEUE_INVALID_RESPONSE');
 }
 return rows;
}
async function adNotificationFailures(){
 await owner();
 const rows=await rpc('jb_ad_notification_failures_internal',{});
 return validatedOwnerQueue(rows,'notification');
}
async function adRetryNotification(auditId){
 await owner();
 const id=Number(auditId);
 if(!Number.isSafeInteger(id)||id<=0)
  throw Error('INVALID_NOTIFICATION_FAILURE_REFERENCE');
 return rpc('jb_ad_notification_retry_internal',{p_failure_audit_id:id});
}
async function adQualifiedAnalytics(id){
 await owner();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||'')))
  throw Error('INVALID_CAMPAIGN_ID');
 const data=await rpc('jb_ad_qualified_analytics_internal',{p_campaign:id});
 if(!data||typeof data!=='object'||Array.isArray(data)||
  data.reach_type!=='client_reported_estimate_not_unique_people'||
  data.anti_bot_verified!==false||
  !['today','d7','d30','total','unverified_legacy'].every(k=>
    typeof data[k]==='number'&&Number.isSafeInteger(data[k])&&data[k]>=0)||
  data.today>data.d7||data.d7>data.d30||data.d30>data.total)
  throw Error('QUALIFIED_ANALYTICS_NOT_AVAILABLE');
 return data;
}
async function adRenewalRequests(){
 await owner();
 const rows=await rpc('jb_ad_owner_renewals_internal',{});
 return validatedOwnerQueue(rows,'renewal');
}
async function adChangeRequests(){
 await owner();
 const rows=await rpc('jb_ad_owner_change_requests_internal',{});
 return validatedOwnerQueue(rows,'change');
}
async function adDecideChange(id,decision,note){
 await owner();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||''))||
   !['accepted_for_work','rejected'].includes(decision)||
   String(note||'').trim().length<8)
   throw Error('INVALID_CHANGE_DECISION');
 return rpc('jb_ad_decide_change_request_internal',{
   p_request:id,p_decision:decision,p_note:String(note).trim()
 });
}
async function adIssuePortal(id){
 await owner();
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id)))
  throw Error('INVALID_CAMPAIGN_ID');
 // Rollout fail-closed: old production B7 still lets an advertiser submit
 // photo/video through the legacy RPC. NEVER issue credentials against it.
 // This Owner-only staging readiness RPC ships atomically with the new
 // backend text-request-only policy, and does not write data.
 const ready=await rpc('jb_ad_owner_change_requests_internal',{});
 if(!Array.isArray(ready))throw Error('B7_SAFE_PORTAL_BACKEND_REQUIRED');
 return rpc('jb_ad_issue_portal_internal',{p_campaign:id});
}
async function adTransition(id,status,note=''){
 // LIVE/positive promotion is forbidden against legacy backend: its RPC
 // checks an old payment flag but not safe current media/quote/inventory.
 // Founder emergency HIDE/PAUSE/REJECT remains available.
 await owner();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||'')))
  throw Error('INVALID_CAMPAIGN_ID');
 if(['approved','payment_pending','live'].includes(status)){
  let capability;
  try{capability=await rpc('jb_ad_lifecycle_capability_internal',{});}
  catch(_){throw Error('B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED');}
  if(capability!=='B7_LIFECYCLE_PROTECTED_V1')
   throw Error('B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED');
 }
 return rpc('jb_ad_transition_internal',{p_id:id,p_status:status,p_note:note});
}
/* T036 ADS-023 — DRAFT bridge only, NOT used by existing Admin UI.
 * On missing backend RPC this fails closed; never fall back to an unsafe
 * duplicate-write and NEVER treats LIVE as a safety-only transition. */
async function adSafetyTransitionIdempotent(id,status,note=''){
 await owner();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||'')))
  throw Error('INVALID_CAMPAIGN_ID');
 if(!['paused','hidden','expired','rejected','cancelled'].includes(status))
  throw Error('T036_CP02_SAFETY_ONLY');
 return rpc('jb_ad_safety_transition_idempotent_internal',{
  p_id:id,p_status:status,p_note:String(note||'').slice(0,2000)
 });
}
// B7 draft/approval MUST be deployed atomically with its reviewed backend.
 // The old LIVE creative-save RPC auto-approves; never call it when the
 // Owner-only backend capability sentinel is absent or wrong.
 const adId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}[0-9a-f]{8}$/i.test(String(id||''));
 async function creativeDraftCapability(){
  await owner();
  let capability;
  try{capability=await rpc('jb_ad_creative_workflow_capability_internal',{});}
  catch(_){throw Error('B7_TWO_STAGE_CREATIVE_BACKEND_NOT_DEPLOYED');}
  if(capability!=='B7_DRAFT_THEN_EXPLICIT_APPROVE_V1')
   throw Error('B7_TWO_STAGE_CREATIVE_BACKEND_NOT_DEPLOYED');
 }
 async function adCreative(id,x){
  if(!adId(id)||!x||!['image','video','text'].includes(x.type))
   throw Error('INVALID_CREATIVE_DRAFT');
  await creativeDraftCapability();
  return rpc('jb_ad_save_creative_internal',{
   p_campaign:id,p_type:x.type,p_media:x.media||null,p_text:x.text||null,
   p_cta_type:x.ctaType||null,p_cta_target:x.ctaTarget||null
  });
 }
 async function adApproveCreative(id){
  if(!adId(id))throw Error('INVALID_CREATIVE_ID');
  await creativeDraftCapability();
  return rpc('jb_ad_approve_creative_internal',{p_creative:id});
 }
async function adConfirmPayment(){
 // Preserve exported API shape for old callers, but NEVER issue the legacy
 // production RPC which marks payment CONFIRMED without verified receipt,
 // consent, agreed quotation and independent Owner bank-ledger evidence.
 // The only Owner UI path is the explicit adConfirmManualPayment form,
 // whose server-side evidence trigger is REVIEW_ONLY until safe rollout.
 await owner();
 throw Error('B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE');
}
function scheduleInstant(value){
 const text=typeof value==='string'?value.trim():'';
 const parts=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(text);
 if(!parts)throw Error('INVALID_SCHEDULE');
 const [year,month,day,hour,minute,second]=parts.slice(1,7).map(v=>Number(v||0));
 const date=new Date(text),lastDay=new Date(Date.UTC(year,month,0)).getUTCDate();
 if(!Number.isFinite(date.getTime())||month<1||month>12||day<1||day>lastDay||hour>23||minute>59||second>59)throw Error('INVALID_SCHEDULE');
 // datetime-local has no offset: interpret it in the device zone, then send UTC.
 // Reject nonexistent local times rather than silently moving a campaign start.
 if(!parts[8]&&(date.getFullYear()!==year||date.getMonth()+1!==month||date.getDate()!==day||date.getHours()!==hour||date.getMinutes()!==minute||date.getSeconds()!==second))throw Error('INVALID_SCHEDULE');
 return date.toISOString();
}

async function adSetApprovedQuote(id,amount,termsRef){
 await owner();
 if(amount===''||!Number.isSafeInteger(Number(amount))||Number(amount)<=0||
    String(termsRef||'').trim().length<8||!id)throw Error('INVALID_QUOTE_TERMS');
 return rpc('jb_ad_set_approved_quote_internal',{
  p_campaign:id,p_price_minor:Number(amount),p_terms_ref:String(termsRef).trim()
 });
}
async function adConfirmManualPayment(id,x){
 await owner();
 const amount=Number(x?.amountMinor),method=String(x?.method||'').trim().toLowerCase();
 const ref=String(x?.reference||'').trim(),evidence=String(x?.evidenceRef||'').trim();
 const consent=String(x?.acceptanceRef||'').trim(),note=String(x?.verificationNote||'').trim();
 if(!id||String(x?.confirm||'')!=='CONFIRM'||x?.amountMinor===''||
    !Number.isSafeInteger(amount)||amount<=0||
    !['upi','bank','cash'].includes(method)||ref.length<8||ref.length>120||
    evidence.length<8||consent.length<8||note.length<10)
   throw Error('MANUAL_PAYMENT_EVIDENCE_REQUIRED');
 let receivedAt,acceptedAt;
 try{receivedAt=scheduleInstant(x?.receiptAt);acceptedAt=scheduleInstant(x?.acceptedAt);}
 catch(_){throw Error('INVALID_PAYMENT_TIMESTAMP');}
 if(Date.parse(acceptedAt)>Date.parse(receivedAt)||Date.parse(receivedAt)>Date.now())
   throw Error('INVALID_PAYMENT_TIMESTAMP');
 return rpc('jb_ad_confirm_manual_payment_internal',{
  p_campaign:id,p_reference:ref,p_amount_minor:amount,p_method:method,
  p_receipt_at:receivedAt,p_evidence_ref:evidence,p_acceptance_ref:consent,
  p_terms_accepted_at:acceptedAt,p_verification_note:note,
  p_confirm:'CONFIRM'
 });
}
async function adSchedule(id,start,end){
 const startsAt=scheduleInstant(start),endsAt=scheduleInstant(end);
 if(Date.parse(endsAt)<=Date.parse(startsAt))throw Error('INVALID_SCHEDULE');
 return rpc('jb_ad_schedule_internal',{p_campaign:id,p_starts_at:startsAt,p_ends_at:endsAt});
}
g.JBPhase4={grievanceRows,grievanceTransition,grievanceReopen,grievanceDuplicate,grievanceIssueAdd,grievanceHistory,complianceRows,complianceMonth,complianceApproveMonth,complianceTransition,publicAdRequest,publicAdPackages,adPackages,adSavePackage,adRows,adVerifyAdvertiser,adNotificationFailures,adRetryNotification,adQualifiedAnalytics,adRenewalRequests,adChangeRequests,adDecideChange,adIssuePortal,adTransition,adSafetyTransitionIdempotent,adCreative,adApproveCreative,adConfirmPayment,adSetApprovedQuote,adConfirmManualPayment,adSchedule};
})(window);
