# JANTA BOL / B11 — T072 P2 original Case-Creation Android durable request UUID candidate / T075 blocker route
**Date:** 28 Oct 2026 IST. **Scope:** Review-only candidate; original app untouched; no production SQL/client deployment, no secret/credential access.

## Actual blocker
Original B8 case Owner RPC `jb_b8_g1_owner_create_case(text,text,text)` can create **two independent permanent cases** if first request commits and acknowledgment is lost, then the exact request is retried. Original real PG17 negative proof GitHub run `40641234256`; exact protected SQL idempotent proposal and eight concurrent PostgreSQL session proof run `40642901985` (8 identical requests -> one case scoped), but original production RPC remains in use.

## New executed solution candidate
- New standalone **browser client proposal**, not imported by the old B8 UI, file `ci/phase4/b11/t072-durable-owner-idempotency-CLIENT_PROPOSAL_ONLY.mjs`.
- Calls **only** protected proposed four-argument RPC `jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)`; **never** falls back to the original duplicate-prone RPC.
- Uses secure random per-intent UUID, persistent per-owner request key **before sending RPC**, SHA-256 of salted canonical payload (without storing title, area or private case ID), Web Locks for simultaneous-tab exclusion, fresh Supabase `auth.getUser()` actor binding before and inside the exclusive lock; Backend remains sole live Owner/AAL2 authority.
- Ambiguous acknowledgment, offline request or server error leaves **PENDING** record, retries same exact UUID and payload; changed inputs while pending **denied**. Refresh/new tab can use same key. Intentional *new* case requires separate explicit operation and previous request to be **CONFIRMED**; cannot discard a PENDING request. A missing Web Locks API, insecure entropy, denied Storage, corrupt state or expired user fails CLOSED before possible duplicate write.
- Doesn't silently change Source B8 class, Owner UI, migration or Supabase production. This helper is not an approved release component until Founder Android private-mode/storage/lock manual checks, hosted old/new RPC parity, production migration security review and exact-source integration.

## Actual CI
GitHub Actions **40648819696 / job 122683845185 SUCCESS** on proposed branch earlier SHA `8c6d44d3294df12bb734275df3be8a05f68b96e6`:
- New injected browser durable client concurrency/unknown-ack/auth/role/storage/failure tests **16/16 PASS**.
- Original immutable B8 Android G1/G3 workflow regression tests checked on real repository commit `89849ba47f443f423d8bfe4f966bb2d38087201f`: **18/18 PASS**.
- First workflow logs included a confusing status label `T072_CLIENT_PROPOSAL_NOT_INTEGRATED=false` despite the actual source being **not integrated**. A follow-up **log label only** commit changes it to truthful `T072_CLIENT_PROPOSAL_INTEGRATED=false`, no application behavior or data modification. Re-run proof must be inspected for final CI SHA.
- **Test status:** candidate client PASS_SCOPED; original P2 Production OPEN, **T072 Final HOLD**; downstream B11 **T075 Final HOLD**.

## Required protected final work (no invented PASS)
1. Independent audit proposed SQL (private request ledger, revoked/AAL1/expired token negative; request collision, same payload repeated, mismatch payload and 8-way actual PG17).
2. Modify actual B8 Owner create UI **only in a reviewed branch** to call this client, with clear Android handling of unknown/retry/new intent; preserve all old source/tests and private lock, no local private content.
3. Real Founder Android HTTPS browser and Web Locks + persistent storage tests across refresh/tab/unknown connection (incognito may lack storage; that means HOLD, not bypass).
4. Separate Founder-approved, protected production migration only with clean rollback evidence. No original RPC removal without full call-site scan and independent release gate; production access and existing Article/Ad/LIVE/Cricket remain unchanged.
5. Correlated T070/T074 real independent offline restore, E3 backup automation and T075 full E8/Founder final signoff remain independent blockers.

## Security and release decision
**No Main merge, no Production, no B8 old source edits, no Vercel build/deploy, no private credentials, no Cricket/Saarthi.** This is a genuinely tested minimal component candidate, not the production fix. News-only Soft Launch may be discussed as a scoped feature release separately, but cannot automatically waive this P2 while case-creation is still accessible.
