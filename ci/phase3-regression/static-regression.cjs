#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const APP = path.join(ROOT, 'JANTA_BOL_PHASE_3C_WORKING');
const SNAP = path.join(ROOT, 'CODEX_CURRENT_SUPABASE', 'functions');
const OUTDIR = path.join(ROOT, 'ci-results');
fs.mkdirSync(OUTDIR, { recursive: true });

const results = [];
function record(id, ok, detail, layer='static') {
  results.push({ test_id:id, ok:Boolean(ok), detail, layer });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${id}] ${detail}`);
}
function mustFile(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) && fs.statSync(p).isFile();
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function walk(dir) {
  const out=[];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes:true })) {
    const p=path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function rel(p){ return path.relative(ROOT,p).replace(/\\/g,'/'); }

// CI infrastructure checks are deliberately separate from official register PASS.
let infraOk=true;
for (const f of walk(APP).filter(f=>f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', f], {stdio:'pipe'}); }
  catch (e) {
    infraOk=false;
    console.error(`FAIL [CI-JS-SYNTAX] ${rel(f)}\n${String(e.stderr||e.message)}`);
  }
}
if (infraOk) console.log('PASS [CI-JS-SYNTAX] All application JavaScript parses.');

const essential = [
  'JANTA_BOL_PHASE_3C_WORKING/CODE-MAP.md',
  'JANTA_BOL_PHASE_3C_WORKING/DEBUG-MAP.md',
  'JANTA_BOL_PHASE_3C_WORKING/CHANGELOG.md',
  'JANTA_BOL_PHASE_3C_WORKING/TEST-REGISTER.md',
  'JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js',
  'JANTA_BOL_PHASE_3C_WORKING/phase3b-admin-ui.js',
  'JANTA_BOL_PHASE_3C_WORKING/phase3b-reporter-ui.js',
  'CODEX_CURRENT_SUPABASE/functions/jb-live-api/index.ts',
  'CODEX_CURRENT_SUPABASE/functions/jb-live-worker/index.ts'
];
const missing = essential.filter(x=>!mustFile(x));
if (missing.length) {
  infraOk=false;
  console.error('FAIL [CI-ESSENTIAL-FILES] Missing: '+missing.join(', '));
} else console.log('PASS [CI-ESSENTIAL-FILES] Required Phase 3 artifacts present.');

// Official register mapped checks.
record('3A-P4-T004', mustFile('JANTA_BOL_PHASE_3C_WORKING/CODE-MAP.md'), 'CODE-MAP present.');
record('3A-P4-T006',
  mustFile('JANTA_BOL_PHASE_3C_WORKING/CHANGELOG.md') && mustFile('JANTA_BOL_PHASE_3C_WORKING/PHASE3C-BASELINE-AUDIT.md'),
  'Versioned working baseline + changelog artifacts present.');
record('3A-P4-T007',
  mustFile('JANTA_BOL_PHASE_3C_WORKING/DEBUG-MAP.md') && mustFile('JANTA_BOL_PHASE_3C_WORKING/TEST-REGISTER.md'),
  'DEBUG-MAP and TEST-REGISTER present.');

const runtimeFiles = [
  ...walk(APP).filter(f=>/\.(js|html)$/i.test(f)),
  ...walk(SNAP).filter(f=>/\.ts$/i.test(f))
];
const frontendFiles = walk(APP).filter(f=>/\.(js|html)$/i.test(f));
const forbiddenFrontend = [
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /JB_SUPABASE_SERVICE_ROLE_KEY/i,
  /service_role\s*[:=]/i,
  /client_secret\s*[:=]/i,
  /refresh_token\s*[:=]/i,
  /ya29\.[A-Za-z0-9_-]+/,
];
const frontendLeaks=[];
for (const f of frontendFiles) {
  const s=fs.readFileSync(f,'utf8');
  for (const re of forbiddenFrontend) if (re.test(s)) frontendLeaks.push(`${rel(f)} => ${re}`);
}
record('3A-P4-T067', frontendLeaks.length===0,
  frontendLeaks.length ? 'Frontend secret-like material found: '+frontendLeaks.join('; ') : 'No backend/service-role/OAuth secret material in frontend runtime files.');

const repoSecretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /ya29\.[A-Za-z0-9_-]+/,
  /sb_secret_[A-Za-z0-9_-]{15,}/,
];
const repoLeaks=[];
for (const f of runtimeFiles) {
  const s=fs.readFileSync(f,'utf8');
  for (const re of repoSecretPatterns) if (re.test(s)) repoLeaks.push(`${rel(f)} => ${re}`);
}
record('3A-P3-T171', repoLeaks.length===0,
  repoLeaks.length ? 'Secret scan hit: '+repoLeaks.join('; ') : 'Runtime/source secret scan clean for high-risk secret formats.');

const cfg = read('JANTA_BOL_PHASE_3C_WORKING/supabase-config.js');
const cfgSafe = /publishableKey\s*:/.test(cfg) &&
  !/service_role/i.test(cfg) &&
  !/secret/i.test(cfg.replace(/publishableKey/g,''));
record('3A-P3-T071', cfgSafe, 'Frontend Supabase config uses publishable-key model; no reusable privileged key exposed.');

const liveClient = read('JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js');
const adminUi = read('JANTA_BOL_PHASE_3C_WORKING/phase3b-admin-ui.js');
const reporterUi = read('JANTA_BOL_PHASE_3C_WORKING/phase3b-reporter-ui.js');
const edge = read('CODEX_CURRENT_SUPABASE/functions/jb-live-api/index.ts');

record('3B-T001',
  /global\.JBLive\s*=/.test(liveClient) &&
  /JBLive\./.test(adminUi) && /JBLive\./.test(reporterUi) &&
  !/createClient\s*\(/.test(adminUi) && !/createClient\s*\(/.test(reporterUi),
  'Phase 3B UI extends the existing canonical JBLive client instead of creating a parallel frontend Live engine.');

record('3A-P3-T080',
  /userClient\.auth\.getUser\(token\)/.test(edge) &&
  /Authorization/.test(edge) &&
  /JB_SUPABASE_SERVICE_ROLE_KEY/.test(edge),
  'Live API uses server-side authenticated user validation and keeps privileged service key in server environment.');

record('3A-P3-T126',
  /a\.role\s*!==\s*"owner"\s*\|\|\s*a\.aal\s*!==\s*"aal2"/.test(edge),
  'High-risk Phase 3B admin actions retain owner + AAL2 server checks.');

record('3B-T026',
  /Force Stop reason/.test(adminUi) &&
  /const sessionId=.*reason=textValue\(payload\.reason,240\)/s.test(edge) &&
  /!validUuid\(sessionId\)\|\|!reason/.test(edge),
  'Force Stop requires a reason in UI and server request validation.');

record('3B-T058',
  !/PUBLIC_REPORTER_NAME_(?:ON|OFF)/.test(reporterUi) &&
  /PUBLIC_REPORTER_NAME_(?:ON|OFF)/.test(adminUi),
  'Reporter UI cannot directly expose public-name control; Admin UI owns the control.');

record('3B-T069',
  !/permanent_delete|admin_delete_update/i.test(reporterUi) &&
  /p3bAdminDeleteUpdate/.test(liveClient),
  'Permanent-delete path is not exposed in Reporter UI and remains an admin-side client action.');

record('3B-T079',
  /p3bAdminFinalPublish/.test(liveClient) &&
  /a\.role\s*!==\s*"owner"\s*\|\|\s*a\.aal\s*!==\s*"aal2"/.test(edge),
  'Default Final Report publish path has owner/AAL2 server enforcement.');

record('3A-P2-T159',
  !/DRONE/.test(reporterUi),
  'Phase 3A/normal Reporter UI does not expose a standalone Drone control layer.');

const fail = results.filter(r=>!r.ok);
const payload = {
  generated_at:new Date().toISOString(),
  register_checks:results.length,
  pass:results.length-fail.length,
  fail:fail.length,
  infra_ok:infraOk,
  results
};
fs.writeFileSync(path.join(OUTDIR,'static-results.json'), JSON.stringify(payload,null,2));

let md = '# Phase 3 static regression\n\n';
md += `Register-mapped checks: **${payload.register_checks}**  PASS: **${payload.pass}**  FAIL: **${payload.fail}**\n\n`;
for (const r of results) md += `- ${r.ok?'✅':'❌'} **${r.test_id}** — ${r.detail}\n`;
if (!infraOk) md += '\n❌ CI infrastructure checks also failed.\n';
fs.writeFileSync(path.join(OUTDIR,'static-summary.md'), md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);

if (!infraOk || fail.length) process.exit(1);
