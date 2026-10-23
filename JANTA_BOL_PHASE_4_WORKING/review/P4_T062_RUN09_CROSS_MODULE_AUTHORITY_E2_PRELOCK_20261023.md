# JANTA BOL — P4-T062 Cross-module authority checkpoint
Date 2026-10-23 IST. Original Phase-4 B10 RUN-09 T062. **E2 partial PASS / E1 existing CI PASS / E5 real actor negative matrix DUE. FINAL PASS+LOCK = HOLD.**

## Founder instructions / ZIP handling
Continue B10 test sequence using same JANTA BOL source branch, **issue exactly ONE FINAL B0–B10 ZIP only when the whole B10 is proven and locked**. Do not deliver intermediate ZIPs as final, and do not require reimport into SPCK during backend tests. Do not touch Cricket.

## Actual LIVE production JANTA BOL READ-ONLY audit (no JWT/password or token requested)
- Project: `vrffsnkycvjithwtiylt`. All operations `BEGIN READ ONLY` + `ROLLBACK`; no production mutation.
- Real account roles: 1 Owner, 1 Editor, 2 Reporters; team accounts: 1 active Editor, 2 active Reporters. Actual protected records: 6 Grievances, 7 Ad Campaigns, 11 Ad Creatives, 1 B8 Case, 1,560 Audit rows (counts only). Nothing sourced from Cricket.
- Under actual `SET LOCAL ROLE authenticated` **with NULL auth.uid() (no token)**: observed zero readable records for Source, Article Versions, Grievance, Grievance Evidence, Grievance History, Audit, Ads, Creatives, Analytics, Live Sessions, Team Accounts, and User Roles. This is an actual SQL role access test, **NOT** proof of an authenticated real Editor/Reporter token.
- Direct `anon` ACL denied on Article, Article Source/Version, Audit, Grievance, Ad Campaign/Creative, User Role, Team, Live Session, and raw B8 Case. Some of these tables grant `authenticated` SQL SELECT but RLS policies restrict rows; a grant alone is not a leak. B8 internal cases/no-policy tables disallow both anonymous and authenticated direct access.
- `public` OWNER mutation `jb_b9_owner_%` anonymous EXECUTE count 0. `public` privileged Ad `jb_ad_%internal` anonymous EXECUTE count 0. Intended public B8 projection RPCs are `jb_b8_g4_public_feed` and `jb_b8_g4_public_case`. `jb_grievance_submit_internal` is anon-executable for intended public grievance intake, **NOT** Owner authority; investigate detailed field validation in later T065.
- Owner-only Article Source and Audit RLS policies use `private.current_owner_aal2()`; `user_roles` mutations require `private.current_owner_recent_mfa(600)`; private Live session owner access uses `private.current_owner_aal2()`; staff Article creation/editing has explicit role/RLS restrictions.
- Verified `trg_enforce_article_lifecycle` BEFORE UPDATE on Articles: rejects change to publication status unless current app role is Owner or a system Live transition is flagged; Article UUID immutable; version/audit trigger exists. System Live activation privileged `jb_live_activate_public_internal` is callable by `service_role` and NOT callable by anon/authenticated. Real production roles were NOT impersonated with fabricated bearer tokens.

## Follow-up hardening note (not proof of exploit)
The Article lifecycle trigger reads the custom setting `jb.system_live_transition`, and only the privileged Live activation routine is known to set it. PostgreSQL custom GUCs are generally caller-modifiable where SQL execution is allowed, so static review alone is **not sufficient** to prove the system-exception path cannot be forged by some other callable RPC or SQL injection. The current internal activation RPC has anon/authenticated EXECUTE denied. Before final T062 lock, require a source-wide call surface proof and isolated low-privilege negative attempt, **without** weakening or bypassing the existing Live engine.

## Existing E1
`ci/phase4/b10-whole-platform-security-pg17.sql` already tests synthetic reporter AAL2 and editor AAL2 cannot use Owner analytics/settings, and Owner AAL1 cannot assign terms; source checks/PG17/Phase3 protected CI GREEN in run `39963365578` from prior T061 checkpoint. These fixtures are isolated and roll back.

## T062 blocking real evidence E5
The original T062 requires a cross-module **real authenticated actor authority matrix** across Reporter, Editor, Owner AAL2, Advertiser and Public, with protected audit/history evidence. Anonymous and tokenless-auth E2 checks are PASS, but do not substitute for real affected-account role tokens. Need to test read/write attempts only with **controlled and authorized test identities**, not impersonating real reporters, not modifying real live data. If controlled identities or safe test records aren't available, leave FINAL HOLD rather than fabricating proof.

**Status:** T062 E2 baseline PASS, one bounded custom-GUC threat review DUE, E5 authenticated negative matrix DUE; **T062 FINAL HOLD**. No T063 device step has been attempted; no B10 final ZIP delivered. T061 remains separately PASS+LOCK.
