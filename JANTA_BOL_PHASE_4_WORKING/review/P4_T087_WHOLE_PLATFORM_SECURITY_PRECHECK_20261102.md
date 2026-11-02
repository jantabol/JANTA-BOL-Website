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
`T087_OLD_PROTECTED_CI=PASS_SCOPED_CI_41402446261`
`T087_13_MODULE_SOURCE_AND_SECURITY_NEGATIVES=PASS_SCOPED_18_18`
`T087_REAL_CONNECTED_E2_RLS_61_OF_61=PASS_SCOPED_CONFIG_ONLY`
`T087_REAL_HOSTED_CROSS_ACCOUNT_HTTPS_NEGATIVES=DUE`
`T087_REAL_E5_AUDIT_FAMILY_CONTINUITY=PASS_SCOPED_AGGREGATES_ONLY`
`T087_WHOLE_PLATFORM_E1_E2_E5_RECONCILIATION=PARTIAL`
`T087_ORIGINAL_FULL_PASS_LOCK=HOLD`
`T087_OLD_NEWS_ARTICLE_ADS_AUTH_LIVE_PROD_MODIFIED=NO`
`T087_FOUNDER_ANDROID_MANUAL_STEP=NONE_NOW`

## Stop conditions
Any original protected CI failure, unauthorised/private leak, leaked key, weakening MFA/Owner, stale/revoked JWT data access, different Article ID/PURL, fake Live, unreliable backup, or skipped original full security family => RED_STOP and exact minimum fix. No synthetic private leak is accepted as actual hosted E2. **Do not start T088 Final as if T087 is PASS**. Report scoped evidence and genuine DUE at test end.


## Actual completed E1 execution and historic B7 workflow reconciliation — 2026-11-02
**GitHub Actions #41402446261 at exact source SHA `2281c505ba6c6d82601a2c7315f7e0b01679aeb7` COMPLETED SUCCESS, all four required jobs succeeded**: 13-family source/negative suites, real isolated B10 PG17 role/anon/RLS/revoked JWT, original signed PostgREST T065 cross-account and T066 red/green (NOT hosted), old G0 and G1 protected B0–B8/News/Auth/B7. Original T083 120/120 preserved. Original B7 T035 5/5 historical tests reused at authentic source, and missing T041 workflow restored byte-identical from an existing trusted repo branch with branch-specific trigger. No Production change, no paid services, no new media/provider actions. Full ZIP step SKIPPED.

**Important red-stop history:** First T087 runs correctly FAILED on the previously missing old B0/B7 workflow path and on the T067 prerequisite fixtures. We did **not remove the old guards**: ran B0/T035 on authentic historic sources, restored exact original T041 workflow (old historical branch-only trigger), replayed original B10 T065+T066 signed local HTTP fixture chain before T067/T068, and verified final exact-head SUCCESS. Do not rewrite earlier RED as GREEN.

**Final gate still HOLD**: the original requires E1+E2+E5, and real connected E2 is read-only RLS policy/catalog proof, not current production signed multi-account IDOR and session revocation denial. E5 aggregates do not cover every completed module's complete lifecycle and notification/retention externally. B10 T063/064/065/068 and real B11 restoration, B8 factual correction remain separately held. No Founder manual step at this source-review checkpoint. `T087_ORIGINAL_FULL_PASS_LOCK=HOLD`.


## Additional verification after first T087 report — 2026-11-02, read-only, no Founder manual step

### Exact-head E1 CI result, no fictitious tests
- Draft PR #111 candidate SHA `adcb9c6e9b3f63a89ed00dbfd20632207406cb39`; GitHub Actions run `#41402696831`, event push, **COMPLETED/SUCCESS on that SHA**. Required 4 jobs successful (original T087 source protected regression, B10 disposable PG17/signed localhost HTTP, reusable G0 + G1). The separate optional historical full ZIP/random-selector job **SKIPPED** and must not be counted as completed. This confirms source/isolated security tests only.

### Supplemental production SQL role-isolation *read-only* probes
All probes ran on connected production project `vrffsnkycvjithwtiylt` inside explicit **`BEGIN TRANSACTION READ ONLY` ... `SET LOCAL ROLE ...` ... `ROLLBACK`**; no app data written, no original role grants or policies altered. This changes only the temporary SQL session role, **not a hosted HTTP/JWT test**.

1. `SET LOCAL ROLE anon`: `public.jb_c1_public_articles(NULL,1)` returned **1 public published item** (only count observed), `public.jb_b8_g4_public_case(all-zero-UUID)` returned **NULL**, and `public.jb_b10_live_update_public_eligible(all-zero-UUID,all-zero-UUID)` returned **FALSE**. These prove valid public output and nonexistent private-case/Live-negative examples, NOT every possible ID or signed-user access path.
2. `SET LOCAL ROLE authenticated` **without JWT/session claims**: direct `SELECT COUNT(*)` returned **0 visible rows from each of seven private datasets**: `article_versions`, `audit_logs`, `team_accounts`, `live_sessions`, `grievances`, `live_notifications`, `user_roles`. This is evidence of fail-closed anonymous-context RLS **for these SQL role tests only**. It cannot substitute for actual authenticated Owner-vs-Reporter, revoked session or cross-account signed HTTP denials.
3. Catalog `has_table_privilege('anon', OID,'SELECT')` returned **FALSE** for each of those seven private relations, with RLS enabled; public content uses deliberate screened SECURITY DEFINER RPC access. This grant check and SQL isolation don't verify HTTP gateway behavior.

### Supplemental E5 presence/absence summary (SELECT-only)
- `article_versions`: **920 snapshots, 26 distinct articles** — historical/version presence, not a complete correction notification lifecycle.
- `live_notifications`: **160 rows, all `delivery_state=IN_APP_READY`**, across live (149), grievance (4), compliance (4), social (2), system (1). Do **not** claim external delivery.
- `b8_case_review_events`: **0 rows**; no real B8 case-review lifecycle demonstrated by this table.
- `live_sessions`: **16 rows all `public_status=OFF`**; no real live provider on-air evidence.

### Supabase Security Advisor triage — evidence only, not automatically exploitable
Security Advisor returned **43 INFO** `rls_enabled_no_policy` tables (may deliberately fail closed; check intended access), **23 WARN** anonymous-executable public SECURITY DEFINER RPCs, **118 WARN** authenticated-executable SECURITY DEFINER RPCs, and **1 WARN** leaked-password protection setting. The single known public view `article_stats` has `security_invoker=true`. These require targeted RPC function-by-function role/session/body review and signed real HTTP response checks; **do not revoke or modify production functions blindly**.

Official linter detail:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

**GATE: `T087_E2_ROLE_ISOLATION_SQL=PASS_SCOPED_7_OF_7_PRIVATE_ZERO_PLUS_3_ANON_RPC_PROBES`; `T087_REAL_HOSTED_SIGNED_CROSS_ACCOUNT_HTTPS_NEGATIVES=DUE`; `T087_E5_END_TO_END_LIFECYCLE_PROOF=PARTIAL`; `T087_FINAL_PASS_LOCK=HOLD`.** T086 untouched. No production release, no paid API/services, no repetition of Android/Share/Incognito.


## 2026-11-02 continuation — actual connected DB E2 identity contexts, E5 audit-join, RPC exposure triage

**Non-invasive verification:** On production project `vrffsnkycvjithwtiylt`, run each tested context inside `BEGIN TRANSACTION READ ONLY` / `SET LOCAL ROLE authenticated` and `ROLLBACK`, setting temporary `request.jwt.claims` from existing Owner/Reporter **IDs + existing session IDs** (without obtaining their passwords, JWTs or signatures); output **counts only**. No table/policy/auth/session/permission changes. This proves live Postgres policy/function evaluations under controlled claim contexts; it **cannot establish a truly authenticated signed hosted HTTPS/PostgREST response**.

### E2 actual RLS results, additional read-only proof
- Reporter `aal1` + current matching session: session guard **true**, app role `reporter`, owner guard **false**. Private Owner article versions, all audit records, private grievances, Live sessions and foreign drafts **0 visible**; one self Team account, **119** own notifications visible. Cross-account Team, Role, Notifications and foreign nonpublished Article visibility **0**. Positive control rules out a meaningless all-zero simulated context.
- Owner `aal2` + current matching session: session guard **true**, owner guard **true**. **31 drafts**, **920 versions**, **1635 audit entries**, **6 grievances**, **16 Live sessions**, **3 Team accounts**, and **38 own notifications** visible. Correct positive control for authorized Owner.
- Owner `aal1` + matching existing session: owner guard **false**; Owner-only drafts/versions/audit/Live **0**.
- Owner `aal2` + intentionally nonexistent session UUID: session guard **false**, Owner guard **false**, protected versions/audit/grievances/Live/Team/notifications all **0**. **However `public.user_roles.users_can_read_own_role` permits the subject to SELECT its one own role even with a nonexistent session** (other roles zero). Preserve as a **scoped stale-session policy triage finding**, not proven exploitable hosted JWT leakage; exact minimum candidate after **isolated** regression: add `private.current_session_active()` to that self-role RLS SELECT predicate while retaining legitimate active-session self-role read. No production migration authorized/performed.
- Mandatory **real signed multi-account HTTP E2 + actual revoked bearer 401/403/empty payload** remains **NOT_RUN/DUE**. SQL-context JWT claim setting is not cryptographic validation or gateway behavior.

### E5 actual join by `record_type + record_id` — no personal/secret data extracted
- Of **160** `public.live_notifications` rows, **156/160** have at least one same-record `public.audit_logs` row. **4/160** lack a same-record audit: **3** `live / grievance_received` and **1** historical `system / P4_T046_E3` synthetic notification. Of the five `live / grievance_received` notifications, **4** currently reference a grievance row and **1** points to a missing/deleted current grievance; a missing current row can be legitimate retention/deletion, not automatically corruption. These are correlation gaps, not proven notification delivery failure.
- `article_versions` **920/920** rows join to current articles; **26/26** versioned article IDs join their same-record article audit; **23** IDs have 2+ versions. Evidence of Article history + canonical audit linkage only, not a real factual correction communication acceptance.
- In-app notification state **160/160 `IN_APP_READY`**; this is **not** external delivery. B8 public revisions **0** and case-review events **0**. Real complete per-module lifecycle still pending.

### SECURITY DEFINER execution-privilege metadata triage
- Connected catalog confirms **118** `authenticated`-executable SECURITY DEFINER routines; **23** are also callable by `anon`, matching the published public Ads/Grievance/Article/Search/Live/B8 interfaces. Across the remaining **95 authenticated-only functions**, **95/95** source bodies reference at least one **known guard helper/predicate pattern** (`current_owner`, `current_session_active`, `current_app_role`, `p4_staff_allowed`, `auth.uid`, `p4_owner_allowed`, `jb_social_allowed`, or a B8 authorization predicate). This is **static triage only, NOT proof all 95 reject malicious execution**. Sampled `jb_ad_link_advertiser_user_internal` and `jb_ad_save_package_internal` contain `private.p4_owner_allowed()` and `jb_social_history_internal` uses `private.jb_social_allowed()`; their previously “no guard” labels from naive text matching were **false positives**.
- All 23 `anon`-executable RPCs require individual confirmation of intended public output, token/rate constraints and safe inputs. No public function was invoked with side effects, no grants revoked, no exploit asserted. Security Advisor warnings still **OPEN for targeted hosted checks**; absence of matching guard text is **not** evidence of a vulnerability.

**Verdict now:** `T087_E2_CONNECTED_DB_OWNER_REPORTER_MFA_STALE_SQL=PASS_SCOPED`, `T087_E2_SIGNED_HOSTED_HTTP=NOT_RUN_DUE`, `T087_E5_LINKED_RECORD_CHECK=156/160_PARTIAL`, `T087_RPC_SECURITY_DEFINER_METADATA=TRIAGED_SOURCE_ONLY`, **`T087_ORIGINAL_FULL_PASS_LOCK=HOLD`**. Keep T086 existing PASS+LOCK and current T087 scoped Evidence Lock. No production release; no repeated Founder mobile steps; Soft Launch is priority, but no weakening of its security gate.
