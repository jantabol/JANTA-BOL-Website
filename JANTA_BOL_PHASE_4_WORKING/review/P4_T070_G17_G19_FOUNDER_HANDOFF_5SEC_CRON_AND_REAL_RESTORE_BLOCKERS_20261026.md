# JANTA BOL Phase-4 • P4-T070 G17–G19 FINAL EXECUTION HANDOFF
**Checkpoint date:** 26 October 2026 IST
**Founder choice:** A — maintenance is permitted **conditionally after a proven safe rollback**. Not unconditional permission to stop traffic, disable cron jobs or deploy privileged code.
**Official Phase-4 master test definition:** P4-T070 "Real Restore Drill + Identity Preservation" (RUN-10, RECOV-012..018, Sections 586–599). Must actually restore *representative* database, original files, Auth, permissions and config preserving Article/PURL, Grievance ID/history, LIVE, Ads/payment relationships. Must verify latest trustworthy state; no blind overwrite; actual E1+E2+E4+E5+E8 evidence. P4-T071 is the subsequent RPO/RTO + cross-module failure isolation matrix (RECOV-019..026), **not yet started**.

## Actual evidence (independent GitHub and read-only Supabase)
- Verified completed production/manual Github original DB backup+isolated database-only PG17 clone run **40223103797**, GitHub workflow `b7-t034-dual-recipient-real-MANUAL.yml`, source commit `4ef0643520f664b0c23fee2cd70af27c02509b5f`.
- Verified completed real encrypted B2 original media five-file isolated runner readback run **40274621191**, workflow `b11-storage-media-MANUAL.yml`, source commit `bfd22fc7c2716fe32ffe517b556012089f5ea440`. **These are separate capture points**.
- Real Founder Android-held primary AGE recipient successfully authenticated the exact five-media B2 ciphertext off-runner; SHA matching real runner. Owner did **not** extract and reverify five object bytes on the phone; prior runner did original file-level SHA proof.
- Real G15 GitHub hosted clean Supabase local stack, six-table fake-data PG dump/restore, five fabricated files restore/TAMPER detect, anonymous RLS denial and Auth health succeeded in run **40292914139**. **No real JANTA BOL source bytes in that G15 environment.**
- Real SQL source identity over 11 DB families read-only; original identity and current file/storage counts correctly tracked. 2 production families LIVE updates and Ads payments genuinely zero and not marked exercised.
- All 13 active deployed JANTA BOL Edge Function packages retrieved privately via authorized Supabase, only 13 public-safe slug/version/sha identities recorded; runnable clone not deployed, Vercel/Auth/AAL2 not recovered into target.
- Real maintenance preflight G17 audited 3 active cron, 48 enabled public triggers, 5 tables with direct anon write grants, 15 with authenticated grants, 215 public SECURITY DEFINER functions, and 5 deployed Edge endpoints with `verify_jwt=false` (not a vulnerability claim).
- **New decisive G17 scheduler frequency finding (read-only):** job 3 runs **every 5 seconds**, 717 successful runs in observed previous hour and 0 failed; job 4 once per minute, 60 successful; job 5 hourly, 1 successful. Their opaque command SHA256/scope digests and schedules captured without command text/secrets in `ci/phase4/b11/t070-g17-cron-readonly-source-evidence.json`. These rates show an active recurring job that must be accounted for; no global write-quiescence established. **Do not blindly unschedule or disable job 3.**
- Last candidate CI `40307974249` PASS 91/91 tests, **synthetic/contract only**, main unchanged. A new cron evidence/test CI is under candidate branch; verify its exact run conclusion before declaring new test count.

## Final independent G19 hold matrix
- G17 effective safely reversible backend write barrier and a witnessed rollback: **NOT RUN**, because job3 5-second recurrence, other writers/Storage/Edge/queues remain unfenced.
- Source-bound same trusted point raw DB+five original media B2 encrypted backup: **NOT RUN**. DB-only + media-only historical runs cannot be reinterpreted as same-point.
- G18 genuine isolated joined restore of real DB+five original media+Auth/permissions/13 Edge runtime/Vercel configuration: **NOT RUN**.
- G19 independent original Article URLs+Grievance/LIVE/Ads relationships, negative anonymous/Owner/AAL2 security tests and E1/E2/E4/E5/E8 Android audit on a genuine restored deployment: **NOT RUN**.
- Independent final decision for T070: **HOLD**. **P4-T071 not started** under locked testing order. Never represent source-only readback, a synthetic local rehearsal, a self-attested TRUE value, or green static CI as the missing E8 recovery.

## Minimum safe next actions (ordered; not automated)
1. *Founder only, Android-safe:* Check JANTA BOL Admin on phone/tablet for **Unsynced / Offline / Conflict / Pending Upload** items and **preserve** any found; do not clear local storage, discard drafts, revoke sessions, paste keys or force sync into a paused server. Report simply `NONE` if empty, otherwise `PENDING` plus count without exposing private data. Do not activate maintenance yet.
2. Prepare an actually enforceable, versioned backend write fence (Direct PostgREST SQL grants/RLS, security-definer RPCs, five JWT-less Edge functions, cron including 5-sec job, background queue, Storage presigned URLs) with automatic timeout, fail-closed behavior and stored rollback state. Verify real *disconnected* crash rollback and protection of offline queue before touching production.
3. Only after independently validated rollback and renewed go/no-go, perform one protected main/manual production maintenance drill with no user secrets in logs, no expensive Supabase clone, immutable dedicated JANTA BOL B2 archive and timeboxed re-open; never affect Cricket.
4. Run genuine detached combined restoration and independent identities/security tests and issue founder E8. Only then mark T070 PASS+LOCK, and start P4-T071 official failure matrix.

**Operational verdict: A accepted; preparatory evidence and safe testing COMPLETE in scope; actual risky production operation NOT EXECUTED, T070 FINAL LOCK = HOLD.**
