(function(global){
'use strict';

function client(){
  if(!global.JBBackend?.client)throw new Error('BACKEND_NOT_READY');
  return global.JBBackend.client;
}
async function api(action,payload={}){
  const {data,error}=await client().functions.invoke('jb-team-api',{body:{action,payload}});
  if(error)throw new Error(error.message||'TEAM_API_UNAVAILABLE');
  if(!data?.ok)throw new Error(data?.error||'TEAM_API_FAILED');
  return data;
}
async function mutation(action,payload={}){
  await global.JBBackend.requireRecentMfa(600);
  return api(action,payload);
}
async function invite(payload){
  const data=await mutation('invite',payload);
  return data.account;
}
async function list(){
  const data=await api('list');
  return data.accounts||[];
}
async function history(teamAccountId){
  const data=await api('history',{team_account_id:teamAccountId});
  return data.history||[];
}
async function sessions(teamAccountId){
  const data=await api('sessions',{team_account_id:teamAccountId});
  return data.sessions||[];
}
async function activate(id){
  return (await mutation('activate',{team_account_id:id})).result;
}
async function suspend(id,reason){
  return (await mutation('suspend',{team_account_id:id,reason})).result;
}
async function reactivate(id){
  return (await mutation('reactivate',{team_account_id:id})).result;
}
async function changeRole(id,role,reason='ROLE_CHANGED'){
  return (await mutation('change_role',{team_account_id:id,role,reason})).result;
}
async function setPublicName(id,enabled){
  return (await mutation('set_public_name',{team_account_id:id,enabled:!!enabled})).result;
}
async function depart(id,reason){
  return (await mutation('depart',{team_account_id:id,reason})).result;
}
async function revokeSession(id,sessionId,reason='LOST_DEVICE'){
  return (await mutation('revoke_session',{
    team_account_id:id,session_id:sessionId,reason
  })).result;
}

global.JBTeam={invite,list,history,sessions,activate,suspend,reactivate,changeRole,setPublicName,depart,revokeSession};
})(window);
