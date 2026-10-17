# JANTA BOL B8 — G2 CP01: Evidence Provenance + Article Identity Snapshot
**17 October 2026 | first G2 engineering checkpoint | Code source SHA `8e9b6cb98d885e050bc9a7f5336b1062df8079e6`.**
**NO LIVE SQL/Storage/production deployment, only disposable GitHub PostgreSQL17 and CI.**

## Exact Source/Change
Starting approved B8 reviewed branch `codex/b8-g0-g1-accountability-20261017`; old G1 CP01/CP02 tests already green. Added exactly the three G2 CP01 pieces plus one workflow update:
- `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g2_cp01_provenance_survival_REVIEW_ONLY.sql`
- `ci/phase4/b8-g2-cp01-cascade-fixture.sql`
- `ci/phase4/b8-g2-cp01-provenance-regression.sql`
- `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml` (adds G2 jobs to old protected CI)
Existing `JANTA_BOL_PHASE_3C_WORKING/*`, B1/B2 protected SQL, B5/B6, B7/Ads source and Cricket are **NOT CHANGED**.

## Real verified CI evidence
- GitHub [**run #39006338575**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39006338575), tested SHA **`8e9b6cb98d885e050bc9a7f5336b1062df8079e6`**, **2/2 SUCCESS**. PostgreSQL service **actual postgres:17**, credentials synthetic fixture only. Earlier G1 CP01/02 SQL + genuine regressions still green, plus G2 CP01 real catalog/roles/hash negatives/rollback. Protected original Phase3 News/Auth STATIC and B7 truthful closure still green; NOT full hosted Phase3 E2/E3.
- Actual PostgreSQL17 log excerpts (confirmed):
  - `B8 G2 protected private table ACL, old three CASCADE constraints, independent case reference PASS`.
  - `B8 G2 evidence hash claim, Article version, confidentiality and truthful NOT_VERIFIED/NO_BYTES state PASS`.
  - `ROLLBACK` and `B8 G2 disposable PG17 ROLLBACK PASS; old News and B7 sentinel untouched`.
- Positive: Founder AAL2 binds a currently existing nondeleted Article with **server-read original title and version** to B8 private Case; assigned active Reporter can append a syntactically valid claimed SHA-256 metadata receipt; Owner reads private, accurately marked `NOT_VERIFIED`, `bytes_verified=false`, `source_bytes_preserved=false`, `legal_hold_enforced=false`; no public table access.
- Negative: anon/private table access forbidden; wrong Reporter cannot submit, malformed SHA or future observation rejected, Owner AAL1 cannot read private proof, private rows cannot be updated silently. Legacy Article sources/versions/verification real database FK **metadata** replicated with ON DELETE CASCADE in synthetic fixture; B8 case Article UUID has **NO FK** to `articles`—structurally independent.
- NOTE **NO Article DELETE WAS EXECUTED BY THIS CP01 REGRESSION**. The report's title refers to reference design, **NOT yet runtime-proven deletion survival**. Future controlled disposable deletion/hold test remains mandatory. No actual media bytes uploaded; a user-supplied SHA is only an unverified claim, not proof of file authenticity.

## Important STOP-before-deploy and remaining G2 work
1. **CRITICAL G2 CP02 before any real protected Article deletion:** protected legal-hold contract / Article deletion safety, independent original source/file retention, real disposable database full destructive/rollback simulation **under approved safe fixture only**, no modification of existing protected Article deletion path without exact old regressions. Current new G2 metadata alone does NOT preserve old confidential original source bytes when Article FKs cascade.
2. **G2 CP03 reporter upload:** server-scoped case upload to existing PRIVATE editorial bucket, short-lived credential, hash/MIME/magic/size/retention, no broad Reporter Storage SELECT/UPDATE, photo/file quarantined, authenticated session+revoke+cross-case tests, real Android E3. Upload is not completed or installed today.
3. **G3/G4/G5**: durable genuine proof verification, right-to-reply send status and official reply, Founder full evidence pack, public approval/projection, case lifecycle and original official T092–T099, ACC001–051, original E1/E2/E3/E4/E5/E7/E9. All official PASS still **0/8**, only bounded disposable candidate E1/E2 green.
4. Production/Preview source parity remains before Founder-authorized Phase-4 News soft launch; B7 real first-paid ad stays on hold until soft launch; no new paid resources.

**Verdict:** G2 **CP01 bounded PostgreSQL17 / security / integration candidate GREEN**. **Whole G2 NOT PASS+LOCK** while legal-hold+real upload remain DUE. **B8 8 Official tests 0/8 FINAL PASS**. No fake progress, no destructive production action.
