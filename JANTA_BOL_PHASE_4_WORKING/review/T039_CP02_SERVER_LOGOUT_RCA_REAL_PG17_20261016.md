# JANTA BOL — P4-T039 CP02 REAL A/B PORTAL SESSION LOGOUT RCA + FIX
**Execution:** 16 October 2026, India · **Official SOT:** Founder B7 FINAL MASTER Blueprint PDF p.30/37, P4-T039 ADS-041–047, E2+E3+E5 RUN06.
**Scope verdict:** CP02 reviewed source + actual disposable PostgreSQL17 **PASS**. Commercial account hosted E2, real Owner E5 and Founder Android E3 **DUE**. **Official T039 0/7 FINAL PASS/LOCK.**

## Exact current source and FIRST DIVERGENCE
- Existing advertiser page `JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html` had `logoutButton` clicking only `clear()` for tab `sessionStorage` and reporting **"आप लॉगआउट हो गए हैं"**. The **server-issued token remains valid up to 12 hours**, because no backend revocation call was made.
- Existing deployed production `jb_ad_portal_login` creates a 12h opaque token; `jb_ad_portal_campaign` trusts unexpired `ad_portal_sessions`. No deployed `jb_ad_portal_logout(text)` was found in prior live `pg_proc` inspection; the new function exists **in a review-only candidate, not live**. The old login/revocation/approval creative gaps from CP01 remain until separately approved paired migration.
- User-facing false “logged out” success while server token is live is a concrete privacy/security discrepancy, not a cosmetic defect. No actual advertiser account or token had to be used to diagnose it.

## Red → minimum safe fix → Green
- [**RED CI #38915998989**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38915998989) verified new explicit regression found the missing `rpc('jb_ad_portal_logout',{p_token:...})` call; original page still showed local-only success. This is a **real source behavior gap**, not a fixture false failure.
- **Minimum review-only backend candidate** `JANTA_BOL_PHASE_4_WORKING/db/20261016_b7_t039_portal_server_logout_REVIEW_ONLY.sql`: `public.jb_ad_portal_logout(text)`, explicit narrow RPC grants for anon/authenticated, validates exact 48 lowercase hex, hashes with existing SHA-256 `extensions.digest`; only updates the matching unexpired, unrevoked server session, emits **one `portal_session_logout` history event** with no raw token/PII, replay no new event. No public session table select, no creative, money, Article or Owner authority changes. Stored function is `SECURITY DEFINER` with restricted catalog search path.
- **Minimum review-only page change** `advertiser-portal.html`: logout immediately clears local token/view; asynchronously calls ONLY the exact server logout RPC with previous token. Displays **“दोनों पर ... बंद”** only when RPC returns true. On missing/unavailable backend, still clears browser, **explicitly says server revocation not confirmed and asks Admin to revoke**. Never lies that the server token has been revoked. Login, creative pending request, renewal and article route unchanged.
- **New E1 real browser script behavior** `ci/phase4/b7-t039-cp02-server-logout-source.test.cjs` uses the REAL page's inline script in a mocked DOM and backend, exercising both server-success and `PGRST202` RPC-unavailable cases; proves browser tab storage cleared in both.
- **New real ephemeral PostgreSQL17** `ci/phase4/b7-t039-cp02-server-logout-regression.sql`: two separate synthetic Advertiser A/B bearer tokens, revoke only A, A can no longer see campaign/submit text/renew; B continues, invalid/expired/replay returns false; one history entry, no extra request, media, sold state, news or other user effects, **ROLLBACK**. Not a hosted session proof.

## Green reproducible GitHub evidence
- [**GREEN #38916292843 — 3/3 jobs SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38916292843), code SHA `ef94325bee288697cc4d298995ad236019732731` before evidence-only writes:
  - new portal browser source and mocked live-handlers **5/5 PASS**; original canonical source contract **7/7 PASS**; protected **76/76 prior Client/News regressions PASS**; B7 9 canonical/60 ADS closure checker appropriately **BLOCKED**.
  - actual isolated PostgreSQL17 new server logout A vs B, one history and replay, financial/media/status/renewal invariants **PASS**, transaction ROLLBACK; no leaked passwords or real tokens in workflow logs.
  - original unchanged real isolated PG17 `b7-portal-regression.sql` 15+ preexisting success notices, 1-use, expired/revoked token, approved creative only, pending renewal, Owner isolated decision **PASS**, ROLLBACK.
- [CP01 unchanged source job #38916292567](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38916292567) triggered on same code SHA; its real PG/Source status must be checked before merging (not required for CP02 source verdict).
- Earlier CP01 source/read-only authority baseline [#38914842407](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38914842407) PASS.

## Required LIVE release HARD GATES
- Neither the **new SQL function** nor the **new page** is Production-deployed. Deploying only the frontend would **fail closed on logout**, not actually revoke tokens. Both must be reviewed and released atomically, with real hosted Owner+advertiser 2-tenant E2, Android E3, verified advertiser downgrade/reissue source and E5; no paid ad may go live before all remaining T034–T039 media, payment, renewal, and privacy gates.
- Both preexisting migration candidates (`20261010_b7_portal_text_change_REVIEW_ONLY.sql` and `20261012_b7_verification_portal_revocation_REVIEW_ONLY.sql`) are NOT deployed. The four CP01 deployed legacy first divergences (reusable password, unapproved creative shown, direct media record, absent token-renewal endpoint) remain real commercial blockers.
- No genuine Owner/AAL2, customer login, real payment, Production credentials, live SQL, DNS/domain, static deploy, GitHub merge, extra Supabase branch, newsroom/Cricket modifications or actual E3 manual founder test in CP02.
- Contact-only NEWS can be independently considered for soft launch without opening the client portal; **do not mark T039 passed from this local CI**.
- Next: reconcile paired session-revocation, verified-state downgrade and Owner reissue source; then consolidate true 7 official hosted E2/E3/E5 DUE before proceeding P4-T040 if no additional Founder gating required. **Founder manual step now NONE.**

**NO REBUILD • NO PRODUCTION MUTATION • NO OLD PASS REPEAT • NO FAKE PASS**
