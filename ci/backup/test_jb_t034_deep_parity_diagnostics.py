#!/usr/bin/env python3
"""No-secrets fake tests of fixed-label-only deep parity classification."""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HELPER = Path(__file__).with_name("jb-t034-deep-parity-diagnostics.py")
METRICS = (
    "01_article_full_data", "02_ad_campaigns_full_data",
    "03_advertisers_full_data", "04_ad_payments_full_data",
    "05_ad_history_full_data", "06_audit_logs_full_data",
    "07_auth_users_full_data", "08_storage_metadata_full_data",
    "09_app_RLS_policy_definitions", "10_table_owner_acl_RLS",
    "11_app_function_bodies_and_owners", "12_app_triggers_definitions",
    "13_constraints_definitions_validation", "14_sequences_definition",
    "15_database_extensions_versions", "16_app_default_privileges",
)
SENTINEL = "TOP_SECRET_CONFIDENTIAL_TEST_ONLY_NEVER_PRINT"

class ParityFakeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / "source"
        self.clone = self.root / "clone"
        self.same = ["a" * 32] * 16
        self.put(self.source,self.same)
        self.put(self.clone,self.same)

    @staticmethod
    def put(path,values):
        path.write_text("".join(m+"="+v+"\n" for m,v in zip(METRICS,values)),encoding="utf8")

    def call(self):
        z=subprocess.run([sys.executable,str(HELPER),str(self.source),str(self.clone)],
                         stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=8)
        self.assertNotIn(SENTINEL,z.stdout+z.stderr)
        return z

    def test_exact_16_pass(self):
        z=self.call()
        self.assertEqual(z.returncode,0)
        self.assertEqual(z.stdout.strip(),"T034_DEEP_PARITY_DIAGNOSTIC_MATCH=ALL_16")

    def test_one_data_mismatch_only_constant_label(self):
        v=self.same.copy();v[5]="b"*32;self.put(self.clone,v)
        z=self.call()
        self.assertEqual(z.returncode,1)
        self.assertIn("T034_DEEP_PARITY_MISMATCH_METRIC=06_audit_logs_full_data",z.stdout)
        self.assertIn("T034_DEEP_PARITY_MISMATCH_COUNT=1",z.stdout)
        self.assertNotIn("b"*32,z.stdout)
        self.assertNotIn("a"*32,z.stdout)

    def test_two_security_mismatches_and_count(self):
        v=self.same.copy();v[9]="b"*32;v[15]="c"*32;self.put(self.clone,v)
        z=self.call()
        self.assertEqual(z.returncode,1)
        self.assertIn("T034_DEEP_PARITY_MISMATCH_METRIC=10_table_owner_acl_RLS",z.stdout)
        self.assertIn("T034_DEEP_PARITY_MISMATCH_METRIC=16_app_default_privileges",z.stdout)
        self.assertIn("T034_DEEP_PARITY_MISMATCH_COUNT=2",z.stdout)

    def test_malformed_sensitive_hash_rejected_without_echo(self):
        v=self.same.copy();v[2]=SENTINEL;self.put(self.clone,v)
        z=self.call();self.assertEqual(z.returncode,2)
        self.assertEqual(z.stdout.strip(),"T034_DEEP_PARITY_DIAGNOSTICS_INVALID=HOLD")

    def test_unknown_metric_name_refused(self):
        self.clone.write_text(self.clone.read_text().replace("01_article_full_data",SENTINEL))
        self.assertEqual(self.call().returncode,2)

    def test_duplicate_name_rejected(self):
        t=self.clone.read_text().splitlines()
        t[4]=t[3]
        self.clone.write_text("\n".join(t)+"\n")
        self.assertEqual(self.call().returncode,2)

    def test_missing_newline_or_extra_line_rejected(self):
        self.clone.write_bytes(self.clone.read_bytes().rstrip(b"\n"))
        self.assertEqual(self.call().returncode,2)
        self.put(self.clone,self.same)
        self.clone.write_text(self.clone.read_text()+SENTINEL+"\n")
        self.assertEqual(self.call().returncode,2)

    def test_symlink_source_rejected(self):
        original=self.source
        backing=self.root / "backing"
        original.rename(backing)
        original.symlink_to(backing)
        self.assertEqual(self.call().returncode,2)

    def test_unknown_cli_or_missing_file_never_traceback(self):
        z=subprocess.run([sys.executable,str(HELPER),str(self.source),SENTINEL],
                         capture_output=True,text=True,timeout=8)
        self.assertEqual(z.returncode,2)
        self.assertEqual(z.stdout.strip(),"T034_DEEP_PARITY_DIAGNOSTICS_INVALID=HOLD")
        self.assertEqual(z.stderr,"")

if __name__=="__main__":
    unittest.main(verbosity=2)
