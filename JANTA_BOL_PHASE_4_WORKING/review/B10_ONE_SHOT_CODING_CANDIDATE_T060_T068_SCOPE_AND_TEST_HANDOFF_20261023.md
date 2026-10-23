# JANTA BOL — Phase-4 B10 ONE-SHOT WHOLE-BLOCK CODING CANDIDATE
**Date:** 2026-10-23 IST | **User-selected workflow:** code the **entire** B10 block (9 original tests) in one scoped coding batch, **then** independently test, then next block. No piecemeal partial-feature launch. This is an engineering source freeze, not production authorization or a fabricated B10 final security certification.

## Authority and exact inherited scope
- Repository **ONLY** `jantabol/JANTA-BOL-Website`; original supplied ZIP `PHASE_4_B9_BLOCK_COMPLETE (1).zip` verified as a historical B0–B9 snapshot. Original source commit `d16702aaf393bc46cb714b667f4305a518325b9a`.
- Original ZIP has 625 files; 622 SHA-256 entries exact and 3 modified member bytes: `JANTA_BOL_PHASE_3C_WORKING/index.html`, `article.html` and `b9-search-ui.js`. **Never overwrite these three with the older manifest-listed bytes.** Their source/edit provenance and newer B9 branch counterparts require reconciliation before release. User's Android preview verifies Search entry and golden Related News, but neither constitutes a B9 production merge/deploy.
- Current GitHub B9 baseline is **45 commits ahead** of supplied ZIP base and updates 24 paths, notably T109 error handling, T105 5,000-story isolated benchmark, final audit records and homepage/Article cosmetic fixes. B10 development branch forks latest B9 G0 audit HEAD `cb1b972f628104b492ba59659bb1c0f0627c8c77`, not stale ZIP bytes.
- **Original B9-T105 official final evidence HOLD**: only real old (1–2 year) Article + at-scale Android E3 missing. B8 complete gate still separately HOLD in register. B10 development is **not** proof of former block final closure or permission to ship.

## Exactly one B10 coding batch, T060–T068
B10 is original **RUN-09 cross-module security closure**, primarily existing core hardening verification, not a greenfield auth/ads/grievance engine. No new privileged production RPCs or live schema changes were needed/authorized at coding stage. The whole security regression harness was added on its own branch without edits to legacy News, Auth, Owner, MFA, Article, Live, Ads, Grievance or Recovery product files.

| Original official test | Implemented B10 coding/security-checking surface | What is NOT claimed |
|---|---|---|
| **T060** baseline/back-end-only authority/fail closed | Existing Owner AAL2 code/source + actual synthetic PG17 owner positive, reporter/editor reject | No forged LIVE user token exercise yet |
| **T061** public/private/sensitive boundary | RLS/ACL/privacy Source assertions + actual PG17 anonymous negative on hidden UUID/body | Full real grievance Gov ID & storage access audit still needs E5 |
| **T062** cross-module role matrix | Required module inventory + synthetic reporter/editor AAL2 cannot elevate to Owner | Full actual public/team/advertiser multi-account cross-module E5/DUE |
| **T063** MFA, session, lost-device/recovery | Confirm old MFA/session/recovery source retained; PG17 simulated stale Owner AAL1 denied | **Real Android E3 and safe lost-device/recovery drill DUE** |
| **T064** secrets, environment, RLS, storage | Frontend secret/secret-key material guard, existing fixed security-definer search_path, private table ACL and invoker views | Actual hosted/storage/admin-config review DUE |
| **T065** IDOR/parameter tampering | Original B9 private-body/hidden UUID test retained + PG17 anonymous direct 3-ID enumeration denial | Full cross-tenant authenticated case/ad IDOR DUE |
| **T066** revocation and authority isolation | Actual B7 revocation-visibility fail-closed source; B9 public search and Owner RPC no public execution | Real device/network session revocation and suspended-account E5 DUE |
| **T067** incident RCA and audit continuity | Original Phase3 protected incident regression, B9 T109 injected outages, PG17 Owner display event with actor & before/after | A full operational security incident with human governance E5 DUE |
| **T068** final Security closure evidence lock | 109 original tests enforced, no T105 or B10 auto-PASS, all prior suites are CI dependencies, verified SHA256 Master ZIP required | **Final B10 PASS+LOCK DUE** until all required E1/E2/E3/E5/E7 and old security gates satisfied |

### Coding artifacts (on dedicated GitHub branch)
- `ci/phase4/b10-whole-platform-security-source.test.mjs`: 9 named original T060–068 Node security-code contracts.
- `ci/phase4/b10-whole-platform-security-pg17.sql`: actual disposable PG17 RLS, public search, hidden UUID, Reporter/Editor/Owner-AAL1 denial, positive Owner-AAL2, before/after audit; one transaction then ROLLBACK.
- `.github/workflows/b10-whole-platform-security-candidate.yml`: runs T060–068 source/PG17, preserves B9 Source/RPC & old Phase3 Auth/Incident/Recovery + complete B8 protected cross-module PG17. NEVER consumes prod secrets.
- `ci/phase4/build_b0_b10_full_source_zip.py`: manifest SHA256 and CRC for **ALL** tracked B0–B10 source, exact commit identity, safeguards against ZIP-slip/symlinks/untracked secrets. Generated full ZIP upload only after CI gates GREEN.
- `JANTA_BOL_PHASE_4_WORKING/review/B10_ONE_SHOT_CODING_CANDIDATE_T060_T068_SCOPE_AND_TEST_HANDOFF_20261023.md`: this original-scope fidelity and evidence/dependency register.

## Live Supabase G0 read-only security prechecks reused
- Correct JANTA BOL Supabase ONLY: `vrffsnkycvjithwtiylt` (Cricket's Supabase/project forbidden).
- 100/100 public base tables RLS true; 0 anonymous read with RLS off; private Articles, grievance identity, internal sources, raw analytics, audit denied direct anonymous read. 16 currently Published Search results with 16 hidden Article ID denies.
- 3 Storage buckets: `grievance-private`/ `private-editorial` private, `public-media` public. Anonymous direct RLS listing of both private buckets gave zero visible items; this is NOT an object upload/download penetration test.
- 214 `public` SECURITY DEFINER funcs; 21 anon-executable; Advisor warns 116 authenticated callable. **Do NOT mass revoke 21**: they include intended public search/enquiry/feed. Evaluate function-by-function negative privileges/data-minimization and do not claim warnings closed. 43 no-policy RLS INFO (intentionally private tables possible). Leaked-password Auth Protection 1 WARN requires dashboard-owner review.
- T060/T061 read-only live evidence demonstrates positive posture only, **not** complete B10 safety proof.
- Advisor URLs: `https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable`, `https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection`.

## Test after coding (not before)
1. Fix code/source-only CI RED by **RCA + minimum checker fix**, never disable protected tests.
2. Capture exact final SHA, 109-test selector, 9 B10 source contracts and disposable PG17 negative logs + old B0–B8 gate logs and full-source ZIP integrity.
3. Run independent read-only LIVE API/permission inventories, all 21 public RPCs and role matrix, private storage, Auth config and leak scans. Only with approved controlled fixtures test actor-tampering and negative E5.
4. **Founder manual Android step belongs to T063**, requiring safe AAL2 MFA/session/reauth evidence. Never perform real lost-device global revoke without explicit Owner decision and tested recovery path.
5. Security event & notification E5, real incident RCA T067 then T068 gate. Finally mark PASS+LOCK if proven; otherwise record individual HOLD, not fake PASS.
6. Archive/ZIP source divergence + B9-T105 actual-old-archive E3 separate remaining gate before production B11.

**Critical scope:** Development candidate code can be one-shot, final test certification cannot be asserted merely because source/CI compile. Not a public Vercel deployment. No production DB mutation. No touching Cricket.
