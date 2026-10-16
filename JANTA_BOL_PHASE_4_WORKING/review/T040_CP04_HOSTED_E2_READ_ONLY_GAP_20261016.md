# JANTA BOL — P4-T040 CP04 / GENUINE HOSTED READ-ONLY BACKEND E2 PREFLIGHT
**Date:** 16 October 2026, 21:00–21:05 IST (host SQL checked 2026-10-16 15:28 UTC).  
**Master:** Founder 37-page B7 Final Blueprint, ADS048 CTA / ADS049 qualified counts / ADS050 failure+privacy, E1+E2+E3.  
**Security disposition:** Limited actual **HOSTED READ-ONLY** observations completed; **NO qualified ad ticket paid-campaign positive E2** because backend is NOT deployed and no real paid LIVE ad exists. **0/3 canonical Final PASS+LOCK**, all DUE; never interpret this as production-safe commercial analytics.

## 1. LIVE JANTA BOL Supabase — checked via authorized SELECT only
Project `vrffsnkycvjithwtiylt`, PostgreSQL **17.6**; time zone **UTC**. Actual aggregate state:
- `public.articles status='published'`: **15**, core news remains live.
- `public.ad_campaigns`: **7**, `status='live'`: **0**.
- `public.ad_payments status='confirmed'`: **0**.
- `public.ad_events`: **0**.
- `ad_events/ad_campaigns/ad_creatives/ad_payments` RLS enabled; anonymous direct table SELECT/INSERT denied. Under **actual database `anon` role in `BEGIN READ ONLY; SET LOCAL ROLE anon`**, the EXISTING hosted `jb_ad_public_feed` returned **0 homepage ads and 0 article ads**, then `ROLLBACK`. This is genuine hosted read-only behavior, NOT a qualified view/click proof.
- Live anonymous-executable OLD RPCs `jb_ad_event(uuid,text)` and `jb_ad_record_event(uuid,text)` still exist with `SECURITY DEFINER`. Their exact current source accepts unqualified `impression`/`click` on an eligible LIVE campaign and directly writes the original `ad_events` ledger. They have no 50%/1-second ticket/human proof. With 0 LIVE campaigns NOW this is not evidence that any fraud occurred, but future **FIRST PAID LIVE** must eliminate these anonymous raw-event count routes **atomically** with new backend. **NO WRITE RPC WAS CALLED.**
- Old staff `jb_ad_analytics_internal(uuid)` totals raw views and uses UTC midnight in `today`; it is NOT the staged qualified IST Owner report. Do not sell its counts as billable verified reach.
- The reviewed `public.ad_view_tickets` table and `jb_ad_issue_view_ticket`, `jb_ad_qualify_view_ticket`, `jb_ad_record_ticket_click`, `jb_ad_qualified_analytics_internal` functions were **ABSENT on live**. Private source `b7_eligible_article_creatives` also not installed live. No real paid E2 positive is possible from this current production state without a reviewed/safe deployment.
- GitHub `JANTA_BOL_PHASE_3C_WORKING/index.html` and `article.html` DO load `public-ads.js` but deliberately **DO NOT** import the staged `ad-viewability.js` or `ad-analytics-client.js`. The staged module itself says NOT LINKED until paired server migration and official geo cutover. This is deliberate **FAIL CLOSED**. Never deploy frontend alone or blindly enable tracking.

## 2. Exact already-tested review-only implementation preserved
- New CP04 reproducible SQL: `ci/phase4/b7-t040-cp04-HOSTED-E2-PREFLIGHT-READ_ONLY.sql`. Explicit `BEGIN READ ONLY`, catalog/ACL counts, role-limited anonymous feed and `ROLLBACK`. **Not an instruction to apply migrations or issue events.**
- New CP04 guard: `ci/phase4/b7-t040-cp04-hosted-readiness-source.test.cjs`: 6 source checks for original ADS048..050 DUE, paired backend+frontend release, raw RPC disable in REVIEW-only SQL, SHA256 ticket eligibility, Owner IST day, protected News, no fake E2. Existing CP01 HIDE and CP02 IST source/actual PG17 results unchanged.
- [GitHub **#38924970241 — CP04 1/1 job SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38924970241): **6/6** new readiness checks, **3/3** actual public-ads.js simulated optional stats+feed failure E1, **13/13** existing analytics client, full B7 closure audit correctly **BLOCKED** due real evidence. No hosted paid-ad request; this CI job is SOURCE-ONLY, NOT hosted E2.
- [GitHub **#38924969659 — protected review baseline 2/2 SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38924969659): original actual disposable PG17 CP01 HIDE/21min, CP02 IST boundary, full ad ticket, client, and protected Phase3 **STATIC** security/News/compliance regressions all PASSED on **same code SHA `67211a612920539b072c6d9372445d5266561673`**; coverage audit `644` exact registered IDs/59 manual-only not fake. Full hosted transactional Phase3 regression **NOT RUN**.

## 3. E2 Test Matrix — exact feasible vs currently BLOCKED
| Scenario | Safely verified NOW | Why still DUE |
| --- | --- | --- |
| Public site zero-purchased-ad isolation (ADS048/050) | REAL LIVE read-only anonymous feed: homepage=0, article=0; 15 published News unaffected | Test verifies **no ads** under zero LIVE, not valid approved CTA while paid LIVE |
| Direct anonymous data exposure | REAL LIVE RLS/SQL ACL denies `ad_events` SELECT/INSERT; old raw RPC executable | PostgREST bearer/actual JWT authorization negatives with staged new functions and actual deployed backend still DUE |
| Valid qualified view/click (ADS049) | Staged SQL original and actual disposable PG17 tests already GREEN CP01/CP02 | Live ticket functions/table absent, paid campaign=0, tracked scripts NOT wired, must not fake invoice/LIVE or synthetic public reach |
| Owner Today/7d/30d | Isolated PG17 real IST-boundary RED→GREEN CP02 | Deployed Owner signed AAL2 hosted E2 query and real event reconciliation DUE |
| Server abuse/privacy/outage (ADS050) | Source supports one nonce/ticket + no viewer PII fields; E1 renderer failures 3/3 | Hosted traffic/rate/quota protection, old raw anonymous route cutover, failure budget, true hosted isolated outages E2 DUE; no confirmed bot-free people |
| Android E3 | No physical Android run in this checkpoint | Need **verified deployed exact SHA/URL** and paired backend TEST ENVIRONMENT before interactive views/CTA can genuinely PASS |

## 4. FIRST REAL PAID AD — decision and deployment gates (NO AUTO-DEPLOY)
1. Verify unmerged dependency chain **T034→T035→T036→T037→T038→T039→T040** against latest production schema and Founder Master PDF. Existing Production lacks payment receipt, advertiser portal, verified Article-geo, ad ticket functions. Do NOT apply review SQL piecemeal to core news.
2. For positive backend E2, use **Founder-authorized isolated STAGING / sandbox with safe synthetic contract**, not production fake bank receipt, fake buyer signed agreement, fake LIVE public ad or exposed credentials. No separate Supabase project/paid branch has been requested/created. If isolated hosted staging is not available, positive paid-ad E2 MUST remain held until first approved real transaction/paired rollout.
3. Before public hosted rollout revoke old raw anon click/impression functions, apply new Owner-only qualified service, true Article ID/LGD/geo verification, independent abuse/rate budget, RLS, rollback and current-LIVE Phase3 regression; then real owner AAL2 E2 and physical Android E3.
4. **A no-paid Android E3 partial test** can check published Article + contact-only request + zero unauthorized paid ad on a verified already-deployed URL. Such a negative **does not** substitute for ADS048–050 positive qualified paid-ad view/click. Ask Founder for ONE safe Android link step only once that URL/commit is confirmed. The Vercel connection used in this checkpoint returned no projects when searched by `janta`; no deployment SHA/URL was independently verified.
5. News/Domain/Social soft-launch independently remains the Founder priority. No production schema, Auth, payment, article, Vercel or Cricket modifications here.

## Honest CP04 output
- **Actual hosted READ-ONLY backend negative/existence preflight: EXECUTED (no database writes).**
- **CI 1/1 new CP04 and 2/2 protected baseline: PASS at described scoped E1/source/PG17.**
- **TRUE hosted E2 valid paid ad + real Android E3: 0/3 FINAL PASS; HOLD.** 
- **Founder manual step NOW:** NONE for CP04. For full E2 next, Founder must approve a truly isolated staged hosted test scope; do not silently create paid resources or touch LIVE.
- **CP05:** establish verified deployed public News/Article URL and prepare only safe zero-LIVE Android baseline; qualified paid CTA E3 remains gated until paired service and consent.

**NO REBUILD • NO FAKE PASS • READ-ONLY BACKEND NOT PAID-E2 • FAIL-CLOSED • DO NOT HARM NEWS**
