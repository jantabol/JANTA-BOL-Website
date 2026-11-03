#!/usr/bin/env python3
"""Deterministic audit-only archive of actual production 32 HTML + 32 JS.
Source-only: NO credential, no E8 hosting/database backup, no original T090 final lock.
Must run after actual live 64/64 full-byte parity test in the same GitHub Actions job.
"""
import hashlib
import json
import re
import subprocess
import zipfile
from pathlib import Path

SHA = "60970abdacf560815b9db3bd819eb467ef984616"
ROOT = Path("JANTA_BOL_PHASE_3C_WORKING")
OUT = Path("t090-janta-bol-prod-static64-NOT-FULL-RESTORE.zip")
STAMP = (1980, 1, 1, 0, 0, 0)
names = sorted(x.name for x in ROOT.iterdir() if x.is_file() and re.fullmatch(r"[a-z0-9-]+\.(html|js)", x.name))
assert len(names) == 64, "STATIC_SOURCE_LIST_CHANGED"
assert sum(x.endswith(".html") for x in names) == 32
assert sum(x.endswith(".js") for x in names) == 32
assert len(set(names)) == 64

def add(z, name, raw):
    info = zipfile.ZipInfo(name, date_time=STAMP)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    z.writestr(info, raw)

manifest = {
    "kind": "T090_64_PUBLIC_STATIC_ASSETS_AUDIT_SNAPSHOT_NOT_FULL_BUILD",
    "deployment_source_sha": SHA,
    "deployment_id": "dpl_7YhVGAh758YvZq6HmteERdyCKtMb",
    "source_verified_against_live_https_by_prior_ci_step": True,
    "scope": "32 canonical HTML and 32 canonical JS only, exact bytes of immutable production SHA",
    "does_not_restore": ["Supabase Database", "GoTrue Auth", "Edge Functions runtime", "Storage bytes", "Vercel configuration", "provider secrets"],
    "full_t090_final_lock": "HOLD",
    "files": []
}
original = {}
for name in names:
    rel = ROOT.as_posix() + "/" + name
    raw = subprocess.check_output(["git", "show", SHA + ":" + rel])
    # Audit branch HEAD is intentionally not the production SHA. The prior CI
    # test compared these exact immutable Git blob bytes with live HTTPS.
    original[rel] = raw
    manifest["files"].append({"path": rel, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)})

with zipfile.ZipFile(OUT, "w") as z:
    for rel in sorted(original):
        add(z, rel, original[rel])
    add(z, "T090_STATIC_ONLY_MANIFEST.json", (json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2)+"\n").encode())

with zipfile.ZipFile(OUT, "r") as z:
    assert z.testzip() is None
    assert set(z.namelist()) == set(original) | {"T090_STATIC_ONLY_MANIFEST.json"}
    for rel, raw in original.items():
        assert z.read(rel) == raw, "ZIP_BYTES_DO_NOT_MATCH_" + rel
    embedded = json.loads(z.read("T090_STATIC_ONLY_MANIFEST.json"))
    assert embedded == manifest
    assert embedded["full_t090_final_lock"] == "HOLD"

archive_hash = hashlib.sha256(OUT.read_bytes()).hexdigest()
Path(str(OUT) + ".sha256").write_text(archive_hash + "  " + OUT.name + "\n")
print("T090_STATIC64_PROD_QA_ARCHIVE_BYTE_AND_SHA256_VERIFIED=PASS_SCOPED")
print("T090_STATIC64_ZIP_SHA256=" + archive_hash)
print("T090_STATIC64_ZIP_BYTES=" + str(OUT.stat().st_size))
print("T090_SIGNED_E5_FULL_E7_E8_AND_ORIGINAL_FINAL=HOLD")
