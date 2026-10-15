#!/usr/bin/env python3
"""Strict, fixed-schema deep-security mismatch classifier; NEVER displays hash or data.

Input: the 16 privately held SHA-independent MD5 value manifests produced
from the SAME MVCC source snapshot and disposable restored clone.
Only PUBLIC safe, hard-coded metric labels may be written to stdout.
A malformed manifest is not a mismatch: it is a fail-closed diagnostic HOLD.
"""
from __future__ import annotations

import pathlib
import re
import sys

METRICS = (
    "01_article_full_data",
    "02_ad_campaigns_full_data",
    "03_advertisers_full_data",
    "04_ad_payments_full_data",
    "05_ad_history_full_data",
    "06_audit_logs_full_data",
    "07_auth_users_full_data",
    "08_storage_metadata_full_data",
    "09_app_RLS_policy_definitions",
    "10_table_owner_acl_RLS",
    "11_app_function_bodies_and_owners",
    "12_app_triggers_definitions",
    "13_constraints_definitions_validation",
    "14_sequences_definition",
    "15_database_extensions_versions",
    "16_app_default_privileges",
)
HEX = re.compile(r"[a-f0-9]{32}\Z")


class DiagnosticError(Exception):
    """Opaque failure; its description must not be printed."""


def read_private_manifest(path: str) -> tuple[str, ...]:
    p = pathlib.Path(path)
    if p.is_symlink() or not p.is_file() or p.stat().st_size > 4096:
        raise DiagnosticError()
    data = p.read_bytes()
    if not data.endswith(b"\n") or b"\r" in data or b"\x00" in data:
        raise DiagnosticError()
    lines = data.decode("utf-8", errors="strict").splitlines()
    if len(lines) != len(METRICS):
        raise DiagnosticError()
    values = []
    for metric, line in zip(METRICS, lines):
        key, separator, value = line.partition("=")
        if not separator or key != metric or not HEX.fullmatch(value):
            raise DiagnosticError()
        values.append(value)
    return tuple(values)


def evaluate(source: str, clone: str) -> int:
    a = read_private_manifest(source)
    b = read_private_manifest(clone)
    mismatch = [metric for metric, left, right in zip(METRICS, a, b) if left != right]
    if not mismatch:
        print("T034_DEEP_PARITY_DIAGNOSTIC_MATCH=ALL_16")
        return 0
    for metric in mismatch:
        # These are COMPILE-TIME CONSTANTS. Never print arbitrary file content.
        print("T034_DEEP_PARITY_MISMATCH_METRIC=" + metric)
    print("T034_DEEP_PARITY_MISMATCH_COUNT=" + str(len(mismatch)))
    return 1


def main() -> int:
    if len(sys.argv) != 3:
        raise DiagnosticError()
    return evaluate(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        # Raw file data, hash, exception, traceback or path MUST NEVER leak.
        print("T034_DEEP_PARITY_DIAGNOSTICS_INVALID=HOLD")
        sys.exit(2)
