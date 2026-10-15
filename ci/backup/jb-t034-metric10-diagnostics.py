#!/usr/bin/env python3
"""Never disclose private metric-10 per-relation rows, tokens, or hashes.

Compare two private, ephemeral psql -At outputs; print ONLY fixed-safe categories,
schema classes and bounded integer counts. Even parser failures remain opaque.
"""
from __future__ import annotations

import pathlib
import re
import sys

SCHEMAS = ("public", "private", "auth", "storage")
FIELDS = ("KIND", "OWNER", "ACL_FORM", "GRANTOR", "GRANTEE",
          "PUBLIC", "PRIVILEGE", "GRANT_OPTION", "ACL_EXACT", "RLS", "FORCE_RLS")
HEX = re.compile(r"[a-f0-9]{32}\\Z", re.ASCII)
MAX_BYTES = 2_000_000
MAX_ROWS = 20_000


class Hold(Exception):
    pass


def load(path: str) -> dict[tuple[str, str], tuple[str, ...]]:
    p = pathlib.Path(path)
    if p.is_symlink() or not p.is_file() or p.stat().st_size > MAX_BYTES:
        raise Hold()
    raw = p.read_bytes()
    if not raw or not raw.endswith(b"\\n") or b"\\r" in raw or b"\\0" in raw:
        raise Hold()
    lines = raw.decode("ascii", errors="strict").splitlines()
    if len(lines) > MAX_ROWS:
        raise Hold()
    result: dict[tuple[str, str], tuple[str, ...]] = {}
    previous = None
    for line in lines:
        v = line.split("|")
        if len(v) != 13 or v[0] not in SCHEMAS:
            raise Hold()
        if not all(HEX.fullmatch(v[k]) for k in (1, 2, 3, 5, 6, 7, 8, 9, 10)):
            raise Hold()
        if v[4] not in ("N", "E", "X") or v[11] not in ("t", "f") or v[12] not in ("t", "f"):
            raise Hold()
        key = (v[0], v[1])
        if key in result or (previous is not None and key <= previous):
            raise Hold()
        previous = key
        result[key] = tuple(v[2:])
    return result


def compare(source: str, clone: str) -> int:
    left, right = load(source), load(clone)
    if not left or not right:
        raise Hold()
    keys_a, keys_b = set(left), set(right)
    missing, extra = keys_a - keys_b, keys_b - keys_a
    common = keys_a & keys_b
    print("T034_METRIC10_COMPONENT_DIAGNOSTICS=HOLD" if left != right else
          "T034_METRIC10_COMPONENT_DIAGNOSTICS=IDENTICAL")
    for schema in SCHEMAS:
        print(f"T034_METRIC10_{schema.upper()}_SOURCE_COUNT={sum(k[0] == schema for k in keys_a)}")
        print(f"T034_METRIC10_{schema.upper()}_CLONE_COUNT={sum(k[0] == schema for k in keys_b)}")
        print(f"T034_METRIC10_{schema.upper()}_MISSING_COUNT={sum(k[0] == schema for k in missing)}")
        print(f"T034_METRIC10_{schema.upper()}_EXTRA_COUNT={sum(k[0] == schema for k in extra)}")
    print(f"T034_METRIC10_MISSING_RELATION_COUNT={len(missing)}")
    print(f"T034_METRIC10_EXTRA_RELATION_COUNT={len(extra)}")
    for index, name in enumerate(FIELDS):
        count = sum(left[k][index] != right[k][index] for k in common)
        print(f"T034_METRIC10_{name}_DIFFERENCE_COUNT={count}")
    return 0 if left == right else 1


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise Hold()
        sys.exit(compare(sys.argv[1], sys.argv[2]))
    except Exception:
        print("T034_METRIC10_COMPONENT_DIAGNOSTICS_INVALID=HOLD")
        sys.exit(2)
