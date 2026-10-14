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

work="$(mktemp -d)"
cleanup() { rm -rf -- "$work"; }
trap cleanup EXIT HUP INT TERM
mkdir -m 700 "$work/plain"
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
docker run --rm --network=host -v "$work/plain:/backup" postgres:17 \
  pg_dump --format=custom --no-owner --file=/backup/raw_full.dump "$JB_DB_URI" >/dev/null
docker run --rm -v "$work/plain:/backup:ro" postgres:17 \
  pg_restore --list /backup/raw_full.dump > "$work/plain/raw_inventory.txt"
for fname in roles.sql schema.sql data.sql raw_full.dump raw_inventory.txt; do
  test -s "$work/plain/$fname" || fail "empty backup component $fname"
done
# SQL files contain personal/confidential data; never print their lines or hashes.
date -u +%Y-%m-%dT%H:%M:%SZ > "$work/plain/backup_utc.txt"
printf 'JANTA BOL production project vrffsnkycvjithwtiylt\n' > "$work/plain/source_project.txt"
# Age secret identity never exists in Actions; owner retains it offline.
tar -C "$work/plain" -cf - roles.sql schema.sql data.sql raw_full.dump raw_inventory.txt backup_utc.txt source_project.txt |
 zstd -T0 -q | age -r "$JB_BACKUP_AGE_RECIPIENT" -o "$work/backup.age"
test -s "$work/backup.age" || fail "empty encrypted archive"
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
printf 'RESTORE_VERIFIED=false (needs separate offline age identity + disposable isolated restore)\n'
