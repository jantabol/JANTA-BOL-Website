# JANTA BOL — PHASE 4 / B12 — ALL-CODING-FIRST HANDOFF
Date: 2026-10-28. Founder direction: make one review-only B12 coding packet covering all eight T076–T083 concerns BEFORE starting test sequence T076, T077, ..., T083 individually. No paid system. No rebuild. No fake PASS.

## Canonical sources and source-selection caution
- Requirements: JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf, Appendix A Topic 11 Sections 657–734 and Appendix B T076–T083. Phase-3 regression mandatory after code changes.
- Code baseline selected: `codex/t071-c1-android-published-loading-guard-20261027` because it includes the latest evidence-aware public news feed and previously corrected ISRO/Founder Android preview behavior. It is **not** protected `main`.
- IMPORTANT CROSS-PHASE INTEGRATION GAP: B9/B10 security/accountability source work exists on independent `codex/b10-whole-platform-security-candidate-20261023`; B11 real backup/recovery and T072 fixes are partly in review-only branches; none are automatically merged by starting this coding packet. They are NOT silently assumed incorporated or fully locked. A safe source reconciliation and old protected CI remains mandatory before any real Production deployment.
- Current `main` is an older static demo; do NOT deploy it as the protected live Phase-4 publishing product or overwrite Founder article data.
- Project locks: `jantabol/JANTA-BOL-Website`, existing `vrffsnkycvjithwtiylt` Supabase, existing Vercel `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`, B2 existing bucket (read-only visual proof). Cricket/Saarthi fully excluded.

## Code written as a single B12 coding candidate (not yet production released)
| Test | Exact code/config or existing protected foundation | What the code now addresses | Final evidence still pending |
|---|---|---|---|
| T076 | `vercel.json` | Preserves old V3 URL redirect, secure headers on V3 routes, no-store on Admin/Article documents; no paid domain | real candidate HTTPS hosting/public and Auth routes, E1/E6/E7 |
| T077 | `JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js`, `admin-login.html`, `article.html` | Blocks external/encoded path traversal in post-AAL2 `next`, allows known same-directory Admin pages and valid Article UUID for edit. Keeps published PURL UUID and emits canonical link; existing roles/authority unchanged | owner AAL2 login/redirect, publish→correct→unpublish→republish same UUID/PURL, env separation (E1/E2/E4/E6) |
| T078 | `ci/phase4/b12/t078-production-catalog-readonly.sql`, `b12-release-truth.json` | JANTA BOL-only metadata-only DB/RLS/roles/function inventory; no live DDL/keys | actual signed migration/backups when needed, production secret-scan and RLS negatives (E1/E2/E7/E8) |
| T079 | `ci/phase4/b12/t079-external-provider-failclosed.cjs` | Names existing Social/B7 Ads/Notifications provider boundaries, returns DUE candidate with explicit E6 proof; never invents payment or writes Article state | actual provider real E6 or justified DUE (E2/E6/E7) |
| T080 | `JANTA_BOL_PHASE_3C_WORKING/article.html`, `admin-login.html` | Removes raw database exception text from guest/Owner article page; safer Owner navigation; no new session authority | real Android retry/network/duplicate/action safety (E1/E2/E3/E5/E6); B11 T072 live idempotency remains OPEN |
| T081 | `ci/phase4/b12/t081-rollout-rollback-guard.cjs` | Fail-closed rollback preconditions, refuses DB restore/write, preserves newer Article data, requires Founder AAL2 and real E8 | actual protected cutover/immutable DB+B2 restore/rollback (E1/E6/E7/E8); B11 recovery gate HOLD |
| T082 | `JANTA_BOL_PHASE_3C_WORKING/article.html`, original `website-v3.js` and backend | One canonical public article URL with UUID, no duplicate business identity | real full Article/Correction/Multi-device smoke (E1/E2/E3/E4/E5/E6) |
| T083 | `ci/phase4/b12/b12-release-gate.cjs` and `b12-release-truth.json` | Deny full Production release until every test has exact required evidence, Phase-3 CI, B11 recovery and T072 duplicates closed, no paid system | full audit, Android, stable source ZIP, Founder final sign-off (E1/E3/E6/E7/E8) |

## Test order (DO NOT execute as a batch at coding time)
Exactly **T076 → T077 → T078 → T079 → T080 → T081 → T082 → T083**. One test at a time after founder starts the sequence. An automated independent static source check required by protected Phase-3 CI is a coding safety gate, NOT a real T076–T083 PASS.

## Major permanent HOLDs (not waived by the coding request)
1. Phase-4 branches B8/B9/B10/B11 are fragmented, and B12 is not a production base until source reconciliation; old Phase-3 CI must be verified GREEN.
2. T072 original B8 case creation retry duplicate P2 not yet corrected in live Supabase.
3. B11 full hosted Auth/Edge/Vercel/B2 recovery E8 HOLD; B2 auto backup not yet deployed.
4. Production domain/HTTPS evidence for old static `main` does not validate this new integrated B12 candidate.
5. No credentials, Supabase DDL, permanent public content, Admin session or live B2 upload were changed.
6. GitHub Main/Vercel Production unchanged; Founder release approval + no paid billing requirement remain mandatory.

**CODING PACKET status: review-only source changes recorded. FULL B12 PRODUCT IMPLEMENTATION, T076–T083 REAL TESTS, AND FINAL B12 LOCK: NOT YET PROVEN.**
