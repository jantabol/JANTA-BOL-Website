## B7 ADS-010/011/015: actual sanitized video, responsive images and required poster

- Verified exact source `2677fa47859863a16da1907b1a6a124a3f2651c7`, candidate job run **38141280878 18/18 SUCCESS** (including real FFmpeg and ImageMagick WASM), protected Phase3A/3B **38141280810 2/2 SUCCESS**.

- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-video-sanitize.mjs` in isolated Node worker only: real ffprobe MP4/H264/AAC codec+duration+pixel policy; separate ffmpeg transcoding to H264/AAC with metadata stripped and private PNG poster from decoded frame; no shell, bounded tools/resources, no video/storage publishing. Source photo/video remains private. VIDEO FFmpeg system package in dedicated CI job; VIDEO SOURCE MULTIPART OWNER UPLOAD remains unimplemented.

- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts` produces true 480/800/1200 (where eligible) static clean PNG responsive variants using pinned ImageMagick WASM, no upscaling, no EXIF/GPS, independent SHA256 per rendition. No automatic Storage or public links.

- `JANTA_BOL_PHASE_3C_WORKING/public-ads.js` now requires an HTTPS sanitized poster URL before video ad rendering; video always click-to-play controls, no autoplay, muted, no paid ticket before first actual video data. Existing backend public feed does NOT yet supply poster_url; video intentionally fails closed until paired backend / actual approved poster route. Article stays readable.

- Actual RED->RCA: FFmpeg scaling 720x400 upscaled to 1280x720 under force_original_aspect_ratio=decrease; fix uses min(iw,limit) and min(ih,limit); real codec/PNG tests green. Extra GPS-stamped input test proves output does not retain location/comment metadata. Existing Node and Deno tests preserved.

- NOT READY: actual Founder signed AAL2 / E5, Android E3, dedicated private media upload and durable queue, worker deploy and privileged secret runtime isolation, image renditions/private+approved public objects, immutable video receipt and poster, authoritative media approval/live feed with poster, official G3 LGD import and exact deployed E7. No Production SQL/Storage mutations, no PR merge, no advertiser LIVE. P4-T034..T042 **0/9 Final PASS+LOCK**; `B7_ADVERTISEMENT.zip` BLOCKED.

This file documents CODE REVIEW CI only, not live Founder acceptance or approval.
