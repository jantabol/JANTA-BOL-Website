# JANTA BOL — P4-T039 CP04: Consolidated original ADS041–047 & first-commercial-ad hard gate
**16 Oct 2026. Founder Blueprint:** B7 Final 37-page SOT pp29–30, `P4-T039` E2+E3+E5. **Official 7/7 FINAL DUE. NO FINAL PASS/LOCK.**
**Soft-launch boundary:** Founder wants NEWS + optional "विज्ञापन के लिए संपर्क करें" public form first. Do NOT activate advertiser portal, paid LIVE, media, login accounts, bank/payment provider or paid branches for that launch. Normal newsroom/domain Android route has separate release requirements.

## Proven engineering by checkpoints
- **CP01 actual PG17 A/B original portal source** [#38914842407](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38914842407) 2/2 success: one-use credential, session isolation, approved creative only, text request Owner review, renewal Pending, no auto-extending ad. **LIVE legacy source still differs** — old password reuse allowed, unapproved creative projected, old direct unapproved image/video creation, portal-token renewal RPC missing. No production patch installed.
- **CP02 actual PG17 + real portal-page handler unit** [#38916689653](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38916689653) 3/3 success: explicit logout same token DB revocation, A session revoked but B unaffected, no ad/News/media/renewal changes; browser clears locally and reports SERVER revocation unconfirmed if backend is down. Both reviewed client and new narrow SQL **NOT deployed**.
- **CP03 actual PG17 Owner downgrade/reverify boundary** [#38917748717](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38917748717) 2/2 success: found a privileged old bearer resurrection risk after verified Owner reissue, explicit [RED #38917611788](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38917611788), minimal monotonic `revoked_at` guard patched in existing review-only SQL, original BE10 downgrade regression PASS, A old session cannot resurrect while new distinct token permitted, B unaffected, campaigns stay hidden.
- Across latest CP03 real source + JS: 5/5 logout, 7/7 original portal source, 76/76 preserved News/Client. Closure manifest 9 canonical/60 ADS remains BLOCKED; **this is correct**.

## Official 7-test/7-gate final matrix
| ADS | Verified only in review/isolated environment | Exactly remaining before first commercial advertiser portal LIVE |
| --- | --- | --- |
| **041** secure setup/one-time | disposable PG secret consumption/reissue, exact server logout, no revoked-session resurrection PASS | real issued Owner+AAL2 temporary account, SMS/email delivery/rotation/consumption, hosted E2 and Android E3 fresh/replay/remote logout |
| **042** A/B isolation | synthetic A/B source and PG old token denial, only own campaign result | real two independently authorized advertisers A/B, sessions & Supabase RLS/SECURITY DEFINER negative tenant-escape proof E2/E5 |
| **043** privilege deny | client no publish/admin buttons; Owner RPC negative in PG | actual authenticated advertiser must fail ADMIN, NEWS publish/correct, payment/Owner media/Owner RPC including AAL2 negatives E2/E5 |
| **044** own dashboard | review-only `approved=true` creative projection, own status mock | real statuses, paid/approved creative, price/time/placement/geo reconciled against real Owner ledger and Android E3 |
| **045** text request only | candidate backend denies image/video/media URL/CTA direct insert; pending request logged | paired deployment kills original LIVE `jb_ad_portal_submit_creative` direct creative path, real A/B E2+Android E3 |
| **046** owner version | original approved creative unchanged by text-only request and Owner decision in PG | actual Owner AAL2 accepted request then separate verified media-review/version publish E2+E5, no auto-replacement on open Article |
| **047** renewal | pending-only canonical `ad_renewal_requests`, separate old JWT home preserved; no payment/end mutation | hosted portal-token renewal RPC; Owner quote+verified new payment+schedule E2/E5, no premature extension and Android E3 |

## Deployment/Founder gate (not approved)
1. Source parity audit against LIVE: current functions and triggers, table migration preflight, token grants, RLS, official verified-downgrade function, Owner temporary credential **issuance** (AAL2), media approval, compatibility with B5/B6 News. Current LIVE has 7 campaigns, no paid/active advertiser portal sessions at previous read-only audit; no real accounts created here.
2. Pair original verified-only + text-only portal SQL `20261010_b7_portal_text_change_REVIEW_ONLY.sql`, session/verified-downgrade `20261012_b7_verification_portal_revocation_REVIEW_ONLY.sql` with NEW monotonic guard, `20261016_b7_t039_portal_server_logout_REVIEW_ONLY.sql` and conditional guarded portal UI. These are **DRAFT candidates**, not an instruction to run/deploy now. They require secure API function grants, owner source verification, migration rollback and real hosted E2/E3/E5 gate before first paid advertiser launch.
3. A suspended/revoked advertiser's existing paid live ad must be hidden in open article within approved revocation SLA (T036 ADS019, paired HIDE watcher and SQL still uninstalled); stale token must not reopen; no other advertiser's session should be revoked. Payment/financial histories never edited on credential action.
4. No realistic media/geo/renewal/full ads tests without verified posted domain, real Android evidence and Founder checkpoint. All T034–T038 genuine first commercial-ad gates remain independently due, not silently waived.

## Honest final checkpoint
**T039 CP01–CP04 source/isolated engineering and consolidated audit COMPLETE; official ADS041..047 = 0/7 FINAL PASS+LOCK (ALL DUE).** 
**Production/unrelated projects unchanged, PR34 DRAFT, T039 commercial FULL HOLD, no ZIP.**
**Next:** continue `P4-T040` original blueprint evidence mapping and review-only source if Founder agrees sequential order. Keep NEWS contact-only/domain/social softlaunch priority separately. 
**Founder manual step NOW: NONE.** Once genuine Android E3 or real Owner login required, stop and request one step at a time.
