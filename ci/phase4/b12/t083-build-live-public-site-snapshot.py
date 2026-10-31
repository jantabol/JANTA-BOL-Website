#!/usr/bin/env python3
"""T083: public WEB source identity snapshot from the exact served Git SHA.
NOT full Phase4 source/master ZIP, DB backup, secrets or release approval.
All paths come from immutable git tree, not the review HEAD.
"""
from __future__ import annotations
import hashlib
import io
import json
import re
import subprocess
from pathlib import PurePosixPath, Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

LIVE = "93df12aa8ffdfae38d9a4066b6a4556bb36969e5"
OUT = Path("out/T083_LIVE_PUBLIC_SITE_SOURCE_CANDIDATE_20261031.zip")
PREFIX = "JANTA_BOL_PHASE_3C_WORKING/"
STATIC = {".html",".js",".css",".json",".svg",".webp",".jpg",".jpeg",".png",".gif",".ico",".txt",".xml",".webmanifest",".woff",".woff2"}
TOTAL_LIMIT = 30 * 1024 * 1024
FILE_LIMIT = 3 * 1024 * 1024

def gitbytes(*args: str) -> bytes:
    return subprocess.check_output(("git", *args), timeout=30)

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def eligible(path: str) -> bool:
    p = PurePosixPath(path)
    name = p.name.lower()
    if p.is_absolute() or ".." in p.parts:
        return False
    if path == "vercel.json":
        return True
    if not path.startswith(PREFIX) or p.suffix.lower() not in STATIC:
        return False
    if any(t in name for t in ("password","credential","private-key","backup","secret","service-role","service_role")):
        return False
    if any(s.startswith(".") for s in p.parts):
        return False
    return True

def check_public_bytes(path: str, data: bytes) -> None:
    if len(data)>FILE_LIMIT:
        raise SystemExit("WEB_SOURCE_FILE_TOO_LARGE: "+path)
    if b"-----BEGIN PRIVATE KEY-----" in data or b"-----BEGIN OPENSSH PRIVATE KEY-----" in data:
        raise SystemExit("PRIVATE_KEY_CONTENT_DENIED: "+path)
    if re.search(rb"(?:ghp_|gho_|github_pat_)[a-zA-Z0-9_]{25,}",data):
        raise SystemExit("GITHUB_TOKEN_DENIED: "+path)
    if re.search(rb"sb_secret_[a-zA-Z0-9_-]{16,}",data):
        raise SystemExit("SUPABASE_SECRET_DENIED: "+path)
    if re.search(rb"(?im)^\s*(?:BACKBLAZE_APPLICATION_KEY|SUPABASE_SERVICE_ROLE_KEY|VERCEL_TOKEN|DATABASE_URL)\s*[:=]\s*[^\s#]{12,}",data):
        raise SystemExit("SERVER_CREDENTIAL_DENIED: "+path)
    if b"postgresql://" in data and b"@" in data:
        raise SystemExit("POTENTIAL_DB_CONNECTION_DENIED: "+path)

def make_info(name: str) -> ZipInfo:
    info=ZipInfo(name,date_time=(2026,10,31,0,0,0))
    info.external_attr=0o644<<16
    info.compress_type=ZIP_DEFLATED
    return info

def main() -> None:
    if gitbytes("rev-parse", LIVE).strip().decode()!=LIVE:
        raise SystemExit("WRONG_PRODUCTION_BASE")
    tracked=gitbytes("ls-tree","-r","--name-only","-z",LIVE).decode().split("\0")
    paths=sorted(p for p in tracked if p and eligible(p))
    if len(paths)<60 or "vercel.json" not in paths:
        raise SystemExit("INCOMPLETE_PUBLIC_SITE_PATHS")
    files=[]
    total=0
    for path in paths:
        content=gitbytes("show", LIVE+":"+path)
        check_public_bytes(path,content)
        total+=len(content)
        if total>TOTAL_LIMIT:
            raise SystemExit("TOO_MUCH_SOURCE_CONTENT_ABORT")
        files.append((path,content))
    names={p for p,_ in files}
    mandatory={
        "vercel.json",
        PREFIX+"index.html",
        PREFIX+"article.html",
        PREFIX+"admin-login.html",
        PREFIX+"backend-client.js",
        PREFIX+"public-c1-projection.js"
    }
    if not mandatory.issubset(names):
        raise SystemExit("MANDATORY_PUBLIC_APP_SOURCE_MISSING")
    manifest={
        "artifact_type":"PUBLIC_WEB_SOURCE_SNAPSHOT_CANDIDATE_NOT_B12_FINAL",
        "site":"JANTA BOL",
        "date":"2026-10-31",
        "exact_served_git_sha": LIVE,
        "source_file_count":len(files),
        "uncompressed_web_bytes":total,
        "source_files_sha256":[{"path":p,"sha256":sha(b)} for p,b in files],
        "not_included":[
          "private Founder secrets", "Supabase DB", "storage binaries/backup",
          "Auth identities", "Edge runtime", "complete Phase4+B0-B12 source",
          "CI reviewer signoff", "current-point E8 restore", "real rollback"
        ],
        "t083_final_lock":"HOLD"
    }
    payload=(json.dumps(manifest,ensure_ascii=False,sort_keys=True,indent=2)+"\n").encode()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(OUT,"w",compression=ZIP_DEFLATED,compresslevel=9) as z:
        for path,content in files:
            z.writestr(make_info(path),content)
        z.writestr(make_info("T083_PUBLIC_SOURCE_SNAPSHOT_MANIFEST.json"),payload)
    with ZipFile(OUT) as z:
        for path,data in files:
            assert z.read(path)==data
        assert z.read("T083_PUBLIC_SOURCE_SNAPSHOT_MANIFEST.json")==payload
    print("T083_EXACT_LIVE_PUBLIC_SOURCE_IDENTITY=PASS")
    print("T083_PUBLIC_SITE_FILE_COUNT="+str(len(files)))
    print("T083_PUBLIC_SITE_SNAPSHOT_SHA256="+sha(OUT.read_bytes()))
    print("T083_FULL_B12_SOURCE_RELEASE_ZIP=NOT_PROVEN")
    print("T083_CURRENT_E8_FULL_RESTORE=HOLD")
    print("T083_FINAL_LOCK=HOLD")

if __name__=="__main__":
    main()
