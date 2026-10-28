#!/usr/bin/env python3
"""T075 review-only scheduled backup budget gate. No network, no credentials, no deletes.

preflight: check existing private B2 prefix footprint before live DB query.
upload: verify encrypted archive size AND existing B2 bytes will fit combined cap.
This does not claim the remote B2 plan, physical retention, or final billing status.
"""
import json
import os
import sys

MAX_PREFIX_BYTES = 2 * 1024**3  # founder must review eventual quota/billing
MAX_NEW_CIPHERTEXT = 512 * 1024**2
MAX_OBJECTS = 1500


def stop(reason):
    raise SystemExit("T075_SCHEDULED_BUDGET_HOLD: " + reason)


def check(mode, remote_metadata, archive_file=None):
    if mode not in ("preflight", "upload"):
        stop("unknown operation")
    if not isinstance(remote_metadata, str) or not os.path.isfile(remote_metadata):
        stop("remote size metadata missing")
    try:
        with open(remote_metadata, "r", encoding="utf-8") as f:
            meta = json.load(f)
    except (OSError, ValueError, UnicodeError):
        stop("unreadable B2 size JSON")
    if not isinstance(meta, dict):
        stop("remote size object malformed")
    remote_bytes = meta.get("bytes")
    count = meta.get("count")
    if type(remote_bytes) is not int or not 0 <= remote_bytes <= MAX_PREFIX_BYTES:
        stop("existing B2 footprint unknown/over cap")
    if type(count) is not int or not 0 <= count <= MAX_OBJECTS:
        stop("existing B2 object count unknown/over cap")
    if mode == "preflight":
        if archive_file is not None:
            stop("unexpected archive argument for preflight")
        return {"existing_bytes": remote_bytes, "existing_objects": count}
    if not archive_file or not os.path.isfile(archive_file) or os.path.islink(archive_file):
        stop("encrypted archive unavailable or symlinked")
    try:
        new_size = os.stat(archive_file, follow_symlinks=False).st_size
    except OSError:
        stop("cannot stat encrypted archive")
    if type(new_size) is not int or not 0 < new_size <= MAX_NEW_CIPHERTEXT:
        stop("new ciphertext not within 512 MiB cap")
    if count >= MAX_OBJECTS:
        stop("B2 object count cap before new immutable upload")
    if remote_bytes + new_size > MAX_PREFIX_BYTES:
        stop("existing plus new ciphertext would exceed 2 GiB cap")
    return {"new_bytes": new_size, "within_safe_upload_cap": True}


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        stop("usage: preflight size.json OR upload size.json archive.age")
    mode = sys.argv[1]
    if mode == "preflight" and len(sys.argv) != 3:
        stop("preflight takes only metadata")
    if mode == "upload" and len(sys.argv) != 4:
        stop("upload requires encrypted archive")
    check(mode, sys.argv[2], sys.argv[3] if len(sys.argv) == 4 else None)
    # Zero sensitive values in output; no original DB/Media metadata.
    print("T075_SCHEDULED_B2_BUDGET_" + mode.upper() + "=PASS")
