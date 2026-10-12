# JANTA BOL — Phase 4 B7 — Consolidated Problem Punch List
12 October 2026 | Working branch `codex/b7-blueprint-20261010`

## Governance
This is an **issue index, not the Master Blueprint or a PASS declaration**. Cross-reference: `B7_20261012_ANDROID_E3_ISSUE_REGISTER.md`, `B7_FINAL_ZIP_CLOSURE_MANIFEST.json`, official 60 ADS checks, 9 P4-T034..P4-T042 canonical tests. All nine currently **DUE (0/9 FINAL PASS+LOCK)**. No production deployment, migration, payment, advertiser verification, publication, PR merge or B7 ZIP follows from this checklist.

### A — Reproduced local Android UI defects (OPEN / batch-fix together)
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

### B — Observed unavailable functions and undeployed integration (DUE, NOT automatically security vulnerabilities)
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

**Independent backend read-only observation, 12 Oct:** Supabase project `vrffsnkycvjithwtiylt` catalog query found no functions with names `jb_ad_notification_failures_internal`, `jb_ad_notification_retry_internal`, `jb_ad_qualified_analytics_internal`, `jb_ad_owner_renewals_internal`, `jb_ad_owner_change_requests_internal`. Verify SPCK `supabase-config.js` targets this same project before asserting cause for the local preview. No database write made.

### C — Environment and evidence ambiguities (not confirmed app bugs)
- ENV01: `localhost:7700 ERR_CONNECTION_REFUSED` intermittently when SPCK preview server/tab was unavailable; recovered after restarting preview. **Not proven B7 code failure.**
- ENV02: Advertiser portal could open directly in SPCK but initial newly opened Chrome tab refused localhost. **Navigation/server lifecycle unresolved.**
- ENV03: Embedded SPCK Admin Login preview reported device biometric/credential API unavailable. May be WebView/secure-context limitation; verify correct real Android Chrome/deploy.
- ENV04: Gallery chooser sometimes delivered a screenshot containing the photograph, rather than the original cropped image. Do not call this backend image corruption; add preview/remove UX. True ultra-wide original and 4:5 image still unverified.
- ENV05: Observed 16:9 (3264x1840), 1:1 (2448x2448), portrait local photo and 15s MP4 preview are **client visual-only**; server sanitization, EXIF/GPS removal, poster, release not established.
- ENV06: Generic “unavailable until backend rollout” screen can hide different errors (missing RPC, AAL2/role, wrong environment). Establish exact first divergence, do not invent root cause from text alone.

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
