# JANTA BOL Phase-4 B9 / P4-T105 — ACTUAL Android + Large Synthetic Archive Checkpoint

Date: 23 October 2026 (IST). Original 321-page Phase-4 Master Execution Pack, RUN-13, SRCH-046..050, sections 1010..1014.

**Required:** E1 GitHub CI, E2 DB/RPC, E3 real-device speed/usability.
**Verdict:** **PARTIAL DEVICE + SYNTHETIC CI PASS; T105 FINAL PASS + LOCK HOLD** because no genuine production 2024–2025 (1–2-year-old) Article exists and 5,000-row performance was not measured directly in Android rendering. This report does not substitute simulation for that real Article/device condition.

## Real E3 — founder Android phone AND tablet screenshots, reused from current chat
- Steps 1–4, phone: B9 public Search loaded, 16 real Published news listed; August 2026 filter returned exactly 2 real historical test stories (21 and 23 August). Tapping 21 August opened the ORIGINAL permanent UUID `df97df06-a246-4e4e-ac5d-1f965fa6b381`, correct title/body/Related 5, no visible error; oldest ordering 21 Aug, 23 Aug, 7 Sep, 9 Sep.
- Step 5, phone: `Cooler` Search returned 1 correct Published news, founder estimated **approximately 1 second** (NOT stopwatch measurement).
- Steps 6–8, Android browser secured Founder/AAL2 Analytics: real 30-day report screenshot **60 Views, 4 Shares, 64 Total Events**, 7-day **15/1/16**, Today **9/0/9**. At each original verification time, independent LIVE Supabase read-only SQL gave EXACT same totals (remember raw totals increase upon actual page visits). Phone/Founder path requires no manual analytics calculation.
- Steps 9–11, tablet or split-screen Android SPCK environment: Search UI displayed 16 real Published and correct responsive fields; `Cooler` returned one correct news item; founder estimated **about 1 second**; August 2026 filter returned BOTH 21 and 23 Aug real stories. This repeats search coverage already exercised for T100/T101, so **no further repeat phone/tablet steps are warranted** just to resubmit the same screenshot.
- No new actual 2024/2025 live historical Article was found. The actual live oldest observed Article dates from Aug 2026. This cannot be faked or made compliant by editing a current Article's date.

## E1 — new 5,000-row ISOLATED PG17 benchmark
- New reviewed-only SQL file `ci/phase4/b9-t105-large-archive-pg17.sql` and narrow GitHub B9 CI workflow hook, source SHA `91195c6fdab8a344a60e06e47c0dc046903622b0`.
- Genuine GitHub workflow run **39940856394 — completed SUCCESS**. Jobs passed: B9 standalone real PostgreSQL17 fixture/security, source/109 tests lineage, inherited protected Phase3/B7 G0 and B8 G1, full B0–B9 source ZIP. Historical B8-only ZIP intentionally SKIPPED, not PASSED.
- Dedicated job executed **5,000 ADDITIONAL synthetic Article records** into disposable local PG17 (4,500 Published and 500 Draft/Unpublished/Deleted, besides the baseline 3 Published/3 hidden fixtures). `INSERT 0 5000` and `T105_PG17_LARGE_ARCHIVE_SYNTHETIC_PASS` confirmed in real job log.
- Synthetic **2024 and 2025 old Article searches** PASS; no forced Topic/Tag. All public synthetic + fixture Article identities return original `article.html?id=<UUID>`.
- Full actual `jb_b9_search` oldest-keyset cursor traversed **4,503 distinct public Articles across 91 pages of up to 50, zero duplicates, no lost identities**. 503 nonpublic stay hidden; private-body marker and Draft ID searches yield zero.
- Largest single RPC processing time observed on GitHub runner was **4.13 ms**. This number is **PostgreSQL function execution only**, not network/browser/Android end-to-end speed, and is not a universal performance guarantee.
- All synthetic work in `BEGIN ... ROLLBACK` on a separate disposable GitHub PostgreSQL service; ZERO changes to JANTA BOL production DB, rows, live indexes, domain, main branch or Cricket.

## E2 — independent LIVE read-only backend corroboration
- JANTA BOL Supabase project `vrffsnkycvjithwtiylt`; real 32 Article entries, 16 Published; phone and tablet two August search hits agree with production backend.
- Founder 30d/7d/Today totals independently matched *at the corresponding observation time*, avoiding false fixed-count promises.
- Existing protected public-only filters, PostgreSQL17 Archive and Project private role/Owner/AAL2 gates still intact.
- Real 1–2-year old Published data: **absent**. Not a failure of a date cutoff: date-agnostic/year-aware query already verified with isolated 2024/25 fixture.

## Release decision / Founder time
- **All current meaningful Android steps 1–11 completed; no more redundant manual search or analytics tests.**
- Functional existing phone/tablet usability + 5k backend load **PASS**, but final T105 official PASS+LOCK **HOLD** for original real old-Article on Android requirement and actual 5k-item phone/tablet UX-load comparison. It is a **data/scale evidence gap**, not an observed functional bug.
- If the real Article corpus grows and verified 2024/25 history is legitimately imported, recheck actual old published URL on Android and mobile network budget; **no artificial live backdated story** to fill a test.
- B9 overall HOLD, T109 not final locked, B10 not started; B0–B8 retained.

**Checkpoint decision: T105 device steps complete; no extra founder action right now.**
