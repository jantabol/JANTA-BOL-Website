#!/usr/bin/env bash
# G17 synthetic PostgreSQL-only write-fence drill. NEVER touch live DB or Storage.
# Requires the disposable G15 local fixture DB, container, and scratch.
set -Eeuo pipefail
set +x
umask 077
hold(){ echo "G17_DB_FENCE_HOLD=$1" >&2; exit 3; }
[[ "${GITHUB_REPOSITORY:-}" == 'jantabol/JANTA-BOL-Website' ]] || hold WRONG_REPOSITORY
[[ "${GITHUB_REF:-}" == 'refs/heads/codex/b11-t070-real-restore-identity-preflight-20261025' ]] || hold WRONG_BRANCH
[[ "${G17_LOCAL_SYNTHETIC_ONLY:-}" == 'YES' ]] || hold LOCAL_ONLY_CONFIRMATION_MISSING
for key in JB_DB_URI SUPABASE_DB_PASSWORD SUPABASE_SERVICE_ROLE_KEY JB_B11_SERVICE_ROLE_KEY JB_BACKUP_B2_APPLICATION_KEY; do
  [[ -z "${!key:-}" ]] || hold REAL_CREDENTIAL_PRESENT
done
[[ "$#" == 2 ]] || hold REQUIRED_LOCAL_DB_AND_TEMP_DIRECTORY
db="$1"; scratch="$2"
[[ -d "$scratch" && "$db" =~ ^supabase_db_[a-zA-Z0-9_.-]+$ ]] || hold LOCAL_TARGET_INVALID
[[ "$(docker exec "$db" psql -U postgres -d postgres -X -Atqc "SELECT count(*) FROM t070_fixture.articles WHERE slug='only-synthetic-article'")" == 1 ]] || hold SYNTHETIC_FIXTURE_MISSING
# Source and clone are disposable already prepared by G15. No production endpoint.
pid=''
coordinator=''
fd_open=0
cleanup_probe(){
  if [[ "$fd_open" == 1 ]]; then exec 9>&- || true; fd_open=0; fi
  if [[ -n "$pid" && "$pid" =~ ^[0-9]+$ ]]; then
    docker exec "$db" psql -X -qAt -U postgres -d postgres -c "SELECT pg_terminate_backend($pid);" > /dev/null 2>&1 || true
  fi
  if [[ -n "$coordinator" ]]; then wait "$coordinator" 2>/dev/null || true; fi
  pid='';coordinator=''
}
trap cleanup_probe EXIT HUP INT TERM
probe_start(){
  local label="$1"
  local fifo="$scratch/g17-${label}.fifo" stdout="$scratch/g17-${label}.out" stderr="$scratch/g17-${label}.err"
  mkfifo -m 600 "$fifo"
  docker exec -i "$db" psql -U postgres -d postgres -X -qAt -v ON_ERROR_STOP=1 < "$fifo" > "$stdout" 2> "$stderr" &
  coordinator=$!
  exec 9>"$fifo";fd_open=1
  printf 'BEGIN;\nLOCK TABLE t070_fixture.articles IN SHARE MODE;\nSELECT '\''G17_BARRIER|'\'' || pg_backend_pid();\n' >&9
  for attempt in $(seq 1 80); do
    if grep -Eq '^G17_BARRIER\|[0-9]+$' "$stdout"; then break; fi
    if ! kill -0 "$coordinator" 2>/dev/null; then hold BARRIER_COORDINATOR_EARLY_FAILURE;fi
    sleep 0.1
  done
  local marker
  marker="$(grep -E '^G17_BARRIER\|[0-9]+$' "$stdout" | head -n 1 || true)"
  [[ "$marker" =~ ^G17_BARRIER\|[0-9]+$ ]] || hold BARRIER_NOT_READY
  pid="${marker#*|}"
}
probe_blocked_write(){
  # READ operations must remain possible. SHARE lock should block INSERT/UPDATE.
  [[ "$(docker exec "$db" psql -U postgres -d postgres -X -Atqc "SELECT count(*) FROM t070_fixture.articles")" == 1 ]] || hold PUBLIC_READ_STOPPED
  local output="$scratch/g17-negative.out"
  if docker exec "$db" psql -U postgres -d postgres -X -qAt -v ON_ERROR_STOP=1 -c "SET lock_timeout='400ms'; INSERT INTO t070_fixture.articles(id,slug) VALUES('00000000-0000-4000-8000-000000000199','G17-blocked-write');" > "$output" 2>&1; then
    hold WRITER_WAS_NOT_FENCED
  fi
  # Error text remains in a private scratch file; no SQL exception contents in stdout.
  [[ "$(docker exec "$db" psql -U postgres -d postgres -X -Atqc "SELECT count(*) FROM t070_fixture.articles WHERE slug='G17-blocked-write'")" == 0 ]] || hold BLOCKED_ROW_PRESENT
}
# Positive reversible transaction: open a separate session, prove fenced write, ROLLBACK.
probe_start normal
probe_blocked_write
printf 'ROLLBACK;\n' >&9
exec 9>&-;fd_open=0
wait "$coordinator" || hold EXPLICIT_ROLLBACK_FAILED
coordinator='';pid=''
docker exec "$db" psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -c "INSERT INTO t070_fixture.articles VALUES ('00000000-0000-4000-8000-000000000198','G17-reopened'); DELETE FROM t070_fixture.articles WHERE slug='G17-reopened';" > "$scratch/reopen.out" 2>&1 || hold WRITE_NOT_REOPENED
echo 'G17_LOCAL_PG_FENCE_READ_CONTINUES=PASS'
echo 'G17_LOCAL_PG_BLOCKED_WRITE_TIMEOUT=PASS'
echo 'G17_LOCAL_PG_EXPLICIT_ROLLBACK_REOPENS=PASS'
# Unexpected coordinator process failure must release locks automatically.
probe_start forced
probe_blocked_write
[[ "$pid" =~ ^[0-9]+$ ]] || hold BACKEND_PID_INVALID
terminated="$(docker exec "$db" psql -U postgres -d postgres -X -Atqc "SELECT pg_terminate_backend($pid);")" || hold COORDINATOR_FORCE_DROP_FAILED
[[ "$terminated" == t ]] || hold COORDINATOR_NOT_DROPPED
exec 9>&-;fd_open=0
wait "$coordinator" >/dev/null 2>&1 || true
coordinator='';pid=''
docker exec "$db" psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -c "INSERT INTO t070_fixture.articles VALUES ('00000000-0000-4000-8000-000000000197','G17-crash-reopened'); DELETE FROM t070_fixture.articles WHERE slug='G17-crash-reopened';" > "$scratch/crash-reopen.out" 2>&1 || hold CRASH_LOCK_DID_NOT_AUTO_RELEASE
echo 'G17_LOCAL_PG_FORCED_CONNECTION_LOSS_AUTO_ROLLBACK=PASS'
echo 'G17_LOCAL_PG_CRASH_RECOVERY_WRITES_REOPEN=PASS'
echo 'G17_STORAGE_WRITE_FENCE_VERIFIED=false'
echo 'G17_SOURCE_CRON_5_SECOND_JOB_PAUSED=false'
echo 'G17_REAL_PRODUCTION_MAINTENANCE_PERFORMED=false'
echo 'G17_REAL_JOINT_DB_MEDIA_RESTORE=NOT_RUN'
echo 'T070_REAL_JOINT_E8=NOT_RUN'
trap - EXIT HUP INT TERM
