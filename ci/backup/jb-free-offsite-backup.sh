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
auto="${JB_T075_AUTO_JOINT_BACKUP:-0}"
[[ "$auto" == 0 || "$auto" == 1 ]] || fail 'invalid T075 scheduled backup mode'
if [[ "$auto" == 1 ]]; then
  [[ "$dual" == 1 && "$joint" == 1 ]] ||
    fail 'T075 scheduled mode cannot skip real original PG17 plus media restore'
  node --input-type=module -e "import {assertScheduledBackupContext} from './ci/phase4/b11/t075-scheduled-backup-identity.mjs'; assertScheduledBackupContext();" ||
    fail 'T075 scheduled workflow not independently approved'
fi
[[ "$dual" == 0 || "$dual" == 1 ]] || fail 'invalid dual-restore mode'
[[ "$joint" == 0 || "$joint" == 1 ]] || fail 'invalid joint-restore mode'
[[ "$joint" == 0 || "$dual" == 1 ]] || fail 'joint media restore requires existing dual-recipient PG restore'
if [[ "$dual" == 1 ]]; then
  if [[ "$auto" == 0 ]]; then
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
  else
    [[ "$joint" == 1 && "${JB_B11_SERVICE_ROLE_KEY:-}" != "" ]] ||
      fail 'T075 scheduled mode requires original protected service role and joint export'
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
if [[ "$auto" == 1 ]]; then
  # FREE-TIER COST CAP: metadata-only read of EXISTING remote before DB export.
  # No automatic deletes, pruning, overwrite, new bucket or retention downgrade.
  rclone --config "$work/rclone.conf" --retries 1 size --json "${JB_BACKUP_REMOTE_PREFIX%/}" > "$work/scheduled-budget.json" ||
    fail 'T075 scheduled offsite quota unreadable, refuse live export'
  python3 - "$work/scheduled-budget.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
n=d.get('bytes')
if not isinstance(n,int) or n<0 or n>2*1024**3:
 raise SystemExit('T075 scheduled backup offsite limit exceeded/unknown')
PY
  echo 'T075_SCHEDULED_EXISTING_ENCRYPTED_OFFSITE_BYTES_WITHIN_2GIB=PASS_METADATA_ONLY'
fi
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
    # The SAME exported PostgreSQL MVCC snapshot supplies editorial, Auth,
    # Live and Ads identity proof. Never print digest or identifier contents.
    jb_t034_snapshot_query ci/phase4/b11/t070-representative-identity.sql \
      "$work/plain/t070_representative_identity.txt" || \
      fail 'cannot capture source representative identity and relationship proof'
    [[ "$(wc -l < "$work/plain/t070_representative_identity.txt")" == 25 ]] || \
      fail 'T070 incomplete representative identity manifest'
    for n in 19 20 21 22 23 24 25; do
      grep -Fxq "${n}_orphan_check=0" "$work/plain/t070_representative_identity.txt" || \
        fail 'T070 source relationship integrity not verified'
    done
    mkdir -m 700 "$work/plain/media"
    node ci/phase4/b11/storage-media-manual-cli.mjs export-manual \
      --root "$work/plain/media" > "$work/private-media-export.log" 2>&1 ||
      fail 'original Storage media read-only export did not finish cleanly'
    node ci/phase4/b11/storage-media-manual-cli.mjs verify-offline \
      --root "$work/plain/media" > "$work/private-media-verify.log" 2>&1 ||
      fail 'source original five Storage file bytes fail SHA256 validation'
    # Fresh READ-ONLY PG lookup AFTER original-byte GET and stable listing;
    # never reuse the exported MVCC snapshot for this current-state gate.
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
    # One additional FRESH single-statement READ ONLY source transaction, after
    # media GET. All 25 representative row/relationship digests must match the
    # authoritative raw-dump MVCC snapshot; else do not assert a trusted point.
    # No auth identities, PURL, private grievance records or digests reach logs.
    {
      printf 'BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED, READ ONLY;\n'
      cat ci/phase4/b11/t070-representative-identity.sql
      printf '\nCOMMIT;\n'
    } | docker run --rm -i --network=host postgres:17 \
      psql -X -qAt -v ON_ERROR_STOP=1 "$JB_DB_URI" \
      > "$work/plain/t070_post_media_representative_identity.txt" \
      2> "$work/private-post-representative-db.err" || \
      fail 'fresh read-only representative DB post-media identity unavailable'
    [[ "$(wc -l < "$work/plain/t070_post_media_representative_identity.txt")" == 25 ]] || \
      fail 'T070 post-media representative identity scope incomplete'
    cmp -s "$work/plain/t070_representative_identity.txt" \
      "$work/plain/t070_post_media_representative_identity.txt" || \
      fail 'source Article/Grievance/LIVE/Ads/Auth changed during joint media acquisition'
    echo 'T070_FRESH_PG_POST_MEDIA_25_IDENTITY_FAMILIES=STABLE'
    node ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs \
      "$work/plain/t070_snapshot_storage.json" \
      "$work/plain/media/config/storage-export-readonly-summary.json" \
      "$work/plain/t070_post_media_current_storage.json" || \
      fail 'source Storage original five objects mismatch raw PG snapshot file identities'
    echo 'T070_REAL_SOURCE_FIVE_MEDIA_CAPTURED_WITH_PG_MVCC_SNAPSHOT=PASS'
  fi
  jb_t034_snapshot_finish
  printf 'T034_SOURCE_RAW_DUMP_AND_MANIFEST_SHARED_SNAPSHOT=CONFIRMED\n'
  [[ "$(wc -l < "$work/plain/source_db_identity.json")" == 1 ]] ||
    fail 'invalid source database identity record'
  python3 ci/backup/jb-t034-db-identity.py plan \
      "$work/plain/source_db_identity.json" "$work/identity-preflight.sql" ||
    fail 'source database identity outside reviewed owner/ACL allowlist'
  rm -f "$work/identity-preflight.sql"
  [[ "$(wc -l < "$work/plain/expected_identity.txt")" == 26 ]] ||
    fail 'invalid metric coverage in source baseline'
  ! grep -q '=MISSING' "$work/plain/expected_identity.txt" ||
    fail 'one of the four protected Ad RPCs is absent on live source'
fi
# SQL files contain personal/confidential data; never print their lines or hashes.
date -u +%Y-%m-%dT%H:%M:%SZ > "$work/plain/backup_utc.txt"
printf 'JANTA BOL production project vrffsnkycvjithwtiylt\n' > "$work/plain/source_project.txt"
# Age secret identity never exists in Actions; owner retains it offline.
bundle=(roles.sql schema.sql data.sql raw_full.dump raw_inventory.txt backup_utc.txt source_project.txt)
if [[ "$dual" == 1 ]]; then
  bundle+=(expected_identity.txt source_db_identity.json expected_security_identity.txt raw_dump_snapshot_id.txt snapshot_scope.txt security_parity_contract_sha256.txt expected_metric10_components.txt metric10_components_contract_sha256.txt)
fi
if [[ "$joint" == 1 ]]; then
  bundle+=(t070_snapshot_storage.json t070_post_media_current_storage.json t070_representative_identity.txt t070_post_media_representative_identity.txt media)
fi
tar -C "$work/plain" -cf - "${bundle[@]}" |
 zstd -T0 -q | age "${age_args[@]}" -o "$work/backup.age"
test -s "$work/backup.age" || fail "empty encrypted archive"
if [[ "$auto" == 1 ]]; then
  [[ "$(wc -c < "$work/backup.age")" -le 536870912 ]] ||
    fail 'T075 scheduled ciphertext bundle exceeds single-run 512MiB cap; no remote upload'
fi
name="production/database/$(date -u +%Y%m%dT%H%M%SZ)-run${GITHUB_RUN_ID}.tar.zst.age"
destination="${JB_BACKUP_REMOTE_PREFIX%/}/${name}"
# Fail if collision or remote access unavailable; no overwrites.
# Must be owner-provisioned private bucket/folder. Fail CLOSED if inaccessible.
rclone --config "$work/rclone.conf" lsf "${JB_BACKUP_REMOTE_PREFIX%/}" >/dev/null ||
 fail "approved offsite storage destination unavailable"
rclone --config "$work/rclone.conf" copyto --immutable "$work/backup.age" "$destination" >/dev/null ||
  fail "upload failed"
# Cryptographically verify ciphertext download bytes (does NOT prove DB restore).
rclone --config "$work/rclone.conf" copyto "$destination" "$work/remote.age" >/dev/null ||
 fail "cannot download encrypted backup for checksum comparison"
cmp -s "$work/backup.age" "$work/remote.age" || fail "remote ciphertext does not match source"
sha="$(sha256sum "$work/backup.age" | cut -d' ' -f1)"
bytes="$(wc -c < "$work/backup.age")"
printf 'OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true\nOBJECT_SUFFIX=%s\nSHA256_CIPHERTEXT=%s\nBYTES=%s\n' "$name" "$sha" "$bytes"
if [[ "$dual" == 1 ]]; then
  # Check that ciphertext was actually recovered from B2 before AGE decrypt.
  # The owner private key is NOT available on this runner.
  mkdir -m 700 "$work/recovered"
  age -d -i "$work/ephemeral-restore.identity" "$work/remote.age" |
    zstd -dq | tar --no-same-owner --no-same-permissions -C "$work/recovered" -xf - ||
    fail 'B2 ciphertext could not be decrypted into local isolated runner'
  for f in roles.sql schema.sql data.sql raw_full.dump raw_inventory.txt backup_utc.txt source_project.txt; do
    [[ -s "$work/recovered/$f" ]] || fail "missing recovered archive component $f"
    cmp -s "$work/plain/$f" "$work/recovered/$f" ||
      fail "recovered archive bytes differ from original component $f"
  done
  for f in raw_dump_snapshot_id.txt snapshot_scope.txt; do
    [[ -s "$work/recovered/$f" ]] || fail 'exported source snapshot metadata missing after AGE'
    cmp -s "$work/plain/$f" "$work/recovered/$f" ||
      fail 'source snapshot evidence differs after AGE decrypt'
  done
  [[ -s "$work/recovered/expected_security_identity.txt" ]] ||
    fail 'protected security parity digest absent after decrypt'
  cmp -s "$work/plain/expected_security_identity.txt" "$work/recovered/expected_security_identity.txt" ||
    fail 'security parity manifest changed after encrypted roundtrip'
  [[ -s "$work/recovered/expected_metric10_components.txt" &&
      -s "$work/recovered/metric10_components_contract_sha256.txt" ]] ||
    fail 'private metric10 component evidence missing after AGE'
  for f in expected_metric10_components.txt metric10_components_contract_sha256.txt; do
    cmp -s "$work/plain/$f" "$work/recovered/$f" ||
      fail 'private metric10 evidence altered during AGE roundtrip'
  done
  [[ "$(cat "$work/recovered/metric10_components_contract_sha256.txt")" == "$(sha256sum ci/backup/jb-t034-metric10-components.sql | cut -d' ' -f1)" ]] ||
    fail 'protected metric10 diagnostic contract changed'
  [[ -s "$work/recovered/security_parity_contract_sha256.txt" ]] ||
    fail 'encrypted parity contract SHA file absent'
  cmp -s "$work/plain/security_parity_contract_sha256.txt" "$work/recovered/security_parity_contract_sha256.txt" ||
    fail 'parity contract fingerprint changed in B2 roundtrip'
  [[ "$(cat "$work/recovered/security_parity_contract_sha256.txt")" == "$(sha256sum ci/backup/jb-t034-security-parity.sql | cut -d' ' -f1)" ]] ||
    fail 'source snapshot and clone parity comparison SQL revisions differ'
  [[ -s "$work/recovered/source_db_identity.json" ]] ||
    fail 'source DB owner/ACL manifest missing after encryption'
  cmp -s "$work/plain/source_db_identity.json" "$work/recovered/source_db_identity.json" ||
    fail 'source DB identity differs after encrypted B2 readback'
  [[ -s "$work/recovered/expected_identity.txt" ]] ||
    fail 'signed encrypted bundle lacks source snapshot-identity baseline'
  cmp -s "$work/plain/expected_identity.txt" "$work/recovered/expected_identity.txt" ||
    fail 'source baseline did not survive encrypted B2 round trip'
  printf 'T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS; OWNER_PRIVATE_KEY_NOT_USED=true\n'
  # Disposable Docker has NO NETWORK. No real DB write is ever allowed.
  # Fail closed if Supabase public functions require additional extensions/auth.
  bash ci/backup/jb-t034-offline-full-pg-restore.sh "$work/recovered" ||
    fail 'full isolated PG17 restore verification refused; B2 encrypted archive is preserved'
  if [[ "$joint" == 1 ]]; then
    cmp -s "$work/plain/t070_snapshot_storage.json" \
      "$work/recovered/t070_snapshot_storage.json" ||
      fail 'encrypted DB snapshot original media manifest changed in B2 roundtrip'
    [[ -s "$work/recovered/t070_representative_identity.txt" ]] || \
      fail 'representative identity absent in encrypted archive'
    cmp -s "$work/plain/t070_representative_identity.txt" \
      "$work/recovered/t070_representative_identity.txt" || \
      fail 'representative identity changed during AGE B2 roundtrip'
    [[ -s "$work/recovered/t070_post_media_representative_identity.txt" ]] || \
      fail 'fresh post-media representative identity absent in encrypted archive'
    cmp -s "$work/plain/t070_post_media_representative_identity.txt" \
      "$work/recovered/t070_post_media_representative_identity.txt" || \
      fail 'fresh post-media representative identity changed in AGE B2 roundtrip'
    cmp -s "$work/recovered/t070_representative_identity.txt" \
      "$work/recovered/t070_post_media_representative_identity.txt" || \
      fail 'source representative identity became inconsistent during media acquisition'
    [[ -s "$work/recovered/t070_post_media_current_storage.json" ]] || \
      fail 'fresh PG post-media identity absent in encrypted archive'
    cmp -s "$work/plain/t070_post_media_current_storage.json" \
      "$work/recovered/t070_post_media_current_storage.json" || \
      fail 'post-media PG identity changed during AGE B2 roundtrip'
    node ci/phase4/b11/storage-media-manual-cli.mjs verify-offline \
      --root "$work/recovered/media" > "$work/private-media-restored.log" 2>&1 ||
      fail 'five ORIGINAL Storage file bytes not recovered from encrypted B2 archive'
    node ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs \
      "$work/recovered/t070_snapshot_storage.json" \
      "$work/recovered/media/config/storage-export-readonly-summary.json" \
      "$work/recovered/t070_post_media_current_storage.json" ||
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
