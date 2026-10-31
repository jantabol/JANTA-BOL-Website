#!/usr/bin/env python3
"""T083 deterministic *evidence-only* ZIP. NOT a DB backup, source-release ZIP,
production restoration, traffic rollback, or final Topic11 acceptance.
Uses only checked-in public operations source/report files. No network/secrets.
"""
from __future__ import annotations
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

LIVE_SHA = "93df12aa8ffdfae38d9a4066b6a4556bb36969e5"
ARCHIVE = Path("out/T083_PUBLIC_OPS_EVIDENCE_ONLY_20261031.zip")
FILES = (
    ".github/workflows/b12-t083-production-ops-readonly.yml",
    "ci/phase4/b12/t083-production-ops-real-http.test.mjs",
    "ci/phase4/b12/t083-build-evidence-pack.py",
    "JANTA_BOL_PHASE_4_WORKING/b12/P4_T083_PRODUCTION_OPS_READONLY_20261031.md",
    "JANTA_BOL_PHASE_4_WORKING/b12/RUN11_T076_TO_T083_ONE_AT_A_TIME_TEST_ORDER.md",
)

def git(*args: str) -> str:
    return subprocess.check_output(("git", *args), text=True).strip()

def digest(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def scan(name: str, data: bytes) -> None:
    # Never put hidden config, credentials, dumps or any key bytes in this artifact.
    if Path(name).is_absolute() or ".." in Path(name).parts:
        raise ValueError("UNSAFE_PATH")
    if any(seg.startswith(".env") for seg in Path(name).parts):
        raise ValueError("ENV_DENIED")
    if re.search(r"(?i)(?:credential|password|backup|secret|key|token).*\.(?:pem|key|json|txt)$", name):
        raise ValueError("POSSIBLE_KEY_FILE_DENIED")
    patterns = (
        b"-----BEGIN" + b" PRIVATE KEY-----",
        b"sb_" + b"secret_",
        b"github_" + b"pat_",
        b"gh" + b"p_[A-Za-z0-9]{30,}",
    )
    for pattern in patterns[:3]:
        if pattern in data:
            raise ValueError("CREDENTIAL_FINGERPRINT_DENIED")
    if re.search(rb"gh[pousr]_[A-Za-z0-9_]{30,}", data):
        raise ValueError("GITHUB_TOKEN_FINGERPRINT_DENIED")
    if re.search(rb"(?i)(?:service_role|application_key|api_secret)\s*[:=]\s*[\x22\x27][A-Za-z0-9_\-]{24,}", data):
        raise ValueError("PRIVATE_CREDENTIAL_ASSIGNMENT_DENIED")

def zip_entry(name: str, data: bytes) -> tuple[ZipInfo, bytes]:
    item = ZipInfo(name, date_time=(2026, 10, 31, 0, 0, 0))
    item.compress_type = ZIP_DEFLATED
    item.external_attr = 0o644 << 16
    return item, data

def main() -> None:
    if os.environ.get("GITHUB_REPOSITORY") not in (None, "jantabol/JANTA-BOL-Website"):
        raise SystemExit("WRONG_REPO")
    head = git("rev-parse", "HEAD")
    if len(head) != 40:
        raise SystemExit("HEAD_IDENTITY_INVALID")
    tracked = set(git("ls-files", "-z").split("\0"))
    selected: list[tuple[str, bytes]] = []
    for name in FILES:
        if name not in tracked:
            raise SystemExit("MISSING_TRACKED_FILE: " + name)
        data = Path(name).read_bytes()
        if len(data) > 1_000_000:
            raise SystemExit("UNEXPECTED_FILE_SIZE")
        scan(name, data)
        selected.append((name, data))
    # Source inventory is a SHA256 index only — NO production source bytes copied.
    index = []
    for name in sorted(tracked):
        if name.startswith("JANTA_BOL_PHASE_3C_WORKING/") and name.endswith((".html", ".js", ".css")):
            if Path(name).is_file():
                index.append({"path": name, "sha256": digest(Path(name).read_bytes())})
    if not index:
        raise SystemExit("NO_PUBLIC_APP_SOURCE_INDEX")
    manifest = {
        "scope": "T083 EVIDENCE ONLY — not source bundle, backup, or deployment proof",
        "product": "JANTA BOL",
        "date": "2026-10-31",
        "live_source_sha": LIVE_SHA,
        "evidence_branch_sha": head,
        "source_bytes_included": False,
        "public_app_source_fingerprints": index,
        "included_evidence_files": [{"path": n, "sha256": digest(b)} for n,b in selected],
        "topic11_final_lock": "HOLD",
        "t081_current_e8": "NOT_RUN",
        "t082_fresh_owner_e4": "NOT_RUN",
        "go_daddy_auto_renew_date": "2027-08-14 (Founder-reported, not independently verified)",
    }
    contents = (json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + "\n").encode()
    scan("manifest.json", contents)
    selected.append(("manifest.json", contents))
    ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(ARCHIVE, "w") as archive:
        for name, data in sorted(selected):
            item, content = zip_entry(name, data)
            archive.writestr(item, content)
    # Integrity: exact in-archive bytes must match scanned inputs.
    with ZipFile(ARCHIVE) as archive:
        assert len(archive.namelist()) == len(selected)
        for name, data in selected:
            assert archive.read(name) == data
    print("T083_EVIDENCE_ZIP_INTEGRITY=PASS")
    print("T083_SCOPED_EVIDENCE_SHA256=" + digest(ARCHIVE.read_bytes()))
    print("T083_PUBLIC_APP_FINGERPRINT_COUNT=" + str(len(index)))
    print("T083_BACKUP_OR_FULL_SOURCE_ZIP=NOT_PROVEN")
    print("T083_FINAL_LOCK=HOLD")

if __name__ == "__main__":
    main()
