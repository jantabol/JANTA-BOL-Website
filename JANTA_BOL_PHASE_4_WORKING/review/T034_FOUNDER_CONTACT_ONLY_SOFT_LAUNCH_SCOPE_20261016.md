# JANTA BOL — P4-T034 / Founder Contact-Only Soft-Launch Scope Decision
**Date:** 16 October 2026 (IST)
**Authority:** Founder decision in conversation.
**Purpose:** Unblock critical Phase-4 work → domain → social-platform accounts/setup → editorial soft launch; do not prolong T034 for first REAL advertiser/bank/payment workflow.

## FOUNDER LOCK — operational priority
1. **Soft launch can receive public "विज्ञापन के लिए संपर्क करें" enquiries** on published news and homepage, with mandatory WhatsApp contact + explicit consent and a PRIVATE Owner review queue.
2. Soft launch is **NEWS FIRST**. Public news reading/editing/correction/publishing remains independent of all advertising and no advertisement is required to access news.
3. **No REAL paid advertisement, financial receipt/UTR, paid campaign, public LIVE creative, unapproved advertiser verification or monetary settlement before first real advertiser onboarding after soft launch.**
4. **REAL payment validation and first-ad activation E6** deliberately deferred to first controlled genuine advertiser onboarding **after** soft launch. Must run complete T038 evidence/Owner AAL2/verification/payment guards/rollback + safe media, label, scheduling and LIVE rendering **BEFORE that first advert actually goes LIVE**. Do not consider the test "passed in advance."
5. Prior real Android public enquiry and Owner review proofs are preserved; don't repeat old PASS evidence without necessity. No rebuild.
6. Preserve full canonical master tests ADS001–060, P4-T034–T042 and `B7_FINAL_ZIP_CLOSURE_MANIFEST.json`. **This Founder prioritization is not a new pass definition**. Canonical T034, T038 and Phase4 Final status remain HOLD/DUE until original evidence requirements are met; any soft-launch decision is separate and explicitly conditional.
7. Founder only can authorize publish/unpublish/edit/correction and actual ad approval/payment/LIVE. No impersonation, unsafe test payment, direct production changes or bypassing AAL2.
8. JANTA BOL and Cricket resources/keys/DBs stay isolated. Free-only testing, no paid branch, no third project retry or project deletion.
9. Before domain go-live: verify exact deployed SHA/target, HTTPS/dns/domain routing, homepage/article master URLs and permissions; original public CTA and no-ads feed still verified; Android smoke tests; error and rollback plan. Domain activation is a **separate explicit release decision** and not authorized by this memo.

## What is already proven with actual evidence

| Domain | Real evidence | Narrow verdict |
| --- | --- | --- |
| Published article CTA → origin/article ID | Founder Android incognito + read-only published UUID catalog, 16 Oct | Real device CTA / URL origin PASS; accepted form not a new payment |
| Consent/phone negative frontend | Founder Android screenshots & unchanged SQL counts, 16 Oct | Narrow negative UI PASS |
| Owner request review queue | Founder Android E7 and durable review ad_history, 16 Oct | Narrow real review PASS |
| Anonymous internal ad table isolation | [CP12 live run #38889066839](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38889066839) | Five live GETs denied 401 / SQLSTATE 42501 |
| Fake Owner JWT | [CP13 live run #38889860985](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38889860985) | Four invalid JWT negatives denied |
| Actual Auth MFA/revoke | [CP11 local run #38887943981](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38887943981) | GENUINE LOCAL GoTrue+TOTP only, not hosted final E5 |
| Protected payment state | Live Supabase SELECT-only 16 Oct | Three guard triggers enabled; 0 payments, 0 LIVE campaigns |
| No advertisements accidentally rendered prelaunch | [CP16 real public GET run #38891943423](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38891943423) | Homepage and article paid feed HTTP 200 **[]** while there are no LIVE campaigns; two GET only |
| Public request contact-only intent | CP16 live source frontend validation | Contact-only wording, explicit consent, mandatory WhatsApp code checked |

## Separate gate: CONTACT-ONLY PRE-LAUNCH CANDIDATE
**Technical scope:** Live source+public REST "empty paid feed" preflight PASS. Prior real Android CTA/request/Owner queue evidence supports a low-risk **CONTACT-ONLY LAUNCH CANDIDATE**; however **domain/prod build verification and deployment/Android last-mile smoke proof still DUE**. Therefore cannot claim entire website SOFT LAUNCHED/READY today.

### Mandatory safeguards at/just before soft launch
- **Strictly zero LIVE paid ads**; no manual payment or "paid" DB mutation.
- Contact request creates *pending* private enquiry, never auto-approval/LIVE. Only Owner can review, with honest verification notes.
- Real published article preserves single permanent news URL, ads cannot alter article authority; homepage/news still work if ad API fails.
- Verify exact canonical production domain ↔ commit/target and real Android page + CTA before first public release; all mandatory editorial/security/regression gates independent.
- Monitor request queues privately, don't present raw contact/phone in public UI or GitHub evidence.
- Any failure of guard/authorization/public isolation/consent, unexpectedly non-empty ad feed, broken Article URL or News publishing independence is **HARD STOP**, not "deferred payment".

### AFTER soft launch and BEFORE first real paid ad (explicit HOLD)
- Actual signed Owner AAL2 authorization, hosted reporter/advertiser/revoked principals (or separately authorized safe staging);
- Genuine advertiser identity/risk verification & durable audit; scoped creative approval with safe media/CTA/clear paid-ad label; schedule & expiry, hide/stop, no in-page ad swaps;
- Real documented UTR/payment/amount/consent/non-refund terms, replay/duplicate/idempotency checks and approved status transition; provider settlement evidence if applicable.
- Full P4-T038 ADS035–040 E2/E5/E6 and impacted B7 tests plus live ad positive E3; approval of first LIVE activation requires Founder explicit sign-off.
- Do not mislabel local synthetic tests, missing hosted E5, or the absence of paid ads as successful genuine payment proof.

## Correct source-of-truth status and order
`P4-T034 CANONICAL = IN PROGRESS / HOLD`. `CONTACT_ONLY_PRELAUNCH_EVIDENCE = PARTIAL PASS / DOMAIN_RELEASE_PENDING`. `P4-T038 REAL_PAYMENT = DEFERRED TO PRE-FIRST-LIVE-AD, NOT PASSED`. `B7_FINAL_ZIP = BLOCKED`. `PHASE4_FINAL_LOCK = HOLD`.

**Operational next work:** Review remaining Phase-4 soft-launch-relevant blockers (T035–T042), not more repeated T034 synthetic payment trials. Implement minimum safe launch-critical work, run affected CI+Android exact deployed version, proceed to official domain and social media setup, then Founder-reviewed soft launch. Complete commercial/ad payment E6 later **before first real advertisement**, not automatically.
