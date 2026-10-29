# JANTA BOL Phase 4 B12 — P4-T076, FIRST REAL HOST/DOMAIN/HTTPS TEST

**Date:** 2026-10-28 (India time), user-authorized initial test. **Truth:** T076 IN PROGRESS; current Production V3 route **FAIL**, candidate not yet deployed; **FINAL PASS + LOCK = HOLD**. Do NOT start T077 or approve any release as a workaround.

## Actual independent public HTTPS CI (NO live writes, NO secrets)
GitHub Actions actual **run 40699768744, job 122856080587** (candidate code head `90c0b99f23cee3653626ba57845b2f1be6e4eae0`, isolated CI runner; HTTPS GET public only, no B2/Supabase/Vercel API write). **4 tests: 2 passed, 2 failed; workflow RED**.

1. **PASS scoped:** Real GET `https://shubham-pichhore-2028.vercel.app/` = **HTTP 200**, validated public HTTPS/TLS chain, actual response contains `JANTA BOL` title, SHA16 `45e396ed2ca3b896`.
2. **FAIL:** Real HTTPS GET `/JANTA_BOL_PHASE_3C_WORKING/index.html` = **HTTP 404**. No V3 document at current public domain; cannot claim New V3 homepage deploy.
3. **FAIL:** Real HTTPS GET `/JANTA_BOL_PHASE_3C_WORKING/website-v3.js` = **HTTP 404**, despite trusted TLS.
4. **PASS scoped:** Review candidate `vercel.json` syntactically has non-permanent root redirect to `/JANTA_BOL_PHASE_3C_WORKING/index.html`, no-store Admin HTML headers, `nosniff`; release truth says **NOT DEPLOYED**. This is only config-in-Git, not a LIVE redirect.

No other endpoints tested, no Founder/Admin session visited, no story published, no credit card, no credentials, no paid features, no custom domain purchased.

## Real Vercel/GitHub source identity RCA
- Verified Project ID `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`, name `shubham-pichhore-2028`. Vercel reports the default domain `shubham-pichhore-2028.vercel.app` **verified**; only one project-domain entry, no custom paid domain.
- Actual Vercel PRODUCTION is **READY**, deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`, release `main` commit SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea`.
- Independent GitHub tree of this original protected Main SHA had 142 entries but **NO** `JANTA_BOL_PHASE_3C_WORKING/` paths and **NO** `vercel.json` (root static files only). Therefore the real 404s are consistent with the old website, not proof of a defect in the reviewed V3 release.
- The integrated reviewed B0–B12 code exists only on `codex/b12-b0-b12-reconcile-20261028` PR #61 (DRAFT, base B10 review). No Vercel branch preview deployment exists for the exact branch per connected Vercel list. Domain verification is not candidate deployment verification.
- This is a **release/hosting/source mismatch**, NOT permission to rebuild, merge direct to protected Main, consume Vercel quota or silently modify deployment config.

## T076 gate reconciliation
| Required test proof | Observed | Status |
|---|---|---|
| Verified default `vercel.app` domain | Vercel verified, no custom domain | PASS scoped |
| HTTPS root of the actual OLD Main version | real HTTP 200 and valid TLS | PASS scoped |
| Actual NEW V3 index and JS at domain | 404 / 404 | FAIL on current deployed source |
| New B12 redirect and no-store header LIVE | config only in PR61, not deployed | HOLD |
| Exact reviewed PR61 SHA deployed to preview/staging/prod | no such deployment found | HOLD |
| Protected prior Phase3 CI, B11 E8 and T072 live owner retry | coding-only green, hosted gates open | HOLD |
| Admin/Auth routes & real Founder device | not run | HOLD |
| Overall T076 Final PASS + LOCK | not satisfied | **HOLD** |

## Required future action (not executed)
Safely reconcile PR #61 approval/deployment identity, protected GitHub Main and Vercel settings; obtain zero-cost resource checks and explicit Founder release approval before a candidate preview or protected Prod release. Re-run exact T076 on that actual deployment, confirm HTTP 200 V3 and all Admin/Auth paths/headers. Do NOT run T077 before T076 accepted or consciously held with Founder documented decision. Under ₹0 requirement no plan, domain, paid provider or credit card should be added.

Sources: GitHub CI `https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40699768744`, PR #61 `https://github.com/jantabol/JANTA-BOL-Website/pull/61`. **B12's T076 official status IN_PROGRESS; all other official T077–T083 remain NOT_RUN; no fake PASS.**
