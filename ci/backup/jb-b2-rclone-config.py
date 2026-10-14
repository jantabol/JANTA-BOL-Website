#!/usr/bin/env python3
"""Build a JANTA BOL ONLY rclone remote from two GitHub environment secrets.

No external app, no logged application secret, and no persisted config outside
the disposable GitHub Actions runner. This file is SAFE to commit: no keys in it.
"""
import os
import re
import sys

def die(message: str) -> None:
    raise SystemExit("B2_CONFIG_FAIL_CLOSED: " + message)

def main() -> None:
    if len(sys.argv) != 2:
        die("one output path required")
    key_id = os.environ.get("JB_BACKUP_B2_KEY_ID", "")
    application_key = os.environ.get("JB_BACKUP_B2_APPLICATION_KEY", "")
    if not re.fullmatch(r"[a-zA-Z0-9_-]{12,128}", key_id):
        die("missing or malformed JANTA BOL B2 key ID")
    if not re.fullmatch(r"[!-~]{12,512}", application_key):
        die("missing or malformed JANTA BOL B2 application secret")
    if "\\n" in application_key or "\\r" in application_key:
        die("newline in application secret")
    # Backblaze B2 native rclone driver; avoids separate endpoint/region inputs.
    # Distinct remote name also prevents accidental cricket bucket access.
    content = (
        "[jbbackup]\\n"
        "type = b2\\n"
        f"account = {key_id}\\n"
        f"key = {application_key}\\n"
    ).replace("\\n", "\n")
    out = sys.argv[1]
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as config:
        config.write(content)
    print("PASS: scoped B2 rclone config written to ephemeral runner only (no key output).")

if __name__ == "__main__":
    main()
