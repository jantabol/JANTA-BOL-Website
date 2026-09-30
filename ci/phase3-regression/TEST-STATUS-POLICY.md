# JANTA BOL — Phase 3A Test Status Policy

Source requirement: Phase 3A Master Blueprint Section 466 / Test 3A-P4-T025.

Official Phase 3A test-result statuses are exactly:

- PASS — expected result was observed with required evidence and affected regression is clean.
- FAIL — observed behavior contradicts the requirement or expected result.
- OPEN — test is not yet closed because required evidence, fix, or verification is still pending.
- DEFERRED — test is intentionally postponed only with a specific reason, required future condition, and retest point.

Rules:
- PRE-CHECK, candidate, technical evidence, mapped, due, skipped CI step, or chat confirmation are not substitutes for these official result statuses.
- Manual/device-only tests remain OPEN until their required real-device evidence exists.
- A failed test cannot become PASS by weakening its checker.
- A DEFERRED test must retain its reason and retest condition.
- Historical locked PASS records remain preserved unless a material regression contradicts them.
