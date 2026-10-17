# B7-G3 independent security first-divergence — Article INSERT geo forgery

**Date:** 12 October 2026 · **PR #5:** OPEN/DRAFT · **Status:** REVIEW-ONLY, NOT LIVE.

## Authority and exact first divergence

`db/20261010_b7_geo_targeting_REVIEW_ONLY.sql` introduced
`ad_geo_*` columns onto canonical `public.articles` and a
`BEFORE UPDATE OF ad_geo_*` Owner/AAL2 trigger. **It did not protect
`INSERT`**. Before staged deployment, this represents an exploitable
design gap in the candidate migration: a lower-privilege Article creator
or direct privileged insertion route could attempt to insert Article
ad-geography verification fields in the initial row. A later Founder
Publish does not by itself prove those initial source codes were reviewed.
This is a candidate first-divergence analysis, **NOT a confirmed LIVE breach**:
the B7 private geo functions were absent from the read-only Production
catalog inspection.

## Minimum-safe correction

1. Reuse the **existing** `private.b7_article_ad_geo_owner_guard()`.
2. Add a second `BEFORE INSERT` trigger on **the same Article SOT**.
3. A normal Article INSERT with all `ad_geo_*` fields NULL succeeds as
   before, whether reporter/Owner; any attempted pre-populated ad-geo
   verification field is rejected **even for Owner**.
4. The only intended source of verified geography remains the existing
   `public.jb_ad_set_article_geo_internal` Owner/AAL2 API **after**
   a published Article has been checked against a verified official LGD
   district/tehsil directory and source evidence. No new geo tables,
   public authority or independent URL system were added.
5. Added isolated PostgreSQL regression to `b7-geo-regression.sql`:
   fake initial published geo insert denied with no side effect,
   ordinary draft creation permitted, Owner direct insert shortcut denied,
   prior positive/negative geo matrices and all protected suites retained.

## Release evidence and remaining gates

This fix exists on a **staged SQL migration**, not Production. Exact-HEAD
Candidate/PostgreSQL and Protected Phase3 regression results must be
checked after the final commit. Existing historical GREEN on the parent SHA
cannot certify these new triggers. None of the 9 canonical B7 tests is
declared final PASS or LOCK.

The Government of India LGD Ministry directory and Open Government Data
LGD Districts / Sub-Districts must supply a dated authoritative export,
verified MP district count, parent tehsil mapping, source checksum and
Founder-reviewed import. Current test codes 101..104 / 201..203 are
**synthetic only**. Never present them as official.

Official public source references:
- https://panchayat.gov.in/en/lgd/
- https://data.gov.in/catalog/local-government-directory-lgd
- https://lgdirectory.gov.in/demo/downloadDirectory.do

No B5 Storage policy was changed. Keep the independent restrictive-policy
correction and protect previous B3, B5, Article URLs and permissions.

**0/9 FINAL PASS+LOCK · B7_ADVERTISEMENT.zip BLOCKED · NO B8.**

## Additional server-selection defense: stale newsroom district

The same staged geo migration was audited for **post-review editorial drift**.
The ad geo Owner UPDATE trigger watches `ad_geo_*`, not the existing
`articles.district` label. A later edit of ordinary newsroom district
could contradict a previously verified LGD code while the private
ad selector continued to match the old verified code. This could
misdirect district/tehsil paid ads if allowed into a paired LIVE release.

**Minimum-safe fix:** `private.b7_geo_matches_article(uuid,uuid)` now
fails closed for district/tehsil geography when the existing nonblank
newsroom district disagrees with the verified LGD district name.
An existing NULL newsroom label remains eligible when the Owner's
LGD verification provides independent proof. No Article record,
Article URL or geo audit log is deleted or rewritten.

**E2 negative fixture:** initial Shivpuri campaign is eligible for a
verified Pichhore Article; after a synthetic newsroom district change
to Gwalior it is **not** eligible; reverting the edit to Shivpuri
restores the original match. All fixture updates roll back.

**Neither the INSERT route nor this drift behavior is claimed to be
an actual LIVE incident.** Both are prospective staged safeguards
until tested and approved for deployment.
