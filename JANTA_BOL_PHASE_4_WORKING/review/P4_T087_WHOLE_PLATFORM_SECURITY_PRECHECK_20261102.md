# JANTA BOL — B13 / P4-T087 — Whole Phase-4 Module Regression + Security Negatives

**Date:** 2026-11-02 IST. **Original source:** Phase-4 Final Test Blueprint, page 309, Topic 12, RUN-15, **AUTO / FULL SECURITY REGRESSION**, §§773–783. Required **E1 = CI/logs**, **E2 = real DB/RLS/RPC/API response**, **E5 = audit/history/notification/lifecycle record**. Mandatory protection: **Full required old Security + Functional CI**.

**Acceptance condition (original):** each completed module continues to satisfy its locked behavior; unauthorized/private access denied; no cross-module regressions.

**Founder request:** START T087 following reviewed T086 individual RUN15 evidence lock in Draft PR #110, no repeat Android steps. **Do not label incomplete test PASS.** Soft Launch highest priority; old original Article, Auth, Ads, Live and published site unchanged; no paid system, production SQL mutation or Vercel promotion.

## Exact checkpoint + original legacy
Source branch parent at T086 Final `e5cb88f98ec6f5a7f9e71c6e4b1fa1291a74ee71`. Previous exact `41395842390` completed SUCCESS: original protected T086 16 historical + current 16, whole Article/CAS 6, original T080/T083 120/120, Phase-3 Live Architecture and old disposable PG17 G0/G1. **T086 historical evidence remains untouched**. `TEST-REGISTER.md` T087 currently `NOT RUN — FINAL`; set `IN PROGRESS` only with actual new CI evidence, and `PASS` only when required original E1/E2/E5 all satisfied with no unresolved completed-module cross-regression.
Referenced historical incomplete boundaries are not “turned green” by a broad source test: B10 T063 device recovery, T064 original tracked ZIP secret audit, T065 hosted cross-account signed HTTP, T068 reconciliation, B11 actual joint restore and B8 T098 real factual correction still have scoped/DUE proof. Any blocker to original T087 acceptance is recorded, not silently waived.

## E2 live connected Supabase read-only baseline — actual 2026-11-02 SQL SELECTs
Real project **`vrffsnkycvjithwtiylt`**, **NO production mutations**:
1. 61 relevant `public` physical tables matched across Article/version, Live, user roles/team, grievances/compliance, advertisement, notifications, social, B8, B9 and audit. **61/61 `relrowsecurity=true`, none disabled**. This is only **RLS config presence**, not a real cross-account denial, not a hosted HTTP negative matrix.
2. Specific `pg_policies` SELECT: `article_versions` Owner SELECT `private.current_owner_aal2()`; `audit_logs` Owner SELECT same; `live_notifications` self-read requires `recipient_user_id=auth.uid()` AND `private.current_session_active()`; Team read policy requires Owner AAL2, separate self-read requires active session; `live_sessions` Owner `private.current_owner_aal2()`; `user_roles` recent-MFA management policy `private.current_owner_recent_mfa(600)`. Public `articles` anon SELECT only published, but exact table policy is not proof that every other data path is safe: keep signed HTTP cross-account E2 separately DUE.
3. Data protection triggers (actual catalog): `audit_logs.trg_jb_audit_immutable_guard`, `articles.trg_capture_article_history`, `articles.trg_enforce_article_lifecycle`, `articles.b8_guard_linked_article_hard_delete`, `b8_case_article_links.b8_case_article_links_immutable`, `b8_case_review_events.b8_review_events_immutable`; this checks presence, not complete absence of bypass.
4. DB roles `authenticated` has broad table-level grants on `articles` and `article_versions`; these MUST be constrained by RLS, security-definer session guards and immutability triggers. Do not mistake the grants alone for an exploitable privilege, but preserve real cross-account HTTP failure checks as DUE.

## E5 actual live audit/immutable history baseline — aggregate counts ONLY, no PII
Real `public.audit_logs` SELECT by record_type/action:
- Article `article_update=932`, `article_create=36`, `SOCIAL_PREFERENCES=50`, `SOCIAL_DISTRIBUTION_STATE=9`.
- Grievance `grievance_status=17`, retention `retention_mark_due=4`, `retention_hold=3`.
- Compliance `COMPLIANCE_MONTH_APPROVE=4`, `compliance_status=4`, `COMPLIANCE_ESCALATION_READY=3`.
- Ads `ad_status=8`, `ad_verification=3`.
- Security `security_session_revoked=9`, `security_mfa_factor_add_requested=10`, `owner_recovery_key_set=6`, `security_mfa_factor_remove_requested=7`.
- Team `team_public_name_changed=2`, `team_suspended=1`, `team_role_changed=1`.
- Social `SOCIAL_GLOBAL_SETTING=2`. Live `live_request_submitted=18`, `public_live_activated=22`, `live_interrupted=18`, `live_session_created=16`, `live_permission_revoked=6`, additional protected Live lifecycle actions exist; **historical audit event count is not proof of current provider streaming**.
- These are real **E5 presence/continuity** examples, not proof every one of 13 module families has an independently verified end-to-end E5 sequence. No actual notifications delivered or backup restored in this preflight.

## E1 current source negative matrix work
One dedicated new read-only Node test for 13 families: (1) Core News/Article, (2) Grievance, (3) Compliance, (4) Team/Auth, (5) Social, (6) Ads, (7) Notifications, (8) Audit/Retention, (9) Search/Analytics, (10) B8 Accountability, (11) Phase3 Live, (12) Backup/Recovery, (13) platform security/public boundaries. Tests require exact scoped original security sources and old tests to exist, disallow product change, preserve original T087 REGISTER status, and enforce explicit held proof. Additional *actual old executable suites* to run: original Phase-3 Auth/security/recovery/incident, B10 T060–T068 source/security + negative, B9 public search, B8 public/private source, B7 advertiser revocation/zero paid, B11 13 adapter failure isolation, Founder AAL2 and 15min lock source, T080/T083/T086, B10 T068 unresolved HOLD contract, original PG17 protected B0–B8/News/Auth/B7 via reusable workflow. 
Never report code existence as an exercised hosted denied cross-account attack.

## Exact scope/due matrix
`T087_OLD_PROTECTED_CI=CI_PENDING`
`T087_13_MODULE_SOURCE_AND_SECURITY_NEGATIVES=CI_PENDING`
`T087_REAL_CONNECTED_E2_RLS_61_OF_61=PASS_SCOPED_CONFIG_ONLY`
`T087_REAL_HOSTED_CROSS_ACCOUNT_HTTPS_NEGATIVES=DUE`
`T087_REAL_E5_AUDIT_FAMILY_CONTINUITY=PASS_SCOPED_AGGREGATES_ONLY`
`T087_WHOLE_PLATFORM_E1_E2_E5_RECONCILIATION=PARTIAL`
`T087_ORIGINAL_FULL_PASS_LOCK=HOLD`
`T087_OLD_NEWS_ARTICLE_ADS_AUTH_LIVE_PROD_MODIFIED=NO`
`T087_FOUNDER_ANDROID_MANUAL_STEP=NONE_NOW`

## Stop conditions
Any original protected CI failure, unauthorised/private leak, leaked key, weakening MFA/Owner, stale/revoked JWT data access, different Article ID/PURL, fake Live, unreliable backup, or skipped original full security family => RED_STOP and exact minimum fix. No synthetic private leak is accepted as actual hosted E2. **Do not start T088 Final as if T087 is PASS**. Report scoped evidence and genuine DUE at test end.
