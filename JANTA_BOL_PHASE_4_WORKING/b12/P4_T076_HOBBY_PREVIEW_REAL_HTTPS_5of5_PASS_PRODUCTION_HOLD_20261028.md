# P4-T076 — exact Vercel Hobby Preview verified, production still old Main

**28 October 2026 IST. Test stage:** T076 IN PROGRESS. **Scoped Preview Hosting/HTTPS = PASS**, **Official T076 Production/Full E1/E6/E7 = HOLD**, T077–T083 NOT RUN.

## Actual action taken
User asked assistant to finish all available backend steps without routine Android prompts. We independently confirmed Vercel Team `team_8axPWNjZuUp3vmEwLOxiKVhn` is **Hobby** (no paid plan), and exact project `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI` is Git-linked only to `jantabol/JANTA-BOL-Website`. Created **ONE preview** from Git branch `codex/b12-b0-b12-reconcile-20261028` at Git source SHA `cfd5a64661e834c801c30325b97b5a4d72dfb49f`, ID `dpl_EQC399BieUgUaLN8Xi4wB2fNijLz`. **READY**, `target=null` means Preview; **NOT Production**. No Vercel upgrade, new custom domain, token, backend mutation, B2 transaction, Cricket action or Git Main merge.

Preview URL (public, real): `https://shubham-pichhore-2028-larldsm6o-shubhamshrivastava295-9848.vercel.app`

## Genuine protected-source/HTTPS public network proof
GitHub Actions **run 40703558813**, job `122869521600`, **5/5 Node tests PASS**, actual TLS handshake validated. Public GET only, no cookies, access tokens, login, article write or secret exposure:
- `/JANTA_BOL_PHASE_3C_WORKING/index.html`: HTTP **200**, valid trusted TLS, reviewed JANTA BOL page, no unverified old Shivpuri mock allegation. SHA16 actual response `945bb56aeafd1aa5`. Source file is exact byte prefix; only 163-byte footer is Vercel's **pinned** `vercel.live/_next-live/feedback/feedback.js` opt-in toolbar for this exact deployment. Arbitrary added HTML/script is rejected by CI.
- `/JANTA_BOL_PHASE_3C_WORKING/website-v3.js`: HTTP **200**, trusted TLS, original reviewed JS **byte identical**; SHA16 `0f015627385d4b9b`.
- `/JANTA_BOL_PHASE_3C_WORKING/admin-login.html`: HTTP **200**, Admin login shell only; **Cache-Control no-store**, **X-Content-Type-Options nosniff**, **X-Frame-Options SAMEORIGIN** actually read from response. No MFA performed.
- `/`: trusted TLS, **HTTP 307** same-origin redirect to the reviewed V3 homepage. No offsite redirect.
- `/JANTA_BOL_PHASE_3C_WORKING/article.html`, `/b9-search.html`, `/admin.html`: **HTTP 200** (HTML public shells), with Admin shell strict no-store/nosniff/frame headers. No private data/API exercised.

Two earlier red preview CI attempts deliberately investigated the strict HTML byte equality. Root cause was Vercel's *fixed 163-byte injected preview feedback toolbar* (not source mismatch), evidenced by precise first mismatch byte at local EOF and exact footer match. Did NOT weaken validator to accept arbitrary appended HTML.

## Old Production remains unchanged (separate prior RED)
Independent actual GitHub Action **40699768744**, 4 tests: **2 PASS, 2 FAIL**. Current Production root `https://shubham-pichhore-2028.vercel.app/` returned HTTP 200 valid TLS; old original Main has NO `JANTA_BOL_PHASE_3C_WORKING/` source, so V3 index and `website-v3.js` both 404. Production Vercel still **READY** deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`, Git SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea`. New reviewed PR61 SHA is not deployed to Production. No invisible/false claim that the old-site 404 is repaired in Production.

## Final T076 decision
| Required facet | Result |
|---|---|
| Correct free Hobby project/Git repository | verified, PASS scoped |
| New exact candidate Preview build and HTTPS | READY, PASS scoped |
| V3 Homepage, JS, Founder-login shell, Admin shell, Article/Search, redirect | actual 5/5 tests, PASS scoped |
| Existing Production old home HTTP 200/TLS | PASS scoped |
| Existing Production V3 index and JS | **404 / 404 (real FAIL)** |
| Exact source Git SHA deployed to protected Production Main | **NO** |
| Founder Auth/AAL2, real publishing URLs, rollback/backup E8, Android | **NOT TESTED / HOLD** |
| Official P4-T076 complete+lock | **HOLD** |

Next technical step is **protected release gate**. PR61 remains DRAFT based on a separate B10 Review Branch (not Main) and incorporates un-deployed B11 T072/backup candidates. Protected Main merge or Production promotion would risk breaking existing systems; not authorized merely by code-only CI/preview. Founder-owned security/real recovery issues still open. Review guard and choose isolated release approach before any public cutover; never buy service, change Auth/DB, disable Vercel Deployment Protection, or silently merge Main.

**No Founder manual step was necessary for these public Preview HTTP checks. No next T077 test started.**
