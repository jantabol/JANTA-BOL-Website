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
[[ -s "$src/source_db_identity.json" ]] ||
 fail 'missing protected database owner/ACL/locale/setting identity'
[[ -s "$src/raw_dump_snapshot_id.txt" && -s "$src/snapshot_scope.txt" ]] ||
 fail 'source manifest is NOT bound to an exported raw dump snapshot'
source_snap="$(cat "$src/raw_dump_snapshot_id.txt")"
[[ "$source_snap" =~ ^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+$ ]] ||
 fail 'invalid or missing raw pg_dump shared-snapshot token'
grep -Fxq 'SOURCE_RAW_DUMP_SHARED_SNAPSHOT=YES; AUXILIARY_FILTERED_EXPORTS_SHARED_SNAPSHOT=NO' \
  "$src/snapshot_scope.txt" || fail 'non-authoritative snapshot scope declaration'
[[ -s "$src/source_project.txt" ]] || fail 'missing source project identity'
source_label="$(cat "$src/source_project.txt")"
if [[ "$source_label" == 'SYNTHETIC ONLY' ]]; then
  [[ "${GITHUB_EVENT_NAME:-}" == pull_request &&
     ( "${GITHUB_HEAD_REF:-}" == 'review/t034-cp02-fix-20261015' ||
       "${GITHUB_HEAD_REF:-}" == 'review/t034-cp-rca2-safe-diagnostics-20261015' ) &&
     "${SUPABASE_DB_PASSWORD:-}" == '' ]] ||
   fail 'fake source identity not permitted outside fake CI'
else
  [[ "$source_label" == 'JANTA BOL production project vrffsnkycvjithwtiylt' ]] ||
   fail 'wrong project identity inside decrypted archive'
fi
command -v docker >/dev/null || fail 'Docker unavailable'
# Immutable PG17 image and from-first-start inert scheduler contract. No production connection.
# Source is reviewed repo code, not a user-controlled archive file.
source ci/backup/jb-t034-image-contract.sh
[[ "$JB_T034_PLATFORM" == linux/amd64 ]] || fail 'unsupported offline clone platform'
# The host MUST have PostgreSQL 17 compatible image prepared before this step.
clone="jb-t034-full-pg17-$RANDOM-$RANDOM"
temp="$(mktemp -d)"
cleanup(){
  local status=$?
  # Restore caller's failure status; do NOT silence failed teardown.
  trap - EXIT HUP INT TERM
  if docker container inspect "$clone" >/dev/null 2>&1; then
    if ! docker rm -f "$clone" >/dev/null 2>&1; then
      echo 'T034_OFFLINE_CLONE_CLEANUP=FAILED' >&2
      status=1
    fi
  fi
  if ! rm -rf -- "$temp"; then
    echo 'T034_EPHEMERAL_PLAINTEXT_CLEANUP=FAILED' >&2
    status=1
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
# No Docker stdout/stderr logging: even bootstrap/server messages may hold private values.
# PostgreSQL 17 JSON logs stay inside this networkless ephemeral container (0600).
# Do not replace existing pinned preload/cron/pg_net options.
docker run --platform "$JB_T034_PLATFORM" -d --network none --log-driver none \
  --memory 4g --cpus 2 --pids-limit 200 \
  --name "$clone" -e POSTGRES_PASSWORD=ephemeral_internal_only \
  "$JB_T034_IMAGE" "${JB_T034_START_ARGS[@]}" \
  -c logging_collector=on -c log_destination=jsonlog \
  -c log_directory=/tmp/t034-private-json -c log_filename=t034 \
  -c log_file_mode=0600 -c log_min_error_statement=panic \
  -c log_statement=none -c log_error_verbosity=terse \
  -c log_parameter_max_length_on_error=0 > /dev/null ||
 fail 'isolated Supabase PostgreSQL image did not start'
ready=0
for i in $(seq 1 70); do
  if docker exec -u postgres "$clone" pg_isready -q -d postgres > /dev/null 2>&1; then
    ready=1; break
  fi
  sleep 2
done
[[ "$ready" == 1 ]] || fail 'isolated Supabase PostgreSQL not ready'
# Supabase PostgreSQL first starts a TEMP bootstrap postmaster, shuts it down,
# then launches the final server. A single pg_isready may race the shutdown.
# Require a stable, real SQL-serving postmaster for multiple consecutive probes.
stable=0
for i in $(seq 1 100); do
  if docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
       -d postgres -c 'SELECT 1' 2>/dev/null | grep -Fxq 1; then
    stable=$((stable + 1))
    [[ "$stable" -ge 6 ]] && break
  else
    stable=0
  fi
  sleep 2
done
[[ "$stable" -ge 6 ]] || fail 'Supabase PG bootstrap/final postmaster never stabilized'
# The restored SQL must never execute cron jobs. Verify at first stable boot
# and re-check at the end (not just a post-restore ALTER).
boot_settings="$(docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres \
  -c "SELECT current_setting('cron.database_name') || '|' || current_setting('cron.launch_active_jobs') || '|' || current_setting('pg_net.database_name') || '|' || (SELECT count(*) FROM unnest(string_to_array(replace(current_setting('shared_preload_libraries'),' ',''),',')) AS x(name) WHERE name IN ('pg_cron','pg_net'))" \
  2> "$temp/settings.err")" || fail 'cannot prove offline worker/scheduler startup isolation'
[[ "$boot_settings" == 'postgres|off|template1|2' ]] || fail 'offline clone workers not isolated at boot'
# Require ALL source-version extension artifacts on the actual running amd64 image.
version_count="$(docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres \
  -c "SELECT count(*) FROM pg_available_extension_versions WHERE (name,version) IN
  (('pg_net','0.20.4'),('pg_cron','1.6.4'),('supabase_vault','0.3.1'),
   ('pg_stat_statements','1.11'),('pgcrypto','1.3'),('plpgsql','1.0'),('uuid-ossp','1.1'))" \
  2> "$temp/ext.err")" || fail 'cannot inspect offline extension versions'
[[ "$version_count" == 7 ]] || fail 'offline image missing exact required source extension versions'
# ROOT CAUSE, proven by fake Supabase 17 CI:
# (1) db role "postgres" is NOT SUPERUSER and cannot SET ROLE supabase_admin;
# (2) pg_cron can only be created in cron.database_name=postgres.
# On this NETWORKLESS THROWAWAY target ONLY, use the already-installed
# supabase_admin role and replace the empty bootstrap database postgres with
# a clean template0 postgres database. Never connect to source or Cricket here.
super="$(docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
  -U supabase_admin -d template1 \
  -c 'SELECT rolsuper FROM pg_roles WHERE rolname=current_user' 2>/dev/null)" ||
  fail 'isolated built-in supabase_admin superuser not available'
[[ "$super" == t ]] || fail 'isolated restore cannot preserve Supabase role ownership'
docker exec -u postgres "$clone" psql -X -v ON_ERROR_STOP=1 \
  -U supabase_admin -d template1 -c 'DROP DATABASE postgres WITH (FORCE);' \
  > "$temp/drop.log" 2>&1 ||
  fail 'cannot replace ONLY disposable postgres DB; no live database touched'
# Source DB identity is a protected JSON manifest with STRICT allowlisted
# owner/locale/ACL. It never contains SQL from the archive. The generated
# statements touch the disconnected disposable Docker instance ONLY.
python3 ci/backup/jb-t034-db-identity.py plan \
  "$src/source_db_identity.json" "$temp/prepare.sql" ||
  fail 'source database identity rejected by explicit allowlist'
docker cp "$temp/prepare.sql" "$clone:/tmp/t034-prepare.sql" >/dev/null 2>&1 ||
  fail 'cannot transfer safe owner/ACL preparation into offline target'
# python compiler emits 0600 on host; docker cp preserves root ownership.
# Explicitly hand to isolated postgres OS user, never relax to world-readable.
docker exec -u root "$clone" sh -c 'chown postgres:postgres /tmp/t034-prepare.sql && chmod 600 /tmp/t034-prepare.sql' \
  >/dev/null 2>&1 || fail 'cannot secure isolated owner/ACL setup file'
docker exec -u postgres "$clone" psql -X -v ON_ERROR_STOP=1 \
  -U supabase_admin -d template1 -f /tmp/t034-prepare.sql \
  > "$temp/create.log" 2>&1 || {
    # Fake-data forensic output needs BOTH trusted exact workflow identity and
    # a positive fake source tag; env secret absence alone is not sufficient.
    if [[ "${GITHUB_WORKFLOW:-}" == 'JANTA BOL T034 dual recipient offline clone SYNTHETIC CI' &&
          ( "${GITHUB_EVENT_NAME:-}" == pull_request || ( "${GITHUB_EVENT_NAME:-}" == push && "${GITHUB_REF:-}" == 'refs/heads/review/t034-cp02-fix-20261015' ) ) &&
          "${SUPABASE_DB_PASSWORD:-}" == '' &&
          "$(cat "$src/source_project.txt" 2>/dev/null)" == 'SYNTHETIC ONLY' ]]; then
      grep -m 2 -E 'ERROR:|FATAL:' "$temp/create.log" || true
    fi
    if [[ "${GITHUB_EVENT_NAME:-}" == pull_request &&
          ( "${GITHUB_HEAD_REF:-}" == 'review/t034-cp02-fix-20261015' ||
       "${GITHUB_HEAD_REF:-}" == 'review/t034-cp-rca2-safe-diagnostics-20261015' ) &&
          "$(cat "$src/source_project.txt" 2>/dev/null)" == 'SYNTHETIC ONLY' &&
          "${SUPABASE_DB_PASSWORD:-}" == '' &&
          "${JB_BACKUP_B2_APPLICATION_KEY:-}" == '' ]]; then
      grep -m 3 -E 'ERROR:|FATAL:' "$temp/create.log" || true
    fi
    if grep -Eiq 'invalid locale|collation|locale provider|ICU' "$temp/create.log"; then
      echo 'T034_DB_SETUP_ERROR_CLASS=LOCALE_PROVIDER'
    elif grep -Eiq 'syntax error|unrecognized option' "$temp/create.log"; then
      echo 'T034_DB_SETUP_ERROR_CLASS=SQL_SYNTAX'
    elif grep -Eiq 'role .* does not exist|role .*cannot be assumed' "$temp/create.log"; then
      echo 'T034_DB_SETUP_ERROR_CLASS=MISSING_ROLE'
    elif grep -Eiq 'permission denied|must be owner|insufficient privilege' "$temp/create.log"; then
      echo 'T034_DB_SETUP_ERROR_CLASS=PRIVILEGE'
    elif grep -Eiq 'database .* already exists' "$temp/create.log"; then
      echo 'T034_DB_SETUP_ERROR_CLASS=TARGET_EXISTS'
    else
      echo 'T034_DB_SETUP_ERROR_CLASS=OTHER'
    fi
    fail 'cannot recreate isolated postgres DB with source owner/locale/ACL'
  }
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
  docker exec -u postgres "$clone" psql -X -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
    -c 'DROP SCHEMA IF EXISTS public CASCADE;' > "$temp/reset.log" 2>&1 ||
    fail 'cannot prepare blank public schema for archive-owned namespace'
fi
# Preserve the ORIGINAL outer Docker status. The inner marker distinguishes
# a completed pg_restore process from Docker exec/startup failure.
# The client --verbose output stays in 0600 temporary files: NEVER to Actions.
restore_outer_rc=0
if docker exec -u postgres -e PGAPPNAME=jb_t034_full_restore "$clone" sh -c '
  pg_restore --verbose -U supabase_admin -d postgres --exit-on-error /tmp/input.dump
  rc=$?
  printf "%s\n" "$rc" > /tmp/t034-pg-restore-exit
  exit "$rc"
' > "$temp/restore.log" 2>&1; then
  :
else
  restore_outer_rc=$?
fi
if (( restore_outer_rc != 0 )); then
  restore_inner_rc='UNKNOWN'
  if docker cp "$clone:/tmp/t034-pg-restore-exit" "$temp/inner_rc" >/dev/null 2>&1; then
    candidate="$(cat "$temp/inner_rc" 2>/dev/null || true)"
    if [[ "$candidate" =~ ^([0-9]|[1-9][0-9]{1,2})$ ]] && (( candidate <= 255 )); then
      restore_inner_rc="$candidate"
    fi
  fi
  # Bounded container-state evidence; never call docker logs/inspect full JSON.
  container_state="$(docker container inspect --format '{{.State.Running}}|{{.State.OOMKilled}}' "$clone" 2>/dev/null)" ||
    container_state='unknown|unknown'
  mkdir -m 700 "$temp/pg_json"
  docker cp "$clone:/tmp/t034-private-json/." "$temp/pg_json/" >/dev/null 2>&1 || true
  diag="$temp/diagnostics.json"
  # Both stdout and stderr of the parser are private; validate a freshly
  # constructed fixed-schema report before displaying ANY diagnostic field.
  if python3 ci/backup/jb-t034-restore-diagnostics.py capture \
      --client-log "$temp/restore.log" --json-dir "$temp/pg_json" \
      --toc "$temp/archive_toc.txt" --outer-rc "$restore_outer_rc" \
      --inner-rc "$restore_inner_rc" --container-state "$container_state" \
      --out "$diag" > "$temp/parser.out" 2> "$temp/parser.err"; then
    python3 ci/backup/jb-t034-restore-diagnostics.py emit \
      --report "$diag" || echo 'T034_DIAGNOSTICS_INVALID=HOLD'
  else
    echo 'T034_DIAGNOSTICS_INVALID=HOLD'
  fi
  fail 'FULL PG restore failed (NO production change). Exact Supabase dependency review required.'
fi
q(){ docker exec -u postgres "$clone" psql -X -A -t -v ON_ERROR_STOP=1 \
       -U supabase_admin -d postgres -c "$1" 2> "$temp/query.err"; }
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
[[ -s "$src/expected_identity.txt" ]] ||
 fail 'source snapshot count/RPC identity manifest missing from archive'
[[ "$(wc -l < "$src/expected_identity.txt")" == 26 ]] ||
 fail 'invalid source manifest metric coverage'
# Queries are fixed code from THIS reviewed repo, not from archived user data.
docker cp ci/backup/jb-t034-restore-baseline.sql "$clone:/tmp/t034-identity.sql" >/dev/null 2>&1 ||
 fail 'reviewed identity query could not be sent into offline clone'
docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres -f /tmp/t034-identity.sql > "$temp/clone_identity.txt" 2> "$temp/identity.err" ||
 fail 'isolated restored full DB fingerprint query failed'
cmp -s "$src/expected_identity.txt" "$temp/clone_identity.txt" ||
 fail 'isolated restore differs from source: app/auth/storage row counts, RLS or payment RPC MD5'
[[ -s "$src/expected_security_identity.txt" ]] ||
 fail 'deep app/auth/storage security manifest missing'
[[ "$(wc -l < "$src/expected_security_identity.txt")" == 16 ]] ||
 fail 'deep security manifest coverage incomplete'
docker cp ci/backup/jb-t034-security-parity.sql "$clone:/tmp/t034-security.sql" >/dev/null 2>&1 ||
 fail 'cannot deliver reviewed deep parity SQL into networkless clone'
docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
 -U supabase_admin -d postgres -f /tmp/t034-security.sql \
 > "$temp/clone_security_identity.txt" 2> "$temp/security.err" ||
 fail 'cannot run deep security/data parity inside networkless clone'
cmp -s "$src/expected_security_identity.txt" "$temp/clone_security_identity.txt" ||
 fail 'restored full rows or security definitions differ from protected source snapshot'
printf 'T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH\n'

# Prove real role-switch permissions on the OFFLINE, NO-NETWORK clone:
# public article read is allowed by RLS; payment ledger reads are denied.
if ! docker exec -u postgres "$clone" psql -X -qAt -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres -c \
    "SET ROLE anon; SELECT count(*) FROM public.articles" \
  > "$temp/anon-positive.log" 2> "$temp/anon-positive.err"; then
  fail 'isolated anonymous article access fails expected public behavior'
fi
grep -Eq '^[0-9]+$' "$temp/anon-positive.log" ||
  fail 'isolated anonymous article read did not return a count'
if docker exec -u postgres "$clone" psql -X -qAt -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres -c \
    "SET ROLE anon; SELECT count(*) FROM public.ad_payments" \
  > "$temp/anon-negative.log" 2> "$temp/anon-negative.err"; then
  fail 'anonymous can directly read private payments after restore'
fi
grep -Eiq 'permission denied' "$temp/anon-negative.err" ||
  fail 'anonymous negative was not a verified ACL rejection'
printf 'T034_ANON_REAL_ROLE_ARTICLE_READ_AND_PAYMENT_DENIAL=PASS\n'

# Sequence values are not MVCC snapshot-bound. Preserve archive-captured
# sequence state and assert it cannot collide with existing affected IDs.
docker cp ci/backup/jb-t034-sequence-nextvalue-safety.sql \
  "$clone:/tmp/t034-sequence-safety.sql" >/dev/null 2>&1 ||
  fail 'cannot copy reviewed sequence query to networkless clone'
docker exec -u postgres "$clone" psql -X -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres -f /tmp/t034-sequence-safety.sql \
  > "$temp/sequence-safety.log" 2>&1 ||
  fail 'restored affected sequence state may collide with existing rows'
grep -Fq 'T034_AD_HISTORY_AUDIT_SEQUENCE_SAFETY=PASS' "$temp/sequence-safety.log" ||
  fail 'missing affected sequence safety proof'
printf 'T034_AFFECTED_HISTORY_AUDIT_SEQUENCE_NEXTVALUE=PASS\n'

# Verify exact restored DB-level owner, ACL, settings, locale.
docker cp ci/backup/jb-t034-db-identity.sql \
  "$clone:/tmp/t034-db-identity.sql" > /dev/null 2>&1 ||
  fail 'cannot transfer reviewed DB identity reader'
docker exec -u postgres "$clone" psql -X -At -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres -f /tmp/t034-db-identity.sql \
  > "$temp/actual_db_identity.json" 2> "$temp/dbidentity.err" ||
  fail 'cannot inspect offline database identity'
# The legacy FAKE source fixture uses Debian libc unlike the Supabase image.
# This is a narrow FAKE-only comparison exception for collation library
# version; actual encrypted JANTA BOL backups get NO exception.
identity_compare_extra=()
if [[ "${GITHUB_EVENT_NAME:-}" == pull_request &&
      ( "${GITHUB_HEAD_REF:-}" == 'review/t034-cp02-fix-20261015' ||
       "${GITHUB_HEAD_REF:-}" == 'review/t034-cp-rca2-safe-diagnostics-20261015' ) &&
      "$(cat "$src/source_project.txt" 2>/dev/null)" == 'SYNTHETIC ONLY' &&
      "${SUPABASE_DB_PASSWORD:-}" == '' &&
      "${JB_BACKUP_B2_APPLICATION_KEY:-}" == '' ]]; then
  identity_compare_extra+=(--legacy-fake-cross-image)
fi
python3 ci/backup/jb-t034-db-identity.py compare \
  "$src/source_db_identity.json" "$temp/actual_db_identity.json" \
  "${identity_compare_extra[@]}" ||
  fail 'restored DB owner, locale, ACL or settings drift'
printf 'T034_DATABASE_OWNER_ACL_LOCALE=EXACT_MATCH\n'

post_settings="$(q "SELECT current_setting('cron.database_name') || '|' || current_setting('cron.launch_active_jobs') || '|' || current_setting('pg_net.database_name')")" ||
  fail 'cannot recheck restored background-worker isolation'
[[ "$post_settings" == 'postgres|off|template1' ]] ||
  fail 'restored cron or pg_net could modify offline clone'
printf 'T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH\n'
printf 'T034_FULL_PG17_DATABASE_RESTORED=true\n'
printf 'TABLES_PUBLIC=%s TABLES_PRIVATE=%s TABLES_AUTH=%s TABLES_STORAGE=%s\n' \
  "$public_n" "$private_n" "$auth_n" "$storage_n"
printf 'RLS_PUBLIC=%s RLS_PRIVATE=%s POLICIES_APP_STORAGE=%s\n' \
  "$public_rls" "$private_rls" "$policies"
printf 'ROWS_ARTICLES=%s ROWS_AD_CAMPAIGNS=%s ROWS_AUTH_USERS=%s ROWS_STORAGE_METADATA=%s\n' \
  "$articles" "$ads" "$auth_users" "$storage_metadata"
printf 'STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false\n'
