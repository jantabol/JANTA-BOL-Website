#!/usr/bin/env node
// P4-T063 / RUN-09. Actual MFA/device/E3 must be done separately on trusted Android.
// This source test catches navigation/phishing bugs and confirms preserved backend gates.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const get=p=>readFileSync(resolve(root,p),'utf8');
const dir='JANTA_BOL_PHASE_3C_WORKING/';
const login=get(dir+'admin-login.html');
const auth=get(dir+'admin-auth.js');
const backend=get(dir+'backend-client.js');
const security=get(dir+'admin-security.html');
const emergency=get(dir+'admin-recovery.html');
const recoverySetup=get(dir+'admin-recovery-setup.html');

test('T063 external/malformed post-2FA and local-unlock next destination rejected',()=>{
  const match=login.match(/function safeNextPage\(\)\{[\s\S]*?\n\}/);
  assert.ok(match,'safe next destination code must exist');
  const fn=new Function('q',match[0]+';return safeNextPage();');
  const resolveDest=next=>fn(new URLSearchParams([['next',next]]));
  for(const attack of [
    'https://evil.example/phishing','//evil.example',
    'javascript:alert(1)','data:text/html,bad',
    '../admin.html','/admin.html','..\\admin.html',
    'admin.html\r\nX-Header:1','admin-login.html?loop=1',
    'admin-recovery.html','admin.html#evil',
  ]){
    assert.equal(resolveDest(attack),'admin.html','unsafe redirect: '+attack);
  }
  for(const legal of ['admin.html','admin-security.html','ads.html','b8-accountability.html','grievances.html?tab=inbox','b9-analytics.html?range=7']){
    assert.equal(resolveDest(legal),legal,'legit same-directory destination lost '+legal);
  }
  assert.equal((login.match(/location\.replace\(safeNextPage\(\)\)/g)||[]).length,2,
    'both successful sign-in and local unlock must use safe destination');
  assert.doesNotMatch(login,/location\.replace\(q\.get\('next'\)/);
});
test('T063 login waits for verified Founder identity and server AAL2',()=>{
  assert.match(login,/await JBBackend\.signIn/);
  assert.match(login,/if\(r!=='owner'\)/);
  assert.match(login,/verifiedFactors/);
  assert.match(login,/pendingFactorId=verified\.id/);
  assert.match(login,/await JBBackend\.mfaChallengeAndVerify/);
  assert.match(login,/aal\?\.currentLevel!=='aal2'/);
  assert.match(login,/if\(!\/\^\\d\{6\}\$\/.test\(code\)\)/);
  assert.match(backend,/client\.auth\.signInWithPassword/);
});
test('T063 inactivity lock fails closed and never substitutes for backend session',()=>{
  assert.match(auth,/LOCK_MINUTES=15/);
  assert.match(auth,/await JBBackend\.serverSessionValid\(\)/);
  assert.match(auth,/state\.kind|security\.kind/);
  assert.match(auth,/location\.replace\('admin-login\.html\?locked=1/);
  assert.match(auth,/showGuardUnavailable\(e\)/);
  assert.match(login,/async function existingAAL2State/);
  assert.match(login,/state\.kind!=='ok'/);
  assert.match(login,/window\.isSecureContext/);
});
test('T063 real session revoke and recent sensitive AAL2 gates remain backend-authoritative',()=>{
  assert.match(backend,/jb_owner_list_sessions/);
  assert.match(backend,/jb_owner_revoke_session/);
  assert.match(backend,/scope:'global'/);
  assert.match(backend,/scope:'others'/);
  assert.match(backend,/scope:'local'/);
  assert.match(backend,/await requireRecentMfa\(600\)/);
  assert.match(security,/Logout All Other Devices/);
  assert.match(security,/Logout All Devices/);
});
test('T063 emergency recovery is limited, revokes factor only on consent, key not persisted',()=>{
  assert.match(emergency,/LIMITED RECOVERY MODE/);
  assert.match(emergency,/const result=await JBBackend\.verifyOwnerRecoveryKey\(key\)/);
  assert.match(emergency,/JBBackend\.recoveryDeleteMfa/);
  assert.match(emergency,/confirm\('Selected verified MFA factor revoke karna hai\?/);
  assert.match(emergency,/verifiedRecoveryKey=''/);
  assert.match(emergency,/clearStaleRecoveryModeOnLoad/);
  assert.match(recoverySetup,/JBBackend\.setOwnerRecoveryKey\(generatedKey\)/);
  assert.match(recoverySetup,/await ensureRecentMfa\(\)/);
  assert.match(backend,/client\.auth\.mfa\.challengeAndVerify/);
});
