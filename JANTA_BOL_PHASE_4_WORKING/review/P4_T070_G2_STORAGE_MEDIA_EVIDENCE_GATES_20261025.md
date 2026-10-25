# JANTA BOL • P4-T070 • G2 Evidence Gate • 2026-10-25 IST
**Scope:** T070 only. Founder instruction: complete and lock when truly proven.
**Current final verdict:** **HOLD** — no invented restore proof.

## Evidence examined (without production writes)
- B2 bucket UI (Founder screenshots 2026-10-25): `jantabol-backup-euc-2026/production/database/` contains 11 encrypted `.tar.zst.age` objects (~116.2 MB). This is evidence of stored DATABASE archives; no Storage file-byte backup is established from this listing.
- Historical GitHub T034 real action run `39602669748`, 2026-10-21: encrypted B2 roundtrip and offline networkless PG17 DB clone did complete. Its logs explicitly state `STORAGE_FILE_BYTES_RESTORED=false` and `PLATFORM_SETTINGS_RESTORED=false`. Reusing this proof must preserve the old date and scope.
- Current JANTA BOL Supabase read-only query: storage.objects counts = grievance-private 2, private-editorial 1, public-media 2; total 5. These are metadata entries, NOT restored bytes.
- Article/version/Grievance/Live/Ads aggregate counts still matched the earlier G1 query on 2026-10-25; no restore, backup workflow, credential creation, production SQL write or media download executed.
- New offline `t070-media-byte-verifier.mjs`: verifies actual file content SHA-256 and size, rejects missing files, symlinks, unsafe relative paths, forged bucket/hash/size, duplicates and empty inventories. Offline **synthetic** negative and positive regression: **8/8 PASS locally under Node 22**. No live credentials, no network or file upload. This is **not** original file recovery and output deliberately states `final_t070_pass:false`.
- PR #40 is a DRAFT; protected main not merged or changed. Cricket/Saarthi remains isolated.

## Independent reproducibility evidence (2026-10-25)
- Executed Node.js **v22.16.0** in an ephemeral local runner: `node --test t070-media-byte-verifier.test.mjs` using a local copy of the exact two PR #40 files.
- **Actual TAP result: 8 PASS / 0 FAIL**; includes matching bytes, tampered same-size bytes, missing media, traversal/duplicate inventory, invalid bucket/hash/size, linked file and parent, non-absolute root.
- Matched the runnable local copies by Git blob content SHA to GitHub PR #40 files: verifier `aedc7f781cce9df22625e6795cba7c60896a4f07`, tests `adfbd0c129ad3ec15a37b01d56fa1574856738ff`.
- This verifies **the synthetic offline development gate only**. It neither recovers original Supabase objects nor proves same-snapshot restore, Auth service or settings. GitHub Actions on the updated PR HEAD have not been independently verified GREEN.
- Fresh READ-ONLY Supabase confirmation: project state `ACTIVE_HEALTHY`, 5 Storage metadata objects in 3 buckets, 32 articles, 6 grievances, 16 live sessions, 7 ad campaigns; these are not restored data and do not prove all source bytes remain retrievable.
- Zero production changes, zero third-party account uploads, no private data or credentials handled.

## G2 backend and offline regression recheck (2026-10-25, continued)
- **Ran LIVE JANTA BOL source SQL, strictly READ-ONLY** from existing `ci/phase4/b11/t070-live-source-integrity.sql`: 14 relationship/uniqueness results: **12 consistent with actual records; 2 NOT_EXERCISED** (live_updates=0, ad_payments=0). Source healthy does **not** mean restored clone parity.
- **Ran NEW LIVE JANTA BOL source SQL** `ci/phase4/b11/t070-storage-source-preflight.sql`: exactly 3 buckets, 5 metadata objects (2 grievance-private, 1 private-editorial, 2 public-media), all 5 objects have size metadata. Both grievance-evidence rows map to existing Storage object paths, and both recorded SHA256 and sizes. No source/storage metadata object had a `sha256` metadata field (0/5); only independently authenticated original file bytes can establish all five hashes. **ZERO file bytes downloaded or backed up in this checkpoint.**
- **Ran REAL production RLS schema read-only preflight**: all **11/11** T070 core public tables have RLS enabled, 0 missing. A live policy switch is not proof of a restored platform or of non-leakage under anon/user identities.
- **Ran locally on Node v22.16.0, exact latest PR Git blob content matched**: 8 media byte verifier tests + 4 new read-only Storage SQL security-contract tests: **12/12 PASS, 0 FAIL** (two different suites). Git blobs: SQL `9db935f1f9300652f3c130f1fc9d4157de59e1c7`, SQL tests `d22cf6dc07d0b9880fb22c6e21dfe74d4b75465f`; media verifier `aedc7f781cce9df22625e6795cba7c60896a4f07`, media tests `adfbd0c129ad3ec15a37b01d56fa1574856738ff`.
- Existing previous workflow `40191864723` had independently verified 20/20 G0/G1 synthetic source-contract tests. **Do not represent the present PR head's full GitHub Actions CI as GREEN until actual Actions logs are obtained**. Vercel status alone is not a CI guarantee.
- Founder requirement: no old keys/private AGE material in chat, no private evidence bytes to GitHub, no production mutation, no new Paid Supabase environment, Cricket untouched. All met for these checks.
- **Manual/authorization boundary found:** to run real T070 E8, an authenticated, approved, private-media export and isolated restore/runtime is required. The GitHub/Supabase connectors currently available have no direct authorized Storage object bytes read or safe dedicated storage restore action. Founder can be guided step-by-step without sharing keys or private evidence to chat; no real restore has been executed yet.
- **G2 DEVELOPMENT/PREFLIGHT 12/12 LOCAL PASS; T070 real E8 HOLD.** Do not unlock T071 based on synthetic tests.

## Required evidence for real E8 before T070 Final PASS
1. Trusted same-snapshot source manifest with Article IDs/PURLs, Grievance public IDs, Live and ad-payment associations, Auth IDs/security policy identity.
2. Real networkless disposable PG17 restore of that snapshot; compare both sides with T070 comparator and record bounded logs.
3. Recover all five original PRIVATE/PUBLIC storage object BYTES into isolated recovery destination (not to production), run the offline SHA-256 verifier with independently captured source hashes and preserve a non-secret receipt. DB storage.objects metadata alone cannot satisfy this.
4. Prove platform Auth/RLS/application access and configuration restored and safe, without printing secret values or using the Founder offline AGE identity in GitHub.
5. Separate synthetic representative recovery where source has zero rows: live_updates and ad_payments. No fake payments or live updates in production.
6. E1/E2/E4/E5/E8 and affected baseline regression, followed by actual Founder Android proof.

## Security boundaries
- Do NOT rerun T034 production manual workflow without its own separate Founder approval and reviewed 40-character SHA.
- Do NOT re-use a historical backup as a current snapshot, bypass key approvals, create fake media objects or disable RLS.
- No automated production restoration or upload to B2 is authorized here. Zero-cost, development-only gate preserves Main.
- **Final P4-T070 = HOLD until actual E8 and validation.** Media verifier development test = PASS/LOCK for its narrow synthetic-only scope.

## G2.1 comparator hardening and verification • 25 Oct 2026
- Re-audited baseline T070 comparator, found real-source provenance contradiction: previous contract required `isolated=true` for BOTH original production source manifest and restored offline clone. Corrected to `source.isolated=false`, `restored.isolated=true`. No live source data or production setting changed.
- Hardened media path grammar: rejects dot segments, empty path components, backslash paths and absolute-path media references, so unsafe media filenames cannot be accepted into a purported restored manifest.
- Added two fail-closed negative regression tests. Direct V8 JavaScript execution of actual GitHub comparator/test code (substituting a deterministic test hash and structuredClone shim because Code Mode lacks Node built-ins) passed **18/18 logic assertions**. This is NOT official Node.js/Actions validation of the new branch HEAD, and MUST NOT be represented as CI GREEN. Old original G0/G1 GitHub CI 20/20 pass was for an earlier HEAD only.
- Exact new Git blob identities: comparator `389337fbf6f1870df648acb07f6097b7f176451b`, 18-test suite `3f84116986948915f4f2b8ce1453497c2ec9d705`.
- Vercel project `shubham-pichhore-2028` was located by read-only project listing, but environment-variable METADATA query returned **403 insufficient team-scope authorization**. Did not request secret values or change Vercel. Config recovery evidence **HOLD**, not assumed.
- Until an authorized disposable restore of same DB snapshot + original media bytes + Auth/config platform is possible, FINAL T070 **HOLD** despite passing development checks. T071 not initiated.
