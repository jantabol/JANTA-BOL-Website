#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function ok(cond,msg){
  if(!cond){console.error('FAIL [B2] '+msg);process.exitCode=1;}
  else console.log('PASS [B2] '+msg);
}

const migration=read('JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b2_common_records_foundation.sql');
const context=read('JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b2_records_api_context.sql');
const client=read('JANTA_BOL_PHASE_3C_WORKING/phase4-records-client.js');
const ui=read('JANTA_BOL_PHASE_3C_WORKING/records.html');
const edge=read('CODEX_CURRENT_SUPABASE/functions/jb-records-api/index.ts');
const admin=read('JANTA_BOL_PHASE_3C_WORKING/admin.html');
const trash=read('JANTA_BOL_PHASE_3C_WORKING/trash.html');

ok(migration.includes('private.jb_audit_sanitize_jsonb'),'Common audit has metadata sanitizer');
ok(migration.includes('AUDIT_HISTORY_IMMUTABLE'),'Audit history has immutable mutation guard');
ok(!/drop\s+table\s+(if\s+exists\s+)?public\.(audit_logs|article_versions|verification_history|live_retention_registry|live_deletion_ledger)/i.test(migration),'Protected old audit/version/Live retention homes are not rebuilt');
ok(migration.includes('record_retention_policies')&&migration.includes('default_retention_days'),'Retention policy stays domain-defined');
for(const x of ['record_retention_state','record_retention_history','record_disposition_ledger','article_public_view_settings']){
  ok(migration.includes(x),'B2 migration defines '+x);
}
ok(migration.includes('RETENTION_HOLD_ACTIVE')&&migration.includes('RETENTION_DUE_REQUIRED'),'Permanent delete is gated by due state and Hold');
ok(migration.includes('ARTICLE_ID_RETIRED'),'Disposed Article identity cannot be reused');
ok(migration.includes("'raw_views'"),'Public view display audit preserves raw-view evidence');
ok(context.includes('auth.sessions')&&context.includes('user_roles'),'Records API context revalidates session and role');

ok(client.includes("functions.invoke('jb-records-api'"),'Browser Records actions use one server adapter');
ok(client.includes('requireRecentMfa(600)'),'High-risk Records actions require recent Founder MFA');
ok(!client.includes(".from('record_retention_"),'Browser does not directly mutate retention tables');

ok(edge.includes('jb_records_actor_context_internal'),'Server adapter revalidates current Owner/session');
ok(edge.includes('OWNER_AAL2_REQUIRED'),'Server adapter requires Owner AAL2');
ok(edge.includes('recentMfa(claims,600)'),'Server independently gates high-risk actions with recent MFA');
for(const action of ['audit_lookup','audit_export','retention_get','retention_due_list','retention_register','retention_action','public_views_get','public_views_set','permanent_delete_article']){
  ok(edge.includes('"'+action+'"'),'Records API exposes '+action);
}

ok(ui.includes('Audit Lookup')&&ui.includes('Retention Record')&&ui.includes('Permanent Delete Gate'),'Android Records UI covers audit, retention and high-risk delete');
ok(ui.includes('Public View Count Display'),'UI separates displayed views from raw views');
ok(ui.includes('admin-auth.js'),'Records UI remains behind existing admin auth guard');
ok(admin.includes("location.href='records.html'"),'Dashboard links to one Records home');
ok(trash.includes('retention DUE')&&trash.includes("records.html?article="),'Trash UI links to retention gate');

if(process.exitCode)process.exit(process.exitCode);
console.log('B2 static audit/retention regression complete.');
