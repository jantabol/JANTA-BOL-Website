(function(global){
'use strict';

function backend(){
  if(!global.JBBackend?.client)throw new Error('BACKEND_NOT_READY');
  return global.JBBackend;
}
async function api(action,payload={}){
  const {data,error}=await backend().client.functions.invoke('jb-records-api',{body:{action,payload}});
  if(error)throw new Error(error.message||'RECORDS_API_UNAVAILABLE');
  if(!data?.ok)throw new Error(data?.error||'RECORDS_API_FAILED');
  return data;
}
async function ensureRecentMfaInteractive(){
  try{
    await backend().requireRecentMfa(600);
    return true;
  }catch(e){
    const code=String(e?.message||e||'');
    if(code!=='MFA_TOO_OLD'&&code!=='MFA_STEP_UP_REQUIRED')throw e;
  }

  const factors=await backend().mfaListFactors();
  const verified=(factors?.totp||[]).filter(x=>x?.status==='verified');
  if(!verified.length)throw new Error('VERIFIED_MFA_FACTOR_REQUIRED');

  let factor=verified[0];
  if(verified.length>1){
    const menu=verified.map((x,i)=>`${i+1}. ${String(x.friendly_name||'Verified Factor')}`).join('\n');
    const picked=prompt(
      'Fresh MFA ke liye kaunsa Authenticator factor use kar rahe hain?\n\n'+menu+'\n\nFactor number enter karein.'
    );
    if(picked===null)throw new Error('MFA_STEP_UP_CANCELLED');
    const index=Number(picked)-1;
    if(!Number.isInteger(index)||index<0||index>=verified.length){
      throw new Error('VALID_MFA_FACTOR_REQUIRED');
    }
    factor=verified[index];
  }

  const otp=prompt(
    'Fresh '+String(factor.friendly_name||'Authenticator')+' 6-digit code enter karein'
  );
  if(otp===null)throw new Error('MFA_STEP_UP_CANCELLED');
  if(!/^\d{6}$/.test(otp.trim()))throw new Error('VALID_6_DIGIT_CODE_REQUIRED');

  await backend().mfaChallengeAndVerify(factor.id,otp.trim());

  const recent=await backend().recentMfaInfo(600);
  if(!recent?.ok)throw new Error('MFA_STEP_UP_FAILED');

  await backend().requireRecentMfa(600);
  return true;
}

async function highRisk(action,payload={}){
  await ensureRecentMfaInteractive();
  return api(action,payload);
}
async function auditLookup(recordType='',recordId='',limit=100){
  return (await api('audit_lookup',{record_type:recordType,record_id:recordId,limit})).rows||[];
}
async function auditExport(recordType='',recordId='',limit=500){
  return (await highRisk('audit_export',{record_type:recordType,record_id:recordId,limit})).export;
}
async function retentionGet(domain,recordType,recordId){
  return (await api('retention_get',{domain,record_type:recordType,record_id:recordId})).record;
}
async function retentionDueList(){
  return (await api('retention_due_list')).records||[];
}
async function retentionRegister(domain,recordType,recordId,policyKey=null,dueAt=null){
  return (await highRisk('retention_register',{
    domain,record_type:recordType,record_id:recordId,policy_key:policyKey||null,due_at:dueAt||null
  })).result;
}
async function retentionAction(domain,recordType,recordId,retentionAction,reason=null,newDueAt=null){
  return (await highRisk('retention_action',{
    domain,record_type:recordType,record_id:recordId,retention_action:retentionAction,
    reason:reason||null,new_due_at:newDueAt||null
  })).result;
}
async function publicViewsGet(articleId){
  return (await api('public_views_get',{article_id:articleId})).view_state;
}
async function publicViewsSet(articleId,enabled,displayOverride=null){
  return (await api('public_views_set',{
    article_id:articleId,enabled:!!enabled,display_override:displayOverride
  })).result;
}
async function permanentDeleteArticle(articleId){
  return (await highRisk('permanent_delete_article',{article_id:articleId})).result;
}

global.JBRecords={
  auditLookup,auditExport,
  retentionGet,retentionDueList,retentionRegister,retentionAction,
  publicViewsGet,publicViewsSet,permanentDeleteArticle
};
})(window);
