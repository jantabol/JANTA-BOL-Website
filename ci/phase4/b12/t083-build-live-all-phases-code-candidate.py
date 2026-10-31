#!/usr/bin/env python3
"""Snapshot entire CURRENT SERVED JANTA BOL executable code, CI and migrations
from immutable production Git SHA. Excludes docs/PII, secrets and pending Draft PRs.
This is CODE ONLY, not a DB/Auth/Storage/Edge runtime backup or signed release.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

LIVE_SHA="93df12aa8ffdfae38d9a4066b6a4556bb36969e5"
OUT=Path("out/JANTA_BOL_B0_B12_LIVE_BASELINE_CODE_CANDIDATE_20261031.zip")
CODE_EXT={
    ".html",".js",".mjs",".cjs",".jsx",".ts",".tsx",".css",".scss",
    ".sql",".py",".sh",".yml",".yaml",".json",".xml",".svg",".toml",
    ".webmanifest",".ps1",".graphql"
}
MEDIA_EXT={".png",".jpg",".jpeg",".webp",".gif",".ico",".woff",".woff2"}
PREFIXES=(
  "JANTA_BOL_PHASE_",
  "ci/",
  ".github/workflows/",
  "supabase/",
  "backend/",
  "scripts/",
)
MAX_FILE_BYTES=4*1024*1024
MAX_TOTAL_BYTES=70*1024*1024

def git(*args: str)->bytes:
    return subprocess.check_output(("git",*args),timeout=35)
def sha(b:bytes)->str:
    return hashlib.sha256(b).hexdigest()
def path_ok(name:str)->bool:
    p=PurePosixPath(name)
    if p.is_absolute() or ".." in p.parts or any(x.startswith(".env") for x in p.parts):
        return False
    if name=="vercel.json":
        return True
    if not name.startswith(PREFIXES):
        return False
    if p.suffix.lower() in CODE_EXT:
        return True
    return name.startswith("JANTA_BOL_PHASE_3C_WORKING/") and p.suffix.lower() in MEDIA_EXT
def safe_content(name:str,b:bytes):
    low=name.lower()
    if any(t in low for t in (".env","id_rsa","private_key.pem","credentials.json",
                               "service_role.json","secrets.json",".git/")):
        raise SystemExit("UNSAFE_CODE_PATH_DENIED:"+name)
    if len(b)>MAX_FILE_BYTES:
        raise SystemExit("SOURCE_LARGER_THAN_GUARD:"+name)
    bad=(
       rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
       rb"(?:ghp_|gho_|github_pat_)[A-Za-z0-9_]{25,}",
       rb"sb_secret_[A-Za-z0-9_-]{20,}",
       rb"(?i)(?:SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|BACKBLAZE_APPLICATION_KEY|VERCEL_TOKEN)\s*[:=]\s*['\x22][A-Za-z0-9_-]{25,}",
    )
    if any(re.search(pattern,b) for pattern in bad):
        raise SystemExit("CREDENTIAL_LIKE_VALUE_IN_SOURCE:"+name)
    # Legacy CI may use dummy postgres credentials pointing to localhost only.
    # Any connection string with credentials to a remote DB is BLOCKED.
    for uri in re.findall(rb"postgresql://[^\\s\\x22\\x27]+",b):
        if b"@" not in uri:
            continue
        hostname=uri.split(b"@",1)[1].split(b"/",1)[0].split(b":",1)[0].lower()
        if not name.startswith(("ci/",".github/workflows/")) or hostname not in (b"localhost",b"127.0.0.1",b"::1"):
            raise SystemExit("REMOTE_DATABASE_CREDENTIAL_DENIED:"+name)
def info(name:str):
    z=ZipInfo(name,date_time=(2026,10,31,0,0,0))
    z.compress_type=ZIP_DEFLATED
    z.external_attr=(0o644<<16)
    return z

def main():
    if os.environ.get("GITHUB_REPOSITORY") not in (None,"jantabol/JANTA-BOL-Website"):
        raise SystemExit("WRONG_REPO")
    assert git("rev-parse",LIVE_SHA).strip().decode()==LIVE_SHA
    tree=git("ls-tree","-rz","-l",LIVE_SHA).split(b"\0")
    selected=[]
    omitted=[]
    for item in tree:
        if not item:continue
        meta,path=item.split(b"\t",1)
        mode,kind,obj,size=meta.split(b" ",3)
        name=path.decode("utf-8","strict")
        if kind!=b"blob" or not path_ok(name):continue
        if size==b"-" or int(size)>MAX_FILE_BYTES:
            omitted.append(name)
            continue
        data=git("show",LIVE_SHA+":"+name)
        safe_content(name,data)
        selected.append((name,data))
    if omitted:
        raise SystemExit("TRUNCATION_DENIED_DUE_OVERSIZE_CODE:"+json.dumps(omitted[:6]))
    if len(selected)<130:
        raise SystemExit("CODE_COVERAGE_TOO_SMALL:"+str(len(selected)))
    total=sum(len(b) for _,b in selected)
    if total>MAX_TOTAL_BYTES:
        raise SystemExit("ARCHIVE_TOTAL_EXCEEDS_70MB_SAFE_LIMIT")
    names={n for n,_ in selected}
    required={
       "vercel.json",
       "JANTA_BOL_PHASE_3C_WORKING/index.html",
       "JANTA_BOL_PHASE_3C_WORKING/add-news.html",
       "JANTA_BOL_PHASE_3C_WORKING/backend-client.js",
       "JANTA_BOL_PHASE_3C_WORKING/admin-auth.js",
       "JANTA_BOL_PHASE_3C_WORKING/article.html",
       "ci/phase4/b12/t080-admin-ack-failclosed.test.mjs",
    }
    if not required.issubset(names):
        raise SystemExit("MISSING_PRODUCTION_REQUIRED_CODE:"+str(required-names))
    # The real remote source code is immutable; no review-branch changes or
    # attempted merge are silently inserted into this code snapshot.
    manifest={
     "artifact_type":"ALL_PHASES_LIVE_GIT_BASELINE_CODE_CANDIDATE_NOT_FINAL_B12_RELEASE",
     "product":"JANTA BOL",
     "date":"2026-10-31",
     "exact_production_git_sha":LIVE_SHA,
     "code_files":len(selected),
     "total_code_bytes":total,
     "source_files":[{"path":name,"sha256":sha(data)} for name,data in selected],
     "excluded_by_design":[
      "docs, PDFs and historic approval artifacts",
      "pending DRAFT PR #84/90/91/92 revisions not deployed to live",
      "service tokens and environment credentials",
      "database row contents and backup/dump",
      "Storage original media backup",
      "Auth state and user accounts",
      "Edge deployed runtime and webhook/provider credentials",
      "Vercel deployment and traffic rollback proof"
     ],
     "t081_real_complete_e8":"NOT_RUN",
     "t082_fresh_owner_e4":"NOT_RUN",
     "t083_final_release_lock":"HOLD"
    }
    payload=(json.dumps(manifest,indent=2,sort_keys=True,ensure_ascii=False)+"\n").encode()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(OUT,"w",compression=ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in selected:z.writestr(info(name),data)
        z.writestr(info("JANTA_BOL_ALL_PHASES_LIVE_CODE_MANIFEST.json"),payload)
    with ZipFile(OUT) as z:
        assert len(z.namelist())==len(selected)+1
        assert z.read("JANTA_BOL_ALL_PHASES_LIVE_CODE_MANIFEST.json")==payload
        for name,data in selected:assert z.read(name)==data
    print("B12_ALL_PHASES_LIVE_CODE_BYTES_INTEGRITY=PASS")
    print("B12_ALL_PHASES_LIVE_CODE_FILE_COUNT="+str(len(selected)))
    print("B12_ALL_PHASES_LIVE_CODE_ARCHIVE_SHA256="+sha(OUT.read_bytes()))
    print("B12_FULL_CURRENT_E8_BACKUP=NOT_RUN")
    print("B12_FULL_SIGNED_FINAL_RELEASE=NOT_PROVEN")
    print("B12_FINAL_LOCK=HOLD")
if __name__=="__main__":main()
