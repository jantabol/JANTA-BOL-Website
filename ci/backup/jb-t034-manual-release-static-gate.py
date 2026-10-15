#!/usr/bin/env python3
"""P4-T034 CP-04: STATIC ONLY, fail-closed release workflow security checks.

Reads repo YAML as untrusted TEXT. No GitHub auth, live DB, B2, secrets, or
workflow dispatch. Only ensures reviewed workflow text satisfies a minimal
safety contract; does NOT assert that GitHub Environment UI gates are active.
"""
from pathlib import Path
import re
import sys

MANUAL = ".github/workflows/b7-t034-dual-recipient-real-MANUAL.yml"
PRE_FLIGHT = "      - name: Fail closed before connecting to production"
REAL_STEP = "      - name: ACTUAL encrypted B2 export"
SECRETS = (
    "SUPABASE_DB_PASSWORD",
    "JB_BACKUP_AGE_RECIPIENT",
    "JB_BACKUP_B2_KEY_ID",
    "JB_BACKUP_B2_APPLICATION_KEY",
    "JB_BACKUP_REMOTE_PREFIX",
)


def validate(src: str) -> list[str]:
    defects = []
    def check(condition: bool, label: str):
        if not condition:
            defects.append(label)
    # This dedicated manual workflow must NEVER have automatic triggers.
    check(bool(re.search(r"(?m)^on:\n  workflow_dispatch:\n", src))
          and not re.search(r"(?m)^  (?:push|pull_request|schedule|repository_dispatch):", src),
          "manual-only-event")
    check("JANTA_BOL_DUAL_RESTORE_ONLY" in src
          and bool(re.search(r"(?m)^      confirmation:\n", src)),
          "typed-founder-confirmation")
    check(bool(re.search(r"(?m)^      reviewed_sha:\n"
                         r"        description:.*\n"
                         r"        type: string\n"
                         r"        required: true\n", src)),
          "required-reviewed-sha-input")
    gates = (
        "github.event_name == 'workflow_dispatch'",
        "github.repository == 'jantabol/JANTA-BOL-Website'",
        "github.actor == 'jantabol'",
        "github.ref == 'refs/heads/main'",
        "github.run_attempt == 1",
        "github.event.inputs.confirmation == 'JANTA_BOL_DUAL_RESTORE_ONLY'",
        "github.event.inputs.reviewed_sha == github.sha",
    )
    header = src.split("\n    runs-on:", 1)[0]
    for gate in gates:
        check(gate in header, "missing-job-gate-" + gate.split(" ")[0])
    check("    environment: janta-bol-production-backup" in src,
          "exact-secret-environment")
    check("permissions:\n  contents: read\n" in src,
          "least-privileged-token")
    check("      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683"
          in src, "pinned-checkout-action")
    check("      - name: Pinned official Supabase CLI\n"
          "        uses: supabase/setup-cli@45a513f8c64c0bc8e0e3dfe572b5c95be85f6359" in src,
          "pinned-supabase-setup-action")
    check(src.count(PRE_FLIGHT) == 1 and src.count(REAL_STEP) == 1,
          "exact-preflight-and-release-steps")
    if REAL_STEP in src:
        before, after = src.split(REAL_STEP, 1)
        check("secrets." not in before, "no-secret-before-release-step")
        check("        env:\n          JB_T034_DUAL_RESTORE_PROBE: '1'" in after,
              "private-release-environment")
        for name in SECRETS:
            check(("          " + name + ": " + "$" +
                   "{{ secrets." + name + " }}") in after,
                  "only-release-secret-" + name)
        check(src.count("secrets.") == len(SECRETS),
              "no-duplicate-or-extra-secret-reference")
        check("run: bash ci/backup/jb-free-offsite-backup.sh" in after,
              "reviewed-production-helper")
    if PRE_FLIGHT in src:
        preflight = src.split(PRE_FLIGHT, 1)[1].split("      - name:", 1)[0]
        check("JB_REVIEWED_SHA: " + "$" + "{{ github.event.inputs.reviewed_sha }}"
              in preflight, "safe-quote-reviewed-sha")
        check('[[ "$JB_REVIEWED_SHA" =~ ^[a-f0-9]{40}$ ]]' in preflight
              and '[[ "$JB_REVIEWED_SHA" == "$GITHUB_SHA" ]]' in preflight,
              "sha-matching-preflight")
        check("bash -n ci/backup/jb-t034-offline-full-pg-restore.sh"
              in preflight and
              "bash -n ci/backup/jb-t034-shared-snapshot.sh" in preflight,
              "exact-full-restore-preflight")
    check("uses: actions/upload-artifact" not in src,
          "no-public-archive-artifact")
    return defects


def fake_negative_tests(src: str):
    mutations = [
        ("remove-actor", "github.actor == 'jantabol'", "github.actor == 'nobody'"),
        ("remove-run-attempt", "github.run_attempt == 1", "github.run_attempt == 5"),
        ("remove-sha-binding", "github.event.inputs.reviewed_sha == github.sha",
         "github.event.inputs.reviewed_sha != github.sha"),
        ("change-env", "environment: janta-bol-production-backup",
         "environment: non-secure-test"),
        ("wrong-branch", "github.ref == 'refs/heads/main'",
         "github.ref == 'refs/heads/dev'"),
        ("secret-exposure", PRE_FLIGHT, "      - name: EXPOSED\n"
         "        env:\n          SUPABASE_DB_PASSWORD: " +
         "$" + "{{ secrets.SUPABASE_DB_PASSWORD }}\n" + PRE_FLIGHT),
        ("unapproved-automatic-run", "on:\n  workflow_dispatch:",
         "on:\n  push:\n  workflow_dispatch:"),
        ("unprotected-sha", '[[ "$JB_REVIEWED_SHA" == "$GITHUB_SHA" ]]',
         '[[ "$JB_REVIEWED_SHA" != "$GITHUB_SHA" ]]'),
    ]
    for label, before, after in mutations:
        if before not in src:
            raise SystemExit("HOLD: negative fixture could not locate " + label)
        if not validate(src.replace(before, after, 1)):
            raise SystemExit("HOLD: unauthorized change was not detected: " + label)
    print("PASS CP04 FAKE negative: 8 adversarial release-gate mutations rejected")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: gate.py path-to-reviewed-manual-workflow")
    path = Path(sys.argv[1])
    if path.as_posix() != MANUAL or not path.is_file():
        raise SystemExit("HOLD: only canonical JANTA BOL manual workflow may be checked")
    src = path.read_text(encoding="utf-8")
    failures = validate(src)
    if failures:
        raise SystemExit("HOLD: release workflow security invariant(s): " + ", ".join(failures))
    print("PASS CP04 STATIC: manual-only, actor/main/first-attempt, SHA-bound, secret-scoped")
    fake_negative_tests(src)
    print("NOT A REAL RESTORE OR ENVIRONMENT APPROVAL PROOF; T034 HOLD")


if __name__ == "__main__":
    main()
