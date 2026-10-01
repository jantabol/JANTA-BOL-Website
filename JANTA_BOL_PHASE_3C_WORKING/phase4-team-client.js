(function(global){
'use strict';

function client(){
  if(!global.JBBackend?.client)throw new Error('BACKEND_NOT_READY');
  return global.JBBackend.client;
}
function unwrap(data,error,fallback){
  if(error)throw new Error(error.message||fallback);
  if(data&&data.error)throw new Error(data.error);
  return data;
}
async function invite(payload){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().functions.invoke('jb-team-api',{
    body:{action:'invite',payload}
  });
  unwrap(data,error,'TEAM_INVITE_UNAVAILABLE');
  if(!data?.ok)throw new Error(data?.error||'TEAM_INVITE_FAILED');
  return data.account;
}
async function list(){
  const {data,error}=await client().rpc('jb_team_list');
  return unwrap(data,error,'TEAM_LIST_FAILED')||[];
}
async function history(teamAccountId){
  const {data,error}=await client().rpc('jb_team_history',{p_team_account_id:teamAccountId});
  return unwrap(data,error,'TEAM_HISTORY_FAILED')||[];
}
async function sessions(teamAccountId){
  const {data,error}=await client().rpc('jb_team_list_sessions',{p_team_account_id:teamAccountId});
  return unwrap(data,error,'TEAM_SESSIONS_FAILED')||[];
}
async function activate(id){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_activate',{p_team_account_id:id});
  return unwrap(data,error,'TEAM_ACTIVATE_FAILED');
}
async function suspend(id,reason){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_suspend',{p_team_account_id:id,p_reason:reason});
  return unwrap(data,error,'TEAM_SUSPEND_FAILED');
}
async function reactivate(id){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_reactivate',{p_team_account_id:id});
  return unwrap(data,error,'TEAM_REACTIVATE_FAILED');
}
async function changeRole(id,role,reason='ROLE_CHANGED'){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_change_role',{
    p_team_account_id:id,p_new_role:role,p_reason:reason
  });
  return unwrap(data,error,'TEAM_ROLE_CHANGE_FAILED');
}
async function setPublicName(id,enabled){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_set_public_name',{
    p_team_account_id:id,p_enabled:!!enabled
  });
  return unwrap(data,error,'TEAM_PUBLIC_NAME_FAILED');
}
async function depart(id,reason){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_depart',{p_team_account_id:id,p_reason:reason});
  return unwrap(data,error,'TEAM_DEPART_FAILED');
}
async function revokeSession(id,sessionId,reason='LOST_DEVICE'){
  await global.JBBackend.requireRecentMfa(600);
  const {data,error}=await client().rpc('jb_team_revoke_session',{
    p_team_account_id:id,p_session_id:sessionId,p_reason:reason
  });
  return unwrap(data,error,'TEAM_SESSION_REVOKE_FAILED');
}

global.JBTeam={invite,list,history,sessions,activate,suspend,reactivate,changeRole,setPublicName,depart,revokeSession};
})(window);
