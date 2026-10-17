# B8 G2 CP02–CP04 Test Register Addendum — 17 Oct 2026
WHY SEPARATE: do not rewrite the 300KB protected original TEST-REGISTER.md just to assert a bounded new checkpoint. Reconcile this addendum into the canonical register with expected-blob review before B8 FINAL ZIP.

| Gate | Tested code source | Real environment and evidence | Outcome |
|---|---|---|---|
| G2 CP02 linked Article legal hold | 208f7cbc0ec51d7056d735cfa4b47a59b6c94c34 | Actual isolated Postgres17 synthetic attempted hard delete denied before 3 legacy ON DELETE CASCADE tables; rollback; GitHub #39007733691 | PASS *isolated candidate only* |
| G2 CP03 private upload metadata | same | Actual Postgres17 deny-by-default authenticated reporter JWT + service_role-only receipts, suspended reporter, quotas, no false documentary status, rollback; run #39007733691 | PASS *isolated candidate only* |
| G2 CP03 private byte readback | same | Node 10/10 tested server MIME magic, 8 MiB cap, actor and intent binding, SHA256 upload-to-readback, timeout cleanup; runner uses TEST storage adapter | PASS *mock storage / E1 only* |
| G2 CP04 concurrent Article delete/link | same | Real two PG17 sessions, FOR KEY SHARE caused linked old hard-delete attempt lock timeout, both rollback; run #39007733691 | PASS *isolated candidate only* |
| Old protected News/Auth/B7 gate | same | Existing original Phase3 STATIC/CI and B7 9/60 truth guard, run #39007733691 | STATIC PASS; no full live E3 |
| Real hosted private bucket, Android Reporter/Owner and legal disposition | not deployed | No real E2/E3/E5; legal release path not implemented; actual production old-main vs Preview E7 separate | **DUE / NO FINAL G2 LOCK** |

All 8 Official B8 T092–T099 remain 0/8 FINAL; all 51 ACC official requirements 0/51 complete evidence. No Production SQL, Storage, Vercel, Article or Paid Ads changed. Founder B0–B6 prior locks not rewritten; B7 first-shop paid ad HOLD remains. See B8_G2_CP02_CP04_ENGINEERING_FREEZE_LIVE_E3_HOLD_20261017.md.
