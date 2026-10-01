# JANTA BOL — PHASE 4 AFFECTED FILES MAP

STATUS: B0 BASELINE / PRE-CODING
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
