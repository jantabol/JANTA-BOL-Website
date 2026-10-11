# B7 ADS-010/011/015 — REAL WASM PHOTO PROTOTYPE / MINIMUM-SAFE CONTINUATION
SOURCE SHA: `9b6ace69080b691a9a26b1d73bac52e337288323`
DATE: 12 OCT 2026 working checkpoint
STATUS: REVIEW-ONLY; NO DEPLOYMENT; NO APPROVED AD; NO B7 FINAL TEST PASS.

## Exact code and authority
- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-byte-policy.mjs` provides a new PRIVATE, dependency-free SERVER byte/dimension parser (not a browser check). Accepts inspected JPEG, PNG and static WebP only for QUARANTINED PREVIEW; MP4/MOV/HEIC/SVG/PDF, spoofed MIME+extension, excessive pixels/bytes, broken PNG CRC, malformed containers and animated WebP fail closed. Supported media is NOT APPROVED from any of these results.
- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts` uses pinned `npm:@imagemagick/magick-wasm@0.0.30`, checks server bytes BEFORE decode, decodes and auto-orients pixels, caps dimensions without upscaling, sets ImageMagick orientation to Undefined, strips source metadata, re-encodes PNG and verifies strict decoded-container structure. SHA-256 of source and preview derivative are calculated. Returns the image as **PRIVATE PREVIEW bytes only** and explicit `canApprove:false,canPublish:false`. No Storage writes, no upload URL, no advertising feed, no new public RPC, no Owner privilege, no posting or source-link mutation.
- `ci/phase4/b7-media-byte-policy.test.mjs`: seven deterministic Node negative cases for content type, magic, EXIF, text, palette, broken CRC, decoded pixel budget, excessive payload and video denial.
- `ci/phase4/b7-image-sanitize.test.ts`: two core *REAL pinned WASM* tests plus an injected synthetic PNG text comment containing 'GPS=...' that is decoded+stripped in the actual WASM path, and proves clean PNG has NO ancillary metadata; original remains unapproved.
- Candidate CI adds the parser tests to existing static job and **one extra independent Deno WASM job** (`b7-media-wasm-preview`). Previous 16 B7 jobs and all protected Phase3A+3B checks remain present.

## Independent RCA and real RED history
1. Initial new WASM job hit Deno strict `TS7006` for implicit hash parameter (`498771e`). Typed parameter alone led to `TS2345`: `Uint8Array<ArrayBufferLike>` is not WebCrypto `BufferSource<ArrayBuffer>` (`2dc2813`). Independent full-source trace preserved. Corrected with an explicit non-shared `ArrayBuffer` byte copy for SHA-256, with no unsafe type cast or disabled typecheck.
2. Running genuine ImageMagick output revealed a legitimate indexed-color PNG `PNG_MODE` failure in new restrictive parser (`191eb30`). Hardened palette bit depths 1/2/4/8 and PLTE/tRNS *pixel* semantics, but still reject all EXIF/unknown ancillary in clean derivative.
3. Genuine output retained an ImageMagick-specific `orNT` orientation chunk despite `strip` (`63f1bd8`). A new diagnostic error identified the exact chunk (`4988c20`). ImageMagick guidance: after pixel auto-orient, set image orientation `Undefined` before `strip`; pinned 0.0.30 package lacks public `Orientation` symbol (caught by TS2305 at `0c04040`), therefore use the package's numeric Undefined enum value `0` with typed property. No ancillary metadata allowlist was weakened.
4. Actual RESULT: at `fcc60e8ee990a8d5fb0d636b33a3199b80cf3045`, private real WASM job SUCCESS, while all original Candidate jobs PASS. `9b6ace69080b691a9a26b1d73bac52e337288323` adds the real synthetic GPS-text injection regression: Candidate run **38113900702 SUCCESS 17/17 jobs**, including actual WASM pixel decode, metadata strip and separate Node parser tests. Protected Phase3A+3B run **38113900690** must be read independently before calling it PASS.

## HARD RELEASE HOLD
- This is **not yet a public media pipeline**: authenticated Owner/AAL2 session+physical real Android E5, private original bucket, immutable first-party public derivative, publish-protected media ledger with verified source/digest, server AV and polyglot policies, production pixel format compatibility, typed Owner gallery, latest-version creative moderation, safe orphan cleanup and LIVE storage policy checks are DUE.
- Video MP4 H.264/AAC transcoding, codec verification, poster and playback remain DUE; they are NOT silently accepted as images.
- Original News Article ID/URL and existing B5 RESTRICTIVE Storage policy untouched. No GitHub PR merge, no Vercel exact-head deployment, no LIVE Supabase SQL writes, no advertising activation.
- Main B7 Final Blueprint 60 ADS / canonical P4-T034..T042 **0/9 FINAL PASS+LOCK**; `B7_ADVERTISEMENT.zip` **BLOCKED**. Actual E3/E5/E7+Owner signoff required.
