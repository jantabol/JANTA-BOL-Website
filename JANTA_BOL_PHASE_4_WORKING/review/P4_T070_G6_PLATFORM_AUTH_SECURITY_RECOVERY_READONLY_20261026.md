# JANTA BOL • Phase 4 B11 • P4-T070 G6 — Platform / Auth / RLS Recovery Read-Only Audit

**Checkpoint:** 26 October 2026 India, after Founder-confirmed successful workflow #11.  
**Scope:** G6 platform/source configuration inventories and security recovery boundaries, strictly READ-ONLY.  
**Authority:** Founder asked assistant to complete safe backend checks while unavailable; no authorization to make a new production clone, expose credentials or personally identifiable information, change security policy, copy grievance files, touch Cricket resources, or release PR #40.

## G6-01: independently recovered database E8 subset — PASS
Real GitHub Actions workflow run `40223103797`, job `121258741884`, on main `4ef0643520f664b0c23fee2cd70af27c02509b5f` completed with success. Actual job logs independently show:
- `T034_SOURCE_RAW_DUMP_AND_MANIFEST_SHARED_SNAPSHOT=CONFIRMED`
- `OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true`
- `T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS; OWNER_PRIVATE_KEY_NOT_USED=true`
- `T034_FULL_PG17_DATABASE_RESTORED=true`
- `T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH`; `T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH`
- `T034_ANON_REAL_ROLE_ARTICLE_READ_AND_PAYMENT_DENIAL=PASS`
- Actual data/source+clone: 100 public tables, RLS on all 100, 81 app/storage policies; 32 articles, 7 campaigns, 5 auth users, 5 storage metadata rows.
- **Log's exact exclusions: `STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`.**
These markers verify a genuine DB-only isolated clone—not Supabase Auth service/platform configuration recovery or real Storage object byte restore.

## G6-02: active source platform identity / RLS metadata — observed, not recovered
Supabase connector `get_project` returned **JANTA BOL**, project `vrffsnkycvjithwtiylt`, region `ap-south-1`, status `ACTIVE_HEALTHY`, PostgreSQL 17.6 (major 17). No secrets retrieved.

Read-only SQL against this JANTA BOL project returned:
- `public`: 100 ordinary tables / 100 RLS-on / 74 policies / 1 view, with `security_invoker=true` for the 1 view.
- `private`: 5 ordinary tables / 3 RLS-on / 3 policies.
- `storage`: 8 ordinary tables / 8 RLS-on / 4 policies.
- `auth`: 27 ordinary tables / 16 RLS-on; 5 `auth.users` rows (from prior independent logs/aggregate query). Supabase-managed auth schema is not to be changed to force policy coverage.
- Aggregate: **81 policies across public, private, storage**. RLS flag is not a stand-alone proof of all possible runtime authorization paths.
- Storage `grievance-private` (private), `private-editorial` (private) and `public-media` (public): all 3 bucket configurations currently have non-null size limit and allowed MIME restrictions. **A metadata read is NOT equivalent to reconstructing the 3 buckets / policies / object bytes in a newly deployed platform.**
- Source data counts: 878 article versions, 57 grievance history events, 16 LIVE sessions, 0 LIVE updates, 0 Ad payments, 2 grievance-evidence metadata rows. Empty LIVE updates/Ad payments: **NOT_EXERCISED**, must never claim live restore behavior tested.

## G6-03: Edge Functions runtime inventory — active configuration exists, recovery NOT RUN
Supabase `list_edge_functions`: **13 active** JANTA BOL Edge Functions. `verify_jwt=true` for 8, `verify_jwt=false` for 5. These are flag observations, NOT proof that the 5 are publicly unsafe: they can use custom HMAC/scheduler/other authorization checks. No Edge Function source/secret contents read, no functions redeployed, no independent function-runtime recovery. Rebuilding all 13 in an isolated environment and verifying protection is still required for full platform recovery.

## G6-04: Vercel project environment read-only inventory — metadata only
On already connected Vercel team `team_8axPWNjZuUp3vmEwLOxiKVhn`, project ID `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI` (`shubham-pichhore-2028`):
- `get_project` reported Node `24.x`, latest deployment `READY`, and a project-level set of Vercel default domains. One project domain was listed as verified.
- `filter_project_envs(decrypt=false)`: `envs=[]`, `hiddenProductionEnvCount=0` **as visible via connector**. This does not prove that all environment/config/secrets have been inventoried: alternate scopes, platform-managed runtime settings, and external Supabase/Google credentials may be separately managed. No decrypt/value request or config change was performed.
- A ready Vercel deployment and domain metadata **are NOT configuration restore in a separate recovery environment**.

## G6-05: security advisor review — advisories recorded; no forced or speculative changes
Supabase Security Advisors, JANTA BOL project read-only:
| Advisor code | Severity | Observations | Handling |
| --- | --- | ---: | --- |
| `rls_enabled_no_policy` | INFO | 43 | Some deliberately inaccessible/denied-by-default tables may intentionally have no direct policies. Must inspect affected design before assigning bug or relaxing RLS. |
| `anon_security_definer_function_executable` | WARN | 22 | Requires bounded, named function/EXECUTE-path review and internal authorization checks; NOT 22 confirmed exploits. |
| `authenticated_security_definer_function_executable` | WARN | 117 | Privileged callable RPCs require targeted audit; NOT 117 confirmed exploits; overlaps possible. |
| `auth_leaked_password_protection` | WARN | 1 | Auth leaked-password protection configuration is flagged disabled. Review tradeoffs and product option availability; do not change while user unavailable. |

No advisor finding was automatically suppressed or altered. Remediation docs:
- `https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable`
- `https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable`
- `https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection`

These are **additional security review work**, separate from the absence of recovery proof. Existing T034 clone security checks passed but did not establish every deployed function or end-to-end privilege path safe.

## G6-06: media, storage and platform restore completeness
User-observed Android offline 3/3 non-grievance media `SHA-256 MATCH`, AES-256-GCM encrypted B2 upload, B2 download, self-decrypt+3 SHA-256 matching: **PASS limited to 3 media offsite readback**.
Two `grievance-private` objects: Founder explicitly excluded them from SHA matching, and no independent bytes recovery performed. **NOT PROVEN**. No photo/ID/PII or private object source path should be shared in chat/repo.
**No combined/same-atomic-snapshot isolated restore of fresh DB + 3 or 5 actual original media bytes + Auth service + Supabase Edge Functions + platform/Vercel settings**. Full T070 RECOV-012..018 E8 **HOLD**.

## G6 gates and safe handoff
1. **Complete without user:** All connector-accessible read-only G6 platform/auth/RLS inventory and advisory capture; verify report on draft PR branch only. No additional production backup needed now; latest database clone already genuine PASS.
2. **Needs distinct isolated runtime/authorized approach:** Prove recovery of 3 media object bytes to an isolated filesystem with original source provenance; account for 2 grievance objects under founder privacy decision. Full storage disaster recoverability cannot be certified without them.
3. **Needs isolated platform target and verified config custody:** Supabase Auth provider/settings, function versions/authorization, storage-bucket settings and Vercel runtime/domains/secret placement. Never request secrets be pasted or print decrypted values.
4. **Needs scoped security audit of WARN advisor items** before declaring broader production security PASS. Do not automatically add policies, revoke RPCs or flip verify_jwt flags; it may break existing locked app.
5. New GitHub PR commits affect **only documentation on T070 draft branch**. Main unchanged. Official current HEAD Node CI is **not proven** merely by Vercel `success` check.
6. Only then, independently verify T070 full recovery and Founder LOCK, after user is available for any required approval. **T070 FINAL HOLD; T071 NOT STARTED.**

### Final sub-verdicts
- **Database backup + isolated PG17 clone + 26/16 parity/security checks: PASS**
- **Three media offsite ciphertext readback/decrypt/hash: user-observed PASS**
- **Platform/Auth/Edge source configuration inventory: READ-ONLY OBSERVED (NOT RESTORE)**
- **All-5-object storage recovery, platform recovery, and cross-component E8: HOLD**
- **Overall T070 FINAL PASS+LOCK: HOLD, DO NOT UNLOCK T071**
