#!/usr/bin/env bash
# JANTA BOL only. RUN MANUALLY only after Owner has selected PRIVATE offsite
# rclone storage and generated an OFFLINE-HOLD age identity (NEVER in GitHub).
# No Github artifact/repository data backup; ciphertext remote only.
set -Eeuo pipefail
set +x
umask 077

fail(){ printf 'BACKUP_FAIL_CLOSED: %s\n' "$1" >&2; exit 1; }
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD secret missing}"
: "${JB_BACKUP_AGE_RECIPIENT:?age public recipient key missing}"
: "${JB_BACKUP_B2_KEY_ID:?JANTA BOL Backblaze scoped key ID missing}"
: "${JB_BACKUP_B2_APPLICATION_KEY:?JANTA BOL Backblaze scoped secret missing}"
: "${JB_BACKUP_REMOTE_PREFIX:?user-controlled private offsite path missing}"
: "${GITHUB_RUN_ID:?manual GitHub Action only}"

[[ "${JB_BACKUP_AGE_RECIPIENT}" =~ ^age1[0-9a-z]+$ ]] || fail "invalid age recipient public key"
[[ "${JB_BACKUP_REMOTE_PREFIX}" =~ ^jbbackup:jantabol-backup-euc-2026(/[a-zA-Z0-9._/-]+)?$ ]] ||
 fail "JANTA BOL ONLY: remote prefix must target dedicated approved jantabol-backup-euc-2026 bucket"
[[ "${JB_BACKUP_REMOTE_PREFIX}" != *'..'* ]] || fail "invalid remote path"
command -v age >/dev/null || fail "age not installed"
command -v rclone >/dev/null || fail "rclone not installed"
command -v supabase >/dev/null || fail "supabase CLI not installed"
command -v docker >/dev/null || fail "Docker required for exact PostgreSQL 17 client"
command -v zstd >/dev/null || fail "zstd not installed"

# Existing manual backup remains the DEFAULT, unchanged path (mode=0).
# A dual-identity real clone run requires distinct manual workflow authorization.
dual="${JB_T034_DUAL_RESTORE_PROBE:-0}"
joint="${JB_T070_JOINT_PROBE:-0}"
[[ "$dual" == 0 || "$dual" == 1 ]] || fail 'invalid dual-restore mode'
[[ "$joint" == 0 || "$joint" == 1 ]] || fail 'invalid joint-restore mode'
[[ "$joint" == 0 || "$dual" == 1 ]] || fail 'joint media restore requires existing dual-recipient PG restore'
if [[ "$dual" == 1 ]]; then
  [[ "${GITHUB_ACTIONS:-}" == true &&
     "${GITHUB_EVENT_NAME:-}" == workflow_dispatch &&
     "${GITHUB_REF:-}" == refs/heads/main &&
     "${GITHUB_REPOSITORY:-}" == jantabol/JANTA-BOL-Website &&
     "${GITHUB_ACTOR:-}" == jantabol &&
     "${GITHUB_RUN_ATTEMPT:-}" == 1 ]] ||
    fail 'real isolated clone verification denied: manual Founder/main/first attempt required'
  if [[ "$joint" == 1 ]]; then
    [[ "${GITHUB_WORKFLOW_REF:-}" == 'jantabol/JANTA-BOL-Website/.github/workflows/b11-t070-real-joint-restore-MANUAL.yml@refs/heads/main' &&
       "${B11_MEDIA_EXPORT_CONFIRMATION:-}" == 'JANTA_BOL_T070_JOINT_EXPORT_ONLY' &&
       -n "${JB_B11_SERVICE_ROLE_KEY:-}" ]] ||
      fail 'T070 requires a separate, protected, reviewed, Founder-only real joint workflow'
  else
    [[ "${GITHUB_WORKFLOW_REF:-}" == 'jantabol/JANTA-BOL-Website/.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml@refs/heads/main' ]] ||
      fail 'legacy T034 manual workflow identity required'
  fi
  command -v age-keygen >/dev/null || fail 'AGE key generator missing'
fi

work="$(mktemp -d)"
cleanup() {
  # A crashed or interrupted export must release its PG snapshot transaction.
  if declare -F jb_t034_snapshot_finish >/dev/null; then
    jb_t034_snapshot_finish
  fi
  rm -rf -- "$work"
}
trap cleanup EXIT HUP INT TERM
mkdir -m 700 "$work/plain"
# Runner private identity never enters GitHub logs, artifact, B2, tar or chat.
age_args=(-r "$JB_BACKUP_AGE_RECIPIENT")
if [[ "$dual" == 1 ]]; then
  age-keygen -o "$work/ephemeral-restore.identity" > /dev/null 2>&1 ||
    fail 'cannot generate disposable AGE identity'
  ephemeral_recipient="$(age-keygen -y "$work/ephemeral-restore.identity")" ||
    fail 'cannot derive disposable AGE public recipient'
  [[ "$ephemeral_recipient" =~ ^age1[0-9a-z]+$ &&
     "$ephemeral_recipient" != "$JB_BACKUP_AGE_RECIPIENT" ]] ||
    fail 'invalid or duplicate disposable AGE public recipient'
  age_args+=(-r "$ephemeral_recipient")
  unset ephemeral_recipient
fi
# Build b2 native config from owner-entered GitHub Environment secrets, NEVER in repo or logs.
python3 ci/backup/jb-b2-rclone-config.py "$work/rclone.conf" || fail "JANTA BOL B2 config invalid"
# Verify remote name and approved JANTA BOL private bucket BEFORE accessing database.
rclone --config "$work/rclone.conf" listremotes | grep -Fxq 'jbbackup:' || fail "rclone [jbbackup] remote is not configured"
rclone --config "$work/rclone.conf" --retries 1 lsf "jbbackup:jantabol-backup-euc-2026" >/dev/null ||
 fail "JANTA BOL bucket unavailable or scoped key missing list/read permissions; no DB export was attempted"
# Validate age recipient can encrypt public, disposable synthetic data without private key.
printf 'JANTA_BOL_ONLY_NON_SECRET_PREFLIGHT\n' | age -r "$JB_BACKUP_AGE_RECIPIENT" -o "$work/public-recipient-probe.age" ||
 fail "invalid JANTA BOL age public recipient; no DB export was attempted"
rm -f -- "$work/public-recipient-probe.age"
# Required connection string is session pooler, exactly JANTA BOL project.
# Percent encode all characters (avoid broken URI for !/@/# in password).
export JB_DB_URI
JB_DB_URI="$(python3 - <<'PY'
import os
from urllib.parse import quote
pw=quote(os.environ["SUPABASE_DB_PASSWORD"], safe="")
print("postgresql://postgres.vrffsnkycvjithwtiylt:"+pw+
      "@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require")
PY
)"
# Mask encoded and full connection string in Actions logs; do not echo args.
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  printf '::add-mask::%s\n' "$JB_DB_URI"
fi
export PGSSLMODE=require
export PGCONNECT_TIMEOUT=15
# Expected checkout data without copying any sensitive rows to stdout.
docker run --rm postgres:17 pg_dump --version >/dev/null
printf 'BACKUP: three Supabase-recommended filtered roles/schema/data dumps + full raw disaster archive\n'
supabase db dump --db-url "$JB_DB_URI" --role-only -f "$work/plain/roles.sql" >/dev/null
supabase db dump --db-url "$JB_DB_URI" -f "$work/plain/schema.sql" >/dev/null
supabase db dump --db-url "$JB_DB_URI" --use-copy --data-only -f "$work/plain/data.sql" >/dev/null
# Raw full DB archive, including auth/storage metadata omitted from filtered dump;
# Supabase-specific roles/extensions may need manual reconciliation on restoration.
# Default legacy manual backup path unchanged. New explicitly authorized
# double-recipient DR mode preserves table/function owners and original ACLs.
raw_dump_args=(--format=custom --file=/backup/raw_full.dump)
if [[ "$dual" == 0 ]]; then
  raw_dump_args+=(--no-owner)
else
  source ci/backup/jb-t034-shared-snapshot.sh
  JB_T034_SNAPSHOT_WORK="$work"
  jb_t034_snapshot_start || fail 'cannot maintain READ-ONLY exported source snapshot'
  raw_dump_args+=(--snapshot="$JB_T034_SNAPSHOT_ID")
  printf '%s\n' "$JB_T034_SNAPSHOT_ID" > "$work/plain/raw_dump_snapshot_id.txt"
  printf 'SOURCE_RAW_DUMP_SHARED_SNAPSHOT=YES; AUXILIARY_FILTERED_EXPORTS_SHARED_SNAPSHOT=NO\n' \
    > "$work/plain/snapshot_scope.txt"
fi
docker run --rm --network=host -v "$work/plain:/backup" postgres:17 \
  pg_dump "${raw_dump_args[@]}" "$JB_DB_URI" >/dev/null
docker run --rm -v "$work/plain:/backup:ro" postgres:17 \
  pg_restore --list /backup/raw_full.dump > "$work/plain/raw_inventory.txt"
for fname in roles.sql schema.sql data.sql raw_full.dump raw_inventory.txt; do
  test -s "$work/plain/$fname" || fail "empty backup component $fname"
done
if [[ "$dual" == 1 ]]; then
  # Both manifests import the VERY SAME exported snapshot as raw pg_dump.
  # No fresh-count fallback is allowed after concurrent production writes.
  jb_t034_snapshot_query ci/backup/jb-t034-restore-baseline.sql \
    "$work/plain/expected_identity.txt" ||
    fail 'cannot read count/RPC manifest in exported snapshot'
  jb_t034_snapshot_query ci/backup/jb-t034-db-identity.sql \
    "$work/plain/source_db_identity.json" ||
    fail 'cannot read source owner/ACL/locale in exported snapshot'
  jb_t034_snapshot_query ci/backup/jb-t034-security-parity.sql \
    "$work/plain/expected_security_identity.txt" ||
    fail 'cannot read protected full-row/security parity in exported snapshot'
  [[ "$(wc -l < "$work/plain/expected_security_identity.txt")" == 16 ]] ||
    fail 'security manifest coverage is incomplete'
  # Protected metric-10 per-relation evidence is snapshot-bound, encrypted,
  # ephemeral and NEVER printed or uploaded unencrypted.
  jb_t034_snapshot_query ci/backup/jb-t034-metric10-components.sql \
    "$work/plain/expected_metric10_components.txt" ||
    fail 'cannot capture private metric10 components'
  python3 ci/backup/jb-t034-metric10-diagnostics.py \
    "$work/plain/expected_metric10_components.txt" \
    "$work/plain/expected_metric10_components.txt" > "$work/metric10-validation.log" 2>&1 ||
    fail 'invalid private metric10 evidence'
  sha256sum ci/backup/jb-t034-metric10-components.sql | cut -d' ' -f1 > "$work/plain/metric10_components_contract_sha256.txt"
  sha256sum ci/backup/jb-t034-security-parity.sql | cut -d' ' -f1 > "$work/plain/security_parity_contract_sha256.txt"
  if [[ "$joint" == 1 ]]; then
    # Capture original media while authoritative raw DB MVCC snapshot is still held.
    # All payloads/manifests remain in 0700 ephemeral runner and later AGE ciphertext.
    jb_t034_snapshot_query ci/phase4/b11/t070-joint-storage-snapshot-identity.sql \
      "$work/plain/t070_snapshot_storage.json" ||
      fail 'cannot capture private original-file identities from same full DB snapshot'
    [[ -s "$work/plain/t070_snapshot_storage.json" ]] ||
      fail 'empty protected snapshot media metadata'
    mkdir -m 700 "$work/plain/media"
    node ci/phase4/b11/storage-media-manual-cli.mjs export-manual \
      --root "$work/plain/media" > "$work/private-media-export.log" 2>&1 ||
      fail 'original Storage media read-only export did not finish cleanly'
    node ci/phase4/b11/storage-media-manual-cli.mjs verify-offline \
      --root "$work/plain/media" > "$work/private-media-verify.log" 2>&1 ||
      fail 'source original five Storage file bytes fail SHA256 validation'
    # Independent, FRESH READ-ONLY query after Storage GETs; not the
    # previously exported MVCC snapshot. Never log object IDs or timestamps.
    {
      printf 'BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED, READ ONLY;\n'
      cat ci/phase4/b11/t070-joint-storage-snapshot-identity.sql
      printf '\nCOMMIT;\n'
    } | docker run --rm -i --network=host postgres:17 \
      psql -X -qAt -v ON_ERROR_STOP=1 "$JB_DB_URI" \
      > "$work/plain/t070_post_media_current_storage.json" \
      2> "$work/private-post-media-db.err" || \
      fail 'fresh read-only Storage DB post-media identity check unavailable'
    [[ -s "$work/plain/t070_post_media_current_storage.json" ]] || \
      fail 'fresh Storage DB post-media identity empty'
    node ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs \
      "$work/recovered/t070_snapshot_storage.json" \
      "$work/recovered/media/config/storage-export-readonly-summary.json" \
      "$work/recovered/t070_post_media_current_storage.json" || \
      fail 'restored real PG snapshot does not match restored original media identities'
    echo 'T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS'
    echo 'T070_ACTUAL_GO_TRUE_EDGE_VERCEL_CONFIG_RUNTIME=NOT_RESTORED'
    echo 'T070_FINAL_INDEPENDENT_E8=NOT_RUN'
    echo 'T070_FINAL_LOCK=HOLD'
  else
    printf 'T034_FULL_PG_DATABASE_SCOPE=PASS; STORAGE_MEDIA_AND_PLATFORM_CONFIG_NOT_PROVEN=true\n'
  fi
else
  printf 'RESTORE_VERIFIED=false (needs separate offline age identity + disposable isolated restore)\n'
fi
