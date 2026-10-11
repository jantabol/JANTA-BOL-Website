# JANTA BOL B7 — P4-T040 click authorization + G3 verified-LGD input PRECHECK

**Source checkpoint:** `231d2852a0c1ba4184a0ff26540a63c87c0a2cf8`
**Status:** REVIEW-ONLY candidate source; `P4-T034..T042` official final **0/9 PASS+LOCK**; final ZIP BLOCKED.

## Verified first divergence and minimum safe fix
In `db/20261010_b7_cta_click_REVIEW_ONLY.sql`, the staged server-side CTA click recorder still used an OLD regex that did not reject numeric shorthand/hex/octal loopback hosts. The already-hardened Article/Homepage server selection uses `private.b7_safe_public_ad_https(text)`. A web/map CTA rejected by the selection/browser could still be counted by the weaker ticket-click function. Replaced this duplicate logic with the EXISTING **single private** URL policy, without changing RPC signature, campaign/payment/Article history or public endpoint count. Protected `3A-P3-T123` now conditionally requires the ticket-click endpoint to reuse the private helper once G4 is present. Historical raw ad events are unchanged.

### Real disposable PostgreSQL negative evidence
`ci/phase4/b7-view-ticket-regression.sql` tests `https://127.1/owner`, `https://0x7f.0.0.1/private`, `https://0177.0.0.1/panel` as previously unsafe CTA aliases, expects click rejection and independently verifies both `ad_view_tickets.click_at IS NULL` and **no** click ledger event. A genuine approved CTA is later accepted once, including a 21-minute unchanged Article reading session. These are **synthetic E2**, NOT real human view, LIVE or Android E3.

## New G3 official-data structural preflight
`ci/phase4/b7-lgd-source-preflight.cjs` is strictly OFFLINE/no SQL. It accepts explicitly downloaded government **district + subdistrict CSV files** and a manifest with HTTPS government source references, version, exact SHA256 and export date. Fails if MP code=23/name disagree, number of MP districts !=55, district/tehsil duplicates, unknown district parent, inconsistent parent name, missing district subdistrict coverage, malformed CSV, checksum drift, or spoofed .gov-looking URL. Companion `ci/phase4/b7-lgd-source-preflight.test.cjs` uses only **invented SYNTHETIC** 55 district and tehsil fixtures. CI entry is additive in the existing P4-T035 candidate workflow, no old tests removed.

IMPORTANT: Any metadata manifest can be written by a caller; a matching checksum only means file was unchanged relative to that manifest, **NOT that the file came from the government**. Code explicitly emits `official_source_independently_authenticated=false`, `founder_verified=false`, `production_import_authorized=false`, `release_status=DUE_NOT_OFFICIAL_OR_OWNER_VERIFIED`. No LGD codes imported. Official government reports may need CAPTCHA and independent Owner source verification; do not bypass.

Official directory references:
- MP government index lists 55 districts: https://igod.gov.in/index.php/sg/MP/E042/organizations
- GoI LGD directory export: https://lgdirectory.gov.in/downloadDirectory.do
- GoI OGD district resource, updated 08-Oct-2026: https://data.gov.in/resource/local-government-directory-lgd-districts

## Exact CI and LIVE boundaries
- **Candidate:** GitHub Actions `38112503709` **SUCCESS 16/16 jobs** (includes new LGD preflight + all disposable B7 integration suites).
- **Protected:** GitHub Actions `38112503725` **SUCCESS 2/2 jobs** (Phase3A+3B static and original Supabase transactional regressions).
- Production remains unchanged; existing B5 `b5_private_gateway_only` policy stays **RESTRICTIVE**. PR #5 DRAFT, UNMERGED.
- No exact-head Vercel deployed/Android proof, no actual independent MP district/subdistrict download/digests, no Owner AAL2 E5, no server-side media pipeline proof, no release E7 or paid LIVE activation. P4-T040 and G3 remain IN PROGRESS; release ZIP BLOCKED. E6 genuine online provider post-launch DUE per blueprint.

**NO FAKE PASS. NO PRODUCTION WRITES. NEWS FIRST.**
