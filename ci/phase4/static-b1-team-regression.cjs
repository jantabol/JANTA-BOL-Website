#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function ok(cond,msg){if(!cond){console.error('FAIL [B1] '+msg);process.exitCode=1;}else console.log('PASS [B1] '+msg);}

const ui=read('JANTA_BOL_PHASE_3C_WORKING/reporters.html');
const client=read('JANTA_BOL_PHASE_3C_WORKING/phase4-team-client.js');
const edge=read('CODEX_CURRENT_SUPABASE/functions/jb-team-api/index.ts');
const auth=read('JANTA_BOL_PHASE_3C_WORKING/admin-auth.js');

ok(ui.includes('phase4-team-client.js'),'Team UI loads one Phase-4 team client adapter');
ok(ui.includes('Invite Team Member')&&ui.includes('Activate')&&ui.includes('Suspend')&&ui.includes('Reactivate'),'Android team lifecycle controls exist');
ok(ui.includes('Public Name')&&ui.includes('Sessions')&&ui.includes('Mark Departed'),'Public-name/session/departure controls exist');
ok(ui.includes('admin-auth.js'),'Team management remains behind existing Founder admin guard');
ok(!ui.includes('.auth.signUp(')&&!client.includes('.auth.signUp('),'No open newsroom self-registration path is introduced');

for(const rpc of ['jb_team_list','jb_team_history','jb_team_activate','jb_team_suspend','jb_team_reactivate','jb_team_change_role','jb_team_set_public_name','jb_team_depart','jb_team_list_sessions','jb_team_revoke_session']){
  ok(client.includes(rpc),'Client uses canonical '+rpc);
}
ok(client.includes("functions.invoke('jb-team-api'"),'Invite uses server-side jb-team-api');
ok(client.includes('requireRecentMfa(600)'),'High-risk team mutations require recent Founder MFA in client flow');

ok(edge.includes('inviteUserByEmail'),'Invite creation stays server-side through Supabase Admin API');
ok(edge.includes('JB_SUPABASE_SERVICE_ROLE_KEY'),'Service credential remains server environment only');
ok(edge.includes('recentMfa(claims,600)'),'Invite requires fresh MFA');
ok(edge.includes('jb_team_actor_context_internal'),'Invite revalidates current server session/role');
ok(edge.includes('deleteUser(invitedUserId)'),'Invite saga compensates orphan Auth user if DB creation fails');
ok(!edge.includes('SUPABASE_SERVICE_ROLE_KEY =')&&!edge.match(/eyJ[a-zA-Z0-9_-]{20,}/),'No service credential literal is hard-coded');

ok(auth.includes("if(r!=='owner')"),'Existing Founder admin guard remains Owner-only');
ok(auth.includes('serverSessionValid()'),'Existing server-session validity check remains intact');

if(process.exitCode)process.exit(process.exitCode);
console.log('B1 static team regression complete.');
