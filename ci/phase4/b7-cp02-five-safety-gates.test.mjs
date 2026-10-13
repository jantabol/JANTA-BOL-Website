'use strict';
// CP02: Five original B7 guardrails must remain wired together.
// This is SOURCE CONTRACT evidence, not proof of deployed Owner E5/real E7.
// Actual isolated PostgreSQL/media worker tests remain independent jobs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const root='JANTA_BOL_PHASE_4_WORKING/db/';
const shared='CODEX_CURRENT_SUPABASE/functions/_shared/';
const wf=read('.github/workflows/p4-t035-candidate-static.yml');
function exists(text,words){for(const w of words)assert.ok(text.includes(w),'Missing safety guard '+w)}
test('BE05: media enqueue and release cannot bypass Owner AAL2, private proof or approval',()=>{
 const queue=read(shared+'b7-private-media-command-queue.mjs');
 const release=read(shared+'b7-public-release-worker.mjs');
 exists(queue,['ACTIVE_OWNER_AAL2_REQUIRED','OWNER_SESSION_REVOKED','CREATIVE_CHANGED_DURING_PREFLIGHT',
   'SOURCE_SHA256_MISMATCH','DURABLE_COMMAND_READBACK_FAILED','RECONCILIATION_NOT_DURABLE']);
 exists(release,['B7_EXPLICIT_MEDIA_RELEASE_V1','OWNER_REVOKED_BEFORE_RELEASE',
   'PRIVATE_SANITIZED_DERIVATIVE_HASH_MISMATCH','NOT_LATEST_PENDING_CREATIVE',
   'PUBLIC_RELEASE_NOT_VERIFIED','clean_public_bucket!==CLEAN_PUBLIC_BUCKET']);
 for(const item of ['ci/phase4/b7-private-media-command-queue.test.mjs',
   'ci/phase4/b7-public-release-worker.test.mjs',
   'ci/phase4/b7-media-queue-regression.sql'])exists(wf,[item]);
});
test('BE06: ffmpeg real sanitize candidate retains denied metadata, hash and poster tests',()=>{
 const video=read(shared+'b7-video-sanitize.mjs');
 exists(video,['ffprobe','ffmpeg','-map_metadata','-1',
   'PRIVACY_METADATA_SURVIVED_TRANSCODE','stripFfmpegPosterDensity',
   'inspectCleanPngContainer','POSTER_CONTAINER_OR_METADATA_UNVERIFIED']);
 for(const p of ['ci/phase4/b7-video-sanitize.test.mjs',
   'ci/phase4/b7-video-private-stage.test.mjs','ci/phase4/b7-media-byte-policy.test.mjs'])
  exists(wf,[p]);
});
test('BE07: legacy payment guard plus new Owner LIVE-state guard both remain required',()=>{
 const payment=read(root+'20261010_b7_manual_payment_REVIEW_ONLY.sql');
 const live=read(root+'20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql');
 exists(payment,['b7_guard_campaign_live','b7_guard_manual_payment_evidence',
   'AD_NOT_ELIGIBLE_FOR_LIVE']);
 exists(live,['b7_verified_state_guard','B7_NO_DIRECT_POSITIVE_STATUS_INSERT',
   'B7_LIVE_VERIFIED_RECEIPT_MISSING','B7_ADVERTISER_NOT_VERIFIED',
   'B7_VERIFIED_TEXT_CREATIVE_REQUIRED','B7_LIVE_INVALID_SOURCE_STATE']);
 exists(wf,['ci/phase4/b7-lifecycle-state-regression.sql','b7-lifecycle-postgres:']);
 assert.doesNotMatch(live,/create or replace function public\.jb_ad_lifecycle_capability_internal/i,
  'A source candidate must not advertise real deployed readiness');
});
test('BE08: paid/hidden schedule immutable, Owner state locked and append-only change audit',()=>{
 const schedule=read(root+'20261012_b7_schedule_integrity_REVIEW_ONLY.sql');
 exists(schedule,['b7_schedule_window_guard','b7_schedule_change_audit',
   'B7_SOLD_WINDOW_IMMUTABLE','B7_SCHEDULE_START_MUST_BE_FUTURE',
   'B7_SCHEDULE_STATUS_LOCKED','ad_schedule_changed']);
 exists(wf,['ci/phase4/b7-schedule-integrity-regression.sql','b7-schedule-postgres:']);
});
test('BE09: Owner-verified quote/consent/receipt and legacy false payment API denied',()=>{
 const payment=read(root+'20261010_b7_manual_payment_REVIEW_ONLY.sql');
 const js=read('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js');
 exists(payment,['b7_one_confirmed_payment_per_campaign',
   'b7_confirmed_payment_reference_unique','MANUAL_PAYMENT_EVIDENCE_REQUIRED',
   'EXPLICIT_CONFIRM_REQUIRED','TERMS_ACCEPTANCE_CHRONOLOGY_INVALID',
   'CONFIRMED_PAYMENT_IMMUTABLE']);
 exists(js,['B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE',
   'jb_ad_confirm_manual_payment_internal']);
 assert.doesNotMatch(js,/rpc\('jb_ad_confirm_payment_internal'/,
  'Never re-enable legacy weak confirmed payment helper');
 exists(wf,['ci/phase4/b7-payment-regression.sql','b7-payment-postgres:',
   'ci/phase4/b7-legacy-payment-client-gate.test.cjs']);
});
