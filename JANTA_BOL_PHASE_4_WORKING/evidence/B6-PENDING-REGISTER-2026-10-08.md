# JANTA BOL — B6 Pending / Deferred Register
Date: 2026-10-08
Purpose: preserve outstanding scope without blocking B7. This file is a pending ledger, not a blanket B6 PASS certificate.

## P4-T017 — Notifications
- VERIFIED: authenticated in-app compliance notifications rendered on Android; four compliance notification cards; action link navigated to compliance page; backend records exist.
- DEFERRED: Android push subscription, external queue/worker, real device delivery proof, retry/dedupe, read/unread end-to-end update, timestamp display and delivery-status proof.
- Founder channel decision: Android Push PRIMARY; In-App MANDATORY BACKUP; Email optional/not planned now.
- Status: IN-APP scope verified; external push NOT PASS. Do not infer delivered from IN_APP_READY.

## P4-T018 — Government Submission Lifecycle
- **PASS + LOCK — SYNTHETIC LIFECYCLE ONLY**, per Founder scope decision and TEST-REGISTER commit 92b3465aed11e76a651f01a4c786120498670ed4.
- VERIFIED: synthetic prepared → review → ready → submitted → complete; missing-reference denial; owner escalation controls; AAL1 negative; audit/history; CI #430 GREEN.
- DEFERRED: real government filing, official acknowledgement, genuine government source/document evidence and external government integration (E9 real-world gate).
- Synthetic submission/acknowledgement IDs are NOT real filings. Reopen a separate real-world gate when government submission is actually required.

## P4-T019 — Compliance Security / Independence
- VERIFIED: selected RLS/permission denial, audit checks, Android basic flow; CI #456 COMPLETED SUCCESS; isolated mocked publishing fault-injection passed.
- PENDING: real authenticated API/staging proof of article publishing during compliance failure and recovery; exhaustive enacted official-rule applicability mapping; remaining Master test gate reconciliation and mobile/Founder-time coverage where required.
- Status: NOT FULL PASS/LOCK. Mock failure does not establish real outage resilience.

## P4-T020
- Not assessed in this pending-list update. Do not infer PASS, FAIL, or pending from this entry; verify against TEST-REGISTER/master evidence separately.

## Execution boundary
- Proceeding to B7 is permitted as a work-priority decision, NOT a declaration that all B6 tests are fully complete.
- Do not repeat already evidenced checks without a specific regression reason.
- No real government submission, external notification, or production failure injection was performed by creating this register.
