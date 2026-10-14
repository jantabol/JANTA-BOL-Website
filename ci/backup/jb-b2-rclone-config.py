#!/usr/bin/env python3
"""Create ephemeral JANTA BOL Backblaze rclone config, without Termux.

Credentials are read only from GitHub Environment variables and NEVER logged.
The scope of the key must already be constrained to the JANTA BOL-only bucket.
This helper writes only to a disposable GitHub Actions runner path.
"""
import os
import re
import sys

def die(reason: str) -> None:
    raise SystemExit("B2_CONFIG_FAIL_CLOSED: " + reason)

def main() -> None:
    if len(sys.argv) != 2:
        die("temporary output file path required")
    key_id = os.environ.get("JB_BACKUP_B2_KEY_ID", "")
    app_secret = os.environ.get("JB_BACKUP_B2_APPLICATION_KEY", "")
    if not re.fullmatch(r"[a-zA-Z0-9_-]{12,128}", key_id):
        die("invalid or missing scoped key ID")
    if not re.fullmatch(r"[!-~]{12,512}", app_secret):
        die("invalid or missing application secret")
    # Explicitly deny embedded config lines / newline injection.
    if "\n" in app_secret or "\r" in app_secret:
        die("newline forbidden")
    body = (
        "[jbbackup]\n"
        "type = b2\n"
        f"account = {key_id}\n"
        f"key = {app_secret}\n"
    )
    fd = os.open(sys.argv[1], os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        stream.write(body)
    print("PASS: ephemeral JANTA BOL B2 config created; no credentials displayed")

if __name__ == "__main__":
    main()
