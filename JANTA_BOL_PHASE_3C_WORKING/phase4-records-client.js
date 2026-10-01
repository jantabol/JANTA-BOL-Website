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
async function highRisk(action,payload={}){
  await backend().requireRecentMfa(600);
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
