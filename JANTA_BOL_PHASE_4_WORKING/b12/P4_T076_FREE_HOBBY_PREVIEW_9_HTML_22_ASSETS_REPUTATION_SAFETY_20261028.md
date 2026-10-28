# B12 P4-T076 — Founder-approved safety-first live Preview audit (28 Oct 2026)

**Goal:** Continue every available backend task without repeatedly asking Founder for manual steps. Founder's release permission does NOT convert an unsafe untested production rollout into PASS. This is a read-only independent source integrity audit, not a Founder-login/product mutation audit.

## Actual progress during this checkpoint

- **GitHub Action 40706282898 / job 122879175741 — SUCCESS, 2/2 focused tests, 9 pages and 22 first-party JS/CSS URL variants checked** against the exact pre-existing Vercel Hobby Preview `dpl_EQC399BieUgUaLN8Xi4wB2fNijLz`, source commit `cfd5a64661e834c801c30325b97b5a4d72dfb49f`. Actual public HTTPS GET with browser-like no-cookie headers, trusted TLS, 200 status, MIME type and strict **byte-for-byte equality** against canonical GitHub client assets. All passed, 0 unauthorized external host requests.
- Nine HTML shell paths were real HTTP 200/TLS verified: `index.html`, `admin-login.html`, `admin.html`, `add-news.html`, `published.html`, `article.html`, `b9-search.html`, `b9-analytics.html`, `grievances.html`. **No Founder credentials sent and no privileged backend operation executed.**
- 22 linked first-party JS and CSS URL variants were HTTP 200, valid MIME, matching the reviewed source bytes. Relevant files include `backend-client.js`, `website-v3.js`, `b12-safe-nav.js`, `supabase-config.js` (browser-publishable config only), `b9-client.js`, `public-ads.js`, `admin-auth.js` and linked Admin/Analytics/Article dependencies. **No actual private Supabase keys were read or shared.**
- Earlier real external GitHub Action **40703558813 — 5/5** covers V3 index exact source (except pinned 163-byte Vercel Preview toolbar footer), source JS, Admin/Login/Article/B9 Search shells and no-store/nosniff/frame headers. Current Production independently remained at old `f447231c` (not the new V3 source), and its V3/JS path HTTP 404 on run **40699768744**.
- Vercel connected account checked: **Hobby**, no paid upgrade. An existing exact Git-linked Preview `READY` was reused rather than creating another unnecessary deployment. **Zero guarantee of future paid usage implied.**
- Supabase *read-only* PostgreSQL catalog inspected: original Production function `public.jb_b8_g1_owner_create_case(p_title text, p_area_label text, p_risk_lane text)` is still the original **three-argument** function; proposed T072 durable idempotent four-argument protected RPC is NOT deployed. **T072 production duplicate-on-ambiguous-ACK P2 is still OPEN**; B11 full hosted recovery E8 remains unproven. This is a concrete risk to live Founder operations and an unsafe basis for a blind Main cutover.

## EXACT release truth

**T076 Preview HTTPS & static dependency integrity: PASS_SCOPED with independent actual CI.**
**T076 official Production+Admin/Auth release: IN_PROGRESS / HOLD** (new integrated version is not on protected Main; Prod V3/JS paths still 404). Production promotion is not an asset-only routing fix. PR #61 is DRAFT, based on B10 review branch, and includes not-yet-deployed migrations/RPC assumptions.

**T077–T083: NOT_RUN** per Founder test-order request. **B11 E8: HOLD; T072 live P2: OPEN**.

Founder granted permission to continue technical work; automatic changing of public News publishing authority, live database schema, production backups or protected Git Main under unresolved P2/E8 would introduce reputational/security risk. We must not do that merely to obtain a green HTTP 200. No real Founder publishing/corrections, DNS change, public Article PURL test, AAL2 proof, production migration, production deploy, billing upgrade, B2 ciphertext upload or Cricket/Saarthi operation was performed during this checkpoint.

**NEXT:** Reconcile exact protected release and T072 idempotent production candidate into isolated PG17/hosted verification and full rollback proof. Only then use the separately authorized production release path; keep current Production live, B12 staged Preview intact. No Founder manual action is required for continued back-end read-only/security work. Founder session/AAL2/device evidence will be requested only when essential.

**Evidence:**
- `https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40706282898`
- `https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40703558813`
- `https://github.com/jantabol/JANTA-BOL-Website/pull/61`
