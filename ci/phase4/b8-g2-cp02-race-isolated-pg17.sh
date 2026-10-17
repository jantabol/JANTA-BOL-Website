#!/usr/bin/env bash
# B8 G2 CP02 — REAL PostgreSQL17 isolated concurrency regression ONLY.
# Requires synthetic Article fixture and reviewed G1/G2 migrations already loaded.
# No LIVE database, no service key. Both transactions deliberately ROLLBACK.
set -Eeuo pipefail
test "${PGDATABASE:-}" = "jb_b8_g1" || { echo 'B8_FAIL_DISPOSABLE_DB_ONLY'; exit 1; }
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
# Session A: Owner AAL2 creates linked case, acquires FOR KEY SHARE and pauses.
psql -X -v ON_ERROR_STOP=1 > "$tmp/owner.log" 2>&1 <<'PSQL' &
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',true);
select set_config('b8.fixture_session','on',true);
select set_config('b8.fixture_aal','aal2',true);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Concurrent Article link and old deletion boundary regression',
 'Pichhore','R1') as race_case \gset
select public.jb_b8_g2_owner_link_article(
 :'race_case'::uuid,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select pg_sleep(3.0);
rollback;
PSQL
owner_pid=$!
# Wait for the transaction to be in pg_sleep (AFTER it inserted a linked case).
ready=0
for _ in $(seq 1 45); do
  if ! kill -0 "$owner_pid" 2>/dev/null; then break; fi
  found="$(psql -X -A -t -c "select count(*) from pg_stat_activity where datname=current_database() and state='active' and query like 'select pg_sleep(3.0)%'" | tail -1)"
  if test "$found" = "1"; then ready=1; break; fi
  sleep 0.1
done
if test "$ready" != "1"; then
  wait "$owner_pid" || true
  cat "$tmp/owner.log"
  echo 'B8_G2_RACE_OWNER_TRANSACTION_NOT_CONFIRMED'
  exit 1
fi
# Session B tries a hard delete of the SYNTHETIC article under a short local
# lock_timeout. FOR KEY SHARE must block it until Owner rollback; no source removal.
set +e
psql -X -v ON_ERROR_STOP=1 > "$tmp/deleter.log" 2>&1 <<'PSQL'
begin;
set local lock_timeout='650ms';
delete from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
rollback;
PSQL
code=$?
set -e
wait "$owner_pid"
if test "$code" -eq 0 || ! grep -q 'canceling statement due to lock timeout' "$tmp/deleter.log"; then
 cat "$tmp/deleter.log"
 echo 'B8_G2_RACE_LEGACY_DELETE_WAS_NOT_SERIALIZED_WITH_CASE_LINK'
 exit 1
fi
test "$(psql -X -A -t -c "select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'")" = "1"
test "$(psql -X -A -t -c "select count(*) from public.b8_cases")" = "0"
test "$(psql -X -A -t -c "select count(*) from public.article_sources")" = "1"
echo 'B8 G2 PG17 PASS: concurrent B8 Article link holds key-share, synthetic hard delete timed out; both transactions rolled back, News/source remain'
