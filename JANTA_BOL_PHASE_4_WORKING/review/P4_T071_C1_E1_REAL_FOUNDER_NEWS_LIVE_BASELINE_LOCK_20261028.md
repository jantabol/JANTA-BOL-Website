# JANTA BOL — P4-T071 C1/E1 Real Hosted Candidate Baseline Lock

Date: 28 October 2026 (India). Master Phase4 P4-T071 p.304, RECOV-019..026. Frozen C1–C5 route unchanged.

## VERIFIED C1 RESULT: PASS + LOCK FOR ORIGINAL E1 BASELINE ONLY
NOT the entire T071, NOT 13-family C2 E2, NOT whole C4 E5, NOT independent E8, NOT a Production release.

**Candidate identity:** JANTA BOL GitHub review branch codex/t071-c1-android-published-loading-guard-20261027, exact deployed app SHA 659bcdc2ec4e270ea066863b4b456aeb65cb7c73. Existing Vercel preview deployment dpl_Cn5EixeHWyDohwfD6C8kPBf5mhPs READY. GitHub CI proved any later test-only commits leave the exact deployed web app source tree unchanged via git diff against SHA 659b. Preview URL: https://shubham-pichhore-2028-mpymb4woq-shubhamshrivastava295-9848.vercel.app

**Actual Founder publish:** ISRO SpaDeX source-backed real article permanent ID f17f6507-02a3-4881-ad37-0b02cadf3d3f, Founder Android Published screen, real Draft -> Published, v12->v13. Two Founder corrections v14 (unverified News Time removed) and v15 (duplicate opening headline removed). Supabase read-only verified status Published, same ID, time NULL, body 2896 characters starting with actual Hindi news lead, original published_at retained; 31 earlier demo drafts remain unpublished and not deleted. article_versions audit includes previous v14. Existing backend-client.js publish() calls requireOwner(), which checks authenticated role Owner and Supabase MFA assurance AAL2; original database UPDATE RLS independently protects owner publishing. Real Founder successfully passed the controlled flow; tokens never extracted.

**Actual Android Incognito guest:** Founder sent full screenshots showing corrected article body, no ADMIN PREVIEW banner, top/bottom Share, correct permanent ID. This is actual no-login reader evidence, NOT mere HTML 200.

**NEW remote read-only real E1 GitHub Actions:** run 40635754482, job 122642204443 SUCCESS, 7/7 PASS, 0 FAIL; test file ci/phase4/b11/t071-c1-real-hosted-anon-news-live-e1-readonly.test.mjs (review PR48). No mock servers, no privileged auth, no mutations. Checked (1) app source/config pin; (2) five exact deployed Vercel page/script HTTP 200; (3) actual anonymous external HTTPS Supabase RPC returns published 2896-character corrected full article; (4) same RPC refuses historical unpublished Cooler demo; (5) legacy public PostgREST published-only column grant, old draft absent, creator/updated-by private UUID columns denied; (6) public live feed LIVE/INTERRUPTED count zero; (7) private live_sessions read denied to anonymous users.

**LIVE OFF baseline:** independent Supabase READ-ONLY aggregate confirmed 7 public_live_feed OFF and 16 live_sessions OFF. Real anonymous external HTTP public LIVE query returned [] for LIVE/INTERRUPTED. Exact public website-v3.js inserts visible LIVE feed only if active filtered rows exist. This is an actual truthful OFF baseline, not a Larix stream success claim.

**Original regressions:** GitHub 40633161166, job 122633982160 SUCCESS: 9/9 Android loading + never auto-fabricate event time and 32/32 original News/B9 Search/LIVE/public guest security source checks; old Owner publishing simulation PASS, separately supported by genuine Founder runtime action.

**Important honest ACL clarification:** Initial real HTTP exploratory tests 40635311824, 40635382494 and 40635497855 failed because a test incorrectly assumed ALL direct public Articles REST reads must be blocked. PostgreSQL column-level grants and pre-existing published-only anon RLS intentionally permit public id/title/body while private created_by/updated_by grants are denied; old Draft rows remain blocked. Supabase read-only has_column_privilege and 7/7 corrected test confirmed this. No privileges were changed, no false blanket-denial claim.

**C1 E1 accepted proofs:** exact same-source candidate PASS, real protected Founder publish/corrections PASS, real guest full Article read PASS, truthful LIVE/OFF state PASS, old Phase3/News/LIVE CI PASS. Release Main and Vercel Production independently remain f447231c0677644ca5a44cc19f12cf0314ff38ea. The review PR is not merged. Custom domain JANTABOL.in remains separate DUE.

**Remaining route:** C2 actual same-candidate 13-family isolated integrated failure E2 HOLD (13/13 local source/HTTP+PG17 evidence preserved); C3 original 4 rules/recovery reviewed and provisional Founder policy approved, integrated claims HOLD; C4 original 13 E5 logs and exact source baseline verified, full integrated faults HOLD; C5 independent E8 and final Founder T071 authority HOLD. T071 FINAL PASS+LOCK=false; T072 NOT STARTED. Do not fabricate hosted provider outages or Production recovery SLAs.

Real read-only CI: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40635754482
Selected original CI: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40633161166
