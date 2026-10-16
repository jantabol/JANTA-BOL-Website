# JANTA BOL — PHASE 4 / B7 / P4-T040 CP02
## Owner IST Analytics Calendar + Failure Isolation — REAL RED → SAFE FIX → GREEN
**Execution:** 16 October 2026 IST · **Founder Master SOT:** B7 Final Master Blueprint P4-T040 ADS-048, ADS-049, ADS-050, genuine **E1 + E2 + E3** required. **Official 3/3 FINAL DUE, no PASS+LOCK.**

### EXACT CURRENT SOURCE / OWNER AUTHORITY (not theory)
- Source branch: `review/t040-cta-privacy-failure-20261016`, DRAFT PR #35 child of unmerged T039 PR #34. Protected older B7 branch and all news systems unchanged.
- In the existing reviewed `20261010_b7_qualified_impressions_REVIEW_ONLY.sql` and final overriding `20261010_b7_cta_click_REVIEW_ONLY.sql`, Owner `jb_ad_qualified_analytics_internal` reported `today` via `created_at >= date_trunc('day', now())`.
- **LIVE Supabase confirmed READ ONLY**: timezone is **UTC** (2026-10-16 15:07 UTC = 20:37 IST). Founder/Android displays schedule times in **Asia/Calcutta (IST)**. A legitimate ad view at **03:00 IST** is from 21:30 UTC on the previous day, and was excluded from `today` while the user naturally sees it as part of the current India calendar day. This is a reporting correctness mismatch. No location/GPS is used.
- Production still has **0 ad_events / 0 LIVE campaigns / 0 ad_payments** during the inspected state. Live legacy anonymous `jb_ad_event`/`jb_ad_record_event` RPCs can insert raw impressions/clicks only when LIVE but are NOT qualified human/billable proof. Neither reviewed Owner stats/ticket migration nor staged analytics JS is deployed/live; news + contact-only soft launch unaffected.

### REPRODUCE / FIRST DIVERGENCE
- New actual PostgreSQL17 clock-boundary test `ci/phase4/b7-t040-cp02-ist-analytics-boundary.sql` inserts **two synthetic qualified impressions** for one campaign: one precisely inside the interval between **IST midnight and UTC midnight**, and one recent valid impression. Also inserts one legacy raw and one explicitly client-reported click to prove separation. Test automatically handles CI running before or after 18:30 UTC. Role Owner is synthetic fixture only; transaction **ROLLBACK**.
- **REAL business RED [#38921756167](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38921756167):** `T040_IST_TODAY_DIVERGENCE got=1 expected=2 IST_midnight=2026-10-15 18:30:00+00 UTC_midnight=2026-10-16 00:00:00+00`, on actual disposable PostgreSQL17. Other protected client job SUCCESS. An earlier [#38921642597](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38921642597) failed before jobs due to an unquoted colon in the **workflow step title**, fixed without touching SQL/business logic; do not mistake that workflow syntax for a backend failure. This was one targeted SQL fix after actual business RED, not guess-patching.

### MINIMUM SAFE FIX — same two original reviewed reporting sources, NO NEW analytics engine
- Changed only `today` time predicate in BOTH existing reviewed SQL reports:
  `created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')`.
- This computes IST calendar **midnight as a PostgreSQL timestamptz instant**, independently of the Supabase DB's session timezone. It does NOT modify stored UTC timestamps, any event rows, Article views, older raw event count, d7/d30 7×24h windows, ledger structure, Revenue/Payment/Owner ACL, or historical evidence.
- Existing CP01 HIDE-after-token click denial (shared eligible Article+approved paid creative) and legitimate **21-minute pinned LIVE Article CTA** remained intact.

### INDEPENDENT FAILURE + PRIVACY E1 (real page JS, simulated outages)
- New `ci/phase4/b7-t040-cp02-analytics-failure-isolation.test.cjs` runs **ACTUAL `public-ads.js`** in a virtual DOM, with exact published Article UUID and one Approved TEXT+HTTPS CTA card.
- **3/3 PASS:** optional analytics `prepare()` throws synchronously; optional analytics `prepare()` rejects asynchronously; public ad feed fails (`PGRST202`). In the first two, existing News text and same original CTA/ad remain, no new paid-ad selection; on public ad-feed failure, ad region stays empty, editorial News remains. No actual network/service outage or physical Android device was tested; these are E1 simulated-failure tests, not hosted E2/E3.
- Protected original client tests also verify no GPS/IP/device/phone/fingerprint storage, approved click `isTrusted` is only a **client signal**, replay/URL safety, news independent of analytics. Cannot claim actual bot-free people or contractual paid reach from counters; bot/rate budget remains **DUE**.

### REAL GREEN + protected receipts
**[Final verified GitHub CI #38922221262 — 2/2 jobs SUCCESS](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38922221262)**, source SHA `969e639da217da36fc637e0181f255f7a16373f2` (before documentation-only changes):
1. **Actual isolated PostgreSQL17**: CP01 HIDE and 21min/one-click negative/positive, original entire ADS048..050 qualified ticket/geo/approved CTA/Owner AAL2 tests, NEW `IST Today=2`, d7=2/d30=2/total=2, legacy raw=1, reported click=1, verified-human clicks=0, explicit `anti_bot_verified=false`. Three SQL transactions end `ROLLBACK`.
2. **Actual original browser renderer in E1 VM + complete protected static baseline:** Viewability **11/11**, Analytics client **13/13**, NEW renderer optional stats/feed outage **3/3**, Android layout **2/2 source-only** (NOT Android E3), protected B7/News client **76/76**; protected Phase3 *STATIC* security/governance/records, publishing-fault and `644/644` coverage audit **PASS** (59 manual-only appropriately protected). Original B7 closure still **BLOCKED** for absent real evidence.
- The full **hosted Supabase transactional Phase3 regression was NOT RUN**: not reported as PASS. Real viewer E2, actual Android E3, real provider payment, Owner Auth E5, independent bot abuse and LIVE first ad release NOT TESTED.

### Remaining true P4-T040 official gates before first real paid ad
| Official test | Scoped engine proof | Honest remaining evidence |
| --- | --- | --- |
| **ADS-048** CTA Call/WhatsApp/Website/Map | safe source/PG17 CTA, HIDE-after-token refuses; 21min still-LIVE works once | hosted Owner-approved creative CTA E2, physical Android E3, invalid target/redirect/hide realistic |
| **ADS-049** qualified today/7d/30d/total | NEW correct IST Today E1 real PG17 and original ticket/Owner stats, explicit client reported/legacy separated | real legitimate hosted paid Article/schedule/data E2 + 50%/1s Android E3, staff/Owner stats reconciliation |
| **ADS-050** privacy/abuse and failure isolation | actual public JS mocked outages 3/3, original negative token/privacy PG17 and protected News CI | actual hosted backend analytics/provider/media failure isolation E2, rate/fraud abuse controls and proper privacy review, physical Android E3 |

### Founder launch and manual boundary
- **No PROD SQL writes, Vercel deploy, real payment, public auth/account, paid campaign, DNS, live ad/analytics, article publication or Cricket changes.** PR#35 remains **DRAFT/unmerged**.
- **Contact-only NEWS soft launch can proceed independently** after its own domain/news/correction/Android/Phase4 release gates; these staged paid-ad analytics modules must remain UNLINKED until complete official first-real-paid-ad approval.
- **Official P4-T040 ADS048..050: 0/3 final PASS+LOCK; scoped CP02 E1+real disposable PG17+Phase3 STATIC regression PASS, hosted E2/E3 HOLD; ZIP blocked.**
- **Founder manual step now NONE.** At actual first real paid ad E3/Owner checkpoint stop and give one explicit step at a time.

**NO REBUILD · EXACT SOURCE → REAL RED → FIRST DIVERGENCE → MINIMUM SAFE FIX → PROTECTED CI GREEN → REAL E2/E3 DUE · NO FAKE PASS**
