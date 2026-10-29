// JANTA BOL P4-T071 (RECOV-019..026), E1/E2/E5/E8 — fail-closed preflight.
// Does NOT inject faults into production, certify RPO/RTO or authorize T070/T071 LOCK.
const names=[
 ['social','OPTIONAL','CORE_CONTINUES'],
 ['analytics','OPTIONAL','CORE_CONTINUES'],
 ['notifications','AUXILIARY','COMMITTED_ACTION_STABLE'],
 ['grievance','PROTECTED','PRIVATE_ACTION_DENIED_ON_DEPENDENCY_FAILURE'],
 ['compliance','PROTECTED','PRIVATE_ACTION_DENIED_ON_DEPENDENCY_FAILURE'],
 ['advertising','PROTECTED','PAYMENT_AND_PUBLICATION_GUARD'],
 ['search','OPTIONAL','CORE_CONTINUES'],
 ['accountability','PROTECTED','PROTECTED_WRITE_FAILS_CLOSED'],
 ['live','PROTECTED','NO_FALSE_LIVE_STATE'],
 ['provider','EXTERNAL','UNKNOWN_MUST_WAIT'],
 ['payments','PROTECTED','AMBIGUOUS_MUST_NOT_GO_LIVE'],
 ['messaging','AUXILIARY','COMMITTED_ACTION_STABLE'],
 ['database','CRITICAL','NO_FALSE_COMMIT_SUCCESS']
];
export const FAULT_MATRIX=Object.freeze(names.map(([name,classification,expect])=>
 Object.freeze({name,classification,expect})));
const SHA=/^[a-f0-9]{64}$/;
const safe=obj=>obj && typeof obj==='object'&&!Array.isArray(obj);
export function assessT071FailureMatrix(e={}){
 const m=safe(e)?e:{};
 const items=FAULT_MATRIX.map(s=>{
  const p=safe(m[s.name])?m[s.name]:{};
  const shared=p.real_product_adapter_tested===true &&
    p.isolated_fault_injected===true &&
    p.actual_failure_logs_reviewed===true &&
    p.protected_production_untouched===true &&
    p.no_false_success===true &&
    p.old_core_regression_green===true &&
    SHA.test(p.source_sha256||'') && SHA.test(p.log_evidence_sha256||'');
  let domain=false;
  switch(s.expect){
   case 'CORE_CONTINUES':
    domain=p.article_read_remained_available===true &&
      p.article_publish_business_action_preserved===true;break;
   case 'COMMITTED_ACTION_STABLE':
    domain=p.business_commit_not_rolled_back===true &&
      p.delivery_failure_audited===true;break;
   case 'PRIVATE_ACTION_DENIED_ON_DEPENDENCY_FAILURE':
    domain=p.sensitive_write_denied===true && p.private_data_not_exposed===true;break;
   case 'PAYMENT_AND_PUBLICATION_GUARD':
    domain=p.uncertain_payment_not_auto_active===true &&
      p.ad_not_auto_published===true;break;
   case 'PROTECTED_WRITE_FAILS_CLOSED':
    domain=p.protected_write_denied===true&&p.audit_preserved===true;break;
   case 'NO_FALSE_LIVE_STATE':
    domain=p.live_command_not_claimed_success===true&&p.provider_retry_bounded===true;break;
   case 'UNKNOWN_MUST_WAIT':
    domain=p.provider_unknown_explicit===true&&p.no_provider_success_fabricated===true;break;
   case 'AMBIGUOUS_MUST_NOT_GO_LIVE':
    domain=p.payment_unknown_not_promoted===true&&p.no_duplicate_charge_or_action===true;break;
   case 'NO_FALSE_COMMIT_SUCCESS':
    domain=p.db_failed_write_not_claimed_committed===true &&
      p.safe_public_read_behavior_recorded===true;break;
  }
  return Object.freeze({name:s.name,expected:s.expect,
   state:shared&&domain?'CLAIM_REQUIRES_INDEPENDENT_REAL_LOG_AUDIT':'HOLD',
   class:s.classification});
 });
 const missing=items.filter(x=>x.state==='HOLD').map(x=>x.name);
 return Object.freeze({scope:'P4-T071_RECOV019_026',
  status:missing.length?'HOLD':'READY_FOR_INDEPENDENT_REAL_LOG_REVIEW',
  matrix_complete:false,missing,items,
  E1_source_scope:'JANTA_BOL_ONLY', E2_actual_fault_proof_required:true,
  E5_negative_log_proof_required:true,E8_independent_operational_review_required:true,
  final_pass:false,final_lock:false,soft_launch_release_authorized:false,
  note:'Even all true assertions are not verified. No production fault injection, no T070 override.'});
}
const stamp=x=>typeof x==='string'&&/Z$|[+-]\d\d:\d\d$/.test(x)&&Number.isFinite(Date.parse(x))?Date.parse(x):NaN;
export function assessRpoRto(e={}){
 const p=safe(e)?e:{};
 const failure=stamp(p.failure_at),point=stamp(p.last_verified_recovery_point_at),
       restored=stamp(p.real_service_restored_at);
 const chronological=Number.isFinite(failure)&&Number.isFinite(point)&&Number.isFinite(restored)&&
   point<=failure&&restored>=failure;
 const measured=p.real_service_recovery_observed===true &&
   p.same_system_source_and_restore===true &&
   p.no_untracked_write_loss_proven===true &&
   p.independent_measurement_reviewed===true;
 const elapsed=chronological&&measured;
 const rpoMs=elapsed?failure-point:null, rtoMs=elapsed?restored-failure:null;
 const targetSet=Number.isFinite(p.rpo_target_ms)&&p.rpo_target_ms>=0 &&
   Number.isFinite(p.rto_target_ms)&&p.rto_target_ms>=0;
 return Object.freeze({
  status:!elapsed?'HOLD':!targetSet?'NO_APPROVED_RPO_RTO_TARGETS':'OBSERVED_REQUIRES_FOUNDER_REVIEW',
  rpo_ms:rpoMs,rto_ms:rtoMs,
  target_comparison:!targetSet||!elapsed?'NOT_ESTABLISHED':
    (rpoMs<=p.rpo_target_ms&&rtoMs<=p.rto_target_ms?'WITHIN_STATED_TARGETS_NEEDS_AUDIT':'EXCEEDS_STATED_TARGETS'),
  final_pass:false,
  note:'13m58s backup/test workflow duration is NOT actual production RTO or RPO.'});
}
export function inspectReleaseSource(html,js){
 if(typeof html!=='string'||typeof js!=='string')return Object.freeze({status:'HOLD_UNKNOWN_SOURCE'});
 const hasStaticPotentiallyUnverifiedClaims=html.includes('शिवपुरी अस्पताल में भ्रष्टाचार का आरोप')||
   html.includes('पिछोर में भारी बारिश से कई रास्ते बंद');
 const staticLiveBadge=/class="live-badge"/.test(html);
 const clientBackendCalls=(js.match(/\bfetch\s*\(/g)||[]).length;
 return Object.freeze({scope:'REPOSITORY_STATIC_FILES_ONLY_NOT_DEPLOYMENT',
  static_news_copy_present:hasStaticPotentiallyUnverifiedClaims,
  static_live_badge:staticLiveBadge,client_fetch_calls_detected:clientBackendCalls,
  actual_vercel_source_mapping_verified:false,
  production_public_article_lifecycle_proven:false,
  status:hasStaticPotentiallyUnverifiedClaims?'SOFT_LAUNCH_EDITORIAL_VERIFICATION_REQUIRED':'PRODUCTION_MAPPING_STILL_REQUIRED'});
}
