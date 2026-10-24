#!/usr/bin/env bash
# JANTA BOL T069 / MEDIA ONLY. No live SQL, deletes, restore-over-LIVE, or Cricket.
set -Eeuo pipefail
set +x
umask 077
fail(){ printf 'T069_MEDIA_HOLD: %s\n' "$1" >&2;exit 3; }
[[ "$#" == 1 && -d "$1" ]] || fail 'one offline original Storage export directory required'
src="$1"
[[ "${GITHUB_ACTIONS:-}" == true && "${GITHUB_REPOSITORY:-}" == jantabol/JANTA-BOL-Website &&
   "${GITHUB_EVENT_NAME:-}" == workflow_dispatch && "${GITHUB_ACTOR:-}" == jantabol &&
   "${GITHUB_REF:-}" == refs/heads/main && "${GITHUB_RUN_ATTEMPT:-}" == 1 &&
   "${GITHUB_WORKFLOW_REF:-}" == jantabol/JANTA-BOL-Website/.github/workflows/b11-storage-media-MANUAL.yml@refs/heads/main &&
   "${B11_FOUNDER_APPROVED_MEDIA_OFFSITE:-}" == JANTA_BOL_MEDIA_EXPORT_ONLY &&
   -n "${GITHUB_RUN_ID:-}" ]] || fail 'Founder/main/manual protected release missing'
[[ "${JB_BACKUP_AGE_RECIPIENT:-}" =~ ^age1[0-9a-z]+$ ]] ||
 fail 'Founder primary public age encryption recipient missing'
[[ "${JB_BACKUP_REMOTE_PREFIX:-}" =~ ^jbbackup:jantabol-backup-euc-2026(/[a-zA-Z0-9._/-]+)?$ &&
 "${JB_BACKUP_REMOTE_PREFIX}" != *'..'* ]] || fail 'JANTA BOL-only dedicated B2 prefix required'
for name in JB_BACKUP_B2_KEY_ID JB_BACKUP_B2_APPLICATION_KEY; do
 [[ -n "${!name:-}" ]] || fail 'Backblaze protected scoped secret absent'
done
for cmd in age age-keygen zstd tar rclone node sha256sum cmp;do
 command -v "$cmd" >/dev/null || fail 'required backup tool unavailable'
done
[[ -s "$src/config/storage-export-readonly-summary.json" ]] ||
 fail 'original 3-bucket source receipt absent'
node ci/phase4/b11/storage-media-manual-cli.mjs verify-offline --root "$src" >/dev/null ||
 fail 'source original Storage bytes not SHA verified'
tmp="$(mktemp -d)"
cleanup(){ rm -rf -- "$tmp"; }
trap cleanup EXIT
age-keygen -o "$tmp/ephemeral-age.key" >/dev/null 2>&1 ||
 fail 'ephemeral decrypt verifier recipient unavailable'
secondary="$(age-keygen -y "$tmp/ephemeral-age.key")"
[[ "$secondary" =~ ^age1[0-9a-z]+$ && "$secondary" != "$JB_BACKUP_AGE_RECIPIENT" ]] ||
 fail 'wrong independent decryption key'
tar --format=posix -C "$src" -cf "$tmp/media.tar" ./storage ./config ||
 fail 'cannot package original media and private receipt'
zstd -q -f -T1 "$tmp/media.tar" -o "$tmp/media.tar.zst" ||
 fail 'compression failed'
age -r "$JB_BACKUP_AGE_RECIPIENT" -r "$secondary" \
 -o "$tmp/owner-encrypted.age" "$tmp/media.tar.zst" ||
 fail 'dual-recipient AGE encryption failed'
python3 ci/backup/jb-b2-rclone-config.py "$tmp/rclone.conf" ||
 fail 'existing JANTA BOL-only B2 config builder failed'
dest="${JB_BACKUP_REMOTE_PREFIX}/b11/media/${GITHUB_RUN_ID}-first-run.age"
rclone --config "$tmp/rclone.conf" copyto --immutable "$tmp/owner-encrypted.age" "$dest" ||
 fail 'immutable encrypted Backblaze B2 upload failed'
rclone --config "$tmp/rclone.conf" copyto "$dest" "$tmp/readback.age" ||
 fail 'new encrypted Backblaze B2 object readback failed'
cmp -s "$tmp/owner-encrypted.age" "$tmp/readback.age" ||
 fail 'ciphertext bytes changed between upload and readback'
age -d -i "$tmp/ephemeral-age.key" -o "$tmp/download-restored.tar.zst" "$tmp/readback.age" ||
 fail 'downloaded B2 ciphertext AGE authenticated decrypt failed'
zstd -q -f -d "$tmp/download-restored.tar.zst" -o "$tmp/download-restored.tar" ||
 fail 'decompressed ciphertext invalid'
mkdir -m 700 "$tmp/disposable-restored"
tar --extract --file "$tmp/download-restored.tar" --directory "$tmp/disposable-restored" \
 --no-same-owner --no-same-permissions ||
 fail 'disposable real media payload extract failed'
node ci/phase4/b11/storage-media-manual-cli.mjs verify-offline --root "$tmp/disposable-restored" > "$tmp/private-parity.json" ||
 fail 'independent restored Storage original-file hash/count/size mismatch'
receipt_count="$(node -e 'const a=require(process.argv[1]);console.log(a.file_count)' "$tmp/private-parity.json")"
cipher_sha="$(sha256sum "$tmp/readback.age" | cut -d' ' -f1)"
[[ "$cipher_sha" =~ ^[a-f0-9]{64}$ && "$receipt_count" =~ ^[1-9][0-9]*$ ]] ||
 fail 'private media proof invalid'
echo 'B11_T069_ENCRYPTED_ORIGINAL_MEDIA_B2_READBACK=PASS'
echo 'B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS'
echo "B11_T069_ORIGINAL_MEDIA_FILES_RESTORED=$receipt_count"
echo "B11_T069_B2_CIPHERTEXT_SHA256=$cipher_sha"
echo 'B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false'
