#!/usr/bin/env node
// B10 P4-T064 — E1 static credential and build-log safety gate.
// Never print matched credentials. This is NOT proof of independent environments.
// Static HTML/JS/CSS (public + admin), committed Edge functions, root runtime files,
// deploy workflows, and *.log are inspected as tracked files, not a partial allowlist.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:4e6})
 .toString('utf8').split('\0').filter(Boolean);
const live=tracked.filter(p=>
  /^JANTA_BOL_PHASE_3C_WORKING\/.+\.(?:js|mjs|html|css)$/i.test(p)||
  /^CODEX_CURRENT_SUPABASE\/functions\/.+\.(?:js|mjs|ts)$/i.test(p)||
  /^(?:script\.js|index\.html|style\.css)$/.test(p)||
  /^\.github\/workflows\/.+\.ya?ml$/.test(p)||
  /\.log$/i.test(p)
);
const patterns=[
 ['SUPABASE_SECRET_KEY',/sb_secret_[A-Za-z0-9_-]{10,}/i],
 ['LIVE_PAYMENT_SECRET',/\bsk_live_[a-z0-9]{12,}/i],
 ['WEBHOOK_SIGNATURE_KEY',/\bwhsec_[a-z0-9]{10,}/i],
 ['GITHUB_PAT',/\bgh[pousr]_[A-Za-z0-9]{30,}/],
 ['AWS_ACCESS_KEY',/\bAKIA[0-9A-Z]{16}\b/],
 ['PRIVATE_PEM',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
 ['HARDCODED_BACKEND_KEY',/\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD|POSTGRES_PASSWORD|STRIPE_SECRET_KEY)\s*[:=]\s*['"][^'"\r\n]{14,}['"]/i],
 ['HARDCODED_TOKEN_VALUE',/\b(?:ACCESS_TOKEN|REFRESH_TOKEN|GITHUB_TOKEN|VERCEL_TOKEN)\s*[:=]\s*['"][A-Za-z0-9._=-]{35,}['"]/i],
];
function checkSecret(s){
 const found=patterns.filter(([,rx])=>rx.test(s)).map(([name])=>name);
 // Only a JWT with non-ANON role is a forbidden privileged client key.
 for(const match of String(s).matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}\b/g)){
  try{
   const payload=JSON.parse(Buffer.from(match[0].split('.')[1],'base64url').toString('utf8'));
   if(payload.role && payload.role!=='anon')found.push('PRIVILEGED_JWT');
  }catch{}
 }
 return [...new Set(found)];
}
test('T064 tracked public/admin/static/Edge/workflow/log secret material inventory',()=>{
 assert.ok(live.length>=75, 'T064 coverage unexpectedly shrunk');
 const dangerous=[];
 for(const p of live){
   const data=readFileSync(resolve(root,p),'utf8');
   const issues=checkSecret(data);
   if(issues.length)dangerous.push({file:p,flags:issues});
 }
 assert.deepEqual(dangerous,[], 'T064 secret-pattern failure; values intentionally NEVER printed');
});
test('T064 reject high-confidence secrets but permit deliberately public Supabase key',()=>{
 for(const [synthetic,flag] of [
 ['const key="sb_secret_abcdefghijklmnop";','SUPABASE_SECRET_KEY'],
 ['const key="sk_live_aaaaaaaaaaaaaaaaa";','LIVE_PAYMENT_SECRET'],
 ['const key="whsec_aaaaaaaaaaaaaaaa";','WEBHOOK_SIGNATURE_KEY'],
 ['const key="AKIAAAAAAAAAAAAAAAAA";','AWS_ACCESS_KEY'],
 ['const SUPABASE_SERVICE_ROLE_KEY="DO_NOT_COMMIT_THIS_12345";','HARDCODED_BACKEND_KEY'],
 ['-----BEGIN PRIVATE KEY-----','PRIVATE_PEM'],
 ]){
   assert.ok(checkSecret(synthetic).includes(flag),'scanner missed '+flag);
 }
 assert.deepEqual(checkSecret('window.JB_SUPABASE_CONFIG={publishableKey:"sb_publishable_PUBLIC_ONLY",url:"https://example.supabase.co"};'),[]);
});
test('T064 browser Supabase config is publishable-only; exact public project ID explicitly detected',()=>{
 const config=readFileSync(resolve(root,'JANTA_BOL_PHASE_3C_WORKING/supabase-config.js'),'utf8');
 assert.match(config,/publishableKey:\s*['"]sb_publishable_[A-Za-z0-9_-]+['"]/);
 assert.match(config,/url:\s*['"]https:\/\/[a-z0-9]+\.supabase\.co['"]/);
 assert.doesNotMatch(config,/(?:service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD)/i);
 assert.match(config,/vrffsnkycvjithwtiylt\.supabase\.co/);
 // This last test identifies the real environment-isolation risk; does NOT certify
 // Preview/Production separation when both serve exactly this checked-in config.
});
test('T064 no committed live secret-file extensions and no build-key values',()=>{
 const forbidden=tracked.filter(p=>/(?:^|\/)\.env(?:\..+)?$|\.pem$|\.p12$|\.pfx$|(?:^|\/)\.pgpass$|(?:^|\/)service[-_]account[^/]*\.json$/i.test(p));
 assert.deepEqual(forbidden,[]);
});
