/* Phase-4 B12 T081 rollback/cutover SAFE PLAN (no deploy, no DB operations).
 * Roll back build routing separately from data. Never overwrite the newer
 * Article ID/PURL, grievance, payment, provider, recovery or audit history.
 */
'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function createSafeRollbackPlan(x={}){
 const fail=code=>({state:'HOLD',code,operation_permitted:false,db_restore:false});
 if(x.project_id!=='prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI' ||
    x.repo!=='jantabol/JANTA-BOL-Website')return fail('WRONG_PROJECT_DENY');
 if(!/^[0-9a-f]{40}$/.test(x.current_git_sha||'') ||
    !/^[0-9a-f]{40}$/.test(x.baseline_git_sha||''))return fail('UNKNOWN_GIT_BASELINE');
 if(!/^dpl_[a-zA-Z0-9]{15,}$/.test(x.current_vercel_deployment||'') ||
    !/^dpl_[a-zA-Z0-9]{15,}$/.test(x.baseline_vercel_deployment||''))
  return fail('DEPLOYMENT_ID_UNVERIFIED');
 if(x.backup_restore_e8_verified!==true)return fail('E8_RECOVERY_NOT_VERIFIED');
 if(x.founder_aal2_approved!==true)return fail('FOUNDER_AUTHORITY_NOT_VERIFIED');
 if(x.captured_current_write_fence!==true)return fail('CURRENT_WRITERS_NOT_FENCED');
 if(!Array.isArray(x.changed_article_ids) ||
    x.changed_article_ids.some(id=>!UUID.test(id)))return fail('ARTICLE_IDS_UNVERIFIED');
 if(x.current_data_newer_than_baseline!==false)return fail('NEWER_PRODUCTION_DATA_AMBIGUOUS');
 if(x.verified_read_only_restore_identity!==true)return fail('RESTORE_IDENTITY_UNPROVEN');
 return Object.freeze({
  state:'PRECONDITIONS_RECORDED_FOR_FOUNDER_REVIEW',
  operation_permitted:false,db_restore:false,
  safe_action:'REVIEW_ONLY_VERCEL_ROUTING_ROLLBACK_PROPOSAL',
  data_rule:'NEVER_AUTOMATICALLY_OVERWRITE_NEWER_PRODUCTION_RECORDS',
  restore_rule:'EXPLICIT_SEPARATE_AUTHORIZED_RECOVERY_WORKFLOW_REQUIRED'
 });
}
module.exports={createSafeRollbackPlan};
