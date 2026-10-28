# JANTA BOL Phase 4 / B11 — T074 genuine post-restore original B8 functional-security recheck; T075 read-only gate inventory
**Date:** 2026-10-28 (IST). **Authority:** Review-only evidence, no release authorization. **Founder goal:** soft-launch fast, no fake PASS, no rebuild, old work preserved.

## New executed result — scoped genuine PostgreSQL 17 restore, not only historical log review

**GitHub Actions run 40647232466, job 122678784017, SUCCESS** on review-only source commit `6cc084a13683c1b50056522af33546d5ea370ad0` and PR #53. Reviewed job steps and independent raw logs; all completed SUCCESS.

- SHA-pinned authentic original B8 source/fixture `89849ba47f443f423d8bfe4f966bb2d38087201f`; SHA/source guard and localhost/new-PG17/non-production guard passed. SQL scripts and workflow are *new additions*, old source unchanged.
- Created a real B8 test Owner/AAL2 case, real reporter assignment and private draft through **original SQL RPCs** in disposable PostgreSQL 17; preserved baseline.
- Captured a real local `pg_dump -Fc` archive, recorded SHA-256 and verified it. **After the backup**, deliberately changed the original disposable case risk lane and revoked the original test reporter grant, verifying the source DB diverged from the clean snapshot.
- Independently `pg_restore`d the **same verified local archive** into a separate PostgreSQL17 test DB, then executed real SQL postrestore behavioral and negative security checks. Recovered original Case ID/content/risk, grant, Draft ID/content, synthetic published Article ID and requested Ad ID, three B8 RLS protections, and direct grant denial.
- Additional after-restore real SQL security: authenticated raw case-table read denied; Owner AAL1 create denied; inactive Owner/AAL2 create denied; unrelated active Reporter private card denied; assigned Reporter private card read and new draft create allowed; restored Owner/AAL2 revocation immediately blocked Reporter card; pre-existing Article/Ad unchanged and no unauthorized extra case.
- Machine evidence: `T074_REAL_PG17_POSTRESTORE_FUNCTIONAL_RLS_OWNER_REPORTER_REVOCATION=PASS_SCOPED`. No production data, offsite credentials, service role, secrets, user media, or device state in this job.

**Important limits:** Supabase session/AAL supplier in this original B8 PG17 fixture is a controlled test implementation; this is not full hosted Auth, real offline device recovery, real leaked-key response, original encrypted independent offsite snapshot, coherent DB+5 media+Auth/Edge+Vercel restore, or production recovery. Earlier T034 real offsite DB and T069 real five-media restore are separate historical time-points; they cannot be combined into one restore claim. **T074 FULL E8 = HOLD**, although this new source-backed postrestore functional/security scope is PASS.

## New independent live read-only T075 preparation (no changes to production)

- GitHub `main` HEAD `f447231c0677644ca5a44cc19f12cf0314ff38ea`; Vercel Production project `shubham-pichhore-2028` latest READY deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`, attached **to the same older SHA**. New T071/T072/T073/T074 review-only code not deployed to production.
- Connected JANTA BOL Supabase `vrffsnkycvjithwtiylt`, read-only count: **1 published Article**, **31 draft Articles**, **1 private B8 Case**. No content/identity values dumped.
- **T072 real P2 remains a live endpoint blocker:** original `public.jb_b8_g1_owner_create_case(text,text,text)` exists; exact review-only proposed protected idempotent RPC `public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)` and ledger `public.b8_owner_case_idempotency` are **not deployed**. Do not mark T072 final PASS or casually migrate on live DB.
- Previous read-only metadata confirms all 100 current public base tables have RLS enabled and 13 Supabase Edge Functions are ACTIVE; existence/status only does not establish a postrestore combined system recovery.

## Explicit remaining gates

| Test | Defensible status | Missing real evidence |
| --- | --- | --- |
| T070 | HOLD for full recoverable platform | One-point original DB+Storage+Auth/Edge integrated restore |
| T071 | C1 scoped public publish proof; full HOLD | Genuine hosted provider E8 / C2-C5 final independent |
| T072 | P2 original live RPC OPEN; isolated proposed fix PASS | Approved minimal backend+client durable request-key integration + protected actual E2/E5 |
| T073 | Actual original local corruption and separate PG17 restore PASS scoped; full HOLD | Credentials/incident recovery and approved isolated full deployment rollback |
| T074 | **New original B8 real PG17 postrestore functional/security PASS scoped**; final HOLD | Independent coherent offsite source + original Media/Auth/Edge/Vercel recovery; lost device |
| T075 | Read-only production/preflight inventory obtained; **FULL FINAL HOLD** | Whole B11 E1/E3/E7/E8, real automated health/runbook recovery, Founder signed release risk decision |

## Founder / safety

Founder Android manual action **not required for this isolated actual PostgreSQL work**. A future actual device-loss rehearsal **must not wipe** the user's real phone/tablet or publish private data; use a safe isolated test identity and independently recoverable test draft if authorized. Do not request secrets in chat.

**Change surface:** exactly two new executable test/CI files plus this read-only evidence report in Draft PR #53, stacked on T073 PR #52. **NO** merge to Git Main, Vercel Production deployment, Supabase production write, actual offsite restore, real production key rotation, alteration of published ISRO story, Cricket/Saarthi change. Phase4 B11 T075 final is explicitly **NOT LOCKED**. Next critical decisions: preserve T074 proof once; resolve T072 critical endpoint activation vs OFF and coherent recovery scope; then independent T075 release readiness and truthful public-site release.
