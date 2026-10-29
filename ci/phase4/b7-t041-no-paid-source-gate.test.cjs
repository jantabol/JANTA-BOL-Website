'use strict';
// P4-T041 CP01 truthful SOURCE/E1 gate. This is NOT hosted E2, Owner E5,
// provider delivery, customer money, Android E3 or commercial release proof.
const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const notif=read('JANTA_BOL_PHASE_4_WORKING/db/20261010_b7_unified_notifications_REVIEW_ONLY.sql');
const retention=read('JANTA_BOL_PHASE_4_WORKING/db/20261010_b7_retention_audit_REVIEW_ONLY.sql');
const realB3=read('CODEX_CURRENT_SUPABASE/migrations/20261003000500_phase4_b3_notification_privacy_priority_reminders.sql');
const article=read('JANTA_BOL_PHASE_3C_WORKING/article.html');
const homepage=read('JANTA_BOL_PHASE_3C_WORKING/index.html');
const workflow=read('.github/workflows/b7-t041-no-paid-disposable-contracts.yml');

test('ADS051 single existing B3 notification authority, no duplicate storage or external send',()=>{
 assert.match(notif,/REVIEW ONLY, NOT PRODUCTION/i);
 assert.match(notif,/public\.jb_notification_emit_internal\(/);
 assert.match(notif,/public\.live_notifications/);
 assert.doesNotMatch(notif,/create\s+table\s+(?:if not exists\s+)?public\.live_notifications\b/i);
 assert.match(notif,/'IN_APP_ONLY'/);
 assert.match(notif,/'ads\.html'/);
 assert.match(notif,/B7_UNIFIED_NOTIFICATION_ENGINE_NOT_READY/);
});
test('ADS055 fail-safe notification outage NEVER claims WhatsApp or blocks core business',()=>{
 assert.match(notif,/exception when others then[\s\S]*'ad_notification_failed'/);
 assert.match(notif,/'NOT_CONFIRMED'/);
 assert.match(notif,/'OWNER_REVIEW_REQUIRED'/);
 assert.match(notif,/'external_provider_sent',false/);
 assert.match(notif,/return new;\s*end \$tap\$/);
 assert.match(realB3,/UNSAFE_NOTIFICATION_CONTENT/);
});
test('ADS054 Owner AAL2 retry and immutable concurrent audit',()=>{
 assert.match(notif,/if not private\.p4_owner_allowed\(\) then raise exception 'OWNER_AAL2_REQUIRED'/);
 assert.match(notif,/where id=p_failure_audit_id[\s\S]*for update;/i);
 assert.match(notif,/revoke all on function public\.jb_ad_notification_retry_internal\(bigint\)/i);
 assert.match(notif,/revoke all on function public\.jb_ad_notification_failures_internal\(\)/i);
 assert.match(notif,/STALE_STATE|stale_state_sanitized/);
});
test('ADS052/053 original B3 policy, append-only audited commerce and anti-purge under hold',()=>{
 assert.match(retention,/REVIEW ONLY \/ NOT LIVE/i);
 assert.match(retention,/automatic_disposition=false/i);
 assert.match(retention,/B7_COMMERCIAL_HISTORY_APPEND_ONLY/);
 assert.match(retention,/B7_COMMERCIAL_DELETE_REQUIRES_SEPARATE_RETENTION_DISPOSITION/);
 assert.match(retention,/B7_APPROVED_CREATIVE_VERSION_IMMUTABLE/);
 assert.match(retention,/on conflict\(domain,record_type,record_id\) do nothing/i);
});
test('ADS056 staged adapters not loaded by publicly read Article or Homepage',()=>{
 assert.match(article,/public-ads\.js/);
 assert.match(homepage,/public-ads\.js/);
 assert.doesNotMatch(article,/b7_ad_emit_inapp_owner|jb_ad_notification_retry_internal|b7_t041/i);
 assert.doesNotMatch(homepage,/b7_ad_emit_inapp_owner|jb_ad_notification_retry_internal|b7_t041/i);
 assert.doesNotMatch(article,/ad-analytics-client\.js|ad-viewability\.js/i);
});
test('Safe zero-paid CI isolation: disposable database only, no LIVE credentials, no deployed migration',()=>{
 assert.match(workflow,/postgres:17/);
 assert.match(workflow,/PGDATABASE: b7_t041_/);
 assert.match(workflow,/REVIEW_ONLY\.sql/);
 assert.match(workflow,/on:\n  push:/);
 assert.doesNotMatch(workflow,/SUPABASE_(SERVICE_ROLE_KEY|DB_PASSWORD)|VERCEL_TOKEN|stripe_secret|workflow_dispatch:\s*\{[^}]*production/i);
 assert.doesNotMatch(workflow,/supabase db push|vercel deploy|deploy --prod/i);
});
