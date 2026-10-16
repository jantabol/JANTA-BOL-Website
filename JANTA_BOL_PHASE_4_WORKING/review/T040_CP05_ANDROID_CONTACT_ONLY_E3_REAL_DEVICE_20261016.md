# JANTA BOL — P4-T040 CP05 / REAL ANDROID CONTACT-ONLY PUBLIC SMOKE
**Date:** 16 October 2026, 21:28–21:31 IST. **Founder screenshots provided in this conversation.**
**Disposition:** Five narrowly scoped **no-paid Android UI/navigation observations PASS**; this is **NOT** paid-ad ADS048/049/050 E3 or end-to-end T040 PASS. **All 3 official T040 ADS tests remain DUE.**

## Exact version and safe source authority
- GitHub repo `jantabol/JANTA-BOL-Website`, DRAFT PR #35, branch `review/t040-cta-privacy-failure-20261016`; CP05 checked HEAD `1f1960c31d2378df31df32d11eeb6be2f430106f`. Vercel PREVIEW `dpl_G4nUWgJfhvhhgQJvCeVLAuzwC97B` is `READY`, points to `bc5623e786f5a9541a9c5f0acfc916a578ea9c18`. GitHub comparison of this deployed commit to HEAD: six changed items confined to CP04 workflow/test/report/register, **no user-facing runtime HTML/JS/SQL change**.
- Preview hostname: `shubham-pichhore-2028-rpmcr96ar-shubhamshrivastava295-9848.vercel.app`. **The repository's site files live under `JANTA_BOL_PHASE_3C_WORKING/`.** Direct preview-root `/article.html` had given Android 404 (earlier user screenshot); corrected **nested** `/JANTA_BOL_PHASE_3C_WORKING/article.html?id=14539159-7091-4697-9e19-2927048a06a5` opened on actual Android. Do **not** describe an unconfigured root alias as the working permanent URL. Root production custom domain was not tested or changed.
- Checked actual source `JANTA_BOL_PHASE_3C_WORKING/article.html` uses a relative `advertise-request.html?origin=article&id=<article_uuid>` contact link after a public published article loads. `JANTA_BOL_PHASE_3C_WORKING/advertise-request.html` uses relative `index.html` back link; it reads article origin/id, has HTML required fields and consent, and sends an RPC **only on a valid deliberate submission**.

## Founder actual Android screenshot observations (NOT simulated desktop or source-only)
| No. | Observed screenshot and outcome | Scope |
|---|---|---|
| 1 | 21:28 IST: published `099 test` article page loaded with expected permanent article UUID, Share/WhatsApp buttons and `विज्ञापन के लिए संपर्क करें`; no 404 | PASS: published Article UI and navigation entry only |
| 2 | 21:28 IST: tap on contact CTA opened `विज्ञापन के लिए संपर्क करें`, visible name, 10-digit WhatsApp, optional note, consent, contact-only privacy notice, button and return link | PASS: contact page navigation/UI only; **NOT a paid creative CTA** |
| 3 | 21:30 IST: tap `अनुरोध भेजें` with all required fields empty / consent unchecked displayed Chrome native `Please fill in this field.` and highlighted name | PASS: native HTML empty-required validation; no receipt observed. **Not a DB zero-write audit** and consent-only validation **NOT TESTED** |
| 4 | 21:31 IST: `← समाचार पर वापस जाएँ` opened JANTA BOL nested homepage with logo/menu/hero; no 404 | PASS: return to **homepage**, NOT return to original Article |
| 5 | Earlier initial wrong root `/article.html` returned 404; verified correct nested path worked | PASS: path discrepancy **diagnosed**, but root permalink production mapping still must be resolved separately before canonical public share launch |

## New independent hosted READ-ONLY reconciliation
Live JANTA BOL Supabase (READ ONLY transaction, no data mutation) still shows: PostgreSQL `TimeZone=UTC`, **15 published articles**, **7 campaigns / 0 LIVE campaigns**, **0 confirmed ad payments**, **0 ad events**, no installed `ad_view_tickets` table or qualified ticket RPC at queried signature. This agrees with prior CP04 hosted E2 preflight; it cannot prove paid-ad delivery.

## Official T040 is STILL blocked, for explicit reasons
- **ADS048 valid paid creative Call/WhatsApp/Website/Map E2 + real Android E3**: DUE. The text `विज्ञापन के लिए संपर्क करें` is an enquiry navigation CTA, not an approved paid ad.
- **ADS049 50%-1s real qualified views/clicks and Owner IST report E2/E3**: DUE; analytics modules are intentionally unlinked and no paid ad exists. No verified person/billable impression claimed.
- **ADS050 privacy, actual hosted failure isolation and rate/bot abuse E2/E3**: DUE; native form invalid UI does not prove server anti-abuse or backend transactional isolation. Earlier E1 simulated outages and real PG17 disposable proofs preserved.
- All 5 reported Android checks are **separate contact-only/no-paid smoke checks**, not 5 official canonical tests. T040 ADS048–050 **0/3 FINAL PASS+LOCK**, PR35 remains DRAFT; no B7 ZIP.
- PREVIOUS CP04 CI and PG17 source audit were already PASS at their limited scope; no need to rerun unchanged source. Full protected hosted Phase3 transactional suite was not run. The old LIVE anonymous raw ad-event RPCs must be gated/revoked in a reviewed, **atomic first-paid release**, never ahead of suitable replacement.

## Release/dependency checkpoint
**No new backend migrations/permissions, user PII, ad event generation, fake payment, real LIVE ad, public tracking modules, Owner sign-in or production deployment were performed for CP05.** Do not modify canonical article URL policy silently: Founder lock is one news item = one permanent master URL and correction on that URL.
Next genuine paid-ad E2 requires **Founder decision** on isolated safe staging OR first approved real customer paired release. Until then news/contact-only can proceed independently with its own editorial/domain/security checks. Manual steps required from Founder **NOW: NONE**.

**NO REBUILD · EXACT SOURCE · REAL SCREENSHOT EVIDENCE · NO FAKE PASS · HOLD FIRST PAID LIVE**
