# JANTA BOL — P4-T086 B13 — Post-MFA Published News Correction Return

**Date:** 2026-11-02 IST. **Scope:** read-only source/regression candidate; Draft PR. **No production deploy, no Live Stream, no Article write, no change to Owner Auth authority, no paid system.**

## Exact issue and evidence
Original B13 T086 Article Life Cycle (RUN-15, §§765–772) expects Publish → Open/Share → Correction → Unpublish → Republish preserving original Article UUID/PURL. `JANTA_BOL_PHASE_3C_WORKING/published.html` links the published Article’s yellow **Edit / Correction** button to `add-news.html?edit=<original-uuid>&from=published`. When Owner loses session / AAL2 / hits the 15-minute lock, `admin-auth.js` sends the exact path+query as the `next` parameter to `admin-login.html`, whose `safeNextPage()` calls `window.JBProdSafeNav.target()` **after successful Founder login and MFA**. Old `b12-safe-nav.js` allowlisted only **one query key** and omitted `published.html`; therefore the legitimate correction continuation and post-login Published list were **rejected** and sent to `admin.html`. This was predicted by source and one earlier Founder Android navigation to Dashboard; successful actual post-AAL2 correction reentry remains **NOT_RUN**.

## Tiny patch — NOT a rebuild
Changes only `JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js`, from reviewed Founder A source Git blob `a2107140321c2e099e785c678213ad278cbcfd5f` to candidate blob **`d2d2742e46d3d373f6a6dd549f9d7b0fe684b862`**. Two precise modifications:
1. Add **`published.html`** to existing fixed local Founder pages allowlist; reject any query on it.
2. One narrow exception for **`add-news.html?edit=<VALID_UUID>&from=published`**. Exactly two unique query keys `edit` and `from`, `edit` strictly UUID, `from` exactly lowercase `published`, zero extra/duplicate keys, and canonical output in fixed key order. Other existing single-query routes (`add-news.html?id=<UUID>`, `grievances.html?tab=...`, `b9-analytics.html?range=...`) unchanged. Existing absolute/relative traversal, encoded slash/backslash/control, malformed multi-question, unknown paths, extra params and external redirect controls remain fail-closed. No dynamic domain URL or untrusted query appended to output.
No `admin-login.html`, `admin-auth.js`, Article/News, Supabase Auth/DB, MFA, RLS, Live, B8, Ads or Vercel production/source file changed. **This parser never grants edit authority:** Owner/AAL2/server-valid-session verification and version CAS happen separately in existing unchanged protected code. Deep link does not save, publish or mutate anything.

## Founder Decision A security provenance and versioning
Founder explicitly approved **A — Controlled Baseline Update** on 2026-11-02 to keep historical test bytes and all original 10 cases under stricter new security checks (already scoped PASS in Draft PR #107, exact SHA `1a60b7ac9b141e7027ce071ab5e60c0343ca2424`; CI `41390376028` SUCCESS). Preserve historical source **three successive security baselines**:
- **O — frozen original 2026-10-29:** actual historical commit `5d5fa9bd703607f890851b7a6d5aad3e80e3285e`, original original 10-case source Git blob `47452e35d880b3123ff0782f00564d849f5a06ba` archived at `ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs`; run original canonical test at original commit, no overwrites.
- **A1 — Founder approved 2026-11-02 current V3 baseline:** actual reviewed commit `1a60b7ac9b141e7027ce071ab5e60c0343ca2424`, revised canonical ten-case Git blob `474ff764ae65850863b8142318083964086d4e4e`, now additionally archived byte-identical at `ci/phase4/b12/history/v3-c1-public-integration-20261102-founder-a-v1.cjs`. CI must run its canonical 10 + 8 exact-delta + 12 redirect negative cases on its OWN source; old A1 source is untouched.
- **A2 — new correction-route candidate, pending human release review:** same canonical `ci/phase4/b12/v3-c1-public-integration.test.cjs` 10 original named test cases, revised **only one current nav SHA** from A1 to new A2. No removed test names or assertions. New independent negative/route tests check exact A1→A2 nav source delta and blocked malicious inputs. This is not retroactive modification of A1/O evidence. Candidate not merged/deployed.

**Critical scope distinction:** Founder's earlier A authorized controlled baseline, but a future production rollout of the new parser is NOT yet approved by these audit commits. All historic original V3 tests must remain runnable and GREEN on their original source. New current canonical original 10, strict positive and malicious negative, T077/B12 Founder Auth, T080 correction, T083 original public, Phase3 Live source and original disposable PG17 must GREEN on exact A2 HEAD. Any failure => HOLD, not a fake PASS. No plain SHA update alone can override negative tests.

## Expected current backend-only evidence
`T086_AUTH_DEEPLINK_A2_HISTORICAL_O_10=CI_PENDING`.
`T086_AUTH_DEEPLINK_A2_PREVIOUS_A1_10_8_12=CI_PENDING`.
`T086_AUTH_DEEPLINK_A2_CURRENT_CANONICAL_10=CI_PENDING`.
`T086_AUTH_DEEPLINK_A2_STRICT_POSITIVE_NEGATIVE=CI_PENDING`.
`T086_AUTH_DEEPLINK_A2_EXISTING_T077_T080_T083_AUTH_LIVE=CI_PENDING`.
`T086_AUTH_DEEPLINK_A2_DISPOSABLE_PG17=CI_PENDING`.
`T086_PHYSICAL_POST_MFA_ANDROID_ROUTE_E3=NOT_RUN`.
`T086_REAL_ARTICLE_EDIT_CORRECT_UNPUBLISH_REPUBLISH_E4=NOT_RUN`.
`T086_REAL_LIVE_PROVIDER_START_STOP_VIEWER_E5=NOT_RUN`.
**`T086_OFFICIAL_FINAL_PASS_LOCK=HOLD`.**

Founder manual step NOW **NONE**. The original published ISRO story is NOT to be edited or republished for an artificial green result. Once the release is separately reviewed, perform **read-only Android** login return navigation and same UUID display; never log in on an isolated preview that has no Founder Auth.
