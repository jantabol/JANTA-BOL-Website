JANTA BOL — PHASE 2 BUILD

This folder preserves all 22 Phase-1 files and adds Phase-2 modules.

DEPLOYMENT ORDER
1. Keep Phase-1 backup untouched.
2. Run phase2-migration.sql in the SAME Supabase project after reviewing existing Phase-1 schema.
3. Upload this build as a test/staging copy first.
4. Bind Founder/Owner Auth and enable provider-supported MFA/recovery in Supabase Auth. Recovery secrets/codes must never be stored in these files.
5. Run locked segment tests and regression before production.

NEW PHASE-2 FILES
phase2-client.js, phase2-migration.sql, analytics.html, grievances.html, grievance-submit.html, live.html, reporters.html, compliance.html.

IMPORTANT
- Existing Phase-1 historical TXT files were not rewritten.
- Existing public design files index.html/style.css/script.js remain byte-for-byte copied.
- Large new systems are parallel modules; admin.html/article.html contain small integration hooks.
- Website publishing remains independent from social distribution.
- Permanent delete remains owner-gated through existing backend-client.js.
- 15-minute inactivity lock remains in existing admin-auth.js.