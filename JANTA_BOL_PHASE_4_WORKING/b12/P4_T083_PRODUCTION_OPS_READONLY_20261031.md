# P4-T083 — Production Operations, Audit, DUE & Topic-11 Final Lock Preflight

**Observation:** 31 October 2026. **Review-only / no real production changes / no cost.** Source authority: JANTA BOL Phase-4 Master Execution Pack, **P4-T083, Topic 11, Sections 722–734**, E1+E3+E6+E7+E8 and full original CI protection.

## Proven from actual connected sources (Vercel/GitHub)
- Vercel active JANTA BOL project: `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`. Both `jantabol.in` and `www.jantabol.in` are marked **verified** by the project domain API. WWW is configured as HTTP **308 redirect to apex**. This is **provider configuration evidence**, not an independently captured external TLS handshake.
- Current `jantabol.in` and `www.jantabol.in` aliases resolve within Vercel to READY deployment `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`; Git SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, branch `codex/t080-admin-ack-failclosed-review-20261031`.
- Exact earlier READY candidate `dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx`, Git SHA `14a929180d99088e950475eeee609cae8e3f01c8`. **Do not auto-rollback or restore DB** based on READY alone.
- Protected `main` `f447231c0677644ca5a44cc19f12cf0314ff38ea` is **434 commits behind** current served Git source. Any attempt to blindly deploy Main would risk production regression and must be stopped.
- Read-only Vercel domain-config reports apex `configuredBy=A`, public A address `76.76.21.21`; authoritative listed nameservers `ns15.domaincontrol.com` / `ns16.domaincontrol.com` (external registrar DNS), `misconfigured=false`, no conflicts, `ipStatus=no-change`. Do not make DNS edits.
- Project domain verification is not proof of GoDaddy account ownership, auto-renew or paid renewal date. Independent `GET /v5/domains/jantabol.in` returned **403 not authorized** via the connected Vercel account (the domain is externally registered), so registrar ownership and renewal expiry are **NOT_VERIFIED**. This is NOT an outage of the public domain.
- Vercel certificate-list endpoint returned **no cert records visible for this account**. That alone cannot prove a missing or expired live cert (project-level managed certs can be represented differently); the true external certificate date/issuer and chain are separately tested by the review GitHub Actions network job and remain **NOT_VERIFIED until the job succeeds**.
- A limited assistant-side external network probe was DNS-blocked in its execution environment; its inability to resolve `jantabol.in` is **not** an assertion that the actual site is down. Founder earlier provided real Android screenshots of live HTTPS article and safe draft privacy behavior.

## Scope-locked T083 external proof harness
- Review branch `codex/t083-live-operations-preflight-20261031` based exactly on **LIVE** source SHA `93df12a...`. Only new CI code, one review workflow and this report; no website/Admin/Founder/DB/SQL/source/security changes.
- CI check: root DNS A publicly routable and matches known Vercel config, www routable, trusted real TLS certificates valid at least 7 days longer for root+www with TLS >= 1.2, public HTML GET, www 308 same-origin canonical redirect.
- CI also explicitly checks **NO FINAL LOCK** when full current-point E8 restore / real cutover / Founder signoff remain absent. This is a **logic safety assertion**, not a real E8 restore.
- Strict branch SHA diff gate excludes any original product/security/backup code changes, test runs with `contents:read`, `persist-credentials:false`, no injected keys, payments, DB writes, private Article fetch or Auth.
- If the GitHub Action does not start, network is inaccessible, the cert is failing or any test errors, mark the corresponding **EXTERNAL TEST = DUE/FAIL**, **NOT PASS**. Never edit DNS or pay for hosting to force GREEN.

## Topic-11 status reconciliation (honest, partial)
| Test | Latest known evidence | Remaining truth |
| --- | --- | --- |
| P4-T076 | Founder real JANTA BOL domain/HTTPS screenshots and connected Vercel verified domain; old test history | Complete T076 final protected CI/release reconciliation not independently established here |
| P4-T077 | Founder reported real draft→verify→publish and permanent Article ID work | Exact final test/version/evidence may require separate acceptance register cross-check |
| P4-T078 | Backup and security preflight evidence exists | Full original/current restore proof not established |
| P4-T079 | Social, messaging, Ads and provider-specific work partly tested | Unavailable external provider cases must remain **DUE**, never synthetic success |
| P4-T080 | Original backend/retry scoped CI and Android workflow | Comprehensive actual offline/retry all-critical-effects evidence still not proven |
| P4-T081 | 67/67 scoped code backup safety; B2 Founder Caps/Billing screenshots $0.00 estimate; Vercel routing dry run | **Coherent real current DB+Storage+Auth+Edge+Vercel E8 restore, actual rollback NOT_RUN** |
| P4-T082 | Phone+tablet Share/Incognito, Founder T006 real Draft Save v5→v6; historical live audit 20/20; 33/33 scoped CI | **Fresh production Owner Correction→Unpublish→Republish not run**; independent full adversarial E5 not proven. New PR91 anonymous live-browser CI not independently verified. |
| P4-T083 | Vercel domains/aliases/route/DNS source metadata preflight; live TLS CI prepared | Registrar renewal/ownership/automatic renewal, SSL expiry actual evidence, full Topic11 regression, stable signed ZIP/manifest, fail-case retest and Founder signoff DUE |

## Production go/no-go / never mislabel PASS
- Old backups, code ZIP, or encrypted files are **not** a working full production E8 recovery proof, and previous B11 T070 logs explicitly marked Auth/Edge/Vercel runtime NOT RESTORED. B2 zero billed so far is not a guarantee of zero future usage/fees. Never schedule an offsite export or payment operation without protected Founder authorization and verified zero-cost guard.
- Current DNS-change/renewal and certificate-monitoring ownership record is still incomplete. Never publish domain registrar details, credentials or screenshots with account secrets.
- Provider DUE and any forced failure require a precise ticket, root cause, isolated retest and evidence. No PASS from mocked availability.
- Before final release: reconcile all eight T076–T083 ledgers, complete original Phase3 + B0–B11 + all impacted regressions, verify previous backups and current-point E8 real restore in isolation, artifact/ZIP SHA with secret scan, sign owner-domain maintenance/renewal, Founder AAL2 final approval, controlled rollback/cutover rehearsal preserving new data. **Do not skip ANY missing proof to meet Soft Launch**.

**T083 STARTED; DNS/DEPLOYMENT VERCEL INVENTORY=PASS_SCOPED; TLS PUBLIC CHAIN=NOT_VERIFIED; REGISTRAR OWNERSHIP/RENEWAL=DUE; E8 NOT_RUN; TOPIC-11 FINAL LOCK=HOLD.**
