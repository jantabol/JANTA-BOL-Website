# JANTA BOL — P4-T081 Vercel immutable rollback-candidate source risk (1 November 2026)

**Authority:** connected Vercel production deployment/rollback-candidate API and GitHub immutable repository comparison, read-only. **Status:** `SOURCE_DELTA_REVIEWED=PASS_SCOPED`; `REAL_ALIAS_ROLLBACK=NOT_RUN`; `E8_FULL_RESTORE=HOLD`.

## Real provider production deployment lineage
- **Current active production:** Vercel `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`, `READY`, Git SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, source branch `codex/t080-admin-ack-failclosed-review-20261031`; provider marks it `isRollbackCandidate=true`. It is assigned `jantabol.in` and `www.jantabol.in` (www 308 to apex).
- **Prior production rollback candidate:** `dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx`, `READY`, Git SHA `14a929180d99088e950475eeee609cae8e3f01c8`, source branch `codex/t080-geo-coverage-published-c1-20261031`; Vercel provider currently marks `isRollbackCandidate=true`. No claim prior deployment is presently carrying jantabol.in.
- **Comparison** `14a92918... → 93df12aa...` GitHub returned `status=ahead`, **3 commits, exactly 3 changed files**: `JANTA_BOL_PHASE_3C_WORKING/add-news.html` (129 line changes) plus `.github/workflows/b12-t080-admin-retry-review.yml` and `ci/phase4/b12/t080-admin-ack-failclosed.test.mjs` (CI-only). **No other app/source files changed** along that exact ancestry.
- Old `add-news.html` immutable git blob: `573c52a8c3c83455af1f3cbd05c26f951ae3b8ff`; current blob `7903f3a116da8e217807042a987f556c5a776adb`. Current adds fail-closed save retry/ACK UI, older version does not contain the current retry behavior. Thus an alias rollback to the older candidate **may intentionally discard T080 retry hardening**. Never call this an identical-function recovery.
- `vercel.json`, `JANTA_BOL_PHASE_3C_WORKING/article.html`, `admin-auth.js`, `backend-client.js`, `public-c1-projection.js`, `website-v3.js`, `index.html`, published-news UI and Public Ads are identical source Git blobs between these two specific candidate SHAs. This is source ancestry proof, **not** a new end-to-end browser/permission test of the old deployment.
- Provider Vercel project environment **names only** (no values retrieved or exposed): `JB_PUBLIC_SUPABASE_KEY` scoped to production; `JB_PUBLIC_SUPABASE_URL` scoped to preview and production. These are *names* of Vercel config records, **not** a restorable secrets/production configuration backup.
- Supabase development branches list was **empty** (no free full-stack restore environment found). No branch was created and no paid services enabled.

## Release / recovery decision
1. **A production rollback candidate exists (metadata only)**, but `CURRENT_MAIN_SAFE_TO_DEPLOY=NO` because Main is behind served source. `OLDER_CANDIDATE_FULLY_EQUIVALENT=NO` because T080 Admin Add News retry behavior differs.
2. A real safe rollback requires Founder-approved RTO/RPO and timing, current snapshot/export including Auth+Edge+media secrets and routes, secure enough isolated target, protected Main/release source migration gate, explicit second-person traffic authorization, and postrollback real public/Founder/device checks. **Do not move an alias just because a candidate is marked READY.**
3. A platform API `isRollbackCandidate=true` says **eligible to select**, not that a rollback was executed or was data-safe.
4. Earlier GitHub Action T083 live HTTPS 7/7 PASS tests the **current** live public site; no new external HTTP test of the old candidate is claimed here. No blind redirect, no public QA article, no Restore button press, no DB mutation.

**T081 Source-level rollback candidate verified PASS_SCOPED. T081 Live rollback NOT_RUN. T081 current full E8 HOLD. B12/B13 final LOCK HOLD.**
