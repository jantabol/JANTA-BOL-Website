#!/usr/bin/env node
// B10 RUN-09 / P4-T060..T068. SECURITY SOURCE CONTRACTS ONLY.
// Code coverage is NOT a real device, a live attack, or a final block lock.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(ROOT,p),'utf8');
const has=p=>existsSync(resolve(ROOT,p));
const app='JANTA_BOL_PHASE_3C_WORKING/';
const b9='JANTA_BOL_PHASE_4_WORKING/db/20261022_b9_search_analytics_REVIEW_ONLY.sql';
const backend=read(app+'backend-client.js'),migration=read(b9);
const protectedFiles=[
 'ci/phase3-regression/static-p3-security-regression.cjs',
 'ci/phase3-regression/static-p3-recovery-regression.cjs',
 'ci/phase3-regression/static-p3-incident-regression.cjs',
 'ci/phase4/b9-pg17-regression.sql'];
test('P4-T060 — backend authority/MFA and explicit fail-closed source contracts',()=>{
 assert.match(backend,/requireOwner/);
 assert.match(backend,/AAL2_REQUIRED/);
 assert.match(backend,/auth\.getSession\(\)/);
 assert.match(migration,/private\.current_owner_aal2\(\)/);
 assert.match(migration,/revoke all on public\.b9_taxonomy_terms/);
});
test('P4-T061 — public/private data source contracts and safe Search projection',()=>{
 assert.match(migration,/alter table public\.b9_taxonomy_terms enable row level security/);
 assert.match(migration,/alter table public\.b9_metric_global_settings enable row level security/);
 assert.match(migration,/status='published'/);
 assert.match(migration,/deleted_at is null/);
 assert.match(read('ci/phase4/b9-pg17-regression.sql'),/B9_PRIVATE_BODY_SEARCH_LEAK/);
 const t061=read('JANTA_BOL_PHASE_4_WORKING/db/20261023_b10_t061_public_live_updates_privilege_SAFE_FIX.sql');
 assert.match(t061,/SECURITY DEFINER/i);
 assert.match(t061,/SET search_path = ''/);
 assert.match(t061,/s\.id=p_session_id/);
 assert.match(t061,/s\.article_id=p_article_id/);
 assert.match(t061,/a\.deleted_at IS NULL/);
 assert.match(t061,/live_updates_public_visible IS TRUE/);
 assert.match(t061,/ALTER POLICY public_live_updates_read/i);
 assert.doesNotMatch(t061,/GRANT SELECT ON (?:public\.)?live_sessions/i);
 assert.match(read('ci/phase4/b10-t061-public-live-update-regression.sql'),/T061_CROSS_ARTICLE_SESSION_TAMPER_TRUE/);

});
test('P4-T062 — Role-matrix module entry points exist, no client-side role alone is proof',()=>{
 for(const p of ['admin-auth.js','grievances.html','compliance.html','advertiser-portal.html',
    'ads.html','b8-accountability-client.js','b9-client.js','backend-client.js']){
  assert.ok(has(app+p),'required original authority module missing: '+p);
 }
 assert.match(read(app+'b9-client.js'),/ownerAnalytics|ownerMetricSettings|ownerAssignTerm/);
});
test('P4-T063 — Auth, MFA, session and recovery code preserved for later real-device tests',()=>{
 assert.match(backend,/mfa\.challengeAndVerify/);
 assert.match(backend,/getAuthenticatorAssuranceLevel/);
 assert.match(backend,/auth\.signOut/);
 assert.match(backend,/ownerListSessions/);
 for(const p of ['admin-recovery.html','admin-security.html','admin-login.html','admin-recovery-setup.html']){
  assert.ok(has(app+p),'Founder recovery artifact missing '+p);
 }
});
test('P4-T064 — hardening, secrets boundary and environment-aware confidential storage',()=>{
 assert.match(migration,/security definer set search_path=''/i);
 for(const p of ['backend-client.js','b9-client.js','b8-accountability-client.js']){
   const text=read(app+p);
   assert.doesNotMatch(text,/(?:service_role|sb_secret_)[A-Za-z0-9_]{22,}/i,'sensitive credential marker in public script '+p);
   assert.doesNotMatch(text,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,'embedded private key in '+p);
 }
 for(const p of ['CODEX_CURRENT_SUPABASE/functions/jb-b8-private-evidence/index.ts',
                   'ci/phase4/b9-pg17-fixture.sql'])assert.ok(has(p));
});
test('P4-T065 — IDOR and UUID guessing negatives remain in search tests',()=>{
 const e=read('ci/phase4/b9-pg17-regression.sql');
 for(const marker of ['B9_DRAFT_UUID_ENUMERABLE','B9_PRIVATE_LEAK','B9_PUBLIC_ONLY_3_EXPECTED','B9_RPC_GRANTS_WRONG']){
  assert.ok(e.includes(marker),'missing pre-existing negative test '+marker);
 }
});
test('P4-T066 — old session/device revocation and advertiser isolation hooks preserved',()=>{
 assert.match(backend,/revoke|Revoke|signOut/);
 assert.ok(has(app+'b7-ad-revocation-bridge.js'));
 assert.match(read(app+'b7-ad-revocation-bridge.js'),/jb_ad_visibility_alive_public/);
 assert.match(read(app+'b7-ad-revocation-bridge.js'),/if\(error\|\|data!==true\)remove\(\)/);
 assert.match(migration,/revoke all on public\.b9_taxonomy_terms,public\.b9_article_terms/);
});
test('P4-T067 — incident RCA and governed audit baseline is preserved',()=>{
 for(const p of ['ci/phase3-regression/static-p3-incident-regression.cjs',
                   'ci/phase3-regression/static-p3-security-regression.cjs',
                   'ci/phase4/b9-client-and-ui.test.mjs'])assert.ok(has(p));
 assert.match(read('ci/phase4/b9-client-and-ui.test.mjs'),/T109 injected|T109 optional/);
 assert.match(migration,/audit_logs/);
});
test('P4-T068 — 109 old tests and unresolved E3 must never become auto-PASS',()=>{
 for(const p of protectedFiles)assert.ok(has(p),'protected original test absent '+p);
 const r=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
 assert.match(r,/T105 FINAL HOLD|T105.*HOLD/);
 assert.ok(has('tools/jb_manual_test.py'));
 assert.ok(has('JANTA_BOL_PHASE_4_WORKING/review/B10_G0_SECURITY_PRECHECK_SCOPE_AND_HOLD_20261023.md'));
});
