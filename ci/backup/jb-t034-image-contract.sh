#!/usr/bin/env bash
# JANTA BOL P4-T034 CP02 — OFFLINE CLONE image contract only.
# Source this file in NETWORKLESS FAKE or recovered local clone; NEVER in LIVE DB.
# Official immutable linux/amd64 manifest SHA reported by 2026-10-14 audit.
# CI runtime creation/extension/GUC proof is separate; this constant is not proof.
JB_T034_IMAGE='supabase/postgres@sha256:3e2a7ab48783077d0122dc72ed5174afb543110c38266c845716c51d130658e4'
JB_T034_PLATFORM='linux/amd64'
# Cron needs to be disabled at FIRST server startup. Do not mutate restored
# cron.job.active or assume --network none prevents local SQL execution.
# Overriding Docker CMD also overrides the baked-in Supabase preload list:
# without this pg_cron/pg_net cannot load even though extension versions exist.
# This is the source catalog preload list read-only verified on 2026-10-15.
# The worker must connect ONLY to extension-free template1, not restored postgres.
JB_T034_PRELOAD='pg_stat_statements,pgaudit,plpgsql,plpgsql_check,pg_cron,pg_net,pgsodium,auto_explain,pg_tle,plan_filter,supabase_vault'
JB_T034_START_ARGS=(postgres -c "shared_preload_libraries=$JB_T034_PRELOAD"
  -c cron.database_name=postgres -c cron.launch_active_jobs=off
  -c pg_net.database_name=template1)
