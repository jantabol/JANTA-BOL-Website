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
const worker = read('CODEX_CURRENT_SUPABASE/functions/jb-live-worker/index.ts');
const reporterPage = read('JANTA_BOL_PHASE_3C_WORKING/reporter-live.html');
const publicSite = read('JANTA_BOL_PHASE_3C_WORKING/website-v3.js');
const backendClient = read('JANTA_BOL_PHASE_3C_WORKING/backend-client.js');

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

const submitStart=edge.indexOf('if (action === "reporter_submit_request")');
const submitEnd=edge.indexOf('if (action === "reporter_my_requests")');
const submitBlock=submitStart>=0 && submitEnd>submitStart ? edge.slice(submitStart,submitEnd) : '';
const myStart=submitEnd;
const myEnd=edge.indexOf('if (action === "reporter_cancel_request")');
const myBlock=myStart>=0 && myEnd>myStart ? edge.slice(myStart,myEnd) : '';
const cancelStart=myEnd;
const cancelEnd=edge.indexOf('// Phase 3B advanced operations.');
const cancelBlock=cancelStart>=0 && cancelEnd>cancelStart ? edge.slice(cancelStart,cancelEnd) : '';

record('3A-P1-T014',
  /a\.role\s*!==\s*"reporter"/.test(submitBlock) &&
  /reporter_id:\s*a\.userId/.test(submitBlock),
  'Live Request Reporter identity is derived from the authenticated server-side actor.');

record('3A-P1-T015',
  /reporter_id:\s*a\.userId/.test(submitBlock) &&
  !/payload\.reporter_id/.test(submitBlock),
  'Live Request path does not trust a caller-supplied Reporter ID.');

record('3A-P1-T022',
  /client_action_id/.test(submitBlock) &&
  /23505/.test(submitBlock) &&
  /\.eq\("reporter_id",\s*a\.userId\)/.test(submitBlock) &&
  /\.eq\("client_action_id",\s*clientActionId\)/.test(submitBlock),
  'Double-submit/idempotency path reuses the existing Reporter + client-action Request on uniqueness conflict.');

record('3A-P2-T066',
  /a\.role\s*!==\s*"reporter"/.test(submitBlock) &&
  /\.from\("live_requests"\)\.insert/.test(submitBlock) &&
  /location_confirmed/.test(submitBlock),
  'Create Live Request is an authenticated Reporter-controlled backend operation with validated request input.');

record('3A-P2-T067',
  /\.from\("live_requests"\)/.test(myBlock) &&
  /\.eq\("reporter_id",\s*a\.userId\)/.test(myBlock),
  'Reporter My Requests query is scoped to the authenticated Reporter identity.');

record('3A-P2-T068',
  /request_status\s*!==\s*"PENDING"/.test(cancelBlock) &&
  /\.eq\("reporter_id",\s*a\.userId\)/.test(cancelBlock) &&
  /\.eq\("state_version",\s*expectedVersion\)/.test(cancelBlock) &&
  /REQUEST_STATE_CHANGED/.test(cancelBlock),
  'Cancel Request path is owner-scoped to the Reporter, PENDING-only, and optimistic-version protected.');

record('3A-P3-T127',
  frontendLeaks.length===0 && /JB_SUPABASE_SERVICE_ROLE_KEY/.test(edge),
  'Browser/frontend receives no RLS-bypass service credential; privileged key remains server-side.');

record('3A-P3-T128',
  cfgSafe,
  'Frontend uses the client-safe Supabase publishable-key model.');

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


// Phase 3B exact-gap source/security evidence.
record('3B-T004',
  /reporter_id:\s*a\.userId/.test(submitBlock) &&
  !/payload\.reporter_id/.test(submitBlock) &&
  /userClient\.auth\.getUser\(token\)/.test(edge),
  'Reporter identity remains server-authenticated; caller-supplied Reporter identity is not trusted.');

const transitionStart=worker.indexOf('if(operationType==="TRANSITION_LIVE")');
const transitionEnd=worker.indexOf('if(operationType==="REFRESH_PROVIDER_STATE")');
const transitionBlock=transitionStart>=0&&transitionEnd>transitionStart?worker.slice(transitionStart,transitionEnd):'';
record('3B-T005',
  /if\(p\.ok\)/.test(transitionBlock) &&
  /jb_live_activate_public_internal/.test(transitionBlock) &&
  /RETRY_PENDING/.test(transitionBlock) &&
  /FAILED_NEEDS_ATTENTION/.test(transitionBlock),
  'Public LIVE activation remains gated by provider-confirmed transition; pending/failure paths do not declare success.');

const revokeStart=edge.indexOf('if (action === "admin_revoke_live_permission")');
const revokeEnd=edge.indexOf('if (action === "admin_suspend_reporter")');
const revokeBlock=revokeStart>=0&&revokeEnd>revokeStart?edge.slice(revokeStart,revokeEnd):'';
record('3B-T007',
  /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(revokeBlock) &&
  /\.from\("live_sessions"\)[\s\S]*\.select\("assigned_reporter_id"\)/.test(revokeBlock) &&
  /jb_live_revoke_permission_internal/.test(revokeBlock) &&
  /jb_live_revoke_capabilities_internal/.test(revokeBlock),
  'Phase 3A permission revoke is chained to Phase 3B capability/source revoke using the server-trusted assigned Reporter.');

record('3B-T011',
  /\.from\('public_live_feed'\)/.test(publicSite) &&
  /\.order\('is_priority',\{ascending:false\}\)/.test(publicSite) &&
  /PRIORITY LIVE/.test(publicSite),
  'Public homepage consumes the safe Live projection, sorts Priority first, and renders a Priority label.');

record('3B-T012',
  /liveRows\.forEach\(x=>liveBox\.appendChild\(liveCard\(x\)\)\)/.test(publicSite) &&
  /\.in\('public_status',\['LIVE','INTERRUPTED'\]\)/.test(publicSite) &&
  !/public_live_feed'\)\.update/.test(publicSite),
  'Priority rendering keeps all returned active/interrupted Lives discoverable and performs no public-feed mutation.');

record('3B-T015',
  /Expected Duration/.test(reporterPage) &&
  /expected_duration_minutes:mins/.test(reporterPage) &&
  /expected_duration_minutes/.test(submitBlock) &&
  /INVALID_DURATION/.test(submitBlock),
  'Reporter request captures Expected Duration and the server validates it.');

record('3B-T020',
  /async function endLive\(sessionId\)\{if\(!confirm\('Live end request bhejna hai\?'\)\)return;/.test(reporterPage),
  'Reporter End requires an explicit confirmation before the backend End request is sent.');

const completeStart=worker.indexOf('if(operationType==="COMPLETE_LIVE")');
const completeEnd=worker.indexOf('if(operationType==="RETIRE_STREAM")');
const completeBlock=completeStart>=0&&completeEnd>completeStart?worker.slice(completeStart,completeEnd):'';
const completePending=completeBlock.indexOf('if(p.data?.pending===true||p.data?.ambiguous===true)');
const completeSuccessBlock=completePending>0?completeBlock.slice(0,completePending):'';
record('3B-T028',
  /if\(p\.ok\)/.test(completeSuccessBlock) &&
  /jb_live_finalize_end_internal/.test(completeSuccessBlock) &&
  !/FAILED_NEEDS_ATTENTION/.test(completeSuccessBlock) &&
  /RETRY_PENDING/.test(completeBlock) &&
  /FAILED_NEEDS_ATTENTION/.test(completeBlock),
  'Provider End cleanup only finalizes inside the confirmed-success branch; pending/failure remains retry/attention state.');

const adminCorrectStart=edge.indexOf('if (action === "admin_correct_update" || action === "admin_delete_update")');
const adminCorrectEnd=edge.indexOf('if (action === "admin_feed_register"');
const adminCorrectBlock=adminCorrectStart>=0&&adminCorrectEnd>adminCorrectStart?edge.slice(adminCorrectStart,adminCorrectEnd):'';
record('3B-T066',
  /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(adminCorrectBlock) &&
  /admin_correct_update/.test(adminCorrectBlock) &&
  !/auto(?:matic)?[_ -]?public[_ -]?clarification/i.test(edge+reporterUi+adminUi),
  'Major public correction path remains Super Admin-controlled; no automatic public-clarification publisher exists.');

const feedStart=edge.indexOf('if (action === "admin_feed_register" || action === "admin_feed_confirm" || action === "admin_feed_switch")');
const feedEnd=edge.indexOf('if (action === "admin_3b_overview")');
const feedBlock=feedStart>=0&&feedEnd>feedStart?edge.slice(feedStart,feedEnd):'';
record('3B-T111',
  /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(feedBlock) &&
  /p_actor:a\.userId/.test(feedBlock) &&
  !/DRONE/.test(reporterUi),
  'Cross-user/source control is not exposed to Reporter UI; feed-source control is server-authenticated owner/AAL2 only.');

const highRiskActions=[
  'admin_replace_reporter',
  'admin_force_stop',
  'admin_final_report_publish'
];
const highRiskGuarded=highRiskActions.every(action=>{
  const i=edge.indexOf(\`if (action === "\${action}")\`);
  if(i<0)return false;
  const sample=edge.slice(i,i+500);
  return /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(sample);
});
record('3B-T116',
  highRiskGuarded &&
  /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(feedBlock) &&
  /a\.role !== "owner" \|\| a\.aal !== "aal2"/.test(adminCorrectBlock) &&
  /JB_SUPABASE_SERVICE_ROLE_KEY/.test(edge),
  'Privileged replacement/Force Stop/feed/delete/final-publish paths enforce server-side owner+AAL2 before internal RPCs.');


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
