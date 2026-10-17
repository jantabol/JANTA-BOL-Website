'use strict';
// JANTA BOL P4-T036 exact official ADS016..023 SOURCE-ONLY authority audit.
// This file never connects to Supabase and cannot approve financial records.
// PASS means "honest contract/evidence mapping and client fail-closed", NOT T036 E2/E5.
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='JANTA_BOL_PHASE_4_WORKING/';
const manifest=JSON.parse(fs.readFileSync(root+'review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
const t=manifest.canonical_tests.find(x=>x.id==='P4-T036');
assert.deepEqual(t.range,[16,23]);
assert.deepEqual(t.required_evidence,['E2','E5']);
assert.equal(t.final_status,'DUE','NO_FAKE_PASS: T036 cannot be closed on code-only evidence');
const ads=manifest.ads.filter(x=>x.canonical_test==='P4-T036');
assert.equal(ads.length,8);
assert.deepEqual(ads.map(x=>x.id),Array.from({length:8},(_,i)=>'ADS-'+String(16+i).padStart(3,'0')));
assert.ok(ads.every(x=>x.final_status==='DUE'));
const app=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8');
const renderer=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
const schedule=fs.readFileSync(root+'db/20261012_b7_schedule_integrity_REVIEW_ONLY.sql','utf8');
const lifecycle=fs.readFileSync(root+'db/20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql','utf8');
// No false LIVE readiness: positive states still strictly blocked in the
// CLIENT while the official server-only lifecycle capability is absent.
assert.match(app,/jb_ad_lifecycle_capability_internal/);
assert.match(app,/B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED/);
assert.match(app,/return rpc\('jb_ad_transition_internal'/);
assert.match(app,/function adSchedule\(id,start,end\)/);
assert.match(renderer,/pinnedArticleSlots\.add\(slot\)/);
assert.match(renderer,/data\.length!==1/);
assert.match(renderer,/scopeForArticle/);
assert.match(renderer,/function decodedPoster/);
// Conservative metadata/status guard source checks; the REAL CI jobs execute
// these files in PostgreSQL 17, not just check these strings.
for(const contract of ['BE08_SCHEDULE_LIVE_SOURCE_DRIFT_INDEPENDENT_RCA_REQUIRED',
 'B7_SCHEDULE_START_MUST_BE_FUTURE','B7_SOLD_WINDOW_IMMUTABLE',
 'B7_SCHEDULE_STATUS_LOCKED','ad_schedule_changed']){
 assert.ok(schedule.includes(contract),'BE08 schedule source lost contract: '+contract);
}
for(const contract of ['B7_ADVERTISER_NOT_VERIFIED',
 'B7_LIVE_VERIFIED_RECEIPT_MISSING','B7_LIVE_INVALID_SOURCE_STATE',
 'B7_VERIFIED_TEXT_CREATIVE_REQUIRED']){
 assert.ok(lifecycle.includes(contract),'BE07 lifecycle source lost contract: '+contract);
}
// ADS019: no genuine active-user revocation broadcast/subscription is wired.
// The pinned Article must never silently change to a second ad; do not
// record emergency hide while-open as PASS until server-to-browser delivery exists.
const watched=/\.channel\(|postgres_changes|jb_ad_.*revok.*subscribe|eventSource|visibilityHeartbeat/i.test(renderer);
assert.equal(watched,false,'ADS019 unexpected viewer revocation code needs independent review');
console.log('T036_CP01_SOURCE_AUTHORITY=PASS; canonical ADS016..023=8 mapped and DUE');
console.log('T036_SOURCE_OWNER_POSITIVE_STATUS_FAIL_CLOSED=PASS (CLIENT E1 ONLY)');
console.log('T036_SOURCE_PG_SCHEDULE_AND_LIFECYCLE_CONTRACTS=PASS (isolated SQL separately)');
console.log('T036_ADS019_VIEWER_REVOCATION_REAL_DELIVERY=HOLD; PINNED_NO_AUTOREPLACE');
console.log('T036_LIVE_E2_REAL_IDENTITY_E5=HOLD; NO_PRODUCTION_WRITES; FINAL_LOCK=HOLD');
