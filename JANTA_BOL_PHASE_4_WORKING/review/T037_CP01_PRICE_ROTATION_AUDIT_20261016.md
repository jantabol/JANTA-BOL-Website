# P4-T037 CP01 — 16 October 2026 — Release Evidence

**Master authority:** Founder B7 Final Master Blueprint PDF pp.27–28. Canonical ADS-024..034 = 11 tests; required genuine E2+E3+E5 / RUN-06. 11/11 official outcomes remain **DUE**. This checkpoint proves only review-source/isolated PostgreSQL, not real hosted Owner or Android paid advertising.

**Exact sources:** branched from prior T036 review `b08705039a5e03ee7c3dab1a5deae18d7b69971a`. Original B7 canonical `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8` not modified. No production SQL, LIVE ads, payment, account, DNS, media or Cricket actions.

## REAL Production READ-ONLY audit
- Supabase JANTA BOL: packages **0**, package_versions **0**, campaigns **7**, LIVE **0**, payments **0**, history **29**.
- Real Owner package RPC checks Owner but currently permits zero paise and weight>100. Live `ad_packages_price_minor_check` allows >=0. No immutable version trigger seen. Inventory reserve tables and reviewed Article-UUID weighted private candidate are not deployed. Current `jb_ad_public_feed(text,text)` is legacy; official Article LGD pairing DUE.
- Admin UI supports paise/duration/placement/weight but no dedicated package geo field; geo terms handled by a distinct reviewed candidate. Public enquiry does not require choosing package/price.

## Exact RCA / minimum safe changes (REVIEW ONLY)
- Initial reproducible [RED #38906881585](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38906881585): ADS024 client accepted zero price contrary to PDF. Separate [RED #38907653300](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38907653300): owner save accepted weight101 though reader rejected it.
- Candidate `phase4-domain-client.js` now rejects paise<=0 and weight>100; `ads.html` form price min1/weight max100. Legacy positive client tests preserved.
- New **NOT DEPLOYED** `20261016_b7_t037_positive_price_version_REVIEW_ONLY.sql` adds DB price>0, weight1..100 and historical version append-only guard, with fail-on-legacy-invalid preflight. Real package/old purchase proof still DUE.

## Verified GREEN
[**5/5 GitHub Actions #38907786144 SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38907786144) on source commit `d8646ec2eb9588393088047e553d137fa58bdcab`:
1. Owner/public source checks and protected 13/13 B7 intake and 76/76 client tests PASS; 9 canonical/60 ADS closure audit correctly BLOCKED.
2. Disposable PG17 weighted 1:2:3: **3200 selections = 528/1029/1643**, tolerance PASS; forged geo, unpublished, unsafe media and ineligible creative blocked.
3. Disposable PG17 inventory: booked **600+400=1000**, 1100 and extra client denied; existing purchased terms immutable in synthetic fixtures.
4. Disposable PG17 single-Article-ID feed and homepage cases PASS without extra paid ad.
5. Disposable PG17 package price/version: 0 and weight101 denied, newer price does not alter historic version, old version update/delete denied; ROLLBACK.
All SQL data and paid receipts are **synthetic in disposable PG17**, NOT hosted E2/E3/E5.

## Official remaining acceptance by number
- ADS024: real Owner price/geo/duration and zero negatives E2/E5 DUE.
- ADS025: genuine public optional package plus compact no-package request E2/E3 DUE.
- ADS026: immutable Owner custom multi-district quote E2/E5 DUE.
- ADS027: actual old paid agreement unchanged after edit E2/E5 DUE.
- ADS028: official Government LGD ancestor matching and anti-cross-district E2 DUE.
- ADS029: real pinned paid ad 20-min scroll/play/reopen E2/E3 DUE.
- ADS030: real hosted selection 1:2:3 and capacity fairness E2 DUE.
- ADS031: real one paid ad in long/short published Article E2/E3 DUE.
- ADS032: real concurrent booked capacity/forecast E2 DUE.
- ADS033: genuine paid old guarantee cannot dilute E2/E5 DUE.
- ADS034: eligible-only rotation, real counters and audit E2/E5 DUE.

**CP01 limited engineering PASS; canonical T037 FINAL PASS+LOCK HOLD; paid ad LIVE forbidden until all genuine gates. Contact-only NEWS soft launch remains a separate editorial/domain release. No user manual step currently.**
