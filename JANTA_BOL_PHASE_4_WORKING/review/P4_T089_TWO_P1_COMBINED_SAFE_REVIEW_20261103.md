# T089 — combined narrow P1 launch candidate (source only), November 3, 2026

BASE / current Vercel PRODUCTION: `93df12aa8ffdfae38d9a4066b6a4556bb36969e5` from `codex/t080-admin-ack-failclosed-review-20261031`; no product merge from the large T089 review PR #113, no SQL/Auth/C1/News/backups edits.

**Exactly two functional edits:**
1. `vercel.json` adds nonpermanent `/index.html` → canonical `/JANTA_BOL_PHASE_3C_WORKING/index.html`, retaining original `/` redirect and security headers. Live endpoint `/index.html` previously served standalone demo HTML with fictional weather text; `/` remained canonical.
2. `JANTA_BOL_PHASE_3C_WORKING/phase2-client.js`: existing `setGrievanceStatus` uses Owner guard + `jb_grievance_transition_internal` RPC, no direct Owner table UPDATE. Original live direct status write bypassed server FSM/chronology and case event/notification. Current Supabase grants Owner AAL2 UPDATE and server RPC has transition checks; no unauthorized activity asserted.

Combined CI `ci/phase4/b13-t089-p1-launch-guard-integrated-20261103.test.mjs` checks bounded changes, old security regression, and preservation of published news and C1 URL. Both isolated predecessor CI runs passed: PR #115 #41589214403 and PR #116 #41589955972. **This commit is source-only** and cannot be treated as production-safe until immutable deployment SHA is ready, hosted `/` + `/index.html` route checks show canonical C1, published article permanent URL and Owner/Grievance protected flows remain intact, and controlled production release/rollback authority is proved.

Original T089 final lock still HOLD because Sections 1–339 semantic coverage, older T087/T088 final dependency, and full E7 module/actual deployment reconciliation are incomplete. No paid services or Founder manual repeat. Source candidate is not public deployment.
