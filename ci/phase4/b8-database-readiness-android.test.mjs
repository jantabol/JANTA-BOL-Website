import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const ui=await readFile(new URL('../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js',import.meta.url),'utf8');
const sql=await readFile(new URL('../../JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql',import.meta.url),'utf8');
test('B8 owner login alone is NOT accepted as G0-G9 readiness',()=>{
 const check=ui.indexOf("client.rpc(\n      'jb_b8_g1_runtime_readiness')");
 const show=ui.indexOf("app.classList.remove('hide')");
 assert.ok(check>0 && show>check,'read-only RPC must run before B8 forms unlock');
 assert.match(ui,/readyError\|\|ready\?\.component!=='JANTA_BOL_B8'/);
 assert.match(ui,/ready\?\.db_ready!==true/);
 assert.match(ui,/B8_DATABASE_NOT_DEPLOYED_OR_PARTIAL_G0_G9/);
});
test('G1 handshake returns fixed safe data, requires all G1..G9, not privilege escalation',()=>{
 assert.match(sql,/create function public\.jb_b8_g1_runtime_readiness\(\)/);
 assert.match(sql,/security invoker set search_path=''/);
 for(const p of ['jb_b8_g1_owner_create_case','jb_b8_g2_owner_provenance_summary',
 'jb_b8_g3_owner_evidence_packet','jb_b8_g4_public_feed','jb_b8_g5_owner_private_ledger',
 'jb_b8_g6_reporter_private_upload_readiness','jb_b8_g7_owner_private_history',
 'jb_b8_g8_owner_attest_manual_delivery','jb_b8_g9_owner_due_followups'])
  assert.ok(sql.includes("to_regprocedure('public."+p+"("), 'missing SQL phase sentinel '+p);
 assert.match(sql,/revoke all on function public\.jb_b8_g1_runtime_readiness\(\)\s+from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.jb_b8_g1_runtime_readiness\(\) to authenticated/);
 assert.match(sql,/'official_send_by_app',false/);
});
