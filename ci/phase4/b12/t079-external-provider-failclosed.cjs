/* Phase-4 B12/T079: Provider availability classification; NEVER a parallel publish authority.
 * This module describes optional adapters. It deliberately never calls payment
 * or social providers unless separately implemented and independently approved.
 */
'use strict';
const OPTIONS=Object.freeze({
 social:{required:false,source:'existing social_distribution domain',configured:false},
 ads_payment:{required:false,source:'existing B7 Owner-only payment authority',configured:false},
 advertiser_messaging:{required:false,source:'existing B7 secure message routing',configured:false},
 notifications:{required:false,source:'existing unified B3 notification domain',configured:false}
});
function summarize(overrides={}){
 const statuses={};
 for(const [name,item] of Object.entries(OPTIONS)){
  const v=overrides[name];
  if(v!==undefined && typeof v!=='boolean')throw Error('B12_INVALID_PROVIDER_STATE');
  statuses[name]={
   status:v===true?'PROVIDER_AVAILABLE_NOT_E2E_TESTED':'NOT_AVAILABLE_DUE_CANDIDATE',
   ownership:item.source,canonical_publishing_dependent:false
  };
 }
 return Object.freeze(statuses);
}
function requireExplicitProviderEvidence(name,proof){
 if(!(name in OPTIONS))throw Error('B12_UNKNOWN_PROVIDER_DENY');
 if(!proof || proof.approved_by_founder!==true ||
    typeof proof.run_id!=='string' || !/^\d{7,18}$/.test(proof.run_id) ||
    proof.production_verified!==true)throw Error('B12_PROVIDER_E6_HOLD');
 // The only output is a classification; this function never executes an
 // external effect or changes canonical business/publishing state.
 return {provider:name,status:'E6_RECORDED_NOT_P4_T079_PASS'};
}
module.exports={OPTIONS,summarize,requireExplicitProviderEvidence};

/* Provider account preparation is metadata-only. No OAuth flow, token read,
 * provider API mutation or positive "Posted/SENT/PAID" may occur here.
 * Post-account real E2/E6 must be recorded by an independent E2E run.
 */
const SOCIAL_CHANNELS=Object.freeze(['facebook','instagram','whatsapp','youtube']);
function socialAccountReadiness(channel,facts={}){
 if(!SOCIAL_CHANNELS.includes(channel))throw Error('B12_UNKNOWN_SOCIAL_CHANNEL_DENY');
 if(!facts || typeof facts!=='object' || Array.isArray(facts))throw Error('B12_INVALID_SOCIAL_ACCOUNT_METADATA');
 const fields=['account_exists','founder_controls_account','provider_permissions_approved','server_only_token_storage','production_callback_verified'];
 if(Object.keys(facts).some(k=>!fields.includes(k)))throw Error('B12_UNKNOWN_SOCIAL_ACCOUNT_METADATA_DENY');
 for(const field of fields)if(facts[field]!==undefined && typeof facts[field]!=='boolean')
  throw Error('B12_INVALID_SOCIAL_ACCOUNT_METADATA');
 const missing=fields.filter(k=>facts[k]!==true);
 return Object.freeze({
  channel,
  state:missing.length?'ACCOUNT_OR_APPROVAL_DUE':'REAL_PROVIDER_E2E_DUE',
  missing:Object.freeze(missing),
  confirmed_posted:false,
  canonical_publishing_dependent:false,
  credentials_requested_in_chat:false
 });
}
module.exports.SOCIAL_CHANNELS=SOCIAL_CHANNELS;
module.exports.socialAccountReadiness=socialAccountReadiness;
