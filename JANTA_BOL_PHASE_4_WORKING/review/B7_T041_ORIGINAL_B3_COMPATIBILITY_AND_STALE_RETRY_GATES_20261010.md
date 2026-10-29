# JANTA BOL / B7 — Original B3 integration gate
Date: 10 October 2026 | Draft PR #5 | NOT DEPLOYED / NO FINAL PASS

## Source authority and proof
- Production B3 source was read-only inspected: `public.jb_notification_emit_internal` includes revoked-recipient guard, password/token protection, priority/consequence, canonical `notification_delivery_history` IN_APP receipt and `record_retention_state` under `notification_history_v1`. This was compared against the existing repository migration 005. No hosted production SQL changes or simulated external WhatsApp success.
- New additional GitHub Candidate job executes ORIGINAL repo migration files 001, 002 and 005 verbatim, not a recreated function. `ci/phase4/b7-b3-real-contract-regression.sql` asserts the real B3 component behavior: Owner inbox, ATTENTION, IN_APP history, notification retention, unchanged-status dedupe, revoked-team rejection without dropping an ad request, AAL2 Owner audited retry and no unsafe token/password.
- Previously verified synthetic B3 shim and two real PostgreSQL race sessions remain active. Both types are E1/E2 technical proofs, not Android E3 or Founder E5.

## Stale notification fail-close behavior
- Owner retries refer to ORIGINAL immutable audit event IDs. A failed `ad_live` from before a subsequent HIDE must NOT tell the Founder a currently hidden ad is LIVE.
- Before B3 emit, new review-only retry implementation checks canonical `ad_campaigns.status`, verified advertiser state, or confirmed payment when relevant; stale conditions convert to generic `ad_workflow_updated`, HIGH/Owner ACTION_REQUIRED. Append new `ad_notification_retry_succeeded` evidence with source and delivered event names; never alter original failed audit or mark external channel SENT.
- Malformed audit record UUID returns `INVALID_NOTIFICATION_FAILURE_REFERENCE`; no new in-app message.

## Independent RCA register
- Broken String.replace of a SQL regex ending `$'` created duplicated source tail/unterminated SQL (CI failures 38068722555 and 38068766516). Rebuilt from exact prior green migration SHA, callback-safe substitutions and checked one complete migration; fixed at `9b1280a8`.
- Original concurrency fixture `ad_hidden` mismatched campaign state `approved`. New correct stale-state rule suppressed that false label; changed fixture's synthetic old event to `ad_approved` but DID NOT remove or relax the requirement of one B3 in-app receipt and one success audit. New independent LIVE->HIDE negative lives in original B3 contract test.

## Current gate
- Candidate run 38068932569 **14/14 GREEN on SHA 7342dbc2cb753f39b73e308475c778c2e4c545fb**. Protected run 38068932596 launched on same SHA (verify completion).
- The original SQL migration remains REVIEW_ONLY, Draft PR not merged, no production incident drill or real Android Owner screen. E5 full RLS/AAL2 and role revoke, E3, official LGD, paid feed deployment and qualified anti-bot analytics remain DUE. P4-T041 IN PROGRESS; all nine final B7 tests NOT LOCKED.
