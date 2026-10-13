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
: "${JB_BACKUP_RCLONE_CONFIG_B64:?private remote config secret missing}"
: "${GITHUB_RUN_ID:?manual GitHub Action only}"

[[ "${JB_BACKUP_AGE_RECIPIENT}" =~ ^age1[0-9a-z]+$ ]] || fail "invalid age recipient public key"
command -v age >/dev/null || fail "age not installed"
command -v rclone >/dev/null || fail "rclone not installed"
command -v supabase >/dev/null || fail "supabase CLI not installed"
command -v pg_dump >/dev/null || fail "pg_dump not installed"
command -v pg_restore >/dev/null || fail "pg_restore not installed"
command -v zstd >/dev/null || fail "zstd not installed"

work="$(mktemp -d)"
cleanup() { rm -rf -- "$work"; }
trap cleanup EXIT HUP INT TERM
mkdir -m 700 "$work/plain"
printf '%s' "$JB_BACKUP_RCLONE_CONFIG_B64" | base64 --decode > "$work/rclone.conf" || fail "private rclone remote config invalid"
chmod 600 "$work/rclone.conf"
# Config MUST name [jbbackup]. Never disclose remote auth.
rclone --config "$work/rclone.conf" listremotes | grep -Fxq 'jbbackup:' || fail "rclone [jbbackup] remote is not configured"
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
pg_dump --version >/dev/null
printf 'BACKUP: three Supabase-recommended filtered roles/schema/data dumps + full raw disaster archive\n'
supabase db dump --db-url "$JB_DB_URI" --role-only -f "$work/plain/roles.sql" >/dev/null
supabase db dump --db-url "$JB_DB_URI" -f "$work/plain/schema.sql" >/dev/null
supabase db dump --db-url "$JB_DB_URI" --use-copy --data-only -f "$work/plain/data.sql" >/dev/null
# Raw full DB archive, including auth/storage metadata omitted from filtered dump;
# Supabase-specific roles/extensions may need manual reconciliation on restoration.
pg_dump --format=custom --no-owner --file="$work/plain/raw_full.dump" "$JB_DB_URI" >/dev/null
pg_restore --list "$work/plain/raw_full.dump" > "$work/plain/raw_inventory.txt"
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
name="janta-bol/production/database/$(date -u +%Y%m%dT%H%M%SZ)-run${GITHUB_RUN_ID}.tar.zst.age"
destination="jbbackup:${name}"
# Fail if collision or remote access unavailable; no overwrites.
rclone --config "$work/rclone.conf" ls "jbbackup:janta-bol/production/database" >/dev/null 2>&1 || :
rclone --config "$work/rclone.conf" copyto --immutable "$work/backup.age" "$destination" >/dev/null ||
  fail "upload failed"
# Cryptographically verify ciphertext download bytes (does NOT prove DB restore).
rclone --config "$work/rclone.conf" copyto "$destination" "$work/remote.age" >/dev/null ||
 fail "cannot download encrypted backup for checksum comparison"
cmp -s "$work/backup.age" "$work/remote.age" || fail "remote ciphertext does not match source"
sha="$(sha256sum "$work/backup.age" | cut -d' ' -f1)"
bytes="$(wc -c < "$work/backup.age")"
printf 'OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true\nREMOTE_OBJECT=%s\nSHA256_CIPHERTEXT=%s\nBYTES=%s\n' "$name" "$sha" "$bytes"
printf 'RESTORE_VERIFIED=false (needs separate offline age identity + disposable isolated restore)\n'
