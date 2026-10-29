# JANTA BOL — PHASE 4 / B7 — P4-T039 CP01 ACTUAL SOURCE vs LIVE ADVERTISER PORTAL
**Date:** 16 October 2026 (IST)
**Founder's master source:** `JANTA_BOL_B7_FINAL_MASTER_BLUEPRINT_WITH_TESTS.pdf`, pages **29–30/37**; T039 = ADS-041…047; required **E2 + E3 + E5**, RUN-06; initial planning status NOT RUN. **Canonical 7/7 FINAL DUE, NOT PASS+LOCK.**
**Execution lock:** NEWS/contact-only launch first, no fake advertiser onboarding, no Production SQL, no real login links/campaign edits; ask Founder for a manual action only after a reviewed verified host/device test is genuinely necessary.

## Exact source / current live authority
- Repo `jantabol/JANTA-BOL-Website`, new independent DRAFT child review branch `review/t039-advertiser-isolation-20261016` from T038 PR33 exact source SHA `3a2d3b439d0d5688834906da6a157e55622ed383`. Parent drafts T035→T036→T037→T038 unchanged, canonical B7 separate.
- LIVE JANTA BOL Supabase project `vrffsnkycvjithwtiylt`: SELECT-only catalog read. Current **7 campaigns, 0 LIVE; 0 `ad_portal_credentials`, 0 `ad_portal_sessions`, 0 `ad_renewal_requests`**. `ad_change_requests` canonical table not present. Credentials/session tables RLS enabled and public/anon SELECT+INSERT denied; old owner portal issuance RPC requires `private.p4_owner_allowed()` but this does NOT prove genuine AAL2 issuer E5.
- LIVE legacy `jb_ad_portal_login(text,text)` verifies encrypted secret, creates 12-hour token, but lacks consumed_at one-use guard. **ADS041 first divergence:** same original secret could mint multiple sessions until revoke, contrary to one-time setup.
- LIVE `jb_ad_portal_campaign(text)` returns latest creative by version **without requiring `approved=true`**; unapproved pending asset may display on advertiser dashboard. **ADS044/046 first divergence.**
- LIVE `jb_ad_portal_submit_creative(text,text,text,text,text,text)` accepts `image`, `video`, and CTA and **directly INSERTS ad_creatives approved=false**; it does not limit advertisers to text-only REQUEST. This violates strict owner-media-control requirement **ADS045** even if directly uploaded creative is unapproved. Existing Owner approval gate must remain authoritative. The current source is incompatible with full T039 as deployed.
- LIVE `jb_ad_request_renewal(uuid,timestamptz)` is JWT advertiser-user-scoped and inserts only Pending request with history; no portal-token renewal RPC live. Portal HTML calls missing `jb_ad_portal_request_renewal` and will **fail closed**, not proven positive. **ADS047 genuine hosted E2 DUE.**
- Existing safe **REVIEW_ONLY (NOT DEPLOYED)** SQL `20261010_b7_portal_text_change_REVIEW_ONLY.sql` reuses original tables and signatures while making one-time secret consumption, exact credential/session revocation, advertiser-only pending TEXT request, approved-creative-only campaign response, Owner AAL2 queue/decisions, and request-only renewal via one existing authority; no auto-payment/extension or creative flip. Separate `20261012_b7_verification_portal_revocation_REVIEW_ONLY.sql` links verified advertisers/downgrade to credential/session revocation, but is also NOT live. Do not assume combination already deployed.
- No direct raw portal login IDs, credentials, secrets, tokens, advertising contact details or user identities were read or exported.

## Actual protected 16-Oct CI
- New source-only `ci/phase4/b7-t039-cp01-portal-authority.test.cjs`: original PDF's ADS041..047 **seven tests mapped and official final DUE**; require one-time secret state, token-to-campaign scope, no article/asset mutation by advertiser, approved creative only, renewal Pending only, restricted Portal UI. Also runs prior **76/76** JS client tests and 9 canonical/60 ADS closure audit accurately **BLOCKED**.
- Original unchanged synthetic A/B portal fixture `ci/phase4/b7-portal-fixture.sql` + unchanged original REVIEW-ONLY migration + original SQL regression `ci/phase4/b7-portal-regression.sql` executed in **REAL separate PostgreSQL17** under full transaction `ROLLBACK`. Verified A/B access and no cross-tenant creative; forged/expired/revoked token denial; one-time login credential consumed and replay denied; no image/video/CTA direct write; duplicate text request throttled; no auto change of previously approved creative; Owner mock decision/audit; renewal Pending only, previous JWT renewal remains; missing/expired invalid date rejected, anon direct ledger access denied.
- [GitHub **#38914457056 — 2/2 jobs SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38914457056) at exact code SHA `44bfc49549a2c11f53cd41fb1e77146868df0b72` (before these documentation additions). **This is synthetic PostgreSQL/E1, not genuine Hosted E2/E5 nor Android E3.**
- No new portal product JS/SQL was written, no previous PASS changed, no new live data/roles, and no commercial actor created. We confirmed the previously-existing safe source candidate can run standalone against its synthetic fixture, not that it is production parity or end-to-end usable.

## Seven canonical tests — honest status
| Official ADS | Isolated evidence proved | Genuine missing |
| --- | --- | --- |
| **041** Secure account setup | One-use secret vs second login denied; expired/revoked wrong token denied in synthetic PG | Real Owner-issued verified one-time account, hosted Auth/E5 and revoked Android session; no plaintext retention |
| **042** Two-advertiser isolation | A and B token scoped to separate mock UUIDs and approved creatives, cross access denied in PG | Real hosted A/B test data, RLS/RPC negative E2 without exposing anyone's contacts |
| **043** Newsroom privilege blocked | Portal page no publish buttons; token cannot use Owner queue in original mocked PG | Authenticated actual advertiser cross newsroom publish, Admin, Owner AAL2 E2 negative |
| **044** Accurate own dashboard | Synthetic A/B own campaign, approved creative selection | Real package/time/payment/status own analytics, host E2+physical E3 |
| **045** Text change request only | Review-only SQL denies image/video/CTA and inserts `pending` text request; no ad asset mutated in mock | Paired, deployed E2/E5 and real Android E3; old LIVE RPC still allows direct unapproved media creation |
| **046** Approved creative version remains | Review-only Owner accept does not change approved media, history preserved | Real paid and approved media before/after live version flip E2/E5, not a mock |
| **047** Renewal manual approval | Mock old JWT and portal pending renewal, old campaign end/payment unchanged | Hosted Owner approved new agreement and genuine new payment/rejected silent extension E2/E5 |

## Launch split, blockers, manual checkpoint
- The public CONTACT ONLY / editorial soft launch DOES NOT need a client advertiser dashboard/login. Contact request may run separately under Phase4/news/domain release criteria; don't create real advertiser credentials now.
- Before first commercial paid ad/client portal goes live, replace the original LIVE unsafe RPC behavior only after exact current schema diff, retained app identity, Owner AAL2, verified advertiser downgrade, revoke tests, migration rollback and Founder explicit deployment approval. **Do not deploy this review-only SQL now**.
- Local tests cannot prove realistic cross-tenant privacy against production RLS, permanent-password handling or actual Android screen. No real account setup, direct creative upload or server migration was attempted.
- **Official T039 0/7 PASS+LOCK; 7/7 E2/E3/E5 DUE. CP01 REAL PG17 source parity engineering PASS only.** No ZIP. Founder manual step **NONE** at this checkpoint.
- Next CP02 can inspect exact current portal token table/Owner issuance+revocation source and write minimal security gap test without disturbing existing source and protected B5/B6/News work; after T039 backlog consolidated, proceed next Phase4 soft-launch-critical block.

**NO REBUILD • NO FAKE PASS • NO PRODUCTION WRITES • FIRST REAL AD HARD GATED**
