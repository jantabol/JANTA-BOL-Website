# JANTA BOL — B10 / P4-T065 RUN-09 — Vercel Preview + Direct IDOR / Tampering
**23 OCT 2026 |  E1 + E2 required | Class AUTO / ATTACK NEGATIVE | Official FINAL HOLD**
User explicitly said keep T064 **DUE** and start the first Vercel-relevant next test to establish whether Vercel can operate vs quota issue. This is T065, immediately after T064.
## Real Vercel deployment connectivity (not a synthetic test)
- JANTA BOL only, Vercel project `shubham-pichhore-2028`, team `team_8axPWNjZuUp3vmEwLOxiKVhn`.
- Source B10 candidate branch `codex/b10-whole-platform-security-candidate-20261023`; prior actual Vercel build SHA `58394127f4841f6abae4d1ae6aa8e489d507e44c`; Vercel deployment `dpl_CAgXNU5FUYtmeCFwtQDjsRLxGykd`, **READY**, source=git, target=Preview. Vercel provided `buildingAt`, `ready` and `readyState=READY`; no quota or build exception was presented. Access to deployment metadata and list is successful.
- Founder personally inspected this same preview in Chrome; Vercel Build Logs 12 lines: `vercel build`, `Build Completed`, `Deployment completed`, no visible secret. Direct connector `list_deployment_events` returns **403 forbidden** under team's scope; `web_fetch_vercel_url` also returns **403** team/access bypass issue. These are separate permissions, **NOT quota exhaustion proof**.
- No Vercel production deployment or Rollback attempted.
## E1 synthetic real PG17
- Protected `ci/phase4/b10-whole-platform-security-pg17.sql` exercises three hidden UUID IDOR negatives, public positive read, Owner AAL2/low-role regressions; `ci/phase4/b9-pg17-regression.sql` includes `B9_DRAFT_UUID_ENUMERABLE`, `B9_PRIVATE_LEAK`, `B9_RPC_GRANTS_WRONG`.
- B10 protected original CI `39985225456` SUCCESS with B10 PG17 authority negative job and old B0–B8 Phase3/G0/G1. E1 **PASS**.
## Actual live JANTA BOL SQL low-role API/record tamper tests — E2 PARTIAL
ONLY project `vrffsnkycvjithwtiylt`. All transactions `BEGIN READ ONLY; ... ROLLBACK`; `SET LOCAL ROLE anon` or `authenticated`, no private record contents/IDs or genuine secret tokens exported.
**Positive control:** real published story ID: 1 valid anonymous public `jb_b9_search(p_id)` result.
**Real negative:** chose existing unpublished/private Article ID internally (16 hidden present). `jb_b9_search(p_id)` 0; random guessed UUID 0; unpublished metrics NULL; unpublished public-author NULL; unpublished related-news items 0; raw hidden Article SELECT 0; direct private source/Article Versions/Audit access ACL denied; anon Owner analytics RPC EXECUTE denied.
**Forged Owner:** JWT `role=authenticated,aal=aal2` + current-looking `totp AMR` but fake/nonexistent backend `session_id`: `private.current_session_active` false, `private.current_owner_aal2` false, protected Owner analytics RPC rejected; Article Versions invisible.
**Cross-module negative:** anonymous advertiser token invented/non-real: 0 campaigns. Unknown B8 public grievance-case UUID: null/empty response. All read-only.
**No actual authenticated multiple different user tokens** were used: cross-Account realistic reporter/editor/advertiser isolation E2 remains DUE. No HTTP bearer-token request through Vercel preview was possible with present connector team access (403), so never mark full E2 complete.
## Safeguards and next gate
- T064 remains **DUE** due to real Preview→Production shared JANTA BOL Supabase endpoint; source/Log/RLS checks PASS, but no standalone staging environment. Build Logs screenshot is sufficient for scoped visible build-log proof despite the API 403.
- T065 official **IN PROGRESS / FINAL HOLD**, no T066 started. No production mutations, no use of Cricket/Session Saarthi infrastructure. Two old JANTA BOL CI/source locks unchanged. Final B0–B10 ZIP only after full block.
