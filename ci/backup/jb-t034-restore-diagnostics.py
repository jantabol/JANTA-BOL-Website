#!/usr/bin/env python3
"""Private PostgreSQL 17 restore-error classifier, NOT a raw-log redactor.

Only a new, fixed-schema, allowlisted report may leave the networkless runner.
Source logs, SQL, object names, messages, and exception details are NEVER printed.
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

APP = "jb_t034_full_restore"
SQLSTATE = re.compile(r"^[A-Z0-9]{5}$")
TOC_CONTEXT = re.compile(r"(?m)^pg_restore: error: from TOC entry ([1-9][0-9]{0,8});")
TOC_LINE = re.compile(r"^([1-9][0-9]{0,8});\s+[0-9]+\s+[0-9]+\s+(.+)$")
TYPES = (
    "PUBLICATION TABLE", "MATERIALIZED VIEW", "SEQUENCE OWNED BY",
    "DEFAULT ACL", "FK CONSTRAINT", "TABLE ATTACH", "TABLE DATA",
    "EVENT TRIGGER", "FOREIGN TABLE", "FOREIGN DATA WRAPPER",
    "USER MAPPING", "TEXT SEARCH CONFIGURATION", "SEQUENCE SET",
    "AGGREGATE", "CONSTRAINT", "EXTENSION", "FUNCTION", "TRIGGER",
    "PROCEDURE", "SEQUENCE", "LANGUAGE", "DATABASE", "COMMENT",
    "SCHEMA", "POLICY", "INDEX", "TABLE", "VIEW", "RULE", "TYPE",
    "DOMAIN", "CAST", "ACL", "DEFAULT", "BLOB", "BLOB COMMENTS",
)
SCHEMA_KEYS = (
    "T034_DIAGNOSTIC_VERSION",
    "T034_DIAGNOSTIC_STAGE",
    "T034_DOCKER_EXEC_EXIT",
    "T034_PG_RESTORE_EXIT",
    "T034_CONTAINER_RUNNING",
    "T034_CONTAINER_OOM_FLAG",
    "T034_RESTORE_SQLSTATE",
    "T034_FIRST_TOC_ID",
    "T034_FIRST_TOC_TYPE",
    "T034_FAILURE_CHANNEL",
    "T034_DIAGNOSTIC_COMPLETENESS",
)
CHANNELS = {
    "SERVER_SQL", "CLIENT_ARCHIVE", "CLIENT_CONNECTION",
    "DOCKER_OR_CLIENT", "PROCESS_INTERRUPTED", "UNKNOWN",
}


def limited_read(path, limit=32 * 1024 * 1024):
    p = Path(path)
    if not p.is_file() or p.is_symlink() or p.stat().st_size > limit:
        raise ValueError("invalid private input")
    return p.read_text(encoding="utf-8", errors="replace")


def exit_code(value, permit_unknown=False):
    if permit_unknown and value == "UNKNOWN":
        return "UNKNOWN"
    if not isinstance(value, str) or not re.fullmatch(r"0|[1-9][0-9]{0,2}", value):
        raise ValueError("invalid exit code")
    result = int(value)
    if result > 255:
        raise ValueError("invalid exit code")
    return str(result)


def postgres_first_error(folder):
    folder = Path(folder)
    if not folder.is_dir() or folder.is_symlink():
        return "UNKNOWN"
    matches = []
    total = 0
    files = sorted(folder.iterdir())
    if len(files) > 40:
        raise ValueError("too many private files")
    for path in files:
        if path.is_symlink() or not path.is_file():
            raise ValueError("unexpected private log")
        if not path.name.endswith(".json"):
            continue
        data = limited_read(path)
        total += len(data)
        if total > 32 * 1024 * 1024:
            raise ValueError("too much private log data")
        for line in data.splitlines():
            # Even unknown/malformed JSON is private. Never echo its contents.
            record = json.loads(line)
            if not isinstance(record, dict):
                raise ValueError("bad JSON record")
            if record.get("application_name") != APP:
                continue
            if record.get("error_severity") not in ("ERROR", "FATAL", "PANIC"):
                continue
            stamp, session, seq = (
                record.get("timestamp"), record.get("session_id"),
                record.get("line_num"),
            )
            state = record.get("state_code")
            if not (isinstance(stamp, str) and len(stamp) <= 64 and
                    isinstance(session, str) and len(session) <= 128 and
                    type(seq) is int and seq > 0):
                raise ValueError("uncorrelated server error")
            if not isinstance(state, str) or not SQLSTATE.fullmatch(state):
                state = "UNKNOWN"
            matches.append((stamp, session, seq, state))
    if not matches:
        return "UNKNOWN"
    # The FIRST matching, structured server error, never the first worker error.
    matches.sort(key=lambda x: (x[0], x[1], x[2]))
    return matches[0][3]


def toc_item(client, inventory):
    found = TOC_CONTEXT.search(client)
    if found is None:
        return "UNKNOWN", "UNKNOWN"
    item = found.group(1)
    for line in inventory.splitlines():
        m = TOC_LINE.match(line)
        if m and m.group(1) == item:
            suffix = m.group(2)
            for name in TYPES:
                if suffix.startswith(name + " "):
                    return item, name.replace(" ", "_")
            return item, "UNKNOWN"
    return "UNKNOWN", "UNKNOWN"


def capture(a):
    client = limited_read(a.client_log)
    toc = limited_read(a.toc)
    outer = exit_code(a.outer_rc)
    inner = exit_code(a.inner_rc, permit_unknown=True)
    if outer == "0":
        raise ValueError("cannot report successful restore as failure")
    if inner == "0":
        raise ValueError("inner success cannot accompany outer failure")
    running, oom = a.container_state.split("|")
    if running not in ("true", "false", "unknown") or oom not in ("true", "false", "unknown"):
        raise ValueError("invalid state")
    sqlstate = postgres_first_error(a.json_dir)
    toc_id, toc_type = toc_item(client, toc)
    if sqlstate != "UNKNOWN":
        channel = "SERVER_SQL"
    elif re.search(r"pg_restore: error: (?:could not read from input file|input file does not appear to be a valid archive|unsupported version.*in file header)", client):
        channel = "CLIENT_ARCHIVE"
    elif re.search(r"pg_restore: error: connection to server .*failed", client):
        channel = "CLIENT_CONNECTION"
    elif outer in ("137", "143") or oom == "true":
        channel = "PROCESS_INTERRUPTED"
    else:
        channel = "DOCKER_OR_CLIENT"
    report = {
        "T034_DIAGNOSTIC_VERSION": "SAFE_V1",
        "T034_DIAGNOSTIC_STAGE": "PG_RESTORE",
        "T034_DOCKER_EXEC_EXIT": outer,
        "T034_PG_RESTORE_EXIT": inner,
        "T034_CONTAINER_RUNNING": running.upper(),
        "T034_CONTAINER_OOM_FLAG": oom.upper(),
        "T034_RESTORE_SQLSTATE": sqlstate,
        "T034_FIRST_TOC_ID": toc_id,
        "T034_FIRST_TOC_TYPE": toc_type,
        "T034_FAILURE_CHANNEL": channel,
        "T034_DIAGNOSTIC_COMPLETENESS": (
            "CORRELATED" if sqlstate != "UNKNOWN" and toc_id != "UNKNOWN"
            else "PARTIAL"
        ),
    }
    validate(report)
    out = Path(a.out)
    if out.is_symlink() or out.exists():
        raise ValueError("report collision")
    fd = os.open(str(out), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="ascii") as f:
        json.dump(report, f, separators=(",", ":"))


def validate(data):
    if not isinstance(data, dict) or set(data) != set(SCHEMA_KEYS):
        raise ValueError("unexpected report schema")
    if any(type(value) is not str or len(value) > 40 for value in data.values()):
        raise ValueError("unexpected report field")
    if data["T034_DIAGNOSTIC_VERSION"] != "SAFE_V1":
        raise ValueError("wrong version")
    if data["T034_DIAGNOSTIC_STAGE"] != "PG_RESTORE":
        raise ValueError("invalid phase")
    exit_code(data["T034_DOCKER_EXEC_EXIT"])
    exit_code(data["T034_PG_RESTORE_EXIT"], permit_unknown=True)
    if data["T034_DOCKER_EXEC_EXIT"] == "0":
        raise ValueError("success masquerades as failure")
    for key in ("T034_CONTAINER_RUNNING", "T034_CONTAINER_OOM_FLAG"):
        if data[key] not in ("TRUE", "FALSE", "UNKNOWN"):
            raise ValueError("invalid state")
    if data["T034_RESTORE_SQLSTATE"] != "UNKNOWN" and not SQLSTATE.fullmatch(data["T034_RESTORE_SQLSTATE"]):
        raise ValueError("invalid SQLSTATE")
    n = data["T034_FIRST_TOC_ID"]
    if n != "UNKNOWN" and not re.fullmatch(r"[1-9][0-9]{0,8}", n):
        raise ValueError("invalid TOC ID")
    if data["T034_FIRST_TOC_TYPE"] != "UNKNOWN" and data["T034_FIRST_TOC_TYPE"] not in {x.replace(" ", "_") for x in TYPES}:
        raise ValueError("invalid TOC descriptor")
    if data["T034_FAILURE_CHANNEL"] not in CHANNELS:
        raise ValueError("invalid channel")
    if data["T034_DIAGNOSTIC_COMPLETENESS"] not in ("CORRELATED", "PARTIAL"):
        raise ValueError("invalid coverage")


def emit(a):
    report = json.loads(limited_read(a.report, limit=4096))
    validate(report)
    for key in SCHEMA_KEYS:
        print(key + "=" + report[key])


def main():
    p = argparse.ArgumentParser()
    sp = p.add_subparsers(dest="mode", required=True)
    cp = sp.add_parser("capture")
    for flag in ("client-log", "json-dir", "toc", "outer-rc", "inner-rc", "container-state", "out"):
        cp.add_argument("--" + flag, required=True)
    ep = sp.add_parser("emit")
    ep.add_argument("--report", required=True)
    a = p.parse_args()
    if a.mode == "capture":
        capture(a)
    else:
        emit(a)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never print an exception, traceback, filename, message, SQL or user data.
        print("T034_DIAGNOSTICS_INVALID=HOLD")
        sys.exit(2)
