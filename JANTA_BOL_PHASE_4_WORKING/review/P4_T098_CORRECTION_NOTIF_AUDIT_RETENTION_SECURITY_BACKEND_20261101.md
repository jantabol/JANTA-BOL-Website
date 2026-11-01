# JANTA BOL Phase 4 / RUN-12 / P4-T098 — Backend Preflight and Truth Ledger

**2026-11-01 | SOURCE + LIVE CATALOG E1/E2 ONLY | NO production writes or real official contact.**

## Authority — exact original Master PDF
`JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK(20261101-074327).pdf`, page 313, **P4-T098**, Topic 13 Accountability, RUN-12, **ACC-036–ACC-044**, §§903–916; class **MANUAL / REAL-DEVICE + FAILURE**, initial **NOT RUN**, **E1 + E2 + E3 + E4 + E5 + E9** required. Original expected workflow is **Evidence → Verify → Questions → Response → Follow-up → Outcome**, with **same-story correction keeping original Article UUID/PURL**, linked but separate follow-up Article, notification, common audit, preservation/retention, unauthorized private evidence denial and failure isolation. Reuses Topic 7/8/9/10; Phase3 protected News/Article, Security and Notifications. The original Register still has `P4-T098 | ... | NOT RUN` and **must remain so** until full real-world acceptance.

## Reconciled actual current source (GitHub tested candidate, not prod main)
Pinned baseline is `725df42de228bbe3fb1c263ee7b24455707b743f`, the reviewed T080 + T097 **three B8 frontend files** preview-safe branch, PR #104. No product files modified in this T098 audit. PR #104 remains DRAFT and original `jantabol.in` production alias is on unrelated earlier commit; never conflate preview with prod.
- **ACC-036 same-story correction**: native Founder News `add-news.html` shows `Published News Correction`, reuses the `editing.id` on its Article view link, excludes Save Draft when published, requires Final Review → Confirm Publish. `backend-client.js` calls `publish(item)` and server `articles.update(...).eq('id',working.id).eq('version',expectedVersion)`; no second create intent for an existing Article. Live `articles` table has existing UUID/slug/version; live `article_versions` history count **920**; `trg_capture_article_history` and `trg_enforce_article_lifecycle` enabled. This supports source design and legacy historical availability **NOT** an independent same-news correction E4 Android PASS.
- **ACC-037 separate linked follow-up**: G2 `jb_b8_g2_owner_link_article` fetches source `articles.id` and records `article_id`, title/version/status snapshot. `unique(case_id,article_id)`, append-only link trigger and `ON DELETE RESTRICT` on case reference; each separate follow-up Article requires its own real ID/PURL and Founder explicit link. Live linked Articles **0**; don't link unrelated ISRO demo or fabricate second story.
- **ACC-038 follow-up notification**: G7 `SUMMARY_CORRECTION` requires a real same-case prior SUMMARY event ID; original G7 correction private and `FOUNDER_ATTRIBUTED_UNVERIFIED`. G9 trigger only for `DEADLINE_FOLLOWUP`, `LATE_REPLY_CLAIM`, `SUMMARY_CORRECTION` generates an **Owner-only generic in-app `B8_ACCOUNTABILITY_FOLLOWUP`** (constant safe message, `IN_APP_READY`, dedupe). No outgoing email/SMS/WhatsApp or government send. Owner G9 due list requires AAL2, is capped per page (50) **not per lifetime**, and excludes closed / already followed-up dates. Live trigger `b8_g9_founder_private_followup_alert` active. **0 actual B8 notifications**, **0 summary corrections**, **0 due followup** live.
- **ACC-039 shared audit**: actual `audit_logs` **1,635** rows from historical operations, and immutable guard `trg_jb_audit_immutable_guard` enabled; native `article_versions` historical rows 920. G2 case/article link, G4 redacted revisions, G5 facts, G7 private chronology separately append-only. **Not** yet an independently cross-correlated same-story correction + G7 + alert + B8 audit trace from one real event.
- **ACC-040 preservation/retention**: G7 case/questions/receipt/previous-history FK `ON DELETE RESTRICT`; source append-only G7/G2/G4/G5 triggers; linked original Article hard-delete protected by `b8_guard_linked_article_hard_delete`, active on live articles. No automatic B8 TTL purge present in G9 migration. This is bounded table-level preservation **not a proof of eternal backups, legal retention or no administrator/superuser capability**. No live linked Articles yet to verify a real hard-delete denial.
- **ACC-041 unauthorized access / private evidence**: live **RLS ON** and **zero direct anon/authenticated table grants** for B8 case-link, private G7, private G5, private G4 revisions, private receipts; Owner G7 record / G9 due RPC require fresh AAL2, anon EXECUTE denied; G9 private trigger EXECUTE denied to anon/authenticated. No external auth matrix / live HTTP IDOR run in this T098 scope; real E5/E9 pending.
- **ACC-042 module failure**: Owner Android client requires server identity on every mutation; under errors it fails closed without false SEND, private output clears after 15-minute lock, G6 private upload release stays **OFF**. Original B8 PG17 G0–G9 isolation and Phase3 News/Auth/B7 protected tests run in disposable CI only, not real hosted module failure E3/E9.
- **ACC-043 Android handoff**: actual B8 Owner/Reporter/Editor form menu covers evidence, review, questions, receipt claims, manual truth, follow-up and outcome in source, with 15-minute lock. **Offline Android view-only T097 screenshots were NOT a real T098 E3/ E5 end-to-end flow**.
- **ACC-044 routine assisted tracking**: G9 due workflow is private in-app on an actual Founder action; no automatic mail, cron, provider dispatch or auto-verified source response. Real system-assisted *routine* E5 has not been observed.

## Actual connected production JANTA BOL Supabase (READ-ONLY SELECT only)
Supabase project `vrffsnkycvjithwtiylt`; checked pg_catalog, selected counts, RPC privileges and triggered constraints:
- Source tables `articles`, `article_versions`, `audit_logs`, `live_notifications`, `b8_case_article_links`, `b8_g7_history_events` exist. Existing `article_versions=920` and `audit_logs=1635` in *live*, counts can change and do not prove same-news correction acceptance.
- `b8_case_article_links=0`, `b8_g7_history_events(event_kind=SUMMARY_CORRECTION)=0`, `b8_g7_history_events(event_kind=DEADLINE_FOLLOWUP)=0`, `b8_g7_history_events(event_kind=LATE_REPLY_CLAIM)=0`, `live_notifications(notification_type=B8_ACCOUNTABILITY_FOLLOWUP)=0`, `b8_g4_public_revisions=0`, `b8_private_upload_receipts=0`.
- Live `private.b8_g9_notify_owner_followup` and `public.jb_b8_g9_owner_due_followups` exist and are SECURITY DEFINER, direct anon denied; Owner due function contains Owner AAL2 guard; trigger is enabled.
- B8 G2 Article links, G4 public history, G5 private facts and G7 chronology have enabled immutable triggers. Native news `trg_capture_article_history`, `trg_enforce_article_lifecycle`, `trg_jb_audit_immutable_guard`, `b8_guard_linked_article_hard_delete` are enabled.
- Free/Hobby constraints: no paid upgrade, no live schema migration, no private upload release, no credentials or official government outreach.

## Formal current scope and remaining actual evidence
`T098_SOURCE_NATIVE_ARTICLE_CORRECTION_ID_STABILITY=SOURCE_CHECKED` (real E4 NOT RUN).
`T098_B8_LINKED_SEPARATE_FOLLOWUP=BACKEND_GUARDS_PRESENT_BUT_0_LIVE_LINKS`.
`T098_G7_G9_GENERIC_PRIVATE_IN_APP_NOTIFICATIONS=BACKEND_GUARDS_PRESENT_0_LIVE_TRIGGER_EVENTS`.
`T098_LIVE_ARTICLE_VERSION_AUDIT_HISTORY=CATALOG_E2_SCOPED`.
`T098_LIVE_PRIVATE_RLS_OWNER_AAL2=CATALOG_E2_SCOPED`.
`T098_RETENTION_APPEND_ONLY_RESTRICT=SOURCE_CATALOG_SCOPED_NOT_ETERNAL_PROMISE`.
`T098_ISOLATED_PG17_AND_PROTECTED_NEWS_CI=CI_PENDING`.
`T098_REAL_FOUNDER_ANDROID_FULL_CHAIN_E3_E5=NOT_RUN`.
`T098_REAL_SAME_ARTICLE_CORRECTION_AND_NEW_FOLLOWUP_E4=NOT_RUN`.
`T098_REAL_OFFICIAL_OR_PRIVATE_BYTES_E9=NOT_RUN`.
`T098_LIVE_HTTP_CROSS_ROLE_AND_FAILURE_E5_E9=NOT_RUN`.
**`T098_OFFICIAL_FINAL_PASS_LOCK=HOLD`.**

**Founder step now: NONE** during backend-only read and isolated source tests. Preserve original news IDs, published content, Ads and the current production alias. Avoid meaningless cycles on the same NH-3 TEST ONLY case and never mark the user's original ISRO Article as relevant NH-3 follow-up merely to earn green evidence.
