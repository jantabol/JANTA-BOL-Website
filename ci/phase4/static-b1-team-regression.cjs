#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function ok(cond,msg){
  if(!cond){console.error('FAIL [B1] '+msg);process.exitCode=1;}
  else console.log('PASS [B1] '+msg);
}

const ui=read('JANTA_BOL_PHASE_3C_WORKING/reporters.html');
const client=read('JANTA_BOL_PHASE_3C_WORKING/phase4-team-client.js');
const edge=read('CODEX_CURRENT_SUPABASE/functions/jb-team-api/index.ts');
const auth=read('JANTA_BOL_PHASE_3C_WORKING/admin-auth.js');

ok(ui.includes('phase4-team-client.js'),'Team UI loads one Phase-4 team client adapter');
ok(ui.includes('Invite Team Member')&&ui.includes('Activate')&&ui.includes('Suspend')&&ui.includes('Reactivate'),'Android team lifecycle controls exist');
ok(ui.includes('Public Name')&&ui.includes('Sessions')&&ui.includes('Mark Departed'),'Public-name/session/departure controls exist');
ok(ui.includes('admin-auth.js'),'Team management remains behind existing Founder admin guard');
ok(!ui.includes('.auth.signUp(')&&!client.includes('.auth.signUp('),'No open newsroom self-registration path is introduced');

ok(client.includes("functions.invoke('jb-team-api'"),'All Team browser actions use the verified server adapter');
ok(!client.includes(".rpc('jb_team_"),'Browser client has no direct Team privileged RPC authority');
for(const action of ['invite','list','history','sessions','activate','suspend','reactivate','change_role','set_public_name','depart','revoke_session']){
  ok(client.includes("'"+action+"'"),'Client exposes Team action '+action);
}
ok(client.includes('requireRecentMfa(600)'),'Mutating Team browser actions require recent Founder MFA');

ok(edge.includes('inviteUserByEmail'),'Invite creation stays server-side');
ok(edge.includes('jb_team_actor_context_internal'),'Server adapter revalidates current session and role');
ok(edge.includes('OWNER_AAL2_REQUIRED'),'Server adapter requires Owner AAL2');
ok(edge.includes('recentMfa(claims,600)'),'Server independently requires recent MFA for mutations');
ok(edge.includes('deleteUser(invitedUserId)'),'Invite flow compensates an orphan invited user when DB creation fails');
for(const rpc of ['jb_team_create_pending_internal','jb_team_activate_internal','jb_team_suspend_internal','jb_team_reactivate_internal','jb_team_change_role_internal','jb_team_set_public_name_internal','jb_team_depart_internal','jb_team_list_sessions_internal','jb_team_revoke_session_internal']){
  ok(edge.includes(rpc),'Server adapter uses reviewed internal authority '+rpc);
}

ok(auth.includes("if(r!=='owner')"),'Existing Founder admin guard remains Owner-only');
ok(auth.includes('serverSessionValid()'),'Existing server-session validity check remains intact');

if(process.exitCode)process.exit(process.exitCode);
console.log('B1 static team regression complete.');
