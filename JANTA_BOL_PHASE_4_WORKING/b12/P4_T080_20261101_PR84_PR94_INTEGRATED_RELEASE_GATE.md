# JANTA BOL — T080 exact-current-source integration release gate
**Date:** 1 November 2026. **Review-only branch** `codex/b12-t080-integration-candidate-20261101`. **Status:** `INTEGRATION_CODE_AND_SELECTED_CI=PASS_SCOPED`; `LIVE_PRODUCTION_RELEASE=NOT_DONE`; `T080_REAL_FOUNDER_ANDROID_E3_E5=NOT_RUN`; `B12_FINAL_LOCK=HOLD`.

## Source identities
- Currently served real Production Vercel deployment is **`dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF` READY**, Git SHA **`93df12aa8ffdfae38d9a4066b6a4556bb36969e5`**, aliases include `jantabol.in` and `www.jantabol.in`. Independently rechecked by Vercel after integration. **NO PRODUCTION CHANGE**.
- Baseline current-source **Draft PR #94** HEAD `4678fc504971fc6b9eee0c1ee810c5a2ba2296ba` previously passed reconciled **120/120 original selected B8–B12 cases**. Includes unshipped safe homepage non-receipt + 12s Published Android no-spin protection. These updates are deliberately included in one candidate, not silently assumed live.
- **Draft PR #84** HEAD **`2becde178080c493e59cfb99743ee043532aabf9`** with **2 unchanged exact application file blobs** `backend-client.js` `fb2c60d241ef772d4990536b577acc3c7d70fad7` and `add-news.html` `813d00fbf96b31214cce1f4147d14615c3de4be1`; original **2 exact new testing files** copied unchanged. Updated original lost Publish ACK fix preserves the create-intent shadow until final confirmed ACK.
- Strict new integrated CI verifies that **all four PR84 files are byte-identical** to reviewed latest source while Founder `admin-auth.js`, Owner login, current C1 public Article, public Ads, V3 published-only feed, Publisher route and Vercel configuration match PR94 base SHA **exactly**. **No DB/Media/Auth/Edge/MFA/keys/backup files changed.**

## Real CI (independently read action/job logs)
**GitHub Actions `41282605465` COMPLETED SUCCESS**, exact review head on branch initially `80e478436f01aaba1b7b3cf3a6843dd68e4c9aa8`, job **`124777410527` SUCCESS**, all steps green:
- PR84 actual backend-client source-VM with lost publish ACK + private original shadow recovery **10/10 PASS**.
- Android reload/two-tab source regression **3/3 PASS**.
- Original T080 Admin ACK-failclosed UI **8/8 PASS**.
- Founder role+AAL2 client source guard **12/12 PASS**.
- Original publishing fault-injection isolated fake target PASS.
- **All previously reconciled 120/120 selected B8–B12 old and current source regressions PASS**, **zero failures**, none skipped to force a green.
- Homepage safety current C1 anti-fake test **8/8 PASS**, original Published Android watchdog **5/5 PASS**, original B9 UI **11/11 PASS**, B10 whole-platform source **9/9 PASS**.
- Strict changes-only gate `T080_PLUS_T083_EXACT_SOURCE_PROVENANCE=PASS` and `FOUNDER_ARTICLE_ADS_MEDIA_DB_ROUTE_INTEGRATION_DIFF=NONE`.

**This is a scoped source/VM + GitHub CI release candidate, not real Android field testing, end-to-end production E8 restore, all original protected workflows or a signed full Phase4 package.**

## Actual remaining decision gates
1. **Vercel**: no READY preview for the exact integration HEAD found in connected deployment listing. Existing PR84 Vercel preview was intentionally isolated and Founder Login forbidden, so it cannot supply real current-Owner Android E3/E5. Do not use `--prod` or promote old isolated preview.
2. **Git branch identity**: Protected Main `f447231c...` is not the real current Production SHA, and a blind Main merge/deploy would risk old work. Keep #96 Draft until protected release source/target and restore route are reviewed.
3. **T080**: needs approved controlled release and real Android Founder private nonpublished Draft interrupted-network/reload/two-tab acceptance and write audit. Do not touch original ISRO public Article or publish fake QA news.
4. **T081**: current same-point DB+5 Storage original bytes+GoTrue MFA+Edge+Vercel full isolated restore and actual traffic rollback not proven; ₹0 cap must be verified before triggering old B2 or branch.
5. **T082**: real Founder current Correction→Unpublish→Republish E4 needs a legitimate editorial event, not forced fact-edit or dummy publishing.

**Decision today:** `INTEGRATED_SOURCE_READY_FOR_FURTHER_RELEASE_REVIEW=YES`; `SAFE_PRODUCTION_PROMOTION_APPROVAL=HOLD`; `B12_FINAL_PASS_LOCK=HOLD`. Do not pretend these are equivalent. No additional user manual action was needed for this scoped code review.
