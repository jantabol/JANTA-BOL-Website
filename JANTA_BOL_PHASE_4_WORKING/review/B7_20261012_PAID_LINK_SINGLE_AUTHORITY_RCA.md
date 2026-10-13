# JANTA BOL — B7 paid Article/Homepage link safety: independent RCA

**Scope:** ADS-015, ADS-034, ADS-048, P4-T035/T037/T040/T041, staging source only.


## B7 private Article+Homepage paid URL authority — safe-host E2 checkpoint
- **Status:** source/STAGING REVIEW ONLY; P4-T035/T037/T040/T041 IN PROGRESS, final B7 **0/9 PASS+LOCK**; ADS-001..060 evidence incomplete; `B7_ADVERTISEMENT.zip` **BLOCKED**.
- **Real first divergence:** the legacy-approved-creative branch in `private.b7_eligible_article_creatives` and the separate Homepage query permitted HTTPS loopback / intranet media and CTA hosts (`127.0.0.1`, `*.local`, `*.internal`), even though the newer Owner draft path and browser safe() reject them. A manipulated or older approved record must not reach either public backend projection. This is **STAGED-CANDIDATE source weakness**, NOT evidence of an actual LIVE incident.
- **Minimum safe candidate code:** in `db/20261010_b7_weighted_private_REVIEW_ONLY.sql`, define ONE immutable, invoker-rights `private.b7_safe_public_ad_https(text)` (never anon-callable). `private.b7_eligible_article_creatives` reuses it for Article media and web/map CTA; `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql` reuses the same exact helper for Homepage media and web/map CTA. Reject private/loopback names, abbreviated `127.1`, numeric/hex/octal IPv4 forms, fake userinfo, invalid paths and backslash. One existing `jb_ad_public_feed(text,text)` and immutable Article URL remain.
- **Real isolated evidence on code HEAD `774fdd6aaafb7b47dca7916b2fb0815cf89fa307`:** Candidate GitHub CI **38111683892 SUCCESS 16/16 jobs**; Protected Phase3A+3B **38111683896 SUCCESS 2/2 jobs**. `ci/phase4/b7-weighted-regression.sql` tests direct URL guard and legacy approved latest creative rejection; `ci/phase4/b7-single-feed-regression.sql` tests Homepage negative media/CTA and positive text fallback. Source guard also receives conditional Phase3 T123 coverage, plus existing `b7_article_ad_geo_insert_guard` required when B7 geo schema exists.
- **Historical failed fixture RCA:** Candidate **38111575320** RED only in new Homepage synthetic DO block: PL/pgSQL variable `id` shadowed `INSERT RETURNING id`; it did not prove a Production bug. Minimum-safe repair renamed the variable `v_creative_id` and qualified RETURNING. CI `38111683892` re-ran successful 16/16, no prior assertions skipped/weakened. The original failed receipt is preserved, not marked PASS.
- **LIVE read-only baseline:** 5 campaigns, 0 LIVE, 11 creative records, 1 approved; B7 candidate helper/view-ticket functions not deployed; `storage.objects.b5_private_gateway_only` is correctly **RESTRICTIVE**. No Supabase Production DDL/DML, no B5 policy drop, no PR merge.
- **Release hold:** HTTPS DNS preflight is not content decoding, anti-redirect, verified human view, safe image/video derivative, EXIF/GPS removal, H.264/AAC inspection, official MP 55 LGD codes/parent tehsils or real Owner Android evidence. Initial MP 55 district count is independently supported by Government of India IGOD directory; current OGD districts resource says updated 08 Oct 2026, but NO official district/subdistrict CSV plus SHA-256 or Founder-approved import is held here. **Do not import synthetic fixture codes**. No production/staging activation, E3/E5/real paid impression proof, E7 deployed source parity or Founder signoff.


## Official-source geography evidence (not import permission)
- Government of India IGOD Madhya Pradesh districts index lists 55 districts: https://igod.gov.in/index.php/sg/MP/E042/organizations
- Ministry of Panchayati Raj LGD is government-operated directory: https://panchayat.gov.in/en/lgd/
- Data.gov.in LGD Districts resource was updated 08 Oct 2026: https://data.gov.in/resource/local-government-directory-lgd-districts
- Actual authoritative rows, version, file digest and subdistrict parent links still NOT acquired/verified; no fabricated LGD codes or Production import.

**NO EVIDENCE = NO PASS; NO PASS = NO LOCK.**
