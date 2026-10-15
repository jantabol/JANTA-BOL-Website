#!/usr/bin/env python3
"""FAKE-ONLY classifier regressions: no real DB, secret, B2 or network."""
import contextlib
import importlib.util
import io
import pathlib
import tempfile

path = pathlib.Path(__file__).with_name("jb-t034-metric10-diagnostics.py")
spec = importlib.util.spec_from_file_location("metric10", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def row(schema="public", key="0" * 32, **changes):
    v = [schema, key] + ["1" * 32] * 2 + ["N"] + ["2" * 32] * 6 + ["f", "f"]
    indices = {"KIND": 2, "OWNER": 3, "ACL_FORM": 4, "GRANTOR": 5,
               "GRANTEE": 6, "PUBLIC": 7, "PRIVILEGE": 8,
               "GRANT_OPTION": 9, "ACL_EXACT": 10, "RLS": 11, "FORCE_RLS": 12}
    for name, val in changes.items():
        v[indices[name]] = val
    return "|".join(v) + "\n"

def check(a, b, code, labels=(), must_not_include=""):
    with tempfile.TemporaryDirectory() as tmp:
        left = pathlib.Path(tmp, "left")
        right = pathlib.Path(tmp, "right")
        left.write_text(a)
        right.write_text(b)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            try:
                rc = mod.compare(str(left), str(right))
            except Exception:
                rc = 2
        printed = out.getvalue()
        assert rc == code, (rc, code)
        for label in labels:
            assert label in printed, label
        assert not must_not_include or must_not_include not in printed
        # Printed text is restricted to deterministic fixed labels and integers.
        for line in printed.splitlines():
            assert line.startswith("T034_METRIC10_") and (
                line.endswith("=HOLD") or line.endswith("=IDENTICAL")
                or line.rsplit("=", 1)[1].isdigit()
            )

base = row()
check(base, base, 0, ("T034_METRIC10_COMPONENT_DIAGNOSTICS=IDENTICAL",))
for field, modified in (
    ("KIND", "a" * 32), ("OWNER", "a" * 32), ("ACL_FORM", "X"),
    ("GRANTOR", "a" * 32), ("GRANTEE", "a" * 32),
    ("PUBLIC", "a" * 32), ("PRIVILEGE", "a" * 32),
    ("GRANT_OPTION", "a" * 32), ("ACL_EXACT", "a" * 32),
    ("RLS", "t"), ("FORCE_RLS", "t"),
):
    check(base, row(**{field: modified}), 1,
          (f"T034_METRIC10_{field}_DIFFERENCE_COUNT=1",),
          must_not_include="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
check(base, base + row(key="a" * 32), 1,
      ("T034_METRIC10_EXTRA_RELATION_COUNT=1",))
check(base + row(key="a" * 32), base, 1,
      ("T034_METRIC10_MISSING_RELATION_COUNT=1",))
# Schema grouping and duplicate/malformed/marker injection must remain safe.
check(base, row(schema="storage"), 1, ("T034_METRIC10_STORAGE_EXTRA_COUNT=1",))
with tempfile.TemporaryDirectory() as tmp:
    a, b = pathlib.Path(tmp, "a"), pathlib.Path(tmp, "b")
    a.write_text(base)
    for bad in (base + base, base + "SECRET_GRANT_DATA\n", "\n", base[:-1], base.replace("public", "leaky", 1)):
        b.write_text(bad)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            try:
                mod.compare(str(a), str(b))
            except (mod.Hold, ValueError, UnicodeError):
                print("T034_METRIC10_COMPONENT_DIAGNOSTICS_INVALID=HOLD")
        assert "SECRET_GRANT_DATA" not in out.getvalue()
        assert "INVALID=HOLD" in out.getvalue()
print("T034_RCA8_FAKE_PARSER_POSITIVE_NEGATIVE_PRIVACY=PASS")
