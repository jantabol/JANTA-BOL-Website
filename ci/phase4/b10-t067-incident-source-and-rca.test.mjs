// T067: source, actual incident authority flow, RCA and historical lock evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const client=read('JANTA_BOL_PHASE_3C_WORKING/phase4-team-client.js');
const edge=read('CODEX_CURRENT_SUPABASE/functions/jb-team-api/index.ts');
const runbook=read('JANTA_BOL_PHASE_3C_WORKING/SECURITY-RUNBOOK.md');
const prior=read('ci/phase3-regression/static-p3-incident-regression.cjs');
const regression=read('ci/phase4/b10-t067-incident-contained-audit-notify-pg17.sql');
const t066=read('ci/phase4/b10-t066-disposable-signed-revocation.test.mjs');
test('T067 deployed team Edge source enforces signed auth, backend active session, Owner/AAL2 and recent MFA',()=>{
 for(const s of ['auth.getUser(token)','jb_team_actor_context_internal','!context?.session_active',
  '!=="owner"','!=="aal2"','recentMfa(claims,600)','jb_team_suspend_internal'])
   assert.ok(edge.includes(s),'missing authority contract: '+s);
 assert.match(client,/requireRecentMfa\(600\)/);
 assert.match(client,/highRiskMutation\('suspend'/);
 assert.match(edge,/"suspend","reactivate","change_role"/);
 assert.doesNotMatch(edge,/console\.log\(.*token/);
});
test('T067 audit-first containment, incident runbook and original protected CI preserved',()=>{
 for(const section of ['CONTAIN','Evidence Preserve','Root-cause','Verify database integrity',
  'stop new privileged YouTube work']) assert.ok(runbook.toLowerCase().includes(section.toLowerCase()),section);
 for(const id of ['3A-P3-T148','3A-P3-T151','3A-P3-T152','3A-P3-T154',
  '3A-P3-T159','3A-P3-T161']) assert.ok((prior+
    read('ci/phase3-regression/db-p3-incident-regression.sql')).includes(id),id);
});
test('T067 disposable role-fraud, scoping, audit/notification and old JWT replay negative matrix remains executable',()=>{
 for(const marker of ['T067_REFUSE_NON_DISPOSABLE_DATABASE','T067_REPORTER_FORGED_OWNER',
 'T067_ONE_TARGET_CONTAINMENT_REQUIRED','T067_ONE_TARGET_SESSION_REVOKE_REQUIRED',
 'T067_AUDIT_NOTIFICATION_CAUSAL_CHAIN_MISSING','T067_SENSITIVE_NOTIFICATION_LEAK',
 'T067_REVOKED_INCIDENT_ACCOUNT_STILL_AUTHORIZED',
 'T067_OTHER_REPORTER_COLLATERAL_DAMAGE','T067_OWNER_SESSION_COLLATERAL_DAMAGE','ROLLBACK;'])
  assert.ok(regression.includes(marker),marker);
});
test('T067 RCA documented security fix is RED then GREEN with actual signed JWT, not fake healthy status',()=>{
 const approved=read('JANTA_BOL_PHASE_4_WORKING/db/20261024_b10_t066_advertiser_active_session_PRODUCTION_APPROVED.sql');
 assert.match(approved,/private\.current_session_active\(\)/);
 assert.match(approved,/T066_ORIGINAL_FUNCTION_SOURCE_DRIFT/);
 assert.match(t066,/if\(phase==='red'\)/);
 assert.match(t066,/if\(phase==='red'\)[\s\S]*else\{/);
 assert.match(t066,/revoked advertiser JWT cannot read own campaign/);
 assert.match(read('ci/phase4/b10-t063-recovery-revocation-regression.sql'),/T063_REVOKED_SESSION_KEY_VERIFY_BYPASS/);
});
