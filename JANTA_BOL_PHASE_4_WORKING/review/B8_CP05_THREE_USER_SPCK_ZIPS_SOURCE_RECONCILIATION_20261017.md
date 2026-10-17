# JANTA BOL — B8 CP05 / Founder-uploaded SPCK ZIP source reconciliation
**17 October 2026 • INSPECTION ONLY • NO APP CODE / LIVE DB / DEPLOY / PAID PROJECT CHANGE**

## Scope and source authority
Founder provided exactly three historical Android/SPCK ZIPs for deciding which source to use for B8 **design before coding**. Examined ZIP central-directory, CRC (Python `testzip()`), file lists, included provenance, selective Git-blob SHA-1 exact bytes and latest connected GitHub source. These are user-provided potentially untrusted archives; source was **inspected as text, not executed**. No extracted files were substituted into project or uploaded to GitHub. No user account, generated secret, phone number, media or key material recorded here.

| Original supplied archive | Size bytes / ZIP SHA-256 | Internal exact facts | Verdict |
|---|---|---|---|
| `JB_OFFLINE_AGE_KEYGEN_ANDROID (1).zip` | **5,420** / `9463daa3f40b63399f1e9b52c48f784515c4afc624cb6a2ef3a764606dd4b28a` | 1 file, `index.html` (5,286 uncompressed), browser-side offline AGE key utility; one embedded `AGE-SECRET-KEY-1`-shaped **test/reference** string. Do not assume it is user's private key; do not publish such a value. | **NOT a website or B7/B8 project source**; independent backup/key utility. |
| `JB_BACKUP_ENCRYPTION_TEST.zip` | **19,949** / `71ce5a82498d8f78895eb72aaf22f95ad3103fda9a87ac31ceab5f0e87bd52bb` | 4 HTML files for AGE key compatibility and encrypt/decrypt browser test; not the production backup system or frontend app. | **NOT a B7/B8 project source**; independent experimental test. |
| `JANTA_BOL_B7_SPCK_ANDROID_TEST_BUILD_20261012 (1).zip` | **1,300,288** / `02928b574db1825505f19c8e02efda19980737989f0fa4e248a62a12efb1c89f` | 193 entries = 175 files + 18 directories; 1,260,722 uncompressed bytes; 101 files under `B7_BACKEND_REVIEW_ONLY/`. Source text `B7_SPCK_START_HERE.txt`: build `069761105ab62f941825ffa43d6625209f736fa7`, CI `38209240858`, explicitly **UNLOCKED / NOT FINAL PASS**, review-only SQL/worker NOT deployed, actual E3/E5/E7 still DUE. | **Only relevant complete B7 Android TEST PACKAGE among the three**; **NOT latest GitHub B7 source / NOT final B7 LOCK ZIP**. |

All three ZIP archives pass CRC checks; none of the examined members encrypted or path traversal. This only confirms transport/ZIP structure, not application-security certification. Limited signature scan found no obvious live Github/Supabase private token pattern in third archive, but does NOT prove complete secret hygiene; first utility embeds a literal key-shaped reference vector and should not be pasted into shared logs.

## Exact Oct-12 build → most recent review branch SOURCE drift
Compare GitHub original embedded source commit `069761105ab62f941825ffa43d6625209f736fa7` against latest review `review/b8-precode-design-tests-20261017` (at comparison time `a4918798dbd2522cb4f9ac7b13c10c815e5fa185`): **+319 commits, -0 behind**, 164 reported changed file paths (GitHub compare). The Oct-12 source is ancestor to the newer reviewed branch. It must NEVER be used to overwrite current GitHub files.

Exact Git-blob comparisons: **13 matching and 8 different** among 21 sample paths:
- **Matching examples:** `index.html`, `article.html`, `backend-client.js`, `phase2-client.js`, `add-news.html`, `compliance.html`, `grievance-submit.html`, `ad-analytics-client.js`, `ad-viewability.js`, original B3 notification and retention review SQL, and `B7_FINAL_ZIP_CLOSURE_MANIFEST.json`. Matching blob bytes prove only individual files unchanged, not functionality.
- **Different examples requiring latest source:** `ads.html`, `advertise-request.html`, `public-ads.js`, `public-ads.css`, `phase4-domain-client.js`, `20261010_b7_qualified_impressions_REVIEW_ONLY.sql`, `20261010_b7_cta_click_REVIEW_ONLY.sql`, `20261010_b7_manual_payment_REVIEW_ONLY.sql`. The qualified view/click changes include later T040 HIDE/ticket audit fixes; don't regress.
- Exact B7 ZIP `B7_FINAL_ZIP_CLOSURE_MANIFEST.json` says **final_zip_status=BLOCKED**, 9 canonical tests and 60 ADS items. Thus the ZIP itself explicitly denies final B7 PASS+LOCK.
- Review branch source **does not imply LIVE deployment**: separate verified Vercel production-vs-preview mapping still needs E7. B8 design uses verified GitHub review source plus LIVE Supabase read-only catalog, NOT SPCK ZIP as install/deployment authority.

## Safe B8 handoff
**Locked choice:** retain all three original ZIPs as historical/reference sources; use latest reviewed GitHub exact pinned commit for B8 logical architecture+test freeze. Before actual B8 coding, independently reconcile protected old main/News and B7 staging release, then obtain explicit Founder coding approval. Keep B0–B6 Founder lock, B7 genuine real payment HOLD; keep B8 51 tests & official T092–T099 as **NOT RUN**.
No extraction-to-repo, SQL execution, credential request, approval, ad LIVE, real payment, or production mutation occurred in this audit.
