# T082 E5 — Anonymous Chrome / Actual LIVE Draft Privacy Review (31 October 2026)

**State:** Review-only. Do not confuse 2 public browser checks with a complete independent cross-account API penetration test. T082 FINAL PASS/LOCK HOLD; T081 E8 HOLD.

## Original Founder proof
An Android Incognito screenshot (7:25pm, Oct 31) from `jantabol.in` with `&preview=admin` showed the exact safe message **"Admin preview temporarily unavailable. Please retry securely."** and did not show any T006 draft headline, body or internal note. Earlier Android Incognito without `preview=admin` showed **"Article available nahi hai ya currently unpublished hai."** Both images are held only in conversation, not committed publicly.

## Original connected-source proof (read-only)
Original production C1 public-articles RPC returned **0** for draft T006 `fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14`, **1** for genuine published SpaDeX and **2** in public published feed, excluding `source_url`, `internal_note` and `verification_evidence`. Actual source `article.html` checks `JBBackend.requireOwner()` before private Admin Preview read. Prior 33/33 synthetic/historical regression: GitHub Actions `41207099039` PASS.

## Additional actual clean-browser test
- Exact base: PR #90 HEAD `c4fdbe30e096b6059f00e64cfaf55b4987e4103d`, actual live production source is still from `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`.
- GitHub Actions runs **preinstalled headless Chrome**, each test with a fresh incognito, empty temporary browser profile. GETs only the two *non-published* draft article routes (plain public URL and `preview=admin`). It does **not** request a published article, submit analytics, use Founder tokens, access secrets, write data, upload files or trigger any backup.
- Valid assertions target **actually rendered** `#root` DOM. Both routes must show exact denied messages without the known T006 headline/body or internal QA note. Missing Chrome, blocked network or dynamic JS not loading results in failure/HOLD, **never** automatically passes by matching a static HTML shell.
- No product code changed. This is a *live anonymous browser check*, but **not** an aggressive API IDOR/token replay, and NOT proof that arbitrary hostile clients cannot access restricted backend resources.

## Continuing soft-launch priorities
- Real Founder T006 Draft Save `v5→v6`, persisted QA-only internal note and real DB audit PASS_SCOPED.
- Real historic production test-only record showed 20/20 Article version and audit snapshot parity and 5 publish/5 exit/5 correction historical transitions; this was **not** a fresh 2026-10-31 Owner E4 lifecycle.
- No free JANTA BOL Supabase branch or independent private live publish namespace was found. New branch has hourly costs; do not create it under Founder ₹0. Never promote a test-only fake article into the live news feed to get a PASS.
- Current full Owner-only Correction→Unpublish→Republish E4 and full cross-account API E5 remain separate HOLD gates. T083 independent safe read-only work may proceed under Soft Launch priority; T081 full E8 remains HOLD.
