# JANTA BOL — P4-T108 RUN-13 / FINAL ANALYTICS + PRIVACY AUDIT
**Date:** 23 October 2026 IST
**Project:** JANTA BOL only, Supabase `vrffsnkycvjithwtiylt`
**Original contract:** Phase-4 Master Execution Pack (321 pp), Topic 14; SRCH-059–063, sections 1024–1028.
**Official test:** Complete Analytics Functional + Public Display + Privacy Test Family
**Required evidence:** E1 (CI), E2 (live DB/RPC), E5 (audit, history, authority)
**Verdict:** **P4-T108 scoped PASS + LOCK**. True historical Owner action/audit E5 reused from P4-T103; synthetic override/negative combinations freshly exercised without modifying LIVE Article counters. B9 overall and B8 final remain HOLD.

## E1 — exact source / rigorous PG17 synthetic audit (NO live test-data writes)

- B9 protected source branch: `codex/b9-precode-frozen-20261022`. T108 test code at commit `69282bc80ba4b5f1cd6bf171ad8f3c2ff675975a` (`ci/phase4/b9-pg17-regression.sql` only).
- New rollback-only PostgreSQL17 functional assertions:
  1. **Today / 7d / 30d / Custom** intervals in IST, compare precise `view` and `share` event sums with the backend `jb_b9_owner_analytics` result. 2026-10-23 fixture Today 0; 7d and 30d 4 total (3 views, 1 share); custom 22 October 3 total (2 views, 1 share).
  2. Most Viewed and Most Shared owner sorting identify the expected fixture Article; analytics detail references canonical Article UUID and PURL.
  3. Global Views/Shares four independent states: **OFF/OFF, ON/OFF, OFF/ON, ON/ON**. Public outputs stay null whenever their individual control is OFF; a zero share value when Shares are ON is displayed as **0**, not hidden.
  4. Published Article-specific display wins over global defaults: first Article keeps View Override **999** even under global OFF; second Article's **1234** view override is visible only when Views=ON, while Shares toggle independently. Clearing override returns the **raw** view count. Article-specific OFF beats global ON.
  5. Snapshot **MD5 over all raw `analytics_events` columns, ordered by ID**, is identical before and after all display-control changes. No raw event row is inserted, changed or deleted by display controls.
  6. Exactly **eight** successful control transitions appended synthetic `b9_metric_display_control` audit entries with actor and both before/after images; missing audit fields fail regression.
  7. Non-owner with nominal `aal2`, actual Founder with only `aal1`, negative/invalid view override, global override conflict and Global+Article conflict all **reject fail-closed**; no Owner identity bypass.
  8. Prior protected PG17 suites also verify secret raw-event table grants, published-only counters and default OFF, IST day-boundary, backend permission negative and Article public display separation.
- Synthetic fixture has isolated original source/roles, `BEGIN` transaction and `ROLLBACK`, no production DDL/DML. First scoped CI candidate `310c9897...` FAILED because test expectation said **9** audit writes but the test actually performs **8**. This was **a test-count typo, not a product defect**. Corrected in `1f97bb4758f7db76b932f00cb00b7acb2c1529b8`; protected run **39937606466 SUCCESS**. Additional AAL1/invalid-control guards added at `69282bc80ba4b5f1cd6bf171ad8f3c2ff675975a`. Keep both commits/CI records; do not conceal the initial negative test run.
- CI gates: isolated B9 PG17, 109-test canonical source/ancestry, inherited B0–B8 Phase3/B7 G0 and B8 G1, complete B0–B9 ZIP. B8-only older ZIP **SKIPPED** by branch design, never called PASS.

## E2 — actual LIVE read-only Supabase verification, 23 Oct IST
All verification was **SELECT/metadata/anon permission checks only**. The raw event counts below are **snapshots**, not future-stable numbers; browsing may increment Views independently.

### Actual event data/period arithmetic
- Real `analytics_events` at checked snapshot: **89 events = 79 views + 10 share-button-use events**; **zero** orphan/null Article IDs. Event schema has exactly `id, article_id, event_type, created_at`. No viewer IP, identity, cookie, profile, user agent or fingerprint columns; no dedicated `%visitor%`, `%fingerprint%`, `%tracking%` analytics tables found.
- IST inclusive-day windows at this snapshot:

| Period (IST start inclusive / next-day exclusive) | Views | Shares | Total |
| --- | ---: | ---: | ---: |
| Today 23 Oct | 7 | 0 | 7 |
| Last 7 days 17–23 Oct | 13 | 1 | 14 |
| Last 30 days 24 Sep–23 Oct | 58 | 4 | 62 |
| Custom 1–15 Oct | 14 | 0 | 14 |

- 7-day **per-Article sums match raw event sums exactly** (13 views / 1 share over 32 Article IDs). Top viewed Article raw count **5**, top shared Article raw share count **1**. Existing Founder owner-only report has 7d/30d/Today and shares-sort real E3 from already-locked P4-T103, not newly re-performed for T108.

### Public controls and legacy privacy
- Real global Public Views and Shares **OFF/OFF**. All **16/16** published Article `jb_b9_public_metrics` responses return both flags OFF with **null values**, never raw counts; all **16** nonpublic Articles return `NULL` metrics. Test Article `d943e80f-1d58-4f5c-8d8f-75e772955d56` remains OFF/OFF, override NULL, original Article UUID.
- **No non-null override** is currently applied in production. The 999/1234 override behavior was tested **only in isolated rollback PG17**; no fabricated claim of a real Founder override transaction.
- Actual `anon` lacks raw `analytics_events` SELECT, original `article_stats` SELECT, `article_public_view_settings` SELECT, B9 share/global settings SELECT, and Audit SELECT. Legacy `article_stats` view has `security_invoker=true` and cannot bypass raw event permissions. `anon` can invoke only the public-safe `jb_b9_public_metrics` projection, not Owner analytics or Owner settings RPCs.
- Both Owner analytics and settings functions enforce `private.current_owner_aal2()` **inside DB**, not merely frontend hiding.

## E5 — real permission/action/audit evidence, reused ethically
- From original real Founder T103 Android/AAL2 action: test Article OFF→ON (Views+Shares), public article screenshot displayed `👁 9 Views ↗ 0 Shares`; Founder restored ON→OFF and confirmed the public controls disappear while the Article/PURL/Related News remain.
- Actual LIVE `audit_logs` contains **3** `b9_metric_display_control` events for this Article (two ON saves, one explicit OFF restore) with nonnull actor, before and after states, and intact dates. Latest restore: **2026-10-23T09:27:55+00**.
- Live raw event records were not modified by direct test SQL, and the source writes only settings/audit, not `analytics_events`; stronger immutable raw-row hash regression is covered in isolated PG17.
- Share count **means clicks/usage of JANTA BOL's own Share and WhatsApp Share buttons**. It does **not** certify an external messaging app actually delivered a message. `article.html` calls `JBPhase2.track(article_id,'share')` on button use; `phase2-client.js` stores only Article ID and event type. This is truthful button-usage semantics, not a unique-user/recipient/send-success claim.
- No production Viewer identity/profiling or private raw stats exposed by B9 public display; no bogus unique-visitors definition.

## Release boundaries / nonclaims
- No new Founder Android step is required for P4-T108 **because original required proof is E1+E2+E5, not E3**. Genuine Founder settings E5 from T103 is reused and source-compatible; independent non-null override production UI not exercised.
- Current event counter totals depend on snapshot time. NEVER claim exact totals are static or that an external WhatsApp share was completed.
- Existing anonymous INSERT permission for raw events is an inherited data-collection design, **not a claim of bot-proof, unique, fraud-proof, or externally authenticated share events**. That separate product-hardening question does not turn historical button-use events into certified deliveries.
- T105 still **DUE** for large archive/Android real performance, T109 still **DUE** for full outage/security/failure-isolation final gate. B8 FINAL HOLD and B9 overall HOLD continue; B10 cannot start. No LIVE schema/data changes, main merge, production deploy, reporter permission alteration, or Cricket/Saarthi touch.

**P4-T108 — E1 + E2 + E5: PASS + LOCK (scoped), with historical real Founder E5 + synthetic non-null override proofs explicitly distinguished.**
