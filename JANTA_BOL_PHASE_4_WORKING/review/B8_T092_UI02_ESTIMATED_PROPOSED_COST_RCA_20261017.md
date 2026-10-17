# B8 T092-UI-02 — Estimate ≠ Sanctioned/Actual (17 Oct 2026)

**Evidence:** Actual Founder Android SPCK dropdown screenshot showed only `Sanctioned`, `Tender`, `Revised Cost`, `Reported Actual` under Cost. Official MPPCB-hosted historical highway consultant executive summary lists an **estimated** construction cost of Rs 2,386.46 crore (historical forecast, NOT sanctioned, NOT tender awarded, NOT incurred). Current source has no matching classification. **First divergence** between evidence category and ledger schema.

**Root cause across source-to-server**: HTML `g5Field` missing proposed estimate; `b8-accountability-client.js` denied unrecognized cost field; G5 REVIEW_ONLY SQL had a CHECK restricting Cost to four categories. UI-only edit would FAIL at client/server; **no deceptive UI-only patch**.

**Scoped fix (only B8 files):**
- HTML includes explicit disabled selected classification placeholder and a new `Estimated / Proposed Cost (NOT sanctioned or spent)` option. `required` prevents submitting without deliberate classification.
- Client accepts `ESTIMATED_PROPOSED` for `COST` only; existing Owner-role, strict decimal, date, AAL2 and append-only guards remain.
- G5 review-only SQL CHECK includes `ESTIMATED_PROPOSED`. **No LIVE migration/deploy**.
- Actual isolated PostgreSQL17 G5 regression inserts separate Rs 23,864,600,000 estimated proposed example, retains separate sanctioned/tender/revised/actual entries, checks 17 events, 5 Cost entries, immutable/not independently verified, and preserves original News/Ads.
- Android module test validates explicit selection, exact INR transport, no estimate→actual promotion.

**State / limits:** Source+isolated regression can pass while founder's original SPCK import is still old: UI HTML must eventually be updated on device, but **do not ask for ZIP or production SQL yet**. The reference value is a historical **consultant estimate**, not proof of present spending, sanctioned budget or completion; it is not a real B8 E9 verified official result.
**T092 remains IN PROGRESS** until authorised Backend deployment + real device execution and official E7+E9 criteria.