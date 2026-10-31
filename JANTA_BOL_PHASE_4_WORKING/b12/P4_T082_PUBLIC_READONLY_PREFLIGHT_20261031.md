# P4-T082 — public GET-only preflight (2026-10-31)

**Started under Soft Launch priority after T081 release/rollback E8 remained HOLD.** This stage does not claim to close T081, publish a story or complete the full T082 lifecycle.

- Production domain is `https://jantabol.in`. Public `GET /`, `GET /JANTA_BOL_PHASE_3C_WORKING/index.html` and `GET /JANTA_BOL_PHASE_3C_WORKING/article.html?id=f17f6507-02a3-4881-ad37-0b02cadf3d3f` are checked using a public GitHub runner without cookies, service keys, Owner login, private media or write requests. Only HTTP status, same-site redirect, HTML brand and security-header checks are asserted.
- This is **not** a real Android phone/tablet share test, not live rendered article JSON proof, not correction/unpublish/republish, and not a multi-device login test.
- Exact source baseline: `e361ee207d9e35f26bb3a1a4fafd375e25a4ca22` (T081 Draft review code). No product source files changed.
- The Founder should only be asked for **device/action/expected/proof** when real E3 phone+tablet/correction is the next remaining gate. Founder reserved Publish/Unpublish is never auto-run by CI.
- Original T081 E8 current Auth/Edge/Vercel/DB+Storage full restore and real traffic rollback remain HOLD. B2 Class D cap uncertainty and zero-paid restriction remain in force; never bypass for T082.

**Verdict:** `T082=STARTED; E1/E6 source and public HTTP scoped verification; E2/E3/E4/E5 real multi-device lifecycle NOT_RUN; FINAL LOCK=HOLD`.
