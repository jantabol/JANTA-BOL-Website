#!/usr/bin/env bash
# B8 G4 CP04 — actual PostgreSQL17 two-session Owner HIDE vs stale REVISE race.
# Only executable against CI disposable jb_b8_g1 DB. No Supabase/production access.
set -Eeuo pipefail
test "${PGDATABASE:-}" = "jb_b8_g1" || { echo "B8_G4_NO_NON_DISPOSABLE_RACE"; exit 1; }
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
case_id="$(psql -X -A -t -v ON_ERROR_STOP=1 <<'PSQL' | tail -1
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Synthetic approved public safety hide concurrency regression',
 'Pichhore','R1') as race_case \gset
select public.jb_b8_g4_owner_release_public_projection(
 :'race_case'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true);
commit;
select :'race_case';
PSQL
)"
if [[ ! "$case_id" =~ ^[0-9a-f-]{36}$ ]]; then
 echo 'B8_G4_INVALID_SYNTHETIC_CASE'; exit 1;
fi
test "$(psql -X -A -t -v caseid="$case_id" -c "select (public.jb_b8_g4_public_case(:'caseid'::uuid) is not null)::int" | tail -1)" = "1" || { echo 'B8_G4_PUBLIC_SETUP_FAILED'; exit 1; }

# Tx A acquires row lock, inserts Founder HIDE, pauses BEFORE rollback.
psql -X -v ON_ERROR_STOP=1 -v caseid="$case_id" > "$tmp/hider" 2>&1 <<'PSQL' &
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',true);
select set_config('b8.fixture_session','on',true);
select set_config('b8.fixture_aal','aal2',true);
set role authenticated;
select public.jb_b8_g4_owner_release_public_projection(
 :'caseid'::uuid,'HIDE',null,null,null,false);
select pg_sleep(3.0);
rollback;
PSQL
hider=$!
ready=0
for _ in $(seq 1 40); do
 if ! kill -0 "$hider" 2>/dev/null; then break; fi
 found="$(psql -X -A -t -c "select count(*) from pg_stat_activity where datname=current_database() and state='active' and query like 'select pg_sleep(3.0)%'" | tail -1)"
 if test "$found" = "1"; then ready=1; break; fi
 sleep 0.1
done
if test "$ready" != "1"; then
 wait "$hider" || true
 cat "$tmp/hider"
 echo 'B8_G4_HIDER_NOT_HOLDING_CASE_LOCK';exit 1;
fi
# Tx B a concurrent stale REVISE must not pass HIDE; it times out on SAME Case.
set +e
psql -X -v ON_ERROR_STOP=1 -v caseid="$case_id" > "$tmp/reviser" 2>&1 <<'PSQL'
begin;
set local lock_timeout='650ms';
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',true);
select set_config('b8.fixture_session','on',true);
select set_config('b8.fixture_aal','aal2',true);
set role authenticated;
select public.jb_b8_g4_owner_release_public_projection(
 :'caseid'::uuid,'REVISE','PUBLIC_WORKS','SHIVPURI','UPDATED',true);
rollback;
PSQL
code=$?
set -e
wait "$hider"
if test "$code" -eq 0 || ! grep -q 'canceling statement due to lock timeout' "$tmp/reviser"; then
 cat "$tmp/reviser"
 echo 'B8_G4_HIDDEN_CASE_REVISION_NOT_SERIALIZED';exit 1;
fi
# HIDE rolled back so original approved public snapshot must still be visible.
test "$(psql -X -A -t -v caseid="$case_id" -c "select (public.jb_b8_g4_public_case(:'caseid'::uuid)->>'public_revision')" | tail -1)" = "1" || { echo 'B8_G4_REVISE_HAPPENED_UNDER_RACE';exit 1; }
# Then explicitly COMMIT Founder HIDE and re-read as anon in ANOTHER session.
psql -X -v ON_ERROR_STOP=1 -v caseid="$case_id" > "$tmp/hidecommit" 2>&1 <<'PSQL'
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',true);
select set_config('b8.fixture_session','on',true);
select set_config('b8.fixture_aal','aal2',true);
set role authenticated;
select public.jb_b8_g4_owner_release_public_projection(
 :'caseid'::uuid,'HIDE',null,null,null,false);
commit;
PSQL
test "$(psql -X -A -t -v caseid="$case_id" -c "set role anon;select (public.jb_b8_g4_public_case(:'caseid'::uuid) is null)::int" | tail -1)" = "1" || { echo 'B8_G4_COMMITTED_HIDE_LEAKED_ANON';exit 1; }
test "$(psql -X -A -t -c "set role anon;select public.jb_b8_g4_public_feed(24)::text" | tail -1)" = "[]" || { echo 'B8_G4_HIDDEN_CASE_STILL_IN_ANON_FEED';exit 1; }
echo 'B8 G4 CP04 PASS: real two-session Owner HIDE/REVISE lock serialization, rollback, separate-session committed anon NULL and feed []'
