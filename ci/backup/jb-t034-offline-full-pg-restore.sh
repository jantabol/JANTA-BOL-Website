#!/usr/bin/env bash
# Isolated FULL PostgreSQL database restore proof from a custom archive.
# Never connect to production/Cricket, expose ports, or print personal rows.
# This tests DB schema/data/security; Storage FILE BYTES and platform config
# are outside SQL backups, independently marked as NOT COVERED.
set -Eeuo pipefail
set +x
umask 077
fail(){ echo "T034_FULL_DB_CLONE_HOLD: $1" >&2; exit 1; }
[[ "$#" == 1 ]] || fail 'provide exactly one local recovered archive directory'
src="$1"
[[ -d "$src" && -s "$src/raw_full.dump" ]] || fail 'missing raw PostgreSQL custom archive'
command -v docker >/dev/null || fail 'Docker unavailable'
# The host MUST have PostgreSQL 17 compatible image prepared before this step.
clone="jb-t034-full-pg17-$RANDOM-$RANDOM"
temp="$(mktemp -d)"
cleanup(){ docker rm -f "$clone" >/dev/null 2>&1 || true; rm -rf -- "$temp"; }
trap cleanup EXIT HUP INT TERM
docker run -d --network none --memory 4g --cpus 2 --pids-limit 200 \
  --name "$clone" -e POSTGRES_PASSWORD=ephemeral_internal_only \
  supabase/postgres:17.6.1.136 > /dev/null ||
 fail 'isolated Supabase PostgreSQL image did not start'
ready=0
for i in $(seq 1 70); do
  if docker exec -u postgres "$clone" pg_isready -q -d postgres > /dev/null 2>&1; then
    ready=1; break
  fi
  sleep 2
done
[[ "$ready" == 1 ]] || fail 'isolated Supabase PostgreSQL not ready'
# Create a pristine database from template0; the built-in auth/storage base
# schemas in the bootstrap DB MUST NOT contaminate the restored snapshot.
docker exec -u postgres "$clone" createdb --template=template0 jb_restored_test_db \
  > "$temp/create.log" 2>&1 || fail 'cannot create clean isolated restore database'
# Public namespace ownership varies by PostgreSQL/Supabase dump origin:
# some snapshots include CREATE SCHEMA public and some leave template0 public
# as a built-in namespace. Do not guess; decide from actual archive TOC.
# Exact archive inventory is text; do not disclose it to GitHub job logs.
docker cp "$src/raw_full.dump" "$clone:/tmp/input.dump" > /dev/null 2>&1 ||
 fail 'cannot copy encrypted-source archive into offline target'
docker exec -u root "$clone" sh -c 'chown postgres:postgres /tmp/input.dump && chmod 600 /tmp/input.dump' \
  > /dev/null 2>&1 || fail 'cannot secure offline archive'
docker exec -u postgres "$clone" pg_restore --list /tmp/input.dump > "$temp/archive_toc.txt" 2>&1 ||
 fail 'cannot read PostgreSQL archive inventory'
if grep -Eq '^[0-9]+;.* SCHEMA - public ' "$temp/archive_toc.txt"; then
  docker exec -u postgres "$clone" psql -X -v ON_ERROR_STOP=1 -d jb_restored_test_db \
    -c 'DROP SCHEMA IF EXISTS public CASCADE;' > "$temp/reset.log" 2>&1 ||
    fail 'cannot prepare blank public schema for archive-owned namespace'
fi
if ! docker exec -u postgres "$clone" pg_restore -d jb_restored_test_db \
    --exit-on-error --no-owner --no-privileges /tmp/input.dump \
    > "$temp/restore.log" 2>&1; then
  # Only synthetic CI without LIVE secrets may expose bounded diagnostics.
  if [[ "${JB_T034_SYNTHETIC_DIAGNOSTICS:-0}" == 1 &&
        -z "${SUPABASE_DB_PASSWORD:-}" && -z "${JB_BACKUP_B2_APPLICATION_KEY:-}" ]]; then
    grep -E '(pg_restore: error|ERROR:|Command was:)' "$temp/restore.log" | head -n 12 || true
  fi
  fail 'FULL PG restore failed (NO production change). Exact Supabase dependency review required.'
fi
q(){ docker exec -u postgres "$clone" psql -X -A -t -v ON_ERROR_STOP=1 \
       -d jb_restored_test_db -c "$1" 2> "$temp/query.err"; }
for schema in public private auth storage; do
  q "SELECT 1 FROM pg_namespace WHERE nspname='$schema'" | grep -Fxq 1 ||
    fail "missing restored schema $schema"
done
count_tables(){
  q "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='$1' AND c.relkind='r'"
}
public_n="$(count_tables public)"
private_n="$(count_tables private)"
auth_n="$(count_tables auth)"
storage_n="$(count_tables storage)"
public_rls="$(q "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity")"
private_rls="$(q "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='private' AND c.relkind='r' AND c.relrowsecurity")"
policies="$(q "SELECT count(*) FROM pg_policies WHERE schemaname IN ('public','private','storage')")"
articles="$(q 'SELECT count(*) FROM public.articles')"
ads="$(q 'SELECT count(*) FROM public.ad_campaigns')"
auth_users="$(q 'SELECT count(*) FROM auth.users')"
storage_metadata="$(q 'SELECT count(*) FROM storage.objects')"
for v in "$public_n" "$private_n" "$auth_n" "$storage_n" "$public_rls" \
  "$private_rls" "$policies" "$articles" "$ads" "$auth_users" "$storage_metadata"; do
    [[ "$v" =~ ^[0-9]+$ ]] || fail 'unexpected counts from isolated DB'
done
(( public_n > 1 && private_n > 0 && auth_n > 0 && storage_n > 0 &&
   public_rls > 0 && policies > 0 && articles > 0 )) ||
 fail 'essential security/tables not present in restored DB'
(( public_rls == public_n )) ||
 fail 'not every restored public table has RLS'
printf 'T034_FULL_PG17_DATABASE_RESTORED=true\n'
printf 'TABLES_PUBLIC=%s TABLES_PRIVATE=%s TABLES_AUTH=%s TABLES_STORAGE=%s\n' \
  "$public_n" "$private_n" "$auth_n" "$storage_n"
printf 'RLS_PUBLIC=%s RLS_PRIVATE=%s POLICIES_APP_STORAGE=%s\n' "$public_rls" "$private_rls" "$policies"
printf 'ROWS_ARTICLES=%s ROWS_AD_CAMPAIGNS=%s ROWS_AUTH_USERS=%s ROWS_STORAGE_METADATA=%s\n' \
  "$articles" "$ads" "$auth_users" "$storage_metadata"
printf 'STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false\n'
