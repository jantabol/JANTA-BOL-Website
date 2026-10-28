# P4-B12 / RUN-11 — one-test-at-a-time start order (T076 STARTED; T077–T083 NOT STARTED)
Master source: Final Test Blueprint P4-T076–T083, Sections 657–734. B12 coding gate review-source is complete. T076 started from current production source mismatch; later tests remain one-at-a-time. Merely having code in a PR never marks any test PASS.

| Order | Test | What to execute later | Required evidence | Founder step? |
|---|---|---|---|---|
| 1 | T076 | Real candidate hosting, final domain, valid HTTPS, public/Admin/Auth paths, protected CI | E1 E6 E7 | Only if actual Android/domain proof |
| 2 | T077 | Same Article UUID/PURL Publish, Correction, Unpublish, Republish; redirect tamper and dev/prod security | E1 E2 E4 E6 | Founder MFA/publish approval where required |
| 3 | T078 | Backup/RLS/secret preflight, controlled migrations only if needed, post-restore verification | E1 E2 E7 E8 | Founder security/production authority |
| 4 | T079 | Real Social/Ads/Messaging/Notifications independent provider probes; genuinely unavailable -> DUE with reason | E2 E6 E7 | Provider approval only if available; never paid service |
| 5 | T080 | Android Login→Create→Review→Publish→Dashboard→Logout, slow/disconnect/retry, no duplicate effects | E1 E2 E3 E5 E6 | Yes, real Android |
| 6 | T081 | Repeatable identifiable production release, real B11 encrypted backup+restore and safe rollback/cutover | E1 E6 E7 E8 | Founder AAL2/environment approval |
| 7 | T082 | Real public URL open/share on phone+tablet, correction/unpublish/republish, role/privacy/audit failure isolation | E1 E2 E3 E4 E5 E6 | Yes, phone and tablet |
| 8 | T083 | Final DNS/cert/maintenance/docs/ZIP, provider DUE, complete CI & exact recovery proof | E1 E3 E6 E7 E8 | Founder final signoff |

**Hard gate:** never automate a real Founder-authenticated Publish/Delete, Supabase migration, DNS cutover, or paid B2 operation just because source coding is complete. Existing B11 T072 duplicate P2 and E8 full hosted restore remain unresolved. If blocked, report exactly HOLD/DUE, do not fake the test.

**Test register current state (2026-10-28)**: T076 IN PROGRESS / current Production V3 site and script return HTTP 404; authentic Actions run 40699768744 has 2 scoped PASS and 2 genuine FAIL. Exact PR61 candidate was not deployed. T077–T083 NOT RUN. B12 final PASS/LOCK still HOLD.
