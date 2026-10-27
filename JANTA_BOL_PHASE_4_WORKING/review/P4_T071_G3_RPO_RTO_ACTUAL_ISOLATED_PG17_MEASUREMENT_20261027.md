# JANTA BOL — Phase 4 / P4-T071 G3 — RPO/RTO Actual Isolated PG17 Measurement
**Date:** 27 October 2026 IST  
**Verdict:** **ISOLATED-DB-DRILL MEASURED + PASS for its strictly defined scope; real JANTA BOL hosted/full-system RPO & RTO NOT MEASURED; P4-T071 FINAL HOLD.**

## Exact independently retrievable executed evidence
- Repo: `jantabol/JANTA-BOL-Website`
- Branch/PR: `codex/b11-t071-failure-isolation-preflight-20261027`, **PR #45**, unmerged.
- Tested Git SHA: **`8b6fcab5327cb7aed5eaf328772c1a970d3bfca8`**
- **Real PostgreSQL 17 isolated crash/restore GitHub Actions run: `40501228346`, job `122179118305`: SUCCESS.**
- Guarded workflow: `.github/workflows/b11-t071-rpo-rto-isolated-pg17.yml`
- Executed script: `ci/phase4/b11/t071-rpo-rto-isolated-pg17-drill.py`
- Legacy T071 source-adapter fault regression run on same SHA: `40501228305` SUCCESS; independent prior 13 VM adapter/total 80 checks run `40498177713` SUCCESS (actual source code under synthetic faults).
- Source logs emit canonical JSON plus `T071_EVIDENCE_SHA256=b5edd1774be77b52ecc2cb47e59a6797a20dfee354461dbd98095220808d2220` and PG backup SHA `fadd61fe11e3e103ea2cb9bd73cc4383b8f2a285b0083999ff9ba914026656aa`.

## Chronology — actual wall clock on isolated GitHub runner, UTC
| Event | ISO UTC | Observation |
|---|---|---|
| Last **verified restorable checkpoint** | `2026-10-27T12:07:02.908542Z` | Original disposable PG17 dump **actually restored** to a separate disposable DB, FK/role/RLS queried with fresh psql client, verified source backup digest. |
| Before incident | between checkpoint and fault | **One new committed synthetic Article** intentionally inserted/acknowledged after backup; proves data loss is possible. |
| Incident/failure start | `2026-10-27T12:07:03.330412Z` | The disposable PostgreSQL 17 Docker container killed by `SIGKILL`; psql unavailable observed; no real public system touched. |
| Recovery independent endpoint observed | `2026-10-27T12:07:04.590969Z` | Same synthetic database endpoint recreated from trusted dump after real PG engine restart; **fresh query** confirms synthetic Article/Grievance/Live/Ads FK identities, negative RLS role, five archived **synthetic** media SHA-256 hashes. |

**Direct observed metrics, THIS ONE LOCAL synthetic incident ONLY:**
- **RPO point age** = incident start − last verified restorable checkpoint = **0.422 seconds**.
- **RTO elapsed** = independently observed same **disposable PG database endpoint** restored − incident start = **1.261 seconds**.
- **Actual record loss in this synthetic scenario:** **one post-backup *committed* synthetic Article row**, explicitly detected missing after restore. This is an intentional negative demonstration, **not zero data loss**. No real JANTA BOL articles were lost or mutated.
- **What RTO includes:** local disposable PG engine crash/restart; recreation of exact local DB endpoint; schema+data PG dump restore; independent new psql read, FK and synthetic role/RLS checks; synthetic media restore+five SHA verifications. It does **not** include actual Supabase Auth, Edge, Vercel, payment providers, LIVE encoder, private media or human production incident response. PG17 local service in Docker had no network and no externally reachable port.

## Source-integrity and no fake PASS controls
1. Runner forced `github.repository==jantabol/JANTA-BOL-Website`, exact PR branch and event, `T071_ISOLATED_ONLY=YES`. Credential presence gates reject production DB/service key/B2 secret env; Docker PG17 ran with `--network none` and **no** published port.
2. Local data only: synthetic immutable UUID Article, Grievance, Live session/update, Ads campaign/payment; constrained FKs; synthetic negative RLS role; five invented media objects; independent `pg_dump`, `pg_restore` and checksum validations.
3. Restored endpoint is exactly `t071_original` of the local container. Post-checkpoint committed Article is deliberately absent from backup and must be detected missing; no `RPO=0` is claimed. RTO measured against the actual incident start, not the total CI job or backup duration.
4. The **first three CI attempts were RED**, not disguised as PASS: initial static command issue, diagnostic run found Docker `--rm` made killed container impossible to restart; dropped `--rm` while retaining explicit `finally docker rm -f` teardown. Final actual tested run SUCCESS after fix. The script uses fail-closed `T071_ISOLATED_RECOVERY_HOLD`, with no success output when a safety/integrity check fails.
5. Same timepoint/checksum explicit GitHub evidence, no real-production write, main merge, deployment, remote provider fault or paid project, and no private Storage paths/identities exposed.
6. Founder Android manual step **NONE** for isolated DB drill.

## What this DOES NOT establish (strict master T071 contractual boundary)
- **Production or hosted JANTA BOL RPO and RTO:** NOT MEASURED. `0.422s`/`1.261s` are **not** the production RPO/RTO and cannot be advertised as availability promises or target acceptance.
- **Founder-approved recovery objective ceilings:** NONE APPROVED / `NOT_ESTABLISHED`. No automatic comparison or PASS.
- **13-family real integrated independent failure proof:** not established by source VM or local PG demonstration alone; existing 13/13 adapters PASS in disposable VM, server-side domain persistence and live project fault recovery E8 still missing.
- **E1/E2/E5/E8:** this runner contributes actual local PG17 failure-and-restore timestamps, E1/E2 scoped real local, GitHub E5 logs. **E8 end-to-end full platform independently reviewed = HOLD**.
- **T070 full-system E8:** independently HOLD, no changes. **T071 FINAL PASS+LOCK = HOLD**. Separate Soft Launch public-content editorial release = HOLD, not silently solved here.

## Independent source and production read-only reconciliation
- Github protected `main` HEAD `f447231c0677644ca5a44cc19f12cf0314ff38ea` **unchanged**.
- Vercel deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`, `target=production`, `state=READY`, Git SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea` **unchanged**.
- Database/storage production credentials never loaded; local Docker container removed after verification.

## G3 result
**LOCAL_ISOLATED_PG17_MEASUREMENT=COMPLETE (observed 0.422s / 1.261s, 1 synthetic committed row intentionally lost).**
**PRODUCTION_RPO/RTO=NOT ESTABLISHED. FINAL P4-T071=HOLD.**

The next materially distinct work is E8 on a safely isolated integrated service and a genuine Founder recovery-target decision; do not rerun this same local drill unnecessarily.
