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
