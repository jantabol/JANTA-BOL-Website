# JANTA BOL B8 — G2 CP02–CP04 Actual Engineering Evidence
17 October 2026. Founder requests completion of G2 with Phase-4 Soft Launch priority. Final tested source SHA: 208f7cbc0ec51d7056d735cfa4b47a59b6c94c34.
**G2 CP01–CP04 source coded + isolated E1/E2 candidate CI GREEN. G2 final hosted/Android/Owner PASS+LOCK NOT YET.** NO LIVE migration, production deploy, actual Storage write or paid service.

## What was coded and genuinely tested
- CP01: private immutable Case↔Article UUID/title/version link and Reporter evidence SHA CLAIM. It says NOT_VERIFIED and source-bytes-preserved FALSE until real server upload. Case link has no Article FK; takes FOR KEY SHARE lock on original Article row before linking. PG17 source and permissions tests passed.
- CP02: append-only Owner AAL2 legal-hold events and B8-linked Article BEFORE hard-delete guard, confined to linked Articles without editing old News publishing. Real disposable PG17 attempted synthetic hard delete: DENIED before old Article-source/version/verification ON DELETE CASCADE; transaction ROLLBACK. No general lawful release bypass implemented. An authorized correction/unpublish remains independent; live production still lacks this review-only guard.
- CP03: bounded PRIVATE evidence upload path. Reporter JWT, current active session + Owner-granted case permission; 8 MiB max, image PNG/JPEG/WebP or PDF magic check; database-issued random private object path and 10-minute intent; service-role-only receipt + orphan ledger; server SHA256 verifies uploaded bytes by independent PRIVATE readback; ordinary browser has NO service credentials or direct private-editorial Storage grants. Failure cleanup and ambiguous storage timeouts tested. Documentary authenticity or original source truth is NOT inferred from stored byte integrity. Original free private-editorial bucket reused; no paid resource.
- CP04: actual two concurrent disposable PostgreSQL17 sessions proved Article-link FOR KEY SHARE blocks old hard delete during in-flight link; both transactions ROLLBACK, old News and source remain. No production data affected.

## Real CI source and results
- CP02: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39006912290, both jobs SUCCESS.
- CP03 RED: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39007331121. Exact first divergence server UUID validator skipped an RFC4122 group; PG17 job passed. Minimum safe fix to media adapter only.
- CP03 second RED: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39007397547. Test fixture used nullish-coalescing to turn explicit revoked/null user into valid fixture actor. Minimum safe test-only fix; real auth never weakened.
- GREEN after both RCA: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39007440420.
- Failure-path RCA: even an errored upload can already have stored bytes. Adapter now attempts cleanup on every write ATTEMPT and reports unreconciled private objects. Tests extended.
- G2 CP01–CP04 latest actual GREEN: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39007733691, exact SHA 208f7cbc0ec51d7056d735cfa4b47a59b6c94c34, **2/2 SUCCESS**, actual postgres:17 backend migrations+negative/replay/RLS/rollback tests; real concurrent Article delete-vs-link test; PRIVATE gateway 10/10 Node tests; protected Phase3 STATIC and B7 truthful blocked-closure checks also GREEN. Protected STATIC is not full real Phase3/Android/hosted proof.
- All G2 code remains REVIEW ONLY in separate branch. Not in LIVE Supabase. Existing old News/Auth/B1/B2/B5/B6/B7 application source untouched; only new G2 code, tests and isolated workflow, plus B8 CP01 SQL locking improvement.

## Honest remaining G2 FINAL acceptance
**DUE H1 HOSTED E2:** approve safe review→release source parity, paired Free plan migration and Edge gateway testing; genuine private Storage readback, unauthorized JWT, failure/revoke/orphan proof. Synthetic or mocked Storage is not LIVE proof.
**DUE H2 PHYSICAL ANDROID E3:** integrated Reporter PDF/photo upload through G3 UI on verified deployed URL, genuine Owner AAL2/Reporter/Editor proof and negative cross-role screenshot. Not run.
**DUE H3 E5:** valid Founder AAL2, active/stale Reporter and Editor real session proof; the isolated fixture is not E5.
**DUE H4 LEGAL DISPOSITION:** linked Article hard-delete intentionally fail-closed, exceptional lawful evidence-aware release and B2 retention reconciliation not implemented. Do not bypass prior to security review.
**DUE H5 E7:** Production old main vs reviewed News Preview source/URL parity gate before soft launch. B7 real first-shop ad payment remains on separate after-softlaunch HOLD.
Do NOT delay unrelated G3 coding: G3 Android UI is the next integration dependency for H2. Stop ONLY unsafe deployment; never fabricate unavailable manual proofs.

**Official B8 P4-T092–T099: 0/8 Final PASS+LOCK; ACC001–051: 0/51 original complete evidence PASS. G2 engineering code ready; G2 FINAL not locked.**
NO REBUILD / NO FAKE PASS / FREE FIRST / PROTECT OLD B0–B7 / PHASE-4 SOFT LAUNCH.
