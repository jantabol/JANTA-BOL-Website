# JANTA BOL — Phase 4 B7 — Consolidated Problem Punch List
12 October 2026 | Working branch `codex/b7-blueprint-20261010`

## Governance
This is an **issue index, not the Master Blueprint or a PASS declaration**. Cross-reference: `B7_20261012_ANDROID_E3_ISSUE_REGISTER.md`, `B7_FINAL_ZIP_CLOSURE_MANIFEST.json`, official 60 ADS checks, 9 P4-T034..P4-T042 canonical tests. All nine currently **DUE (0/9 FINAL PASS+LOCK)**. No production deployment, migration, payment, advertiser verification, publication, PR merge or B7 ZIP follows from this checklist.

### A — Nine Android UI findings (UI01..UI08 SOURCE+CI FIXED; UI09 physical E3 retest DUE)
| ID | Priority | Observed failure / source | Fix and proof |
|---|---|---|---|
| UI01 | HIGH | CTA Website target `https://example.com` remains when switched to **No CTA**, then **Call** (6030,6031). | Clear incompatible target and hide for No CTA; independently validate CTA+target server-side; regression across all five kinds. |
| UI02 | HIGH | Change Image → Video retains selected JPG `5990.jpg` plus old still-image preview, even when Preview tapped again (6039,6040). | Compare creative kind to file bytes/type; clear file on mismatch, revoke object URL; reject wrong kind client AND backend. |
| UI03 | HIGH | Image → Text retains old photo preview even after chooser shows no file (6023). | Clear preview and async decode on kind switch; forbid stale media association. |
| UI04 | MED | Text mode still exposes irrelevant media URL/Choose File/local Preview controls (6025). | Hide/disable in Text mode, without changing backend authority. |
| UI05 | MED | No dedicated Remove selected photo / clear local preview; wrong picker selections require replacement/reload. | Add safe one-tap Remove, revoke blob, preserve other unsaved draft fields. |
| UI06 | MED | Old inline `SELECT_LOCAL_MEDIA_FILE_FIRST` error persists after JPG selection until Preview tapped (6035–6038). | Clear obsolete status on new file selection. |
| UI07 | MED | CTA field has one vague `HTTPS URL / phone with country code` placeholder for No CTA/Call/WhatsApp/Website/Map; Map accepted format not explained (6027–6033). | Context-specific target label, allowable schemes/number formats; check official backend target contract. |
| UI08 | MED | Owner package/quotation/payment/request controls cramped on Android; tiny narrow fields, awkward wrapping (B7-E3-002). | Mobile-first single-column responsive controls and readable tap targets. |
| UI09 | RETEST | Homepage `विज्ञापन के लिए संपर्क करें` link was too small (B7-E3-001); source CSS fix at `fbf1bbf` with green 20/20 + 2/2, but **updated bundle Android retest still DUE**. | Do not call this source bug unfixed; confirm on current Android build before closure. |

### B — Sixteen backend/integration findings (BE01..BE16, E2/E5/E7 DUE where applicable)
| ID | Priority | Gap and supporting result | Required evidence |
|---|---|---|---|
| BE01 | BLOCKER | Owner qualified analytics: `Qualified analytics unavailable...` on 6050, no figures. | Verify correct project, `jb_ad_qualified_analytics_internal`, Owner AAL2/RLS and honest estimates E1/E2/E3. |
| BE02 | BLOCKER | Notification issue queue unavailable on 6052. | `jb_ad_notification_failures_internal`, retry with B3 in-app only, immutable failure trail, E1/E2/E5. |
| BE03 | BLOCKER | Renewal queue unavailable (6052). | Owner queue RPC, request + separate quote/payment/inventory/schedule approval; never auto-extend LIVE. |
| BE04 | BLOCKER | Change-request queue unavailable (6052). | Review/decision RPC, append-only new approved creative version; no advertiser direct LIVE edit. |
| BE05 | BLOCKER | Image/video chooser is intentionally `LOCAL PREVIEW ONLY`. Save with selected JPG correctly denies `LOCAL_MEDIA_NOT_UPLOADED` (6036), because actual authenticated private upload/receipt not integrated. | Canonical Owner upload → isolated durable queue/worker → media byte/codec/GPS sanitization → immutable receipt → AAL2 approve → safe public release E2/E3/E5/E7. |
| BE06 | BLOCKER | FFmpeg poster metadata pHYs hardening has isolated code+CI proof at `8bde94c` (18/18+2/2), but no E7 real worker deployment. | Do not relax PNG sanitizer; wire private pipeline and test storage release/revoke, disallowed bytes and metadata. |
| BE07 | BLOCKER | Status selector shows ten states incl. `approved`/`live` (6049) but backend transition constraints not tested. **Dropdown visibility alone is not a vulnerability.** | Server denies premature/unpaid/unverified/no-approved-media LIVE, enforces Owner AAL2 + immutable audit E2/E5. |
| BE08 | HIGH | Start/end selected 13–14 Oct 2026, 19:00, 24-hour form span (6044–6045), but no schedule submitted, saved or activated. | Timezone/expiry/pause/resume/hide-while-open/rotation/end date and inventory E2/E5, isolated staging fixture. |
| BE09 | BLOCKER | Payment methods UPI/Bank transfer/Cash and evidence form rendered (6046–6047), no real receipt or consent proof; external gateway E6 DUE. | Quote version, exact paise, independent receipt, consent, owner AAL2, replay/idempotency guards; never invent UTR. |
| BE10 | HIGH | Advertiser verification dropdown and one-time portal UI exist (6048), but original legacy test rows show verification pending and consent not recorded. | Actual high-risk independent checks, account/session revoke, cross-tenant denial E2/E3/E5. |
| BE11 | HIGH | Public enquiry has HTML-required input checks; server-side phone normalization, consent, forged-parameter deny, spam/duplicates, admin queue and no auto-LIVE unverified. | ADS-001..009 E2/E3/E5. |
| BE12 | HIGH | Official MP district/tehsil LGD source, data provenance and article geo vs viewer geo integration unverified. | Authenticate official source, exact codes, fail-closed unknown areas, release E2/E7. |
| BE13 | HIGH | Actual approved homepage/article ad display, one article=one ad, no in-page swap while open, paragraph placement, rotation and sanitized single canonical public feed unverified. | ADS-013/014/024..034, release E2/E3/E5/E7; protect permanent article URL. |
| BE14 | HIGH | `No packages configured` UI (6052), which **may be legitimate empty inventory**, not automatically a bug. | Read true package records; owner save/version/old-contract immutability backend tests. |
| BE15 | BLOCKER | SPCK localhost:7700 is local preview, not exact Vercel/production release. B7 review-only SQL not deployed; PR #5 draft/unmerged; no complete Owner E5 signoff, E7 deployment proof. | Stage with independent regression/rollback, obtain Founder production permission, exact SHA-to-deploy E7, real Android E3. |
| BE16 | HIGH | **Former ENV06**: generic Owner `unavailable until backend rollout` hid missing RPC vs Owner AAL2 vs configuration; now read-only production catalog confirms five missing Owner RPCs. | Source-fix safe scoped diagnostic messages + no secret leak, separate E2 actual functionality; no silent zero data, no invented availability. |

**Independent backend read-only observation, 12 Oct:** Supabase project `vrffsnkycvjithwtiylt` catalog query found no functions with names `jb_ad_notification_failures_internal`, `jb_ad_notification_retry_internal`, `jb_ad_qualified_analytics_internal`, `jb_ad_owner_renewals_internal`, `jb_ad_owner_change_requests_internal`. Verify SPCK `supabase-config.js` targets this same project before asserting cause for the local preview. No database write made.

### C — Five environment/evidence findings (ENV01..ENV05; physical checks / diagnostics pending)
- ENV01: `localhost:7700 ERR_CONNECTION_REFUSED` intermittently when SPCK preview server/tab was unavailable; recovered after restarting preview. **Not proven B7 code failure.**
- ENV02: Advertiser portal could open directly in SPCK but initial newly opened Chrome tab refused localhost. **Navigation/server lifecycle unresolved.**
- ENV03: Embedded SPCK Admin Login preview reported device biometric/credential API unavailable. May be WebView/secure-context limitation; verify correct real Android Chrome/deploy.
- ENV04: Gallery chooser sometimes delivered a screenshot containing the photograph, rather than the original cropped image. Do not call this backend image corruption; add preview/remove UX. True ultra-wide original and 4:5 image still unverified.
- ENV05: Observed 16:9 (3264x1840), 1:1 (2448x2448), portrait local photo and 15s MP4 preview are **client visual-only**; server sanitization, EXIF/GPS removal, poster, release not established.
**Count reconciliation:** ENV06 was moved to BE16 because the first divergence is an Owner/backend diagnostic gap. Original identifier `ENV06` remains an alias for traceability; no issue removed. **Total: A=9, B=16, C=5 (30 distinct findings).**

### D — Positive local safeguards to PRESERVE (not final official PASS)
- Empty local picker Preview blocked `SELECT_LOCAL_MEDIA_FILE_FIRST` (6034); selected JPG Save DRAFT blocked `LOCAL_MEDIA_NOT_UPLOADED` (6036). Local correct-kind image preview recovery (6038).
- Earlier MP4 >50MiB rejected as designed; shorter 15-second portrait video local playback observed.
- No manual ad approval, advertiser verification, payment confirmation, schedule mutation or new LIVE has been proved in today's Android tests.
- Existing B5 restrictive private policy and Phase3A/3B regressions must remain intact; preserve Authoritative Owner gateway.
- Do not conflate one UI subcheck PASS with ADS or P4-T test final closure.

### E — Required 9 tests, all final DUE
| Official test | Check range | Test domain |
|---|---|---|
| P4-T034 | ADS-001..009 | Public enquiry, queue, verification, auth |
| P4-T035 | ADS-010..015 | Image/video/text, article, media security |
| P4-T036 | ADS-016..023 | Schedule, hide/pause, expire/history/delete |
| P4-T037 | ADS-024..034 | Inventory, rotation, placement, package |
| P4-T038 | ADS-035..040 | Payment, receipt, quote, external E6 |
| P4-T039 | ADS-041..047 | Portal, renewal/change, tenancy |
| P4-T040 | ADS-048..050 | Qualified analytics |
| P4-T041 | ADS-051..056 | Notifications B3/audit |
| P4-T042 | ADS-057..060 | Android usability, regression, deployment |

### F — Execution and closure
1. Run exact-source duplicate/overlap check against B7 Blueprint and TEST-REGISTER. Append any new issues with status/evidence, never silently drop them.
2. One minimum-safe UI batch: CTA target isolation and matching; creative-type mismatch/preview teardown; remove-file control; stale error clearance; responsive Owner layout. Preserve local Save denial.
3. Backend-first: verify local target project; use **isolated** Owner/AAL2/RLS negative tests, finish scoped review migrations and durable media worker without widening old service-role or B5 policy.
4. Independent source + staging CI old Phase3A/3B/B5 and B7; Owner E3/E5, security audit, exact production E7 and genuine payment E6.
5. Each issue lifecycle: `OPEN → SOURCE_FIXED → CI_EVIDENCE → BACKEND_E2 → ANDROID_E3 → AUDIT_E5 → RELEASE_E7 → CLOSED` when applicable. **No 9/9 PASS or B7_ADVERTISEMENT.zip without all canonical evidence.**


## UI source-fixed checkpoint (does NOT close physical Android or backend gates)

## B7 Android E3 UI consolidated batch — 12 Oct 2026, code d12ece4
- RCA from Founder Android screenshots 6023..6039 and exact `ads.html`/`ad-media-preview.js`: creative type was not bound to byte-inspected local file type, previous blob preview and chooser persisted across type changes, stale CTA destination survived Website→No CTA→Call, and Owner phone inputs were cramped.
- SOURCE CHANGES (commit `d12ece4db263816e48375fc5abce79e0ebf3884b`): `JANTA_BOL_PHASE_3C_WORKING/ads.html` now invalidates previous local preview/blob and chooser when switching Image/Video/Text, blocks incompatible file types using `stage(box,file,requested)`, adds a local Remove action and change-driven stale-status reset, hides Text media controls, clears incompatible CTA targets and uses CTA-specific field labels/HTTPS-or-phone local validation, and stacks Owner controls with mobile 44px tap targets. `JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js` rejects byte-inspected kind mismatch before creating preview blob (retains local-only fail-closed semantics).
- REGRESSION ADDED in `ci/phase4/b7-media-preview-regression.cjs`: wrong file kind, type-switch preview teardown, CTA cross-type clearing, mobile layout and local Remove. Existing `ci/phase4/b7-spck-local-media-save-safety.test.cjs` preserved exactly and no local-to-server bypass added.
- REAL RED evidence: candidate run `38263533938` (commit 166c041) failed original URL-only Creative no-file control after stricter CTA regex was accidentally double-escaped; same issue persisted at test commit 6851c92 (`38263890303`). **First divergence traced to `ads.html` URL/phone regex escape, not a legitimate backend denial**. Only the two regex escapes corrected at `d12ece4`; no tests relaxed or disabled. Green proof: candidate run `38264147918` **20/20 jobs completed SUCCESS**, protected Phase3A+3B run `38264147842` **2/2 SUCCESS** on exactly same code SHA.
- ISSUE STATE: UI01..UI08 **SOURCE FIXED + CI VERIFIED**, but **DEVICE RETEST DUE** on an Android bundle built from this SHA; UI09 prior source fix still phone retest DUE. This is not Owner E2 backend proof nor final P4-T035/T042 PASS. Backend RPC/worker/queued media/official LGD/deployment/E5/E6 remain DUE. Source only on draft unmerged PR #5, no Supabase production DDL/DML, no LIVE, payment, advertiser, media upload or branch merge.
- OFFICIAL FINAL: P4-T034..P4-T042 **0/9 FINAL PASS+LOCK**; B7_ADVERTISEMENT.zip BLOCKED. DO NOT CLAIM a shipped Android fix until Founder tests a matching SPCK build.


## Backend-first independent read-only investigation — 12 October 2026
- SPCK configuration source URL: `https://vrffsnkycvjithwtiylt.supabase.co` — matches linked JANTA BOL project; no misplaced environment inferred from the repo config alone.
- Live catalog read-only SELECT confirms **five missing RPCs**: `jb_ad_notification_failures_internal`, `jb_ad_notification_retry_internal`, `jb_ad_qualified_analytics_internal`, `jb_ad_owner_renewals_internal`, `jb_ad_owner_change_requests_internal`. Their existing review-only implementations must pass independent E2/RLS/Owner tests before authorized rollout; **BE01..04 not operationally fixed**.
- Live dataset read-only facts: `ad_packages` **0 rows** (BE14 empty UI is legitimate, not a proven defect); `ad_campaigns` **5**, LIVE **0**; B7 storage bucket count **0** (BE05/06 not operational). No insertion, change or delete performed.
- Live function-source inspection BE07: existing `jb_ad_transition_internal` Owner AAL2 path requires payment confirmed for `live`, but does **not** itself establish clean approved media, full signed receipt, schedule, inventory and all verification conditions. **Premature direct promotion server guard remains incomplete**. Source-only browser safety interlock `phase4-domain-client.js` `jb_ad_lifecycle_capability_internal` (commit `2643b279`) blocks `approved/payment_pending/live` until a later hardened backend advertises `B7_LIFECYCLE_PROTECTED_V1`. Existing Owner HIDE/PAUSE/REJECT/CANCEL preserved; **client interlock is not a substitute for server E2**. That particular code SHA had Candidate CI 20/20 SUCCESS and protected 2/2 SUCCESS.
- Safe SPCK read-only error classification + same-tab advertiser portal link added in `ads.html` (commit `c470a3b`); the original exact-match analytics wording regression initially RED at protected run `38271443461` (and candidate at `38271443162`). Minimum wording fix `64b8c559` preserves old requirement that failure says `unavailable`, without disabling tests; later Candidate CI run `38271632240` SUCCESS, protected run `38271632281` must be confirmed before claiming final green.
- Official B7 canonical `P4-T034..042` **0/9 FINAL PASS+LOCK**. A9 source status is not E3 deployed, B16 not full backend rollout, C5 environment proofs still gated. No production DDL/DML, PR merge or final ZIP.



## BE07 isolated Owner lifecycle guard CI checkpoint — 12 October 2026
- User authorized **A only**: GitHub Actions + disposable PostgreSQL, no new Supabase Staging and no production DB migration, developer-credential changes, old files reset, PR merge, LIVE, payment, Cricket backend or real advertiser edits.
- New **review-only** additive SQL `JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql`. Uses existing single ad_campaigns/ad_creatives/ad_payments/advertisers and requires the original pre-existing `private.b7_campaign_live_guard`; does not change original RPC source or drop any old trigger. Adds private verified status trigger for Owner AAL2, approved text creative, verified advertiser, positive transition order, real structured receipt matching agreed quote and live schedule. Image/Video deliberately fail-closed until private worker and approved public release; no `jb_ad_lifecycle_capability_internal` sentinel yet. Owner emergency HIDE/PAUSE/REJECT/CANCEL preserved. Uninstalled source-only candidate, **NOT LIVE E2/E7 PASS**.
- CI: disposable PG17 `ci/phase4/b7-payment-fixture.sql` + EXISTING `20261010_b7_manual_payment_REVIEW_ONLY.sql` + new SQL + `ci/phase4/b7-lifecycle-state-regression.sql` in a single transaction ROLLBACK. Tests deny unauthenticated, direct approved→LIVE, high-risk pending, no creative, fake paid date, future/expired; positive approved text with **synthetic** quoted receipt under Owner; pause/resume and emergency hide. Synthetic payment never reaches real Supabase.
- RED RCA: candidate `38276019206` failed because preexisting alphabetically-earlier LIVE trigger correctly returned `AD_NOT_ELIGIBLE_FOR_LIVE` instead of the new guard's custom error. `38276171939` caught same first-divergence on forged paid date. Did **not** disable or replace the original safety guard; tests now explicitly require both guards and accept only the two known fail-closed error paths. Strict no-fake-proof.
- GREEN exact engineering SHA `0ef8073bda8e8226ba45e647e5dd7046354abf1d`: new **lifecycle PostgreSQL isolated job SUCCESS**; Candidate workflow `38276288709` recorded `completed/success` and 20/21 individual job conclusions separately show SUCCESS (one other original isolated PostgreSQL job was still reported running at documentation check — do not claim 21/21 individual proof until confirmed); protected Phase3A+3B workflow `38276288702` `completed/success`, prior run `38272720697` `completed/success`. No test suppressed.
- Official P4-T034..P4-T042 **0/9 FINAL PASS+LOCK**; B7 ZIP FINAL BLOCKED. Source+disposable candidate ≠ authorized staging, actual Owner AAL2, Android E3, media worker, first-party LGD, E5 audit, E6 provider, E7 deployment.



## BE08 Schedule — Source + Disposable CI (not Live E2/E7)
- Scope **Option A** exclusively: GitHub Actions disposable PostgreSQL 17; no new staging Supabase, no JANTA BOL/Cricket production write, no original campaign/news changes, no PR merge.
- First divergence: old Owner `jb_ad_schedule_internal` lacked independent DB-level paid/hidden-window lock, future-date restriction and complete schedule audit. Added `db/20261012_b7_schedule_integrity_REVIEW_ONLY.sql`, two additive private triggers on original `ad_campaigns`. Strict preflight of exact original function, original Owner RPC and ad_history untouched; BE07 original+new guards retained. Denies unauthorized, forged initial schedule, past/backward/partial windows, paid/hidden/paused and state-change reschedules. Reuses original ad_history and adds change-only append audit, not an alternative scheduling authority.
- Isolated test: `ci/phase4/b7-schedule-legacy-source-fixture.sql` → original payment fixture/review guard → BE07 state guard → BE08 SQL → `ci/phase4/b7-schedule-integrity-regression.sql` in transaction ROLLBACK. No real receipts; test synthetic only.
- Initial candidate CI `38277959703` RED because exact original RPC fixture formatting differed from strict original-source preflight. **Only fixture formatting corrected**, not strict guard or older protections. Source SHA `4ffd3161c7dbdd4b4fb784d138c6492c56e0ff0e`: B7 candidate `38278183871` **22/22 SUCCESS**; protected Phase3A+3B `38278183827` **2/2 SUCCESS**. E1 + isolated E2 candidate only.
- BE08 **SOURCE_FIX + ISOLATED_CI**, deployment, real Owner E5, Android E3 and E7 **DUE**; P4-T034..P4-T042 **0/9 FINAL PASS+LOCK**. Final B7 zip BLOCKED. Keep A9/B16/C5 list intact.
