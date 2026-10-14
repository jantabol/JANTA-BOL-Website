# JANTA BOL — T034 Backup/Restore: Dual AGE Recipients, Isolated Proof (14 Oct 2026)
STATUS: **SYNTHETIC CI PASS ONLY. G2+G3 real offsite backup/restore remain HOLD.**
This file records evidence, NOT Founder sign-off, and does not authorize production migration, B2 object creation, DB exports or replacement of any existing production workflow.

## Exact boundaries
- Working branch: `review/t034-offsite-restore-hardgate-20261014` forked from `main` `30511a4bad016d1bdce1d7c9abf920606f52f00c`.
- New branch-only workflow: `.github/workflows/b7-t034-dual-recipient-remote-roundtrip-synthetic.yml`. Never requests JANTA BOL Supabase/B2 credentials, never accesses private identity or actual cloud data, never creates a GitHub Artifact.
- Generated **two FAKE ephemeral AGE identities** in isolated runner (a synthetic owner and a temporary restore identity), encrypted fake PG17 dump to BOTH public recipients, deleted original plaintext, copied ciphertext through a simulated offsite destination, compared SHA-256, decrypted independently with *both* identities, rejected tampered ciphertext, performed actual isolated fresh PostgreSQL 17 restore, verified 2/2 FAKE rows, enabled RLS and read policy.
- Initial run `38576153279` failed because target PostgreSQL creates `public` by default and `pg_restore --exit-on-error` rejected `CREATE SCHEMA public`; first divergence specifically located from job `115893674996`. Fixed by dropping **only synthetic target database default schema** before restoring; no guess-based production patch.
- Corrected CI run `38576313141`, commit `ac47aa52be3e99d88f7d875bb9b462380d19ed15`, job `115894249603` **SUCCESS**. GitHub log confirms synthetic owner + ephemeral independent decryption, simulated ciphertext roundtrip SHA match, tamper denial, 2/2 row restore and RLS policy. All files deleted when ephemeral runner completes.
- Earlier real read-only B2 listing + public AGE recipient encryption preflight run `38552538539` PASS. It did not prove owner paper private key matches recipient or encrypt real data. JANTA BOL live pooler read-only password re-test run `38574139664` attempt 2 PASS, no production data read. Evidence is separate and must not be conflated.
- No application code, legacy migration, live Ad records, existing backup workflow or Cricket project changed.

## Critical no-fake-pass distinction
The dual-recipient method creates a **candidate** way to do a future *same-run* decrypt/restore of downloaded real offsite ciphertext in an isolated runner WITHOUT ever uploading the Founder's offline paper private identity to GitHub. This CI **does not implement the method in the production backup script**, **does not validate real AGE paper identity correspondence**, **does not restore any real JANTA BOL schema/data**, **does not attest the storage bucket actually contains a usable archive**, and **does not authorize production payment guard migration**.

## Next engineering work
1. Review production backup script, minimal bounded change candidate for ephemeral restore recipient, downloaded ciphertext decrypt and isolated restore; regression and exact fail-closed handling. Do not change authoritative Backup workflow in main during review.
2. Verify real Founder paper AGE private-key correspondence **locally/offline**, without disclosing identity in chat, GitHub, Supabase or a public webpage.
3. Only after Founder-approved real manual export + B2 encrypted upload + independent actual restore + schema/RLS/role/core count parity: consider ADS-008 production migration. Real ADS-009 authenticated E5 still pending.
