# T089 P1 minimum fix: redirect legacy hosted /index.html to canonical JANTA BOL public site

**Date:** 2026-11-03. **Status:** CANDIDATE SOURCE-ONLY; no live Production deployment, main merge, DNS/domain/Auth/SQL/Edge/News edits or paid resource.

## Real detected conflict

Canonical source under `JANTA_BOL_PHASE_3C_WORKING/index.html` uses the audited C1 published-only public feed and the canonical Article master URL. The separately retained **repository-root** `index.html` is an old STATIC UI prototype with an unconditional `🔴 LIVE` label and a different `script.js` that has no Supabase backend authority. The original `vercel.json` redirects only path `/` to the canonical JANTA BOL homepage. It leaves `/index.html` (a direct legacy URL) without a dedicated redirect. A distinct static UI route is a *presentation/source-conflict candidate*, not a parallel backend Article engine. Do not remove the root files or rewrite the canonical site.

## One reversible safe correction

Add exactly one Vercel redirect:
`/index.html` → `/JANTA_BOL_PHASE_3C_WORKING/index.html` with `permanent:false` (HTTP 307 temporary expected by Vercel), preserving unchanged all original redirect entries, no-store/security headers, Auth URLs and permanent Article URL semantics. This is **not** a permanent Article URL migration; it only prevents confusing old homepage access.

## Evidence, safety, release limit

Protected source-only CI contract `ci/phase4/b13-t089-legacy-home-route-safe-fix.test.mjs` compares the complete JSON exactly to parent plus this one redirect, checks original privacy headers and Article route, and enforces no other changed implementation/DB/workflow source. No backend keys used. **Draft PR only**. Real hosted redirect and smoke proof must be performed **after reviewed safe deployment** by a separate release gate; do NOT mark current jantabol.in as fixed now. Rollback = revert this one redirect after reviewed test, not a destructive production rollback.

The five Supabase live Edge functions not in GitHub plus the production deployment's different Git SHA remain independent full-recovery source gaps requiring confidential backup/baseline review. Original `T089` E7 semantic/authority Final Lock **HOLD** until complete.
