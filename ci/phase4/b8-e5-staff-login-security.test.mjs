import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
const read=async file=>readFile(new URL(file,base),'utf8');

test('Staff login uses existing protected Supabase session and ONLY Reporter/Editor role',async()=>{
  const page=await read('b8-staff-login.html');
  assert.match(page,/JBBackend\.signIn\(userEmail,pw\)/);
  assert.match(page,/client\.auth\.getUser\(\)/);
  assert.match(page,/data\?\.user\?\.id!==session\.user\.id/);
  assert.match(page,/role!=='reporter'&&role!=='editor'/);
  assert.match(page,/jb_b8_g1_runtime_readiness/);
  assert.match(page,/jb_b8_t094_source_binding_readiness/);
  assert.match(page,/server_guard_ready!==true/);
  assert.match(page,/location\.replace\(target\)/);
  assert.match(page,/const target='b8-accountability\.html'/);
  assert.doesNotMatch(page,/signUp|createUser|invite|createCase|service_role/i);
  assert.doesNotMatch(page,/window\.open\(|\.innerHTML\s*=/);
});

test('Login never stores credentials or asks to screenshot secrets',async()=>{
 const page=await read('b8-staff-login.html');
 assert.match(page,/type="password"/);
 assert.match(page,/autocomplete="current-password"/);
 assert.match(page,/password\.value=''/);
 assert.doesNotMatch(page,/localStorage\.setItem\(/);
 assert.doesNotMatch(page,/sessionStorage\.setItem\(/);
 assert.doesNotMatch(page,/console\.log\(/);
 assert.doesNotMatch(page,/confirm\(/);
 assert.doesNotMatch(page,/onclick\s*=/);
});
test('Owner login stays owner-only; B8 authoritative Reporter/Editor session guards intact',async()=>{
 const page=await read('admin-login.html');
 const b8=await read('b8-accountability-ui.js');
 assert.match(page,/Owner\/Super Admin role required/);
 assert.match(b8,/await window\.JBBackend\.client\.auth\.getUser\(\)/);
 assert.match(b8,/jb_b8_g1_runtime_readiness/);
 assert.match(b8,/LOCK_MS=15\*60\*1000/);
 assert.match(b8,/requireFreshIdentity/);
 assert.match(b8,/role==='owner'/);
 assert.match(b8,/createB8Workflow\(/);
 assert.doesNotMatch(b8,/\.innerHTML=/);
});
