# JANTA BOL — T097 Founder Android Versioning / T080 Exact-Base Preview Candidate

**2026-11-01 | PREVIEW ONLY | NOT JANTABOL.IN PRODUCTION | NO PAID PLAN**

## Baseline locked
- **Source:** actual newest T080 safe candidate preview Git SHA `51b3f5fa46708bfeb357b0b61076583e19b04383` (`codex/b12-t080-integration-candidate-20261101`), NOT production alias `jantabol.in`.
- **Source preservation:** only **3 existing B8 frontend files** deliberately overlaid from independently reviewed PR #103 (exact reference `d78e2762634a0d8d7fad916a0864a86ddeb8826c`). All T080 public content, T083 public truth, backend-client.js, add-news.html, Article IDs/PURLs, Ads, Vercel routes, Founder login, B7 backup, original protected SQL unchanged. No direct merge of full stack #100→#103.
- **Three original→candidate Git blob SHA pairs:**
  - `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js`: `0bf53ef35efdc21ac985493ccb49734cdd1a0fb1` → `bf9295b4a16f2434532ec0fe508fd15c7f531500`.
  - `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js`: `505d5ccd27bd62bb111061632b784aae77a56a89` → `8620dc304e733a70c9c4ce593b73992e2aa6a4b1`.
  - `JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html`: `d9e0b79bacdd3b85fa23fee8310a16ea750f686d` → `903ccbf4f9da273540349dee44484ded76b5744e`.
- Only these B8 files + **added tests/CI/review report** may differ from exact T080 base for this dedicated preview.

## Verified original T097 acceptance boundary
- One Owner-only input with existing private same-case server receipt UUID, original/revised typed version and previous version ID. Server RPC is unchanged and demands Owner AAL2, latest-only chain and immutable receipt. UI does not upload a file or verify the source of a government PDF.
- No private evidence release: `PRIVATE_EVIDENCE_UPLOAD=false` in hosted JANTA BOL Supabase, so real NH3 case has no private receipt and cannot truthfully make an ORIGINAL/REVISED entry. No simulated official send, no Government claims.
- This is a **T097 CODE + PREVIEW route** acceptance test, *NOT* real physical Founder E5, third-party E9, public HTML privacy, or formal Test Register final PASS.
- **Safety stop:** protect production domain, no `target=production`, no alias assignment, no merge to Main, no new service env vars, no modifying G6, no protected build credentials.

## CI / evidence checkpoints
- New isolated `ci/phase4/b8-t097-founder-version-form-contract.test.mjs` contains 16 focused cases copied from original PR #103; T097-M16 adapted to this exact T080 release base (no unrelated prior Draft report requirement).
- Current branch runs source/type negative, old G4/G5/G6/G7, T096/T097 private pagination, T080 Admin+Article durability and T083 (120 original cases), and original PostgreSQL17 disposable B0–B8/News/B7 regression.
- **GitHub CI:** pending actual run; do not assert success without the exact run result.
- **Vercel Preview:** pending. The site is not deployed by preparing this branch. Separate Vercel Git build must be confirmed READY with exact SHA and a distinct preview URL.
- **Production:** `jantabol.in` remains at deployment `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`, source `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, unless verified otherwise later.

## Final truth now
`T097_T080_THREE_FILE_SOURCE_SCOPE=CHECK_IN_CI`;
`T097_T080_PROTECTED_NEWS_ADMIN_BACKUP=CHECK_IN_CI`;
`T097_T080_PREVIEW_DEPLOYMENT=NOT_YET_VERIFIED`;
`T097_REAL_FOUNDER_E5=NOT_RUN`;
`T097_REAL_PRIVATE_BYTES_AND_EXTERNAL_E9=NOT_RUN`;
**`T097_OFFICIAL_FINAL_PASS_LOCK=HOLD`**.
