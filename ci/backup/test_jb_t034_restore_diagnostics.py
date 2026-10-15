#!/usr/bin/env python3
"""Synthetic-only adversarial checks. NO Supabase, B2, GitHub secrets or OWNER key."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("jb-t034-restore-diagnostics.py")
SECRET = "FAKE_OWNER_KEY_PII_SQL_SENTINEL_NEVER_PUBLISH"


class SafeRestoreDiagnosticsTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.root = Path(self.dir.name)
        self.logs = self.root / "json"
        self.logs.mkdir()
        self.client = self.root / "restore.log"
        self.toc = self.root / "toc.txt"
        self.report = self.root / "report.json"
        self.client.write_text(
            "pg_restore: error: could not execute query: ERROR: " + SECRET +
            "\npg_restore: error: from TOC entry 123; 1259 999 TABLE public " +
            SECRET + " postgres\n",
            encoding="utf8",
        )
        self.toc.write_text(
            "123; 1259 999 TABLE public " + SECRET + " postgres\n",
            encoding="utf8",
        )

    def run_capture(self, outer="1", inner="1", state="true|false"):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "capture",
             "--client-log", str(self.client),
             "--toc", str(self.toc),
             "--json-dir", str(self.logs),
             "--outer-rc", outer,
             "--inner-rc", inner,
             "--container-state", state,
             "--out", str(self.report)],
            capture_output=True, text=True, timeout=10,
        )

    def run_emit(self):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "emit", "--report", str(self.report)],
            capture_output=True, text=True, timeout=10,
        )

    def write_pg(self, severity="ERROR", code="42P07", target=True, many=False):
        entries = [{
            "timestamp": "2026-10-15 12:00:00.000 UTC",
            "application_name": "background_worker",
            "error_severity": "ERROR",
            "state_code": "XX001",
            "session_id": "bg.1",
            "session_line_num": 1,
            "message": SECRET,
        }, {
            "timestamp": "2026-10-15 12:00:02.000 UTC",
            "application_name": "jb_t034_full_restore" if target else "other",
            "error_severity": severity,
            "state_code": code,
            "session_id": "actual.1",
            "session_line_num": 6,
            "message": SECRET,
            "detail": SECRET,
            "context": SECRET,
            "internal_query": SECRET,
            "statement": SECRET,
        }]
        if many:
            entries.append({
                "timestamp": "2026-10-15 12:00:03.000 UTC",
                "application_name": "jb_t034_full_restore",
                "error_severity": "ERROR",
                "state_code": "23505",
                "session_id": "actual.1",
                "session_line_num": 7,
                "message": SECRET,
            })
        (self.logs / "fake.json").write_text(
            "\n".join(json.dumps(x) for x in entries) + "\n", encoding="utf8",
        )

    def test_first_correlated_error_over_background_worker_and_later_errors(self):
        self.write_pg(many=True)
        out = self.run_capture()
        self.assertEqual(out.returncode, 0, out.stdout)
        self.assertNotIn(SECRET, out.stdout + out.stderr)
        emitted = self.run_emit()
        self.assertEqual(emitted.returncode, 0, emitted.stdout)
        self.assertIn("T034_RESTORE_SQLSTATE=42P07", emitted.stdout)
        self.assertIn("T034_FIRST_TOC_ID=123", emitted.stdout)
        self.assertIn("T034_FIRST_TOC_TYPE=TABLE", emitted.stdout)
        self.assertIn("T034_DIAGNOSTIC_COMPLETENESS=CORRELATED", emitted.stdout)
        self.assertNotIn(SECRET, emitted.stdout + emitted.stderr)
        self.assertNotIn("XX001", emitted.stdout)
        self.assertNotIn("23505", emitted.stdout)

    def test_no_matching_app_has_unknown_sqlstate(self):
        self.write_pg(target=False)
        self.assertEqual(self.run_capture().returncode, 0)
        emitted = self.run_emit()
        self.assertIn("T034_RESTORE_SQLSTATE=UNKNOWN", emitted.stdout)
        self.assertIn("T034_DIAGNOSTIC_COMPLETENESS=PARTIAL", emitted.stdout)
        self.assertNotIn(SECRET, emitted.stdout)

    def test_client_archive_failure_without_sqlstate_or_toc(self):
        self.client.write_text(
            "pg_restore: error: input file does not appear to be a valid archive\n" + SECRET
        )
        self.assertEqual(self.run_capture(outer="1", inner="1").returncode, 0)
        out = self.run_emit().stdout
        self.assertIn("T034_FAILURE_CHANNEL=CLIENT_ARCHIVE", out)
        self.assertIn("T034_RESTORE_SQLSTATE=UNKNOWN", out)
        self.assertIn("T034_FIRST_TOC_ID=UNKNOWN", out)
        self.assertNotIn(SECRET, out)

    def test_docker_fail_without_inner_completion_marker(self):
        self.assertEqual(self.run_capture(outer="125", inner="UNKNOWN", state="false|unknown").returncode, 0)
        out = self.run_emit().stdout
        self.assertIn("T034_DOCKER_EXEC_EXIT=125", out)
        self.assertIn("T034_PG_RESTORE_EXIT=UNKNOWN", out)

    def test_possible_oom_not_claimed_proven(self):
        self.assertEqual(self.run_capture(outer="137", inner="UNKNOWN", state="false|true").returncode, 0)
        out = self.run_emit().stdout
        self.assertIn("T034_FAILURE_CHANNEL=PROCESS_INTERRUPTED", out)
        self.assertIn("T034_CONTAINER_OOM_FLAG=TRUE", out)

    def test_malformed_json_fails_closed_without_leak(self):
        (self.logs / "fake.json").write_text("{broken " + SECRET + "\n")
        fail = self.run_capture()
        self.assertNotEqual(fail.returncode, 0)
        self.assertFalse(self.report.exists())
        self.assertNotIn(SECRET, fail.stdout + fail.stderr)

    def test_parser_refuses_symlink_and_invalid_container_status(self):
        src = self.root / "sensitive.json"
        src.write_text(SECRET)
        (self.logs / "fake.json").symlink_to(src)
        fail = self.run_capture()
        self.assertNotEqual(fail.returncode, 0)
        self.assertNotIn(SECRET, fail.stdout + fail.stderr)
        (self.logs / "fake.json").unlink()
        self.assertNotEqual(self.run_capture(state="THIS|" + SECRET).returncode, 0)

    def test_emit_rejects_unvalidated_extras_and_secret_field(self):
        self.assertEqual(self.run_capture().returncode, 0)
        data = json.loads(self.report.read_text())
        data["private_SQL"] = SECRET
        self.report.write_text(json.dumps(data), encoding="utf8")
        result = self.run_emit()
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(SECRET, result.stdout + result.stderr)

    def test_emit_rejects_newline_injection(self):
        self.assertEqual(self.run_capture().returncode, 0)
        data = json.loads(self.report.read_text())
        data["T034_DOCKER_EXEC_EXIT"] = "1\n" + SECRET
        self.report.write_text(json.dumps(data), encoding="utf8")
        result = self.run_emit()
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(SECRET, result.stdout + result.stderr)

    def test_error_on_success_code_or_success_marker_conflict(self):
        self.assertNotEqual(self.run_capture(outer="0").returncode, 0)
        self.assertNotEqual(self.run_capture(outer="125", inner="0").returncode, 0)
        self.assertFalse(self.report.exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
