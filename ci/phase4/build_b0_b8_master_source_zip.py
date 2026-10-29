#!/usr/bin/env python3
"""Create/verify one complete immutable JANTA BOL B0–B8 SOURCE ZIP.
Only tracked repository files. Never copies .git, host env, CI runtime secrets,
untracked screenshots, live database/media, or other user's data.
Python standard library, deterministic ZIP member order and UTC timestamps.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
PREFIX = "JANTA_BOL_MASTER_SOURCE/"
MANIFEST = PREFIX + "MASTER_SHA256_MANIFEST.json"
GENERATED = "2026-10-17"
PROTECTED_MAIN_SHA = "265856ca9cbfd6c7d51989d85435397b72f24c8d"
CORE = (
    "README.md",
    "index.html",
    "script.js",
    "style.css",
    "JANTA-BOL v1 BACKUP.zip",
    "START_HERE_JANTA_BOL_MASTER_B0_TO_B8.md",
    "JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html",
    "JANTA_BOL_PHASE_3C_WORKING/admin.html",
    "JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md",
    "JANTA_BOL_PHASE_4_WORKING/review/B8_G5_OFFICIAL_EVIDENCE_MANIFEST_20261017.json",
    "ci/phase4/b8-g9-due-followup-notification-regression.sql",
    "CODEX_CURRENT_SUPABASE/functions/jb-b8-private-evidence/index.ts",
    ".github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml",
    "tools/jb_manual_test.py",
)
UNSAFE = (".git/", "node_modules/", ".env", "MANUAL_EVIDENCE_LOCAL/", "dist/")

def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def run_git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

def sources() -> list[str]:
    paths = [p.decode("utf-8") for p in run_git("ls-files", "-z").split(b"\0") if p]
    if len(paths) != len(set(paths)):
        raise RuntimeError("Duplicate Git tracked paths; abort")
    for rel in paths:
        pp = PurePosixPath(rel)
        if pp.is_absolute() or ".." in pp.parts or any(rel.startswith(x) for x in UNSAFE):
            raise RuntimeError(f"Unsafe tracked ZIP member: {rel}")
        if (ROOT / rel).is_symlink():
            raise RuntimeError(f"Symlink refused: {rel}")
        if not (ROOT / rel).is_file():
            raise RuntimeError(f"Tracked file missing: {rel}")
    for req in CORE:
        if req not in paths:
            raise RuntimeError(f"Missing essential full-source snapshot input: {req}")
    return sorted(paths)

def make(out: Path):
    sha = run_git("rev-parse", "HEAD").decode("utf-8").strip()
    if len(sha) != 40:
        raise RuntimeError("HEAD must be full Git SHA")
    paths = sources()
    items = []
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=7, allowZip64=True) as z:
        for rel in paths:
            raw = (ROOT / rel).read_bytes()
            items.append({"path": rel, "sha256": digest(raw), "bytes": len(raw)})
            zinfo = zipfile.ZipInfo(PREFIX + rel, (2026, 10, 17, 0, 0, 0))
            zinfo.compress_type = zipfile.ZIP_DEFLATED
            zinfo.external_attr = ((0o755 if os.access(ROOT / rel, os.X_OK)
                                    else 0o644) << 16)
            z.writestr(zinfo, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=7)
        manifest = {
            "schema": "janta-bol-b0-b8-source-snapshot-v1",
            "source_repo": "jantabol/JANTA-BOL-Website",
            "source_branch": "codex/b8-g5-main-based-integration-20261017",
            "exact_commit_sha": sha,
            "protected_main_base": PROTECTED_MAIN_SHA,
            "includes": "ALL git-tracked file bytes at exact commit, except git internals",
            "not_included": [
                "LIVE Supabase PostgreSQL dump and authentication records",
                "LIVE Storage and external media originals",
                "Backblaze / provider secrets, private accounts or credentials",
                "Android screenshots and manual evidence outside Git",
                "original 321-page private Master Execution Pack PDF (Founder's separate copy)"
            ],
            "manual_tests": "P4-T001..P4-T109 select ANY id; original test evidence must be real",
            "official_b8_final_pass": "NOT_VERIFIED_0_OF_8_AT_SOURCE_FREEZE",
            "files_count": len(items),
            "files": items,
        }
        info = zipfile.ZipInfo(MANIFEST, (2026, 10, 17, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"),
                   compress_type=zipfile.ZIP_DEFLATED)
    verify(out)
    print(f"COMPLETE SOURCE ZIP: {out} ({out.stat().st_size} bytes, {len(items)} tracked files)")
    print(f"EXACT COMMIT: {sha}")
    print(f"SHA256 ZIP: {digest(out.read_bytes())}")
    sha_path = out.parent / "MASTER_ZIP_SHA256.txt"
    sha_path.write_text(f"{digest(out.read_bytes())}  {out.name}\n", encoding="utf-8")
    print(f"INTEGRITY: {sha_path}")

def verify(out: Path):
    if not out.is_file():
        raise RuntimeError(f"Missing ZIP file: {out}")
    with zipfile.ZipFile(out, "r") as z:
        if z.testzip() is not None:
            raise RuntimeError("ZIP CRC validation failed")
        names = z.namelist()
        if len(names) != len(set(names)):
            raise RuntimeError("Duplicate ZIP member")
        if MANIFEST not in names:
            raise RuntimeError("Missing full snapshot integrity manifest")
        m = json.loads(z.read(MANIFEST))
        if m.get("schema") != "janta-bol-b0-b8-source-snapshot-v1":
            raise RuntimeError("Invalid master manifest format")
        if len(m["files"]) != m["files_count"]:
            raise RuntimeError("Missing manifest tracked file")
        recorded = set()
        for item in m["files"]:
            rel = item["path"]
            pp = PurePosixPath(rel)
            if pp.is_absolute() or ".." in pp.parts or rel in recorded:
                raise RuntimeError(f"Unsafe member path: {rel}")
            recorded.add(rel)
            name = PREFIX + rel
            if name not in names:
                raise RuntimeError(f"Tracked file not in ZIP: {rel}")
            raw = z.read(name)
            if digest(raw) != item["sha256"] or len(raw) != item["bytes"]:
                raise RuntimeError(f"SHA256/size mismatch: {rel}")
        if set(names) != set(PREFIX + p for p in recorded) | {MANIFEST}:
            raise RuntimeError("Unmanifested file unexpectedly included in ZIP")
        for req in CORE:
            if req not in recorded:
                raise RuntimeError(f"Missing essential complete snapshot file: {req}")
        print(f"ZIP VERIFIED: {m['files_count']} files, {m['exact_commit_sha']}, byte-verified")
        return m

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--out", type=Path, help="Build source ZIP from full tracked Git tree")
    group.add_argument("--verify", type=Path, help="Independently verify existing source ZIP")
    args = parser.parse_args()
    try:
        if args.out:
            make(args.out)
        else:
            verify(args.verify)
    except Exception as err:
        print(f"MASTER ZIP BLOCKED: {err}", file=sys.stderr)
        sys.exit(1)
