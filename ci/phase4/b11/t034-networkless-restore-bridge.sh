#!/usr/bin/env bash
# JANTA BOL B11: protected adapter to OLD T034 offline full PG17 recovery helper.
# No live DB/Cricket endpoints; actual clone requires a separate manual approval.
set -Eeuo pipefail
set +x
umask 077
fail(){ printf 'B11_T034_HOLD: %s\n' "$1" >&2; exit 3; }
[[ "$#" == 4 || "$#" == 5 ]] || fail 'usage: preflight|run SOURCE SIGNATURE TRUSTED_PUBLIC_KEY [confirmation]'
mode="$1";src="$2";sig="$3";trusted="$4";confirm="";[[ "$#" == 4 ]] || confirm="$5"
[[ "$mode" == preflight || "$mode" == run ]] || fail 'invalid mode'
[[ -d "$src" && -f "$sig" && -f "$trusted" ]] || fail 'offline source/provenance paths unavailable'
[[ "${B11_SOURCE_PROJECT:-vrffsnkycvjithwtiylt}" == vrffsnkycvjithwtiylt ]] || fail 'JANTA BOL only project permitted'
[[ -f ci/backup/jb-t034-offline-full-pg-restore.sh ]] || fail 'original T034 code missing'
command -v node >/dev/null || fail 'Node required'
node ci/phase4/b11/cli.mjs verify-trusted --path "$src" --signature "$sig" --trust-key "$trusted" > /dev/null ||
 fail 'detached authentication or source media hashes invalid'
[[ -f "$src/db/raw_full.dump" ]] || fail 'raw PostgreSQL custom archive missing'
[[ "$(head -c 5 -- "$src/db/raw_full.dump")" == "PGDMP" ]] ||
 fail 'fake/non-custom PostgreSQL archive refused'
for name in source_db_identity.json raw_dump_snapshot_id.txt snapshot_scope.txt security_parity_contract_sha256.txt metric10_components_contract_sha256.txt expected_metric10_components.txt source_project.txt; do
 [[ -s "$src/db/$name" ]] || fail 'existing T034 source evidence missing'
done
if [[ "$mode" == preflight ]]; then
 echo 'B11_T034_EXTERNAL_SIGNATURE=PASS; REUSED_OLD_T034_HELPER=true; ACTUAL_RESTORE_NOT_RUN=true'
 exit 0
fi
[[ "$confirm" == JANTA_BOL_OFFLINE_FULL_DB_RESTORE_ONLY &&
 "${B11_FOUNDER_APPROVED_OFFLINE_DRILL:-}" == YES &&
 "${GITHUB_ACTIONS:-}" == true &&
 "${GITHUB_EVENT_NAME:-}" == workflow_dispatch &&
 "${GITHUB_REPOSITORY:-}" == jantabol/JANTA-BOL-Website &&
 "${GITHUB_ACTOR:-}" == jantabol &&
 "${GITHUB_REF:-}" == refs/heads/main &&
 "${GITHUB_RUN_ATTEMPT:-}" == 1 ]] ||
 fail 'Founder manual main branch authorization REQUIRED'
command -v docker >/dev/null || fail 'networkless Docker unavailable'
[[ -z "${JB_DB_URI:-}" && -z "${SUPABASE_DB_PASSWORD:-}" &&
 -z "${SUPABASE_SERVICE_ROLE_KEY:-}" && -z "${JB_BACKUP_B2_APPLICATION_KEY:-}" ]] ||
 fail 'production credentials cannot be in offline clone environment'
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
mkdir -m 700 "$tmp/t034"
cp -R -- "$src/db/." "$tmp/t034/"
bash ci/backup/jb-t034-offline-full-pg-restore.sh "$tmp/t034" ||
 fail 'original offline full PG17 restore failed'
echo 'B11_REUSED_ORIGINAL_T034_OFFLINE_PG17=PASS'
