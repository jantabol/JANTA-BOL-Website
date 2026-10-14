#!/usr/bin/env bash
# JANTA BOL / T034: isolated Supabase-compatible PostgreSQL 17 APP-SCOPE restore probe.
# NEVER points to production, Cricket, B2, or Supabase. No secrets or private rows
# are printed. Public-only success MUST NOT be reported as a full Supabase restore.
set -Eeuo pipefail
set +x
umask 077

fail(){ printf 'T034_PUBLIC_CLONE_HOLD: %s\n' "$1" >&2; exit 1; }
[[ "$#" == 1 ]] || fail 'exactly one local backup directory argument expected'
snapshot_dir="$1"
[[ -d "$snapshot_dir" && -s "$snapshot_dir/raw_full.dump" ]] || fail 'missing custom PG dump'
[[ "${JB_T034_CLONE_SCOPE:-app}" == 'app' ]] || fail 'only reviewed public+private app scope supported'
command -v docker >/dev/null || fail 'Docker unavailable'

tmp="$(mktemp -d)"
clone="jb-t034-restore-$RANDOM-$RANDOM"
cleanup() {
  docker rm -f "$clone" >/dev/null 2>&1 || true
  rm -rf -- "$tmp"
}
trap cleanup EXIT
# No external network; no source DB env/connection string; no persistent volume.
docker run -d --network none --memory 4g --pids-limit 200 --cpus 2 \
  --name "$clone" -e POSTGRES_PASSWORD=disposable_runner_only \
  supabase/postgres:17.6.1.136 > /dev/null || fail 'cannot start isolated Supabase PG17 clone'

ready=0
for i in $(seq 1 35); do
  if docker exec -u postgres "$clone" pg_isready -q -d postgres > /dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]] || fail 'isolated clone did not start'
# Confidential dump enters an offline container. No Docker port mapping, no logs/artifacts.
docker cp "$snapshot_dir/raw_full.dump" "$clone:/tmp/jb_snapshot.dump" > /dev/null 2>&1 ||
 fail 'cannot deliver dump to isolated container'
docker exec -u root "$clone" sh -c 'chown postgres:postgres /tmp/jb_snapshot.dump && chmod 600 /tmp/jb_snapshot.dump' > /dev/null 2>&1 ||
 fail 'cannot protect isolated input dump'
# Schema-scoped pg_restore does not recreate selected namespaces.
# Preserve blank public from initial bootstrap and create empty private only in
# this offline disposable container. The platform's auth/storage namespaces stay
# intact, never overwritten or claimed as restored.
docker exec -u postgres "$clone" psql -X -v ON_ERROR_STOP=1 -d postgres \
  -c 'CREATE SCHEMA IF NOT EXISTS private;' > "$tmp/clone_init.log" 2>&1 ||
  fail 'disposable private namespace could not be created'
# Some live Supabase functions/constraints require auth, vault, net, etc.; do NOT
# suppress their errors or claim full restore. Fail and retain production unchanged.
if ! docker exec -u postgres "$clone" pg_restore --exit-on-error --no-owner --no-privileges \
  --schema=public --schema=private --dbname=postgres /tmp/jb_snapshot.dump \
  > "$tmp/restore.log" 2>&1; then
  # Diagnostic exposure is allowed ONLY for synthetic workflow with NO real DB credentials.
  if [[ "${JB_T034_SYNTHETIC_DIAGNOSTICS:-0}" == 1 &&
        "${GITHUB_EVENT_NAME:-}" == push &&
        "${GITHUB_WORKFLOW:-}" == 'JANTA BOL T034 dual recipient offline clone SYNTHETIC CI' &&
        -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    grep -E '(pg_restore: error|ERROR:|Command was:)' "$tmp/restore.log" | head -n 12 || true
  fi
  fail 'isolated public+private restore failed; live system unaffected; Supabase compatibility review required'
fi
q(){
  docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 -d postgres -c "$1" 2>"$tmp/query.err"
}
table_count="$(q "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'")" ||
 fail 'table count could not be checked'
rls_count="$(q "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity")" ||
 fail 'RLS could not be checked'
article_count="$(q 'SELECT count(*) FROM public.articles')" || fail 'articles table absent'
ads_count="$(q 'SELECT count(*) FROM public.ad_campaigns')" || fail 'ad_campaigns table absent'
policies_count="$(q "SELECT count(*) FROM pg_policies WHERE schemaname='public'")" ||
 fail 'policies count could not be checked'
for n in "$table_count" "$rls_count" "$article_count" "$ads_count" "$policies_count"; do
  [[ "$n" =~ ^[0-9]+$ ]] || fail 'invalid result from isolated clone'
done
(( table_count > 1 && rls_count > 0 && article_count > 0 && policies_count > 0 )) ||
 fail 'required public table/data/RLS/policy invariants missing'
[[ "$rls_count" == "$table_count" ]] ||
 fail 'not all restored public tables have RLS enabled'
printf 'T034_CLONE_APP_SCHEMAS_PROBE=PASS\nPUBLIC_TABLES=%s\nPUBLIC_RLS_TABLES=%s\nPUBLIC_POLICY_COUNT=%s\nARTICLES_ROW_COUNT=%s\nAD_CAMPAIGNS_ROW_COUNT=%s\n' \
  "$table_count" "$rls_count" "$policies_count" "$article_count" "$ads_count"
printf 'T034_RESTORE_SCOPE=APP_PUBLIC_PRIVATE_ONLY; FULL_SUPABASE_RESTORE_VERIFIED=false\n'
