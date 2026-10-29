#!/usr/bin/env python3
"""JANTA BOL B0–B8: select ANY original P4-T001..T109 without executing a live test.
No network, no deployments, no owner permissions, no fabricated PASS.
Works in Termux/PC with Python >=3.9; Android SPCK users can open the same
markdown Test Register and Master RUN-12 checklist without running Python.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REG = ROOT / "JANTA_BOL_PHASE_4_WORKING" / "TEST-REGISTER.md"
B8 = ROOT / "JANTA_BOL_PHASE_4_WORKING" / "review" / "B8_G5_OFFICIAL_EVIDENCE_MANIFEST_20261017.json"
OUT = ROOT / "MANUAL_EVIDENCE_LOCAL"
NORMAL = re.compile(r"^(?:(?:P4[- ]?)?T)?0*(\d{1,3})$", re.I)
ROW = re.compile(r"^\|\s*(P4-T\d{3})\s*\|(.+)\|\s*$")
B8_REQUIRED = {
    "P4-T092": "E7,E9", "P4-T093": "E2,E9",
    "P4-T094": "E2,E5,E9", "P4-T095": "E2,E5,E9",
    "P4-T096": "E2,E4,E5,E9", "P4-T097": "E2,E5,E7,E9",
    "P4-T098": "E1,E2,E3,E4,E5,E9",
    "P4-T099": "E1,E2,E5,E7,E9",
}
EVIDENCE = {
    "E1": "Source/document review",
    "E2": "Real backend/database execution with authorized accounts",
    "E3": "Real Android device and deployed site testing",
    "E4": "Real public Article/URL/correction behavior evidence",
    "E5": "Founder authorized decision and AAL2/manual approval evidence",
    "E7": "Exact LIVE source/commit/provenance parity",
    "E9": "Genuine external official/provider and reply/no-reply dated evidence",
}

def rows():
    if not REG.is_file():
        raise RuntimeError(f"Missing original test register: {REG}")
    result = {}
    for line in REG.read_text(encoding="utf-8").splitlines():
        m = ROW.match(line)
        if m:
            fields = [x.strip() for x in m.group(2).strip().rstrip("|").split("|")]
            if len(fields) >= 4:
                result[m.group(1)] = {
                    "id": m.group(1),
                    "topic": fields[0],
                    "test": fields[1],
                    "block": fields[2],
                    "source_register_status": fields[3],
                }
    return result

def canonical(raw):
    raw = raw.strip().upper().replace("_", "-")
    if re.fullmatch(r"P4-T\d{3}", raw):
        n = int(raw[-3:])
    else:
        m = NORMAL.fullmatch(raw)
        if not m:
            raise ValueError("Select e.g. P4-T092, T092, 92 (range 1..109)")
        n = int(m.group(1))
    if not 1 <= n <= 109:
        raise ValueError("Original Master P4-T range is 001..109")
    return f"P4-T{n:03d}"

def main():
    cli = argparse.ArgumentParser(description="Pick a random JANTA BOL manual test without fake PASS")
    cli.add_argument("test", nargs="?", help="P4-T001 to P4-T109, T92, or 92")
    cli.add_argument("--list", action="store_true", help="List all 109 original P4 test rows")
    cli.add_argument("--start", action="store_true",
                     help="Create a local NOT_RUN evidence intake file (NO test executed)")
    cli.add_argument("--all-b8", action="store_true", help="Show T092-T099 original manual tests")
    args = cli.parse_args()
    catalog = rows()
    if args.list or args.all_b8:
        for n in (range(92, 100) if args.all_b8 else range(1, 110)):
            k = f"P4-T{n:03d}"
            r = catalog.get(k)
            if not r:
                print(f"{k} | NOT FOUND IN REGISTER (DO NOT CLAIM PASS)")
            else:
                print(f"{k} | {r['block']} | {r['test']} | REGISTER: {r['source_register_status']}")
        if not args.test:
            return 0
    if not args.test:
        cli.print_help()
        return 0
    key = canonical(args.test)
    r = catalog.get(key)
    if not r:
        raise RuntimeError(f"{key} not found in actual repo Test Register")
    print(f"\n===== JANTA BOL MASTER MANUAL TEST: {key} =====")
    print(f"BLOCK: {r['block']} | TOPIC: {r['topic']}")
    print(f"ORIGINAL: {r['test']}")
    print(f"REGISTER (source snapshot; verify against real evidence): {r['source_register_status']}")
    print("EXECUTION: NOT STARTED by this selector. No application/database changes.")
    print("PREFER: real user-device E3, backend E2, source E7 and Founder E5 where required.")
    print("Do NOT infer PASS from an automated CI or a prepared test file.")
    if key in B8_REQUIRED:
        manifest = json.loads(B8.read_text(encoding="utf-8"))
        record = next((t for t in manifest["tests"] if t["id"] == key), None)
        if not record:
            raise RuntimeError("Original B8 mandatory test missing from canonical manifest")
        a, b = record["checkpoints"]
        print(f"ORIGINAL ACC CHECKPOINTS: ACC-{a:03d} to ACC-{b:03d}")
        print(f"OFFICIAL FINAL: {record['status']} (not a coding/CI gate)")
        for proof in record["required_evidence"]:
            print(f"  {proof}: {EVIDENCE.get(proof, 'See Master Pack')}")
        print("Source of truth: original 321-page Master Execution Pack Topic13 pp312–314.")
    if args.start:
        OUT.mkdir(parents=True, exist_ok=True)
        day = dt.datetime.now().strftime("%Y%m%d")
        candidate = OUT / f"{key}_{day}_EVIDENCE_DUE.json"
        if candidate.exists():
            raise RuntimeError(f"Evidence intake exists; never overwrite: {candidate}")
        draft = {
            "schema": "jb-manual-evidence-intake-v1",
            "test_id": key,
            "status": "NOT_RUN",
            "founder_verified": False,
            "real_device_tested": False,
            "live_backend_tested": False,
            "real_official_e9_verified": False,
            "test_completed_at": None,
            "evidence_files_private_paths": [],
            "steps_observed": [],
            "first_divergence": None,
            "rca": None,
            "minimum_safe_fix_commit": None,
            "regression_run": None,
            "notes": "CREATE DOES NOT MEAN PASS. Redact credentials and source identities.",
        }
        candidate.write_text(json.dumps(draft, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        print("CREATED LOCAL INTAKE (status NOT_RUN):", candidate)
    print("NEXT: perform real test ONE BY ONE with Founder and capture actual proof.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, RuntimeError, OSError) as exc:
        print("STOP:", exc, file=sys.stderr)
        sys.exit(2)
