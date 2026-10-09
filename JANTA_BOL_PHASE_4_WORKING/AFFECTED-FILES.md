# JANTA BOL — PHASE 4 AFFECTED FILES MAP

STATUS: B1 CLOSED ✅ | B2 AUDIT / RETENTION — ACTIVE
DATE: 2026-10-01
BRANCH: `phase4-execution-2026-10-01`

This file records what Phase 4 is allowed to change, what must be preserved, and which old regression families protect each area.

## B0 — Governance + CI Safety

### Modified
- `.github/workflows/phase3-regression.yml`
  - add Phase-4 execution branch coverage
  - ensure Phase-4 working records/code trigger protected Phase-3 regression
  - preserve existing static + Supabase regression jobs

### New
- `JANTA_BOL_PHASE_4_WORKING/README.md`
- `JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md`
- `JANTA_BOL_PHASE_4_WORKING/AFFECTED-FILES.md`
- `JANTA_BOL_PHASE_4_WORKING/CHANGELOG.md`
- `JANTA_BOL_PHASE_4_WORKING/DEBUG-MAP.md`
- `JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md`
- `ci/phase4/governance-b0.cjs`

### Preserved / not rebuilt
- Phase-3 application files
- Phase-3 Live provider/worker architecture
- current Auth/MFA/session/recovery implementation
- current article lifecycle/Permanent URL implementation
- current Phase-3 test files and exact old test IDs

## Forecast map for later blocks

| Block | Likely existing files/areas | DB / backend surface | Old regression risk |
|---|---|---|---|
| B1 Team | reporters UI, backend client, Live client | `reporters`, `user_roles`, session/Live permission objects | HIGH: Auth/Session/Live |
| B2 Audit/Retention | backend client, records/admin UI | `audit_logs`, article/version/history, retention objects | VERY HIGH: Article/Live/Security/Recovery |
| B3 Notifications | Phase-3 Live client/admin/reporter UI | `live_notifications`, notification functions | HIGH: Live/Auth |
| B4 Social | add-news, social, settings, phase2 client | `social_distribution` + canonical settings/provider state | HIGH: Publish/Share/PURL |
| B5 Grievance | grievances UI/client | `grievances`, `grievance_evidence` + lifecycle extensions | MED-HIGH: Article/Auth/Privacy |
| B6 Compliance | compliance UI/client | `compliance_tasks` + shared grievance source | MEDIUM: Grievance/Auth/Notifications |
| B7 Ads | ads UI | new canonical advertiser/campaign/payment structures | MED-HIGH: Public layout/Security/Analytics |
| B8 Accountability | article/editorial UI/backend | article/source/history reused + missing structured relations | HIGH: Article/PURL/Evidence |
| B9 Search/Analytics | public site, article, analytics UI/client | articles/search index/topic/tag + analytics extensions | HIGH: Public privacy/PURL/Live identity |
| B10 Security | security/recovery/auth clients | RLS/RPC/functions/grants/files | CRITICAL |
| B11 Recovery | runbooks/CI/deployment records | backup/restore/reconcile/rollback | CRITICAL |
| B12 Production | workflows/config/functions | production DB/storage/domain/providers | HIGH |
| B13 Final Closure | no new feature home | evidence/register/CI/production closure | FULL SYSTEM |

## Permanent affected-file rule

Before each coding block, replace forecast assumptions with an exact live file/object list. No file is edited merely because it appears in this forecast. Every actual edit must be recorded in CHANGELOG and linked to the affected tests.

## B1 — Team / Authority Extension — exact map

### Modified
- `JANTA_BOL_PHASE_3C_WORKING/reporters.html`
  - Android-first Team management UI.
- `.github/workflows/phase3-regression.yml`
  - B1 static + transactional regression added.

### New
- `JANTA_BOL_PHASE_3C_WORKING/phase4-team-client.js`
- `CODEX_CURRENT_SUPABASE/functions/jb-team-api/index.ts`
- `ci/phase4/static-b1-team-regression.cjs`
- `ci/phase4/db-b1-team-regression.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b1_team_authority_foundation.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b1_team_api_security_context.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b1_t123_minimum_security_fix.sql`

### Live DB objects added/extended
- `reporters.public_name_enabled`
- `reporters.updated_at`
- `team_accounts`
- `team_account_history`
- Team service/internal functions
- `public_reporter_directory()`
- `private.current_app_role()` extended so non-owner authority requires active Team state.

### Preserved
- Supabase Auth remains the authentication authority.
- `user_roles` remains the effective newsroom role authority.
- `reporters` remains Reporter identity/profile.
- Phase-3 Live membership/capability/revocation remains separate from newsroom role.
- Existing Article IDs/PURLs and historical Live sessions are not recreated on Team lifecycle changes.
- Old Phase-3 T123 checker remains unchanged and GREEN.

### B1 regression risk
HIGH: Auth / session / Live permission / Reporter identity / Article history.

Protected result:
workflow #246 GREEN across old Phase-3 suites + B1 automated suites.


## B2 — Common Audit + Retention — exact map

### Modified
- `.github/workflows/phase3-regression.yml`
  - B2 static + transactional regression added.
- `JANTA_BOL_PHASE_3C_WORKING/admin.html`
  - Records dashboard entry added.
- `JANTA_BOL_PHASE_3C_WORKING/trash.html`
  - Permanent Delete path now routes through the retention gate.

### New
- `JANTA_BOL_PHASE_3C_WORKING/records.html`
- `JANTA_BOL_PHASE_3C_WORKING/phase4-records-client.js`
- `CODEX_CURRENT_SUPABASE/functions/jb-records-api/index.ts`
- `ci/phase4/static-b2-records-regression.cjs`
- `ci/phase4/db-b2-records-regression.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b2_common_records_foundation.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b2_retention_policy_index.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b2_records_api_context.sql`
- `JANTA_BOL_PHASE_4_WORKING/db/20261001_phase4_b2_live_retention_compat_fix.sql`

### Live DB objects added / extended
- common audit sanitizer + immutable audit guard
- `record_retention_policies`
- `record_retention_state`
- `record_retention_history`
- `record_disposition_ledger`
- `article_public_view_settings`
- Records internal RPCs + service-only actor context
- `jb_owner_permanent_delete_article` extended with retention-due / Hold / retired-identity gates

### Preserved
- `audit_logs`
- `article_versions`
- `verification_history`
- `live_retention_registry`
- `live_deletion_ledger`
- Article ID / Permanent URL identity model
- locked Phase-3 Live routine-retention behavior

### B2 regression risk
VERY HIGH: Article lifecycle / audit history / Live retention / Permanent Delete / Security / Recovery.

Protected result so far:
workflow #296 GREEN across old Phase-3 suites + B1 + B2 static/transactional suites.
