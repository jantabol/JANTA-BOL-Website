# JANTA BOL — B11/T075 E3 — ZERO PAID PRODUCT POLICY / Founder conditional approval
**2026-10-28 IST.** Founder instruction: **weekly automatic encrypted backups only if no paid system, paid upgrade, bill, or subscription.** Existing Zero-Cost Lock takes priority over activation time.

## Verified external price and risk facts (28 Oct 2026)
1. GitHub Actions: **standard hosted runners on this PUBLIC repository** are advertised free under GitHub billing docs; no paid or larger runners requested.
2. Backblaze B2: published pricing says **first 10 GB of stored data is free**, but additional usage or certain operations can incur pay-as-you-go charges; its account-wide free usage may include other unrelated objects not shown by `rclone size` of JANTA BOL encrypted private prefix. Even **2 GiB prefix cap does not guarantee zero spend**. Official B2 docs advise setting data caps; without caps account usage may be unlimited. Some transaction categories are not fully subject to data caps.
3. Supabase project remains existing free-plan JANTA BOL and **no new paid plan** was activated; paid-plan changes not authorized.
4. Existing Vercel Production may auto-build upon Git Main changes. No new Production/paid deployment is authorized solely by coding approval.

## New implemented security gate — real CI verified
The proposed weekly GitHub workflow was strengthened to require BOTH independent default-off repository variables, plus the existing protected GitHub Environment:
- `JB_T075_SCHEDULED_BACKUP_ENABLED=YES_FOUNDER_RELEASED`
- `JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED=YES_FOUNDER_VERIFIED_ZERO`
- Existing environment `janta-bol-production-backup`, schedule on Main, exact repository/workflow identity, one attempt, secure JANTA BOL-only B2/DB permissions.
These variables must **NOT** be set based on assumptions or solely on a user message. The second requires actual Founder inspection of B2 Billing and Caps & Alerts, confirmation of no paid plan or chargeable transactions/overages and observation of existing account-wide storage usage. It is an approval signal, not automated proof, so first actual run still needs B2 readback, original PG17 offline restore, and no-bill verification.

Previously implemented additional bounded safety: no automatic deletion/TTL reduction; remote encrypted backup prefix <=2 GiB **including new archive**, <=512 MiB new ciphertext, <=1500 object count. The weekly no-paid claim remains scoped to these constraints, not account-wide proof.

**GitHub CI Run 40655707811 / job 122706105666 SUCCESS: 53/53 source, security and 8 Python-backed budget boundary regressions pass, no B2 or Supabase Production secret used.**

## Current permitted release scope
- APPROVED to **prepare, statically test and preserve** the FREE-only candidate and existing read-only Backup Watch.
- NOT automatically approved to incur money, expose B2/Supabase keys, trigger a Git Main → Vercel Production rebuild, or activate a live schedule before protected controls and actual B2 account-wide Caps/Billing state have been verified. No paid upsell or subscription may be accepted in this task.
- The manual Android-only proof needed is only B2 Console `Billing` plus `B2 Cloud Storage > Caps & Alerts`. **Never share secret keys**, and **do not enter credit card data**. The Finder/Founder can provide only safe screenshots showing billing/cap settings, or explicitly state a provider verified $0 threshold/no payment method.

## Honest status
**T075 E3 coding & free-only protections PASS_SCOPED 53/53.** Existing ChatGPT daily read-only Health Watch is active, not a real automated encrypted backup.
**T075 E3 live encrypted scheduled backup: HOLD** pending actual verified B2 zero-spend account safeguards and protected GitHub release; **T072** live case retry P2 still OPEN; **T075 E8 whole Auth/Edge/Vercel restore: HOLD**. No false final lock.

References:
- Official GitHub public Actions pricing: https://docs.github.com/en/actions/concepts/billing-and-usage
- Official Backblaze B2 Pricing: https://help.backblaze.com/hc/en-us/articles/217667478-Understanding-B2-Pricing-Structure
- Official B2 Caps: https://www.backblaze.com/docs/cloud-storage-create-and-manage-caps-and-alerts
