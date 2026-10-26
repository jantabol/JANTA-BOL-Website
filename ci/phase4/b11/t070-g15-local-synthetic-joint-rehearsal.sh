#!/usr/bin/env bash
# T070 G15 — local synthetic rehearsal ONLY. No production DB, media or tokens.
set -Eeuo pipefail
set +x
umask 077
hold(){ echo "G15_SYNTHETIC_HOLD=$1" >&2; exit 3; }
[[ "${GITHUB_REPOSITORY:-}" == 'jantabol/JANTA-BOL-Website' && "${GITHUB_REF:-}" == 'refs/heads/codex/b11-t070-real-restore-identity-preflight-20261025' ]] || hold 'WRONG_REPO_OR_BRANCH'
for name in SUPABASE_DB_PASSWORD SUPABASE_SERVICE_ROLE_KEY JB_B11_SERVICE_ROLE_KEY JB_BACKUP_B2_APPLICATION_KEY JB_BACKUP_AGE_RECIPIENT; do
  [[ -z "${!name:-}" ]] || hold 'PRODUCTION_CREDENTIAL_PRESENT'
done
for app in supabase docker tar sha256sum curl; do command -v "$app" >/dev/null || hold 'LOCAL_TOOL_MISSING'; done
d="$(mktemp -d)"
network='jb-t070-g15-fixture'
cleanup(){
  (cd "$d" && supabase stop --no-backup >/dev/null 2>&1) || true
  docker network rm "$network" >/dev/null 2>&1 || true
  rm -rf -- "$d"
}
trap cleanup EXIT
cd "$d"
supabase init --yes >/dev/null
docker network create -o 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' "$network" >/dev/null
supabase start --network-id "$network" >"$d/start.log" 2>&1 || hold 'EMPTY_STACK_BOOT'
db="$(docker ps --format '{{.Names}}' | grep -E '^supabase_db_' | head -n1)"
[[ -n "$db" ]] || hold 'EMPTY_LOCAL_DB'
docker exec "$db" psql -U postgres -d postgres -X -Atqc 'SELECT 1' | grep -qx 1 || hold 'LOCAL_DB_CONNECTION'
cat >"$d/fixtures.sql" <<'SQL'
CREATE SCHEMA t070_fixture;
CREATE TABLE t070_fixture.articles(id uuid PRIMARY KEY, slug text UNIQUE NOT NULL);
CREATE TABLE t070_fixture.grievances(id uuid PRIMARY KEY,article_id uuid NOT NULL REFERENCES t070_fixture.articles(id),public_id text UNIQUE NOT NULL);
CREATE TABLE t070_fixture.live_sessions(id uuid PRIMARY KEY,article_id uuid NOT NULL REFERENCES t070_fixture.articles(id));
CREATE TABLE t070_fixture.live_updates(id uuid PRIMARY KEY,session_id uuid NOT NULL REFERENCES t070_fixture.live_sessions(id));
CREATE TABLE t070_fixture.ad_campaigns(id uuid PRIMARY KEY,label text NOT NULL);
CREATE TABLE t070_fixture.ad_payments(id uuid PRIMARY KEY,campaign_id uuid NOT NULL REFERENCES t070_fixture.ad_campaigns(id));
ALTER TABLE t070_fixture.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY anon_none ON t070_fixture.articles FOR SELECT TO anon USING (false);
GRANT USAGE ON SCHEMA t070_fixture TO anon;
GRANT SELECT ON t070_fixture.articles TO anon;
INSERT INTO t070_fixture.articles VALUES ('00000000-0000-4000-8000-000000000101','only-synthetic-article');
INSERT INTO t070_fixture.grievances VALUES ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000101','G15-SYNTH-001');
INSERT INTO t070_fixture.live_sessions VALUES ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000101');
INSERT INTO t070_fixture.live_updates VALUES ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000103');
INSERT INTO t070_fixture.ad_campaigns VALUES ('00000000-0000-4000-8000-000000000105','synthetic-only');
INSERT INTO t070_fixture.ad_payments VALUES ('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000105');
SQL
docker exec -i "$db" psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q <"$d/fixtures.sql" >/dev/null || hold 'LOCAL_SOURCE_CREATE'
docker exec "$db" pg_dump -U postgres -d postgres -Fc -n t070_fixture >"$d/fixture.pg17.dump" || hold 'PG_DUMP'
[[ -s "$d/fixture.pg17.dump" ]] || hold 'EMPTY_DUMP'
docker exec "$db" createdb -U postgres t070_g15_clone || hold 'LOCAL_TARGET_CREATE'
docker exec -i "$db" pg_restore -U postgres -d t070_g15_clone --no-owner <"$d/fixture.pg17.dump" >"$d/restore.log" 2>&1 || hold 'PG_RESTORE'
sql="SELECT concat_ws('|',(SELECT slug FROM t070_fixture.articles LIMIT 1),(SELECT public_id FROM t070_fixture.grievances LIMIT 1),(SELECT count(*) FROM t070_fixture.live_updates),(SELECT count(*) FROM t070_fixture.ad_payments));"
src="$(docker exec "$db" psql -U postgres -d postgres -X -Atqc "$sql")"
restored="$(docker exec "$db" psql -U postgres -d t070_g15_clone -X -Atqc "$sql")"
[[ "$src" == "$restored" && "$restored" == 'only-synthetic-article|G15-SYNTH-001|1|1' ]] || hold 'SOURCE_CLONE_ID_PARITY'
orphans="$(docker exec "$db" psql -U postgres -d t070_g15_clone -X -Atqc "SELECT (SELECT count(*) FROM t070_fixture.live_updates u LEFT JOIN t070_fixture.live_sessions s ON u.session_id=s.id WHERE s.id IS NULL) + (SELECT count(*) FROM t070_fixture.ad_payments p LEFT JOIN t070_fixture.ad_campaigns c ON p.campaign_id=c.id WHERE c.id IS NULL);")"
[[ "$orphans" == 0 ]] || hold 'SOURCE_CLONE_FK_PARITY'
anon="$(docker exec "$db" psql -U postgres -d t070_g15_clone -X -Atqc 'SET ROLE anon;SELECT count(*) FROM t070_fixture.articles;RESET ROLE;' | grep -E '^[0-9]+$' | tail -n1)"
[[ "$anon" == 0 ]] || hold 'RESTORED_RLS_DENIAL'
mkdir -p "$d/media/source/grievance-private" "$d/media/source/private-editorial" "$d/media/source/public-media" "$d/media/restored"
printf 'G15_FAKE_G1' >"$d/media/source/grievance-private/a.dat"
printf 'G15_FAKE_G2' >"$d/media/source/grievance-private/b.dat"
printf 'G15_FAKE_ED' >"$d/media/source/private-editorial/a.dat"
printf 'G15_FAKE_P1' >"$d/media/source/public-media/a.dat"
printf 'G15_FAKE_P2' >"$d/media/source/public-media/b.dat"
(cd "$d/media/source" && find . -type f -print0 | sort -z | xargs -0 sha256sum) >"$d/original.sha"
[[ "$(wc -l < "$d/original.sha")" == 5 ]] || hold 'MEDIA_COUNT'
tar -C "$d/media/source" -cf "$d/files.tar" . || hold 'MEDIA_ARCHIVE'
tar -C "$d/media/restored" --no-same-owner --no-same-permissions -xf "$d/files.tar" || hold 'MEDIA_EXTRACT'
(cd "$d/media/restored" && sha256sum -c "$d/original.sha" >/dev/null) || hold 'MEDIA_PARITY'
printf 'CHANGED' >>"$d/media/restored/public-media/a.dat"
if (cd "$d/media/restored" && sha256sum -c "$d/original.sha" >/dev/null 2>&1); then hold 'TAMPER_UNDETECTED'; fi
health="$(curl --max-time 12 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:54321/auth/v1/health)"
[[ "$health" == 200 ]] || hold 'LOCAL_AUTH_HEALTH'
echo 'G15_REAL_SYNTHETIC_DB_DUMP_RESTORE=PASS'
echo 'G15_REAL_SYNTHETIC_ID_FK_ZERO_SOURCE_RELATIONS=PASS'
echo 'G15_REAL_SYNTHETIC_ANON_RLS_NEGATIVE=PASS'
echo 'G15_REAL_SYNTHETIC_FIVE_MEDIA_SHA_RESTORE=PASS'
echo 'G15_REAL_SYNTHETIC_TAMPER_DETECTION=PASS'
echo 'G15_LOCAL_AUTH_RUNTIME_HEALTH=PASS'
echo 'G15_JANTA_BOL_PRODUCTION_DB_OR_MEDIA_RESTORED=false'
echo 'G15_SINGLE_REAL_PRODUCTION_CHECKPOINT=false'
echo 'G15_EDGE_VERCEL_RUNTIME_RECONSTRUCTED=false'
echo 'T070_REAL_JOINT_E8=NOT_RUN'
