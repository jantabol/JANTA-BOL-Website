# JANTA BOL — Phase 4 B10 / P4-T062 Real Security Test Report
**Date:** 2026-10-23 IST. Original RUN-09, Topic 9, Sections 498–516. E1 + E2 + E5.
**Scope:** Public/Reporter/Team/Editor/Admin/Advertiser/Founder role matrix across News, Sources, Grievance/Compliance, Ads, Social, Notifications, Audit/Retention, B8 and B9 owner search.
**Final verdict:** P4-T062 PASS + LOCK, with bounded actor coverage and evidence qualifications below; B10 itself NOT LOCKED.

## Two real LIVE privilege defects found and fixed (Founder authorized)
**F01 Owner private article history lacked active AAL2 gate.** Original article_versions SELECT/INSERT checked only current_app_role() = owner; missing active Founder session/AAL2 validation. Two existing RLS policy predicates tightened to private.current_owner_aal2(), preserving privileged history capture trigger and all 878 historic rows. Fix: db/20261023_b10_t062_article_version_owner_aal2_SAFE.sql. Emergency rollback is in db/20261023_b10_t062_original_owner_history_policy_REVERT_REVIEW_ONLY.sql, not executed. Actual database Owner identity with matching backend session but AAL1 returned 0 protected versions, 0 private sources and 0 audit rows. Synthetic Owner AAL2 with valid session positive; Owner AAL1 or no session negative; Editor, Reporter, Advertiser and Public never see Owner history.

**F02 Reporter could read other authors' Draft/Unpublished Articles.** Actual initial LIVE Reporter authenticated SQL-role/session-matched probe returned 32 Articles, including 16 non-public Articles authored by others. Root cause: staff_can_read_all_articles SELECT policy included Reporter for the entire newsroom. One existing SELECT predicate was narrowed to active Editor/Admin and Owner AAL2; two additive SELECT policies preserve Authenticated public Published stories and Reporter own articles/drafts with current_session_active and created_by=auth.uid(). Fix: db/20261023_b10_t062_reporter_cross_draft_read_SAFE.sql. Emergency original policy rollback is db/20261023_b10_t062_reporter_original_read_REVERT_REVIEW_ONLY.sql, not executed. Actual same Reporter/session post-fix: 16 Published Articles visible; 0 other-user hidden/drafts; 0 private Article versions/sources, 0 Grievance, 0 Ads, 0 Compliance, 0 Social settings/distribution, 0 raw Audit rows. Own Draft positive tested in isolated PG17 because LIVE account currently has 0 owned Drafts. Existing Editor/Admin can still read newsroom articles with a current active session; Founder AAL2 preserved.

## E1 — real PostgreSQL17 and protected CI
- Tests reproduce BOTH vulnerabilities on disposable PG17 before each fix, then confirm negative/positive results after.
- Actor matrix: Anonymous, authenticated without session, Reporter active/left/stale, Editor active/inactive, Admin active, external Advertiser forged Owner JWT metadata, Founder AAL1, Founder AAL2+session and revoked Founder session.
- Tests assert protected Owner history cannot be read or inserted by any non-Owner; active Founder AAL2 can read and add history in rollback-only fixture.
- Reporter can read 3 public + own 1 Draft but not two other nonpublic stories; Admin/Editor read all 6 mock newsroom stories when active; fake advert role never self-promotes; signed-out actors only public.
- Real CI latest code HEAD 7040b95b1f4cce99e9b0bd46903422a8fb377553 on run 39970471279 SUCCESS. Prior B0–B8, Phase3 Auth/Recovery/Incident, B9, B10 T061, and synthetic 5,000-Article T105 gates all retained. The optional old B8 separate ZIP workflow job was SKIPPED, not falsely called PASS.

## E2 — actual LIVE Supabase read-only post-deployment checks
- JANTA BOL ONLY: project vrffsnkycvjithwtiylt. Both scoped RLS modifications deployed as guarded atomic migrations; no Article data editing or credentials changed.
- Real SQL-role session-context simulation used existing auth.sessions rows to check backend RLS, **not** a forged signed HTTP token or real Android login. Current Reporter matched a real session and was denied newsroom private records, B9 Owner Analytics RPC, recent Owner MFA, all staff-advertiser/compliance/grievance/social/audit private records; own team row and own notifications continue to appear as intended by RLS.
- No Admin LIVE account and no Editor LIVE session were present. Those active-role positive actor gates were exercised against actual SQL RLS in isolated PostgreSQL17 fixtures, not presented as production browser evidence. Original T062 is AUTO / ROLE MATRIX; device/MFA E3 is separately T063.
- Real post-fix checks: 32/32 original UUIDs, 32/32 slugs, 878 Article History, 31 Sources, and 1,560 protected Audit records untouched. Public B9 Search 16 approved articles, public LIVE Feed 7, LIVE Updates 12, B8 public Feed JSON array; no anonymous direct access to Article, Sources, Audit, History, Owner Analytics.
- Team/role grants verified from LIVE pg_policies, pg_class and routine ACLs. Sensitive B8 case/evidence tables, Advertiser portal credentials and payment tables, notification outbox and retention table direct SELECT denied to anon and authenticated.
- Critical custom GUC jb.system_live_transition is client-modifiable as SQL text; anon has no direct Article UPDATE nor execution on privileged Live activation. No exploitable HTTP route has been established; monitor as separate cross-module hardening review, not proof of full exploit.

## E5 — real historical actor provenance
- Actual 1,560 audited records: Owner 598, Reporter 139, Editor 17, System/unmapped 806. No identity or private record contents exported.
- Categorized actual audit events: Editorial 927, Live 307, Auth/Security 83, Grievance 20, Compliance 12, Ads 12, Other 199.
- Historical Article Version/Audit trigger and old authorization provenance independently checked; no fake test incident or production impersonation logged as real signed-actor evidence.
- Existing real account distribution: Owner 1, Editor 1, Reporter 2. No Admin production actor. Real user credentials, private reporter files, production tokens, recovery keys NOT read or changed.

## FINAL DECISION / containment
**P4-T062 PASS + LOCK, E1 + E2 + E5.** The test exercises valid/invalid SQL actor classes, real Reporter privacy and one active session backend gate, production RLS/cross-module ACL and real audit provenance. Signed app-browser MFA/device verification is explicitly **T063** and has NOT run. T061 remains separately PASS+LOCK. All other B10 tests remain NOT FINAL PASS. B8 and B9-T105 older HOLD gates remain, no waiver. No Cricket/Saarthi resources touched.

User instruction: **ONE FINAL B0–B10 MASTER ZIP ONLY after all B10 tests and final block lock.** Do not deliver interim ZIPs.
