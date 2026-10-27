# JANTA BOL P4–T071 C2 — One Consolidated Actual-Execution Verdict

**Date:** 27 October 2026 IST. **Founder:** “C2 complete kro ... next phir next ... soft launch.”  
**Master:** Phase4 T071 p.304 RECOV-019..026, C2 in frozen Five-Gate Closure Route V1.0. **Public site domain: JANTABOL.in (NOT jantaboli.in)**; DNS DUE outside T071.

## Outcome without a fabricated 13-of-13 pass

**Original thirteen real source adapters with injected dependency failures = 13/13 scoped PASS**, earlier run `40508982711`. These are NOT real backend 13/13 outages.

**NEW actual independently executing PostgreSQL17 source-backed backend failures, both verified in GitHub Actions without touching prod:**

1. **Notifications #03, code source backed:** `40528474982`, job `122274421572`, SUCCESS — **15 actual B8 SQL migrations** in disposable PG17, actual notification INSERT fails, concurrently actual original B8 case function commits under simulated Owner/AAL2; original News+Ad+notification sentinel unchanged; storage recovers; no fake notification delivered. Productwide/messaging provider E8 still HOLD.
2. **Advertising #06 + Payments #11, original project B7 candidate SQL:** `40530048228`, job `122280044810`, SUCCESS — real PG17 authentic `b7-payment-fixture.sql`, `20261010_b7_manual_payment_REVIEW_ONLY.sql`, `20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql`, synthetic Owner enabled. Existing source `jb_ad_confirm_manual_payment_internal` attempts real PostgreSQL payment INSERT during engineered CHECK violation; fails. Independent SQL read-back confirms NO `confirmed` payment, NO campaign `paid` or `live`, attempted direct LIVE promotion denied by original trigger. Storage repair then missing receipt still denied. **No real bank transfer or live Ads/provider action.**
3. **Accountability #08 (previous genuine partial):** `40504645684`, SUCCESS — real isolated B8 public RPC feed fails on scoped permission removal; independent peer public-case RPC continues; original synthetic News + Ad rows preserved; grant restored.
4. **Database #13 — NEW actual failed-write/false-ACK proof:** `40531488909`, job `122285201848`, SUCCESS. Actual original B8 `jb_b8_g1_owner_create_case` inside isolated PostgreSQL17 wrote and committed a baseline record. PG17 `CHECK(false) NOT VALID` caused a subsequent real source RPC INSERT to fail with `check_violation`; no UUID/success was emitted, zero partial rows persisted and independent Article/Ad records survived. After removing the fault the original RPC genuinely committed one new case, and disabling synthetic Owner/AAL2 denied an additional write. **Scope:** genuine PG17 + synthetic Owner auth, NOT hosted client/Supabase/Edge E8. Separately previous backup-crash-restore `40501228346`, SUCCESS: checkpoint point-age 0.422s / local RTO 1.261s with **one acknowledged post-checkpoint synthetic committed row lost**, not production SLA.

### Newly executed Analytics #02 genuine original B7 candidate RPC fault

GitHub **`40531996112`**, job **`122287010483`**, SUCCESS. Disposable real **PostgreSQL17** loaded original B7 payment/event fixtures plus unchanged **`20261010_b7_qualified_impressions_REVIEW_ONLY.sql`** (NOT Production). Confirmed actual owner analytics RPC labels results **client-reported estimates, anti_bot_verified=false**, with qualified/unverified impressions separated. Revoked authenticated `EXECUTE` on `jb_ad_qualified_analytics_internal(uuid)`: actual SQL `insufficient_privilege`, existing synthetic published Article, Ad state and event counts unchanged. Re-granted and checked identical honest analytics after recovery. **Scope: genuine scoped SQL RPC fault**, no provider/bot-proof/hosted article browser; full E8 HOLD.

## 27 October latest seven-family real HTTP batch — all remaining domains covered at scoped boundaries

**Actual GitHub Actions run `40534396564`, job `122295571136`, SUCCESS: 8/8 Node tests and one real original B8 PG17 committed-record durability check before/after.** The test executed actual repository JavaScript adapters pinned to B8 SHA `658f474d...` and complete News/B9 source SHA `b509c60f...`, but against an **actual local Node HTTP server deliberately returning HTTP 503**. The outage response is controlled synthetic, **not a real Supabase Edge or Larix/provider outage**. Genuine static News, Article and LIVE HTML routes returned HTTP 200, unknown file returned 404.

- **#01 Social:** original UI refused fake Posted and HTTP 503 did not change local Pending status.
- **#04 Grievance:** original internal transition rejected HTTP 503; no fabricated protected transition success. This is a source/HTTP boundary test, **not genuine Grievance SQL rollback**.
- **#05 Compliance:** original internal transition rejected HTTP 503; no invented approval/transition. Not original compliance SQL rollback.
- **#07 Search:** original B9 adapter sanitized actual HTTP 503 to `B9_BACKEND_REJECTED_jb_b9_search: REMOTE_CHECK_FAILED`; independently the exact sourced Article **HTML** remained HTTP 200, which alone does **not** prove loaded article body.
- **#09 LIVE:** original LIVE client failed on actual HTTP 503 from local Edge stand-in, no false command success; not a real Larix/live stream.
- **#10 Provider:** camera handoff refused 503, navigation remained unchanged; no actual encoder/provider was called.
- **#12 Messaging:** original LIVE notification acknowledgement refused actual HTTP 503. In that **same GitHub job** genuine disposable PG17 was loaded with original B8 Owner-case RPC and a synthetic Owner/AAL2 actor; a case **was committed before** the messaging fault. A fresh PostgreSQL query **after** the seven HTTP failures proved case + original Article + Ad still persisted. This is an original DB continuity check with a synthetic remote 503, **not a real external messaging delivery receipt**.

**Original source fault coverage is now 13/13 locally:** six of thirteen source-backed actual PostgreSQL17 SQL faults (#02,#03,#06,#08,#11,#13), seven other original adapters confronted with genuine **local HTTP 503** (#01,#04,#05,#07,#09,#10,#12). **C2 FINAL E8 remains HOLD** because backend/provider outages were controlled local stand-ins and six PG17 tests are separate fixture environments, not the same full release-candidate live stack.

### Live connected Supabase READ-ONLY catalog/operational check (no user messages/PII inspected)

The connected production JANTA BOL project `vrffsnkycvjithwtiylt` reported PostgreSQL17 ACTIVE_HEALTHY. Only `BEGIN TRANSACTION READ ONLY` catalog/aggregate probes were used:
- **Social:** global_enabled=true but **three** actual Social Distribution records have `provider_mode=MANUAL`. Therefore **enabled UI cannot be called automated external Posted proof**; source blocks fake Posted.
- **LIVE:** **16 live_sessions OFF**, **7 public_live_feed OFF**. The public site’s old static red LIVE banner is still a separate Soft Launch truth issue.
- **Messaging:** **160 live_notifications = IN_APP_READY**, **no external deliverability established** from this state; a queued/in-app notification is not a proven WhatsApp/email send.
- **Grievance:** six rows across received 3 / resolved 1 / under_review 1 / withdrawn 1. **Compliance:** one complete task. Counts only; no sensitive complaint/task content accessed.
- **Security:** RLS enabled and anon direct SELECT absent on private `articles`, `grievances`, `compliance_tasks`, `social_distribution`, `social_settings`, `live_notifications`. Anon direct `public_live_feed` SELECT is permitted under RLS. Anon EXECUTE on private Grievance/Compliance/Social mutation RPCs is **denied**. Anon `jb_b9_search('T032')` returned **one** public metadata result **without full body**. `jb_b8_g4_public_feed` also exposes a controlled public RPC. These are **ACL/live baseline proofs, not injected production faults**.
- As previously audited, disabled/review-only B7 capability RPCs cannot be forced into Production merely to manufacture a C2 PASS.

**Machine-readable 13/13 evidence index** (with per-domain exact run and full-product HONEST HOLD): `ci/phase4/b11/t071-c2-all-13-source-transport-pg17-evidence-index-20261027.json`. The fixed Five-Gate Route V1.0 remains unchanged.

## Frozen thirteen-family C2 status: no hidden gate

| # | Family | Source/adapter dependency-negative | New/preserved genuine isolated backend proof | Final original connected-E2 test |
|---:|---|---|---|---|
| 1 | Social | PASS | **Original UI real loopback HTTP 503 fail-closed `40534396564`**, provider genuinely external still untested | HOLD |
| 2 | Analytics | PASS | **NEW real disposable PG17 B7 qualified-analytics RPC permission fault, old Article/events unchanged, restored `40531996112`**. No real bot audit or production deployment | HOLD |
| 3 | Notifications | PASS | **PASS scoped real PG17 notification storage outage** | HOLD |
| 4 | Grievance | PASS | **Original protected RPC client via real local HTTP 503 `40534396564`**; original backend grievance transaction not fault-injected | HOLD |
| 5 | Compliance | PASS | **Original protected RPC client via real local HTTP 503 `40534396564`**; original compliance backend transaction not fault-injected | HOLD |
| 6 | Advertising | PASS | **PASS scoped real PG17 original B7 Ad LIVE guard during real payment DB fault** | HOLD |
| 7 | Search | PASS | **Actual local HTTP 503 on original B9 client** with Article HTML 200 `40534396564`; real anon Supabase search RPC one metadata hit, no genuine hosted outage | HOLD |
| 8 | Accountability | PASS | **PASS scoped PG17 original B8 RPC permission fault and restoration** | HOLD |
| 9 | LIVE | PASS | **Original LIVE Edge client real local HTTP 503 `40534396564`**, live DB 16 OFF; no actual Larix/backend outage | HOLD |
| 10 | Provider | PASS | **Real local HTTP 503 camera handoff, no false navigation `40534396564`**; actual Larix/provider not invoked | HOLD |
| 11 | Payments | PASS | **PASS scoped PG17 original B7 payment write rejection, no false paid/Ad LIVE** | HOLD |
| 12 | Messaging | PASS | **Original Edge client real local HTTP 503 while original B8 case genuinely committed in same disposable PG17 job and persisted after `40534396564`**; actual external provider undelivered E8 untested | HOLD |
| 13 | Database | PASS | **NEW real PG17 original B8 failed-write no-false-ACK, rollback, recovery, Owner AAL2 denial `40531488909`**; original crash/restore still disclosed one ACKed post-checkpoint lost row `40501228346` | HOLD |

**Counts:** **13/13 exact family labels now have an executed local failure-isolation boundary probe beyond pure fabricated JavaScript outcomes**: six have original source-backed actual PostgreSQL17 database fault/recovery (#02,#03,#06,#08,#11,#13); seven have real loopback HTTP 503 against original JS clients (#01,#04,#05,#07,#09,#10,#12), with real PG17 B8 case durability verified across simulated messaging failure. These are **DIFFERENT SCOPE CLASSES** and do **not** mean 13 real deployed failures or unified source version. Prior restore still lost one post-checkpoint acknowledged synthetic write. **0/13 can be certified full same-release integrated E8.**

## Non-negotiable C2 completion condition already frozen

A valid **C2 COMPLETE/PASS** needs *each of thirteen* families under the **same actual release-candidate identity** with controlled real integrated fault/unavailability and verified core publication/article read, before/after business state and false-success prevention. A feature deliberately OFF/not deployed need **true same-candidate fail-closed proof**, not payment/provider enabled merely to force pass. C2 **does not require the custom domain JANTABOL.in**, paid hosting or unapproved B7 review-only migrations. Original C1 candidate preview/anonymous full-body current release still HOLD; this prevents same-candidate connected proof, not permission to make up one.

### Explicit remaining backend-capable versus third-party-dependent evidence
- **Backend/security:** genuine Grievance + Compliance isolation; real B9 Search outage while Article read persists; actual LIVE command/data-state handling; server-side database failure false-commit behavior; same-system Source Auth/RLS protected published-News baseline.
- **Intentionally disabled / external:** Social provider, qualified analytics, B7 paid Ad payment, external encoder and messaging require demonstrable fail-closed actual runtime state; if disabled in the release, independently prove honest NOT_AVAILABLE/WAIT instead of making external payments or LIVE sessions.
- Existing C1 draft PR #47 contains scoped safer guest published-body RPC **REVIEW_ONLY**, proven isolated PG17, not deployed. C1 hosted exact-SHA Preview blocked by Vercel Hobby 402; it is **deferred** per Founder, not silently passed.

**No production DB/DDL, GRANT, secrets, provider calls, real bank transaction, Founder-only operation, Git Main merge, Vercel deploy or Cricket resource changes.**

## Final authoritative C2 and broader project state

- **C2 Backend-isolation execution:** valuable additional real proof **PASS for its exact components**. Previous source-only evidence retained; no repeat for no reason.
- **C2 Gate FINAL:** **HOLD / INCOMPLETE**, because the 13-family same-candidate full operational requirement remains unmet. Neither this log nor permission can change the actual facts.
- **C1:** HOLD until exact eligible hosted preview, permitted full Article read and Founder LIVE/publishing baseline.
- **C3/C4:** PARTIAL; **C5:** HOLD; **T071 FINAL:** HOLD; **T072:** NOT STARTED.
- Founder request to avoid endless reports: **this file is the single reconciled C2 status**. Subsequent updates should **replace/update this report with new real proofs**, not split the same evidence into new reports. Only deliver final LOCK if original requirements genuinely verified; don't move the gateposts.

### CI links
- New remaining seven original JS adapters real local HTTP 503 + same-job actual original B8 PostgreSQL17 committed-case readback: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40534396564
- New B7 qualified analytics real PG17 fault: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40531996112
- Notification fault: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40528474982
- B7 Ad and Payment fault: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40530048228
- B8 Accountability fault: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40504645684
- New original B8 DB false-ACK fault: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40531488909
- Real disposable DB backup/crash/restore: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40501228346
- Thirteen source-only adapter fault exercise: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40508982711
