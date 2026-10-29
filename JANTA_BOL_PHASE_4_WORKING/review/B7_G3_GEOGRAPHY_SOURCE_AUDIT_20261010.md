# JANTA BOL — B7-G3 / VERIFIED GEOGRAPHY — SOURCE AUDIT (NOT IMPLEMENTED)
Date: 2026-10-10
Status: **INVESTIGATION / DO NOT DEPLOY / DO NOT CLAIM ADS-014, ADS-028 PASS**

## Founder-approved contract
The opened **published news article** determines target geography, **never visitor GPS/home/profile/query-string**. If Article = Shivpuri district only, never infer Pichhore tehsil; if Article = Gwalior, Pichhore-only ads denied. MP-state and National eligibility require explicit campaign grants. Homepage primarily MP/National. Multiple districts/tehsils require explicitly purchased reviewed set, never implicit all MP. Exactly one paid Article slot, pinned.

## Source provenance checked (10 October 2026)
- Government of Madhya Pradesh district portal: https://mpdistricts.nic.in/ enumerates MP districts.
- Government integrated directory (IGOD): https://igod.gov.in/index.php/sg/MP/E042/organizations lists **55 MP districts** and links district sub-districts.
- MPOnline public portal https://www.mponline.gov.in/portal/index.aspx reports 55 districts and 428 tehsils (as displayed in its 2026 site snapshot). Counts alone do not prove correct per-district tehsil parent relationships.
- Government of India Ministry of Panchayati Raj LGD: https://lgdirectory.gov.in/demo/downloadDirectory.do supports official code-based districts and sub-districts by state; the directory export may require interactive/captcha access.
- LGD official background https://panchayat.gov.in/en/lgd/ describes unique location codes and changes. Preferred stable imported ID: **LGD district/sub-district code**, not hardcoded names alone.
- OGD district catalog https://data.gov.in/resource/local-government-directory-lgd-districts updated October 2026. Use a verifiable versioned export and checksum before ingestion, not a scraped name list.

## Real LIVE Supabase read-only facts
Read-only inventory (2026-10-10): no existing public/private geography/district/tehsil reference tables or matching geo RPC; `public.articles` has `geography_level`, `district`, `location` but **no trusted structured tehsil code**. Published records currently include 7 null geo+district, 4 `Local-Pichhore` with blank district, 4 `Local-Pichhore` with `Shivpuri`. Existing ad campaigns use a single free-text scope; approved multi-district/tehsil grants are not modeled.
This is not an instruction to rewrite existing published articles or forge their location; unavailable metadata must fail closed on local-targeted ads.

## Implementation gates (all OPEN)
1. Fetch **authoritative current full LGD state=MP district + sub-district exports** with codes, names, parent district mapping, source URL and downloaded checksum. Reconcile counts/version/renames to IGOD, record explicit pending/unverified parent links; do NOT fake 428 entries based on count.
2. Prepare read-only catalog tables with versioned provenance + fail-closed verification status (no guesses) and separate campaign area grants; preserve legacy `ad_campaigns.scope` compatibility; don't add parallel Article authority. Directory updates need rollback and explicit impact audit.
3. Build *one* server-owned sanitized ad selection RPC deriving published Article geo by `article_id` server-side, no caller-supplied asserted district/tehsil or GPS; test Gwalior vs Pichhore, Shivpuri district-only vs tehsil-only, MP/National/unknown and multi-area negatives. Old public feed must not be loosened.
4. Confirm official tehsil catalog + no local leakage + all 55 districts, Android E3, protected Phase3/4 CI GREEN on exact deployment SHA. **No PASS before this.**

## DO NOT DO
- Do not infer Tehsil from free-text location, newsroom category, visitor's home or browser geolocation.
- Do not use current three-district mapping as if all 55 have been deployed.
- Do not apply migrations to LIVE Supabase or fabricate district LGD IDs/sub-district parent relationships.
- Do not rewrite test checker or mark G3 PASS based on research-only notes.
