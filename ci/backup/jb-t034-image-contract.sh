#!/usr/bin/env bash
# JANTA BOL P4-T034 CP02 — OFFLINE CLONE image contract only.
# Source this file in NETWORKLESS FAKE or recovered local clone; NEVER in LIVE DB.
# Official immutable linux/amd64 manifest SHA reported by 2026-10-14 audit.
# CI runtime creation/extension/GUC proof is separate; this constant is not proof.
JB_T034_IMAGE='supabase/postgres@sha256:3e2a7ab48783077d0122dc72ed5174afb543110c38266c845716c51d130658e4'
JB_T034_PLATFORM='linux/amd64'
# Cron needs to be disabled at FIRST server startup. Do not mutate restored
# cron.job.active or assume --network none prevents local SQL execution.
JB_T034_START_ARGS=(postgres -c cron.database_name=postgres -c cron.launch_active_jobs=off)
