# JANTA BOL — Phase 4 P4-T071 C2 / E2: 13/13 Real Scoped Failures + Exact Deployed C1 Candidate Public Continuity

Date: 28 Oct 2026. Master RECOV-019..026 p304; frozen C1–C5 route. Public hostname is JANTABOL.in. **One consolidated execution report; no fake final PASS.**

## Verdict

**C2 all thirteen failure families — exact deployed candidate SOURCE/BACKEND in safe isolated environments: 13/13 PASS (scoped).** **Actual same-source remote Vercel + anonymous Supabase unaffected before/after controlled local faults: PASS.**

**C2 final original full release integrated E2 = HOLD**, not Full PASS+LOCK: the seven transport outages were genuine HTTP 503 sent by a disposable local server standing in for external dependencies, and the six real source-backed PG17 backend faults were injected into separate disposable fixture databases within a single GitHub job, not into actual hosted Supabase/Edge/YouTube/Larix/payment providers. We did NOT authorize/provoke destructive Production outages. No Production end-to-end outage can be inferred from observed healthy read-back.

## Immutable identity / source proof

- Repo: `jantabol/JANTA-BOL-Website`. Frozen C1 actual web application **SHA `659bcdc2ec4e270ea066863b4b456aeb65cb7c73`**; existing Vercel Preview deployment **`dpl_Cn5EixeHWyDohwfD6C8kPBf5mhPs` READY**, same exact deployed source.
- Checkout test candidate **`89849ba47f443f423d8bfe4f966bb2d38087201f`** (only test-only source additions). GitHub Actions verified `git diff --exit-code 659b... HEAD -- JANTA_BOL_PHASE_3C_WORKING`, so the web app source is **identical to the deployed Founder-published preview**.
- Original B7/B8 authored SQL fixtures/migrations were verified byte-identical between original backend SHA **`658f474d6ee0f24efac60f069979e8adee1e9221`** and currently deployed C1 source for major payment, Ad guard, analytics and B8 case/notification functions. Existing authentic SQL executed without modification; only repeated cluster-global fixture `CREATE ROLE ... nologin` was skipped for the 2nd–5th disposable database on the same PostgreSQL 17 server. Original private business state machines, database failure checks and backend function implementations remained unchanged. No Git Main code or prod database changed.

## NEW actual GitHub run A — seven 503 boundary failures + genuine C1 article continuity

**GitHub Actions run `40636375107`, job `122644179858`, SUCCESS**. Existing original **seven** repository adapters actually executed with real HTTP requests against a **local server returning HTTP 503**. **8/8 Node assertions PASS**; disposable original B8 `jb_b8_g1_owner_create_case` genuinely COMMITTED a synthetic Owner/AAL2 case *before* the outages, and the same PostgreSQL database was independently queried *after* all HTTP failures: case, original synthetic Published Article and Ad campaign still persisted. This does not simulate a real Founder login.

**Crucial real hosted control in SAME runner before and after local dependency failures:** independently executed original C1/E1 anonymous HTTPS tests **7/7 PASS BEFORE + 7/7 PASS AFTER** to the exact real deployed Vercel Preview and actual live Supabase. Confirmed genuine SpaDeX published Article ID **`f17f6507-02a3-4881-ad37-0b02cadf3d3f`**, corrected body **2896 characters**, old Demo Draft not guest accessible, private creator metadata denied, no false LIVE from actual `public_live_feed`, and private `live_sessions` denied. This proves healthy Core remote News stayed available while **unconnected local** optional failures were exercised; it does **not** prove the live remote stack withstood injected provider faults.

Existing same-candidate original News/B9/LIVE/guest security tests **32/32 PASS**; original P4-T019 Founder/AAL2 publishing **MOCK PASS** (real Founder actual publishing established separately under C1).

## NEW actual GitHub run B — six original backend faults on same candidate SQL source

**GitHub Actions run `40636730966`, job `122645306977`, SUCCESS**. A single disposable GitHub PostgreSQL17 server ran the original B7/B8 source with **five separate isolated temporary databases** (same original fixture content, with only repeated shared cluster-role creation omitted), each guard checking expected exact DB name/source fixture.

| # | Family | Real fault actually induced | Evidence | Bound |
|---:|---|---|---|---|
| 01 | Social | Original candidate social-client failed real local HTTP 503 and refused fake Posted state | Run A | Stand-in HTTP only |
| 02 | Analytics | Original B7 analytics RPC EXECUTE **REVOKED** in actual PG17; `insufficient_privilege`; identical estimate-only/anti-bot=false counts after restoration | Run B | Disposable DB |
| 03 | Notifications | Real PG17 source notification INSERT CHECK failure while original B8 Owner synthetic case committed; recovery confirmed | Run B | Disposable DB |
| 04 | Grievance | Original source protected transition rejected real local HTTP 503, no success response | Run A | Stand-in HTTP only |
| 05 | Compliance | Original source protected transition rejected real local HTTP 503, no fabricated compliance approval | Run A | Stand-in HTTP only |
| 06 | Advertising | Original B7 Ads guard rejected paid/live status under an actual PG17 payment storage failure; no fake LIVE promotion | Run B | Disposable DB |
| 07 | Search | Original B9 adapter rejected real local HTTP 503 and did not invent results; real hosted published article guest read PASS before/after local fault | Run A | Stand-in HTTP only |
| 08 | Accountability | Actual PG17 B8 public feed RPC permission failure; independent peer RPC/source News and Ad persisted | Run B | Disposable DB |
| 09 | LIVE | Original LIVE Edge client rejected real local HTTP 503; real guest feed had **0 active LIVE**, truthful OFF | Run A | No Larix/real LIVE fault |
| 10 | Provider | Original camera handoff refused real local HTTP 503; navigation unchanged | Run A | No external encoder call |
| 11 | Payments | Original B7 payment record INSERT genuinely failed in PG17; no confirmed money or paid/live Ad; after repair missing receipt still denied | Run B | No real payment |
| 12 | Messaging | Original notification ACK refused real local HTTP 503; genuine earlier committed B8 case persisted independently on same PG17 test job | Run A | No real WhatsApp/email deliverability |
| 13 | Database | Original B8 case RPC genuine PostgreSQL `CHECK(false)` failure did not acknowledge success and created zero partial case; repaired DB allowed clean commit | Run B | Disposable DB |

**C2 six real PG17 source backend faults 6/6 PASS. Seven actual original full-candidate adapter HTTP failure families 7/7 PASS. Frozen original thirteen, no DNS 14th family.**

## Original four Master invariants supported at scoped level
1. Optional failure does not crash **original frontend paths**: PASS *local* plus independently REAL remote healthy read. Real hosted simultaneous optional fault remains NOT PROVEN.
2. Payment uncertainty cannot make Ad LIVE: PASS under real original B7 PG17 source trigger; actual payment/Production Ad provider not tested.
3. Messaging failure does not reverse committed business action: PASS for genuine B8 PG17 commit before/after **local synthetic HTTP 503**; real external message provider failure not established.
4. Database failed write cannot claim success: PASS in genuine PG17 original B8 function, with failed and post-repair independent readbacks. No real Supabase outage.

## Provenance and deliberate refusals

- Run A source pinned to EXACT web candidate source 659b and tests from review commit 89849; run B original critical backend SQL SHA/fixture identity verified in GitHub Actions.
- Original old source-negative CI `40534396564` and genuine isolated PG17 runs `40531996112`, `40528474982`, `40530048228`, `40504645684`, `40531488909` remain archived with exact timestamped logs. New runs supersede the old **source identity mismatch** and repeat authentic source SQL faults with the current preview candidate, rather than fabricating missing integrated provider behavior.
- First two exploratory runs of this newly consolidated single-cluster PG17 workflow FAILED due to database-name gate then duplicated shared `CREATE ROLE`, NOT source security failures; both corrected and **new final Run B SUCCESS**. First Run A failed only older pinned-folder guard, corrected to point both original adapter roots at the same exact app.
- **No** real LIVE stream started/stopped, paid invoice confirmed, real provider intentionally disabled, Production Supabase function revoked, confidential data fetched, secrets exposed, new account/project created or paid plan purchased. Main/Vercel Production unchanged; JANTA BOL Supabase live records read-only; Cricket/Saarthi untouched.

## Honest closure route

- **C1 E1** PASS+LOCK (genuine Founder publish, real guest Incognito, corrected Article v15, truthful LIVE OFF).
- **C2 E2 SCOPED 13/13 SOURCE/FAULT SUITE** PASS with full candidate identity and actual remote core pre/post healthy read.
- **C2 E2 full hosted integrated 13-dependency outage**, as demanded by frozen route, remains HOLD: no real failure of actual hosted optional service in the same system. Do **not** mark C2 Final PASS+LOCK or claim a provider/Larix/e-payment negative E2. If optional external services truly remain RELEASE-OFF, obtain read-only capability flag evidence as the route allows rather than activating them. Active Grievance/Compliance/messaging external faults need a safe isolated authentic integration environment to move to full PASS, not production disruption.
- **C3** practical RPO/RTO and Founder conservative recovery-risk policy already covered; no real production RPO/RTO claim.
- **C4** old Phase3 and News/LIVE source passes, 13 E5 logs; full same-connected-provider E5 still HOLD.
- **C5** independent E8 + Founder Final T071 Lock still HOLD. **P4-T071 FINAL PASS+LOCK=false**, **T072 NOT STARTED**.

## Reference links
- C2 Run A exact candidate guest pre/post seven local 503: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40636375107
- C2 Run B six authentic PG17 DB faults: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40636730966
- C1 original real guest E1: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40635754482
