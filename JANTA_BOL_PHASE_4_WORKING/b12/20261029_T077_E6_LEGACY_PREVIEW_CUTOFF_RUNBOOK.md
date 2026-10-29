# P4-T077 E6 — Legacy Vercel Preview Production-Backend Isolation: Zero-Paid Completion Runbook
29 October 2026 (IST). **Risk assessment / cutover plan only**. Not a license to modify production or fake PASS.

## Evidence (real)
- Canonical live production: `jantabol.in`, deployment `dpl_23HiFAWh8m9e5sVh3QQxYorfdxTJ`, commit `532261e335a235dbdaf9697ccdbfe274122a8580`, READY.
- Free/Hobby Vercel Standard Protection `prod_deployment_urls_and_all_previews` is active: old and current Preview URLs respond with Vercel Authentication HTTP 302 in anonymous tests. The canonical domain remains publicly available.
- Latest reviewed integration branch's `supabase-config.js` refuses to initialize JBBackend outside canonical HTTPS hosts. 11/11 synthetic + 2/2 real live negative HTTPS tests passed in GitHub Actions `40842332418`; production/static source tests 10/10 passed `40842332324`.
- **Unresolved issue**: immutable **historical** Preview deployments still ship old static `supabase-config.js` pointing at the real Supabase production project `vrffsnkycvjithwtiylt`. Vercel SSO blocks public visitors but a Vercel-authorized Owner may still enter an old Preview, log in with Supabase and modify live data.
- Only one active Supabase project on the JANTA BOL linked account; a separate, funded Preview database is not yet configured. Under zero-paid terms, do not silently create a paid branch or project.
- Supabase publishable key inventory: one current default modern publishable key and one enabled legacy anon key. **Only the front-end publishable key is safe to embed. Never print or share secret keys.**

## Safe zero-cost **operational** cut-off route (requires Founder Supabase dashboard action)
1. Founder creates an **additional** modern **Publishable** API key under JANTA BOL > Project Settings > API Keys, uniquely named `janta_bol_production_rotated`. This does not deactivate the existing key or break production. Do NOT paste a service_role/secret key or any token into chat. The connector can read the newly created publishable key by name after creation. **Tool limitation:** connected Supabase offers key listing but no create/revoke capability.
2. Independent audit before switching: enumerate every use of the current key (GitHub source and Vercel environment, legacy mobile/SPCK, other apps/webhooks). Check B11 backup/rollback baseline and expected recovery against the proposed change; the legacy production deployment must **not** lose safe rollback. Do not expose a server secret in public code.
3. Prepare smallest possible new production candidate based on **the exact current deployed source** (not blindly newer integration HEAD). Replace only the public key and preserve canonical-origin guard. CI: no-loss tests, protected B0–B12 gates, 2/2 E6 GET, complete published article/public C1 verification, authentication owner MFA smoke. Keep canonical alias on old production until candidate proven.
4. Founder-approved controlled promotion to real production; verify `jantabol.in`, both article IDs, share, Founder auth, draft/published isolation, other public/admin routes. Build a **new-key rollback** option first (roll back old code with old retired key is NOT viable). Never force a release or bypass a failed gate.
5. **Only after all callers and rollback candidates have migrated**: Founder retires/revokes the original modern publishable key from Supabase Dashboard, checks no shadow site still depends on it, validates **historical old Preview's old JS fails API calls** even after Vercel login, and verifies live canonical site works with new key. Whether the default modern publishable key is deletable depends on dashboard state; inspect and report, do not assume.
6. Record the negative test (old Preview login/newspaper writes fail closed) and positive test (canonical published+Owner MFA writes work), Version/Audit preserved, and B11 recovery plan maintained. Only then consider **scoped operational** E6 PASS and T077 final decision. A shared underlying physical database remains shared regardless of key rotation, so **never call this an independent preview database**.

## Stronger physical separation (separate follow-up)
A truly independent Preview database + staging auth is a separate environment; assess free capacity and initial migrations/evidence first. Even after building it, old immutable deployments must be decommissioned or their credentials retired, or they can keep talking to prod. Deleting preview deployments removes historical links and can affect audit/rollback; no destructive deletion without inventory and explicit approval.

## Do not attempt
- Never treat Vercel SSO or a browser-only hostname guard as proof of physical DB isolation.
- Never modify production SQL/RLS/auth settings solely to satisfy a checkbox without full B10/B11 regression and safe rollback.
- Never disable SSO, reveal tokens, use service-role keys in browser, or mix Cricket Supabase with JANTA BOL.
- No paid Supabase branch/project, no wholesale rebuild, no re-publish or edit of actual ISRO news for E6.
- E6 FINAL LOCK **HOLD** until real evidence closes the intended isolation requirement or Founder explicitly approves a documented *scoped risk acceptance* (risk acceptance is NOT proof of strict separation).

## Why now
T077 real article lifecycle E1/E2/E4 is complete; E6's legacy-preview backend isolation is a distinct security invariant. Maintain exact truth until confirmed by actual negative tests; proceed to T078 only when T077 gate is honestly resolved.
