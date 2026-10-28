# JANTA BOL — Phase 4 T071 / Step 4 (G4) — Independent E8 Evidence Audit
**Date:** 27 October 2026 IST
**Owner directive:** single-shot independent E8 verification; no rebuild, no fake PASS, old work safe, Soft Launch priority.
**FINAL VERDICT:** **G4 source/log and local recovery evidence independently cross-checked: PASS for verified scope.** **Full-system independent E8: HOLD. T071 FINAL PASS+LOCK: HOLD.**

## 1. What was actually checked independently — with exact identities
| Evidence | External original checked | Independent finding |
|---|---|---|
| G2 thirteen failure families | GitHub Actions `40498177713`, job `122168854308`, source SHA `e371706dd3ea0d53d9763d3fcab896b994bc989d` | **80/80 Node cases PASS**, of which **13 domain checks executed actual JANTA BOL source adapters in a VM with stubbed failing dependencies**. G2 explicitly says hosted/integrated fault matrix `NOT_RUN`. Cannot promote to complete real-system E2/E8. |
| G3 real PG17 local crash & recovery | GitHub Actions `40501228346`, job `122179118305`, code SHA `8b6fcab5327cb7aed5eaf328772c1a970d3bfca8` | **SUCCESS**, genuine disposable Docker PostgreSQL 17 `SIGKILL` / failed connection / same local DB endpoint restored and independently queried. No live JANTA BOL database, Edge, Auth or Vercel touched. |
| G3 original log payload integrity | SHA256 of canonical original JSON `b5edd1774be77b52ecc2cb47e59a6797a20dfee354461dbd98095220808d2220` | New independent Node auditor **recomputed and matched** canonical digest, verified expected source SHA, job/run IDs and allowed data-loss disclosure. |
| Timepoints | Last verified restorable checkpoint `12:07:02.908542Z`, incident `12:07:03.330412Z`, verified restored `12:07:04.590969Z` | Local snapshot-to-incident = **0.422 seconds RPO-point age**; local incident-to-restored = **1.261 seconds RTO** (rounded); **one committed synthetic post-checkpoint Article was lost and detected**. This is not production RPO/RTO nor an approved target. |
| Old protected source & production | GitHub `main` `f447231c0677644ca5a44cc19f12cf0314ff38ea`; Vercel prod deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`, target `production`, READY | SHA parity **verified read-only**; no merge or production changes. GET `/ ` HTTP 200 still serves old static `🔴 LIVE` and unreviewed claims as public HTML. This is a separate urgent editorial launch blocker, not proof they are factually true or false. |
| Reviewed B8/B9 public candidate | Preview `dpl_7HvpnryrKX6CSnKkrBefsZSTkuXk` | Authenticated HTTP GET root and B9 search returned **200**; public news/search backend E2E + final Founder tagline HEAD still NOT deployed/accepted. Old preview still displays obsolete `स्थानीय समाचार` badge, don't call final branding shipped. |
| Independent live Supabase check | JANTA BOL project `vrffsnkycvjithwtiylt`; read-only SQL incl. `SET LOCAL ROLE anon` | **100/100 public base tables RLS enabled**; direct `anon SELECT public.articles` **permission denied**; direct `anon SELECT public.grievance_evidence` ungranted; `anon jb_b9_search('T032')` returned **one public RPC result**. No data mutation. |

### Public-news anonymous-read concern — verify separately before soft launch
The preview's `backend-client.js` `listPublishedPublic()` uses a **direct `from('articles').select(...)`**. Independent SQL under `anon` failed on direct `public.articles` SELECT, while `jb_b9_search` works under `anon`. This is a **fresh source+ACL mismatch requiring Android true-logged-out replay / route verification**, not a permission grant authorization or proof every visitor currently fails. We did **not** loosen database privileges or change any RLS.

## 2. Executed genuinely independent G4 review workflow
- Added independent observation pack: `ci/phase4/b11/t071-e8-independent-observation-register-20261027.json`.
- Added source/recovery evidence cross-check: `ci/phase4/b11/t071-e8-independent-review.mjs`.
- Added adversarial regression suite: `ci/phase4/b11/t071-e8-independent-review.test.mjs`. Rejects forged log IDs, wrong source pins, 0-loss fabrication, swapped recovery timestamps, local→production metric promotion, faked Founder signature, live E8 assertions, fake production editorial clearance, anonymous privilege escalation and forbidden prod fault injection.
- Added **PR-only, no-credential, no-external-write** workflow `.github/workflows/b11-t071-g4-independent-e8-review.yml`.
- **Independent GitHub Actions run `40502445962`, job `122183220235`: SUCCESS — 21/21 tests PASS, 0 FAIL.** Exact reviewer code HEAD `e77636c90e3fe1ee856940e497735f84af6da4f6`. CI output explicitly:
```
T071_G4_INDEPENDENT_SCOPED_G2_G3_EVIDENCE=CHECKED
T071_G4_INDEPENDENT_FULL_PRODUCT_E8=HOLD
T071_G4_PRODUCTION_RPO_RTO=NOT_ESTABLISHED
T071_G4_OLD_PRODUCTION_STATIC_EDITORIAL_RISK=PRESENT
T071_G4_FINAL_LOCK=false
```
- Old T071 Preflight `40502445977` SUCCESS and local PG17 recovery `40502445768` SUCCESS on same source revision. **Those are historical/review confirmation, not a new full-system E8**.

## 3. Remaining mandatory T071 contract proof (do NOT invent 'hosted' requirement)
The user's Master PDF p.304, `P4-T071 / RECOV-019..026 / §§600–616`, requires controlled failures across 13 modules, RPO/RTO practical recovery review, E1 + E2 + E5 + E8, and baseline publishing/LIVE regressions. **It does not mandate paid external hosting.**

Needed for **E8 full PASS** — on one safely isolated *integrated* runtime, which may be local/disposable:
1. Actual connected module failure/recovery effects and before/after transactions for all relevant domain boundaries: Article read and publish survive optional-module faults; sensitive writes and private data deny; payment ambiguity cannot activate Ads; messaging failures cannot undo committed business actions; database failed writes never show success. G2 fake RPC responses alone do not show server persistence.
2. Negative audit/log samples + independent review bound to the same code/config/restore point; Auth, Edge, LIVE/provider, Ads/Payment, Grievance/Compliance and Search actually integrated, and core publishing + LIVE regressions verified.
3. Practical project-appropriate **Founder approved RPO/RTO targets** and measured **eligible same-system recovery evidence**, with any post-checkpoint lost writes disclosed; G3 local 0.422s/1.261s are not project SLA targets.
4. Independent E8 reviewer/Founder final acceptance evidence and release-candidate identity, without transferring authority to synthetic CI data.

**No deliberate fault was introduced into production and no staging/paid clone was created.** If a full integrated isolated runtime cannot safely be exercised with current tools/budget, these checks **remain HOLD**, not waived.

## 4. Exact audited outcome

| Gate | Result |
|---|---|
| E1 — source identity & public deployment binding (scope) | **CHECKED** |
| E2 — 13 source-adapter VM failures (scope) | **CHECKED** |
| E2 — actual disposable PG17 recover (scope) | **CHECKED** |
| E5 — reviewed G2/G3 GitHub logs, digests, negative test evidence | **CHECKED** |
| E8 — independent scope-limited evidence reconciliation | **PASS — 21/21 CI cases** |
| **E8 — fully integrated end-to-end recovery and module isolation** | **HOLD** |
| **T071 Final PASS+LOCK** | **HOLD (NOT LOCKED)** |
| **T070 Full E8** | **HOLD** |
| Production / main / secrets / DB modified? | **NO** |
| Founder Android/manual step in G4 audit | **NONE** |

## 5. Final decision
**G4 independent evidence-audit work: COMPLETE for the available, honest scope. Full T071 E8: NOT COMPLETE.**

Evidence is now clear and tied to real GitHub run IDs. Do **not** re-label a source-VM/test-container pass as a complete integrated E8. Next *distinct* gate is one true integrated module-persistence/recovery test using safe isolated runtime and a Founder-approved acceptable loss/recovery objective, then independent review. The separate public editorial/anonymous-read risks remain Soft Launch blockers.

**Founder release authorization has NOT been assumed.**
