# JANTA BOL — P4-T035 LIVE advertisement E3 deferred register
Date: 2026-10-09
Authority: Founder instruction to defer **only tests requiring an actual LIVE paid advertisement**.
Status: **DUE / NOT PASS**. This is not permission to relax payment, high-risk verification, editorial approval, or production security controls.

## Deferred (LIVE data prerequisite)
- E3-LIVE-01: Real paid, approved, in-window homepage advertisement appears through anonymous HTTP and Android browser.
- E3-LIVE-02: Real eligible district-scoped article advertisement renders in its matching article and is absent from unrelated scopes.
- E3-LIVE-03: Real creative media/CTA behavior, accessibility, image/video failure fallback, and user-facing label on Android.
- E3-LIVE-04: Real production payment/verification transitions cause immediate eligible/ineligible public visibility changes, without leaking private data.
- E3-LIVE-05: Real production end/paused/unpublished campaign disappears from all public slots and legacy route.
- E3-LIVE-06: Same-build Android E3 screenshots/video, timestamps, campaign identifiers redacted where appropriate, and final Owner signoff.

## Must still be completed now (NOT deferred)
1. Read-only anonymous HTTP contract, invalid-placement and privacy-negative probes.
2. Candidate SQL approval gate, protected Phase-3/4 database security regression, and migration rollback rehearsal.
3. Browser controlled-fixture negative/positive rendering with no production ad data.
4. Production release/merge authorization and migration evidence, subject to independent security review.
5. No production mutation merely to manufacture a LIVE advertisement.

## Existing evidence
- Candidate commit d2b5822cb4514e542a95f177362ac8e9d1d37c2f.
- GitHub Actions run 37920848030: anonymous HTTP 7 checks, isolated PostgreSQL and static jobs successful.
- Live production read-only snapshot: 5 campaigns, 0 LIVE (2026-10-09).

## Closure
Do not mark P4-T035 full PASS/LOCK while deferred E3-LIVE checks remain. Record each future proof and its exact build/commit; never infer positive delivery from a zero-row response.
