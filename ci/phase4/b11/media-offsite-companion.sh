#!/usr/bin/env bash
# B11 media bytes + source identity companion for existing T034 database backup.
# Manual media evidence only, never production mutations/restores.
# Do not upload plaintext, identities or any GitHub Actions artifact.
set -Eeuo pipefail
set +x
umask 077
fail(){ echo "B11_MEDIA_HOLD: $1" >&2; exit 3; }
[[ "$#" == 4 ]] || fail 'usage: synthetic-local|manual-offsite|manual-storage SOURCE SIGNATURE TRUSTED_PUB'
mode="$1";source_dir="$2";signature="$3";trusted_pub="$4"
[[ "$mode" == synthetic-local || "$mode" == manual-offsite || "$mode" == manual-storage ]] || fail 'invalid mode'
[[ -d "$source_dir" ]] || fail 'source offline folder required'
if [[ "$mode" == manual-storage ]]; then
  [[ -s "$source_dir/config/storage-export-readonly-summary.json" && -d "$source_dir/storage" ]] ||
    fail 'exact protected original Supabase Storage export receipt required'
  node ci/phase4/b11/cli.mjs storage-verify-offline --out "$source_dir" >/dev/null ||
    fail 'private receipt object SHA/count/path does not match supplied media file bytes'
else
 [[ -f "$signature" && -f "$trusted_pub" ]] ||
 fail 'source plus independent Owner attestation required'
fi
for name in age age-keygen tar zstd sha256sum node; do
 command -v "$name" >/dev/null || fail 'required offline encryption tool missing'
done
if [[ "$mode" != manual-storage ]]; then
  node ci/phase4/b11/cli.mjs verify-trusted --path "$source_dir" --signature "$signature" --trust-key "$trusted_pub" >/dev/null ||
   fail 'cryptographic media and identity attestation failure'
fi
tmp="$(mktemp -d)"
cleanup(){ rm -rf -- "$tmp"; }
trap cleanup EXIT
[[ "$mode" == synthetic-local ]] || {
 [[ "${GITHUB_ACTIONS:-}" == true &&
    "${GITHUB_EVENT_NAME:-}" == workflow_dispatch &&
    "${GITHUB_REPOSITORY:-}" == jantabol/JANTA-BOL-Website &&
    "${GITHUB_ACTOR:-}" == jantabol &&
    "${GITHUB_REF:-}" == refs/heads/main &&
    "${GITHUB_RUN_ATTEMPT:-}" == 1 &&
    ( ( "$mode" == manual-offsite && "${B11_FOUNDER_APPROVED_MEDIA_OFFSITE:-}" == JANTA_BOL_MEDIA_ONLY ) ||
      ( "$mode" == manual-storage && "${B11_FOUNDER_APPROVED_MEDIA_OFFSITE:-}" == JANTA_BOL_MEDIA_EXPORT_ONLY ) ) &&
    -n "${GITHUB_RUN_ID:-}" ]] || fail 'manual Owner/main release not authorized'
}
primary="${JB_BACKUP_AGE_RECIPIENT:-}"
[[ "$primary" =~ ^age1[0-9a-z]+$ ]] || fail 'approved AGE public recipient missing'
age-keygen -o "$tmp/disposable.age.key" >/dev/null 2>&1 ||
 fail 'disposable AGE identity generation failed'
tmp_pub="$(age-keygen -y "$tmp/disposable.age.key")"
[[ "$tmp_pub" =~ ^age1[0-9a-z]+$ && "$tmp_pub" != "$primary" ]] ||
 fail 'independent encryption recipient required'
tar --format=posix -C "$source_dir" -cf "$tmp/source.tar" . ||
 fail 'source packaging error'
if [[ "$mode" != manual-storage ]]; then
 cp -- "$signature" "$tmp/signature.json"
 tar --append --format=posix -f "$tmp/source.tar" -C "$tmp" signature.json ||
  fail 'cannot include external detached signature'
fi
zstd -q -f -T1 "$tmp/source.tar" -o "$tmp/source.tar.zst" ||
 fail 'media compression error'
age -r "$primary" -r "$tmp_pub" -o "$tmp/offsite.age" "$tmp/source.tar.zst" ||
 fail 'encrypted bundle creation failure'
test -s "$tmp/offsite.age" || fail 'empty ciphertext'
if [[ "$mode" == synthetic-local ]]; then
 cp "$tmp/offsite.age" "$tmp/offsite-downloaded.age"
else
 [[ "${JB_BACKUP_REMOTE_PREFIX:-}" =~ ^jbbackup:jantabol-backup-euc-2026(/[a-zA-Z0-9._/-]+)?$ ]] ||
 fail 'wrong B2 bucket/account scope'
 [[ "${JB_BACKUP_REMOTE_PREFIX}" != *'..'* ]] || fail 'B2 traversal'
 for name in JB_BACKUP_B2_KEY_ID JB_BACKUP_B2_APPLICATION_KEY; do
  [[ -n "${!name:-}" ]] || fail 'B2 scoped key not present'
 done
 command -v rclone >/dev/null || fail 'rclone required'
 python3 ci/backup/jb-b2-rclone-config.py "$tmp/rclone.conf" ||
 fail 'existing JANTA BOL rclone builder rejected credentials'
 dest="${JB_BACKUP_REMOTE_PREFIX}/b11/media/${GITHUB_RUN_ID}-first-run.age"
 # Fail-closed: existing immutable name must never be overwritten.
 if rclone --config "$tmp/rclone.conf" lsf "$dest" >/dev/null 2>&1; then
  fail 'remote media object already exists'
 fi
 rclone --config "$tmp/rclone.conf" copyto --immutable   "$tmp/offsite.age" "$dest" || fail 'private B2 encrypted media upload failed'
 rclone --config "$tmp/rclone.conf" copyto "$dest" "$tmp/offsite-downloaded.age" ||
 fail 'B2 readback unavailable'
fi
cmp -s "$tmp/offsite.age" "$tmp/offsite-downloaded.age" ||
 fail 'remote/offline ciphertext readback digest mismatch'
age -d -i "$tmp/disposable.age.key" -o "$tmp/recovered.tar.zst" "$tmp/offsite-downloaded.age" ||
 fail 'downloaded ciphertext not decryptable with independent identity'
cmp -s "$tmp/source.tar.zst" "$tmp/recovered.tar.zst" ||
 fail 'original signed media archive not byte identical after roundtrip'
# Independently reconstruct the downloaded encrypted archive into disposable
# offline files. A ciphertext/compressed-tar equality check ALONE is not a real
# original-file recovery verification. Never extract into production or runner home.
mkdir -m 700 "$tmp/restored-original-bytes"
zstd -q -d -f "$tmp/recovered.tar.zst" -o "$tmp/recovered.tar" ||
 fail 'readback decrypted payload cannot be decompressed'
tar --extract --file "$tmp/recovered.tar" --directory "$tmp/restored-original-bytes" \
 --no-same-owner --no-same-permissions ||
 fail 'readback archive cannot be extracted to isolated temp'
if [[ "$mode" == manual-storage ]]; then
  # Real original source receipts include exact per-object bytes and SHA256.
  node ci/phase4/b11/cli.mjs storage-verify-offline --out "$tmp/restored-original-bytes" >/dev/null ||
   fail 'readback restoration media byte-by-byte SHA/content verification failed'
  echo 'B11_MEDIA_RESTORED_ORIGINAL_STORAGE_FILE_BYTES=VERIFIED_FROM_DOWNLOADED_CIPHERTEXT'
else
  # A detached signature from the archive becomes an INDEPENDENT file, not
  # accepted as an alternate trust anchor. Trusted public key supplied outside.
  mv -- "$tmp/restored-original-bytes/signature.json" "$tmp/readback-detached.json" ||
   fail 'detached signer missing from recovered archive'
  node ci/phase4/b11/cli.mjs verify-trusted \
   --path "$tmp/restored-original-bytes" --signature "$tmp/readback-detached.json" \
   --trust-key "$trusted_pub" >/dev/null ||
   fail 'readback restored original files failed independent Owner-signed manifest'
  echo 'B11_MEDIA_RESTORED_SOURCE_CONTENT_SIGNATURE=PASS'
fi
sha="$(sha256sum "$tmp/offsite-downloaded.age" | cut -d' ' -f1)"
[[ "$sha" =~ ^[a-f0-9]{64}$ ]] || fail 'invalid verified hash'
echo "B11_MEDIA_ENCRYPTED_OFFSITE_ROUNDTRIP=PASS"
echo "B11_MEDIA_CIPHERTEXT_SHA256=$sha"
if [[ "$mode" == synthetic-local ]]; then
 echo 'B11_MEDIA_EVIDENCE_KIND=SYNTHETIC_LOCAL_NOT_REAL_B2'
elif [[ "$mode" == manual-storage ]]; then
 echo 'B11_MEDIA_EVIDENCE_KIND=MANUAL_STORAGE_BYTES_REAL_B2_NO_DB_SNAPSHOT_OR_FOUNDER_SIGNATURE'
else
 echo 'B11_MEDIA_EVIDENCE_KIND=MANUAL_BACKBLAZE_B2_REAL_NO_CREDENTIALS_EXPOSED'
fi
