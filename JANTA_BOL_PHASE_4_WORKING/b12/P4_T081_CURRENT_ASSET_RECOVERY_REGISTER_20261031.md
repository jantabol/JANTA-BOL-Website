# T081 — CURRENT PRODUCTION RECOVERY ASSET REGISTER (metadata only)

**Observation date:** 2026-10-31. **Mode:** independently read-only GitHub + Supabase + Vercel connectors, no private Auth rows, secrets, data export or production writes.

> **STATUS: RECOVERY INVENTORY E1/E6 SCOPED. NOT a BACKUP, NOT a RESTORED RUNTIME, E8=NOT_RUN, T081 FINAL LOCK=HOLD.**

## Release identity and safe rollback boundary
- Vercel project: `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`; live alias `jantabol.in` → `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`, state `READY`, Git SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, source branch `codex/t080-admin-ack-failclosed-review-20261031`.
- Existing prior READY release `dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx`, SHA `14a929180d99088e950475eeee609cae8e3f01c8` (rollback candidate by inspection ONLY, never executed).
- Domain routing rollback must NOT touch or rewind newer DB, private Grievance, Auth, Article PURLs, Audit, Media or payment records.

## Database and Storage catalog counts (not byte/restore proof)
| Entity | Current count |
| --- | ---: |
| `articles` | 34 |
| `article_versions` | 919 |
| `audit_logs` | 1633 |
| `auth_users` | 5 |
| `auth_identities` | 5 |
| `storage_buckets` | 3 |
| `storage_objects` | 5 |

**Caveat:** Aggregate counts do not prove original Media file bytes or their revision state were captured, nor that Auth identities/sessions could be restored.

## Currently active Edge Functions (metadata only)
All 15 observed functions reported `ACTIVE`. The SHA-256 below is a deployment metadata fingerprint, **not an independently decryptable recovery bundle**.

| Function slug | Version | JWT gate | Deployment metadata SHA256 |
| --- | ---: | :---: | --- |
| `jb-b11-t069-media-backup` | 5 | ON | `d3b62490ee432d35ecbd471aa3e7320071f632aa3f55355a5a1252b2907fa974` |
| `jb-encoder-connector-lols` | 7 | OFF | `35b7700ff05232fb1888f7235a9d322636130ae7efaefdc0f2186a1238c6cf7e` |
| `jb-encoder-handoff` | 15 | OFF | `c60246e60142098a436dd7accd7988c33e6689a9c4af07d8fa3f484dfa371a93` |
| `jb-encoder-launch` | 13 | OFF | `f5cf2d19e87d17dc176738b661b4a98e0e28a0967fc53732048f60b0a305045f` |
| `jb-grievance-assets` | 7 | ON | `4d38e5b6db24ae269b0707585fd77f4cd3d6d6bdb8f959123a060ab4a958a8a2` |
| `jb-live-api` | 40 | ON | `33b9d63a1df219b91ef6305863d766c67a8ff94a78876a79b39c7335e72d3985` |
| `jb-live-worker` | 25 | OFF | `1f0b08c8fdf74997f76a628d051f3fb982dbaf7ae948292eadbcc89fc6349282` |
| `jb-records-api` | 6 | ON | `8b696778acf0a71f3c9de740939121618abc84eb04a888ad584912c6b7d98489` |
| `jb-recovery-delete-mfa` | 15 | ON | `f3a5059271b3f14fdcb60a84183af28923c6c454fa23b41e4a884f0e9fffc71a` |
| `jb-team-api` | 13 | ON | `82c063f70ac818f8ba9fc642eaffa5a7754dcdfe48f165c77ccf983710c23788` |
| `jb-youtube-oauth-callback` | 16 | OFF | `023874b6d79c06d7be2632d4942a0872e02231c5f5239749e33d4a21a4fd901d` |
| `jb-youtube-oauth-health` | 2 | ON | `6509a2075980a4e4a07c70ca0d747a4909cb79c76519868047d258aaa197c0d0` |
| `jb-youtube-oauth-start` | 18 | ON | `c5d063a11757bc44a0de58213e1c71d9f72ee86f3feb1d2daf84aea827812784` |
| `jb-youtube-provider` | 30 | ON | `0ee1d84fb704b99cfcd337e338fb444284e1815f63ab4f14acb47b77d56148f9` |
| `jb-youtube-video-preflight` | 1 | ON | `171f8feb2702a6697d1843e6e98800a200da129001444bc8ae2aacb29f8e4967` |

## Vercel environment VARIABLE NAMES ONLY — no secret values requested
- `JB_PUBLIC_SUPABASE_KEY`: target(s) `production`.
- `JB_PUBLIC_SUPABASE_URL`: target(s) `preview, production`.

**Caveat:** Having environment-variable *names* does not establish ability to recover their original encrypted *values*, OAuth provider credentials, account bindings, signed URLs or runtime permissions. Do not export values to GitHub, a PDF or chat.

## Recovery E8 release truth
- Historic T070 original GitHub run `40452402698` proved one PostgreSQL 17 offline clone plus five original Storage bytes; log explicitly says GoTrue+Edge+Vercel runtime NOT restored and universal source write-freeze not proven.
- There is **NO authenticated current-point coherent full-stack restore** shown for these assets. No safe free-tier B2 account-wide billing guarantee is established by the prefix cap alone.
- T081 source security regression: PR #87, GitHub Actions `41196182344` 67/67 scoped PASS, guarded Backblaze dual quota check prepared in review branch only; no live backup workflow scheduled or triggered.
- Required before any real rollback: separately reviewed, current-point authenticated export/readback+restore of DB, original object bytes, Auth, Edge and Vercel; no writer gap, exact SHA/prod alias identity, no newer-record overwrite, protected Founder AAL2 authorization, verified zero-paid budget cap and explicit rollback rehearsal approval.
- **GO=NO.** Do not auto-enable `T075`, deploy, promote, merge Main or execute the real backup/restore/rollback simply because this register exists.

## Founder-owned checkpoint (only when ready for live E8)
1. Confirm Backblaze **Caps & Alerts/billing** account-level safeguards and existing B2 bucket scope **without sharing any key, token or payment details**. Screenshots may show settings and remaining free allowance, not credentials.
2. After independent zero-paid safeguards are genuinely verified, separately approve the exact protected Main Founder workflow in GitHub Actions. The action will be treated as a real live export with cost/availability implications, not silently triggered from this review branch.
3. Current full Auth+Edge+Vercel restore and safe rollback need their own actual evidence; code-only or provider READY status never qualifies.
