# P4-T076 — Live Domain / HTTPS / Rollback Evidence — 29 October 2026 (IST)

**Test order:** T076 before T077. **No live editing of ISRO news or secrets used in this evidence.**

## Verified actual public cutover
- Founder GoDaddy Android screenshot at 12:12 IST: GoDaddy showed "Your DNS record has been updated successfully"; A @ changed from WebsiteBuilder Site to `76.76.21.21`, TTL 1 hour. Nameservers `ns15/ns16.domaincontrol.com`; existing www CNAME unchanged.
- Authenticated Vercel DNS config after screenshot: `jantabol.in` `configuredBy=A`, `aValues=["76.76.21.21"]`, `misconfigured=false`. www redirect domain also configured (`www.jantabol.in` -> `jantabol.in` permanent 308).
- Vercel certificates freshly issued: `cert_6gjDxeYeye2kRAeGxN2ikwgt` (`jantabol.in`) and `cert_dvONu2A82Ux4KgBiKCqRU8j4` (`www.jantabol.in`), auto-renew enabled.
- GitHub Actions **40831061538**, attempt **2**, job **123305524266**, actual outbound resolver/TLS/HTTPS, **6/6 PASS**: public A record, same-origin root redirect, live V3 home 200, `website-v3.js` SHA-256 identical to source, Founder login HTML 200 with no-store/nosniff, and HTTPS www -> apex redirect.
- Attempt 1 observed DNS A READY but transient HTTPS failure during cutover (2/6 PASS) and correctly FAILED. Attempt 2 successful after Vercel certificates appeared. Do not omit this history.
- Actual production source `532261e335a235dbdaf9697ccdbfe274122a8580` on deployment `dpl_23HiFAWh8m9e5sVh3QQxYorfdxTJ`, target=production READY, linked to apex/www aliases.
- GitHub Actions **40830173701** attempt **2**, actual production origin HTTP **6/6 PASS** (V3 homepage, source-identical JS and public RPC bridge, Founder login shell security headers, article shell, root redirect).
- Previous production baseline `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` SHA `f447231c...` verified READY; Vercel rollback invoked then aliases observed on old deployment; promotion invoked for `dpl_23Hi...` and aliases observed on new. Production V3 origin passed 6/6 after restore. This is **traffic routing rollback proof**, not a real database restore.
- Protected source regression `40821806645` SUCCESS on integrated candidate; B11 full E8 restoration still separate HOLD, not magically passed by T076.

## Gate boundaries
- T076 **domain/DNS/certificate/public HTTPS/production routing evidence PASS**.
- **Real Android custom-domain screenshot RECEIVED**, 29 Oct 2026 at 12:18 IST: mobile browser page header displays `jantabol.in`, JANTA BOL black/red masthead, working rendered home hero and primary `प्रकाशित खबरें देखें` button, top search entry and menu. This is genuine real-device visible homepage proof (E1); HTTPS trust is corroborated separately by actual external CI 6/6 and certificates, not inferred from a padlock icon. No backend action performed from screenshot. Historical Founder password+MFA and published ISRO view evidence exists on V3 preview; not falsely claimed as new exact-domain login proof. Avoid repeating 15-minute inactivity test already Founder-confirmed unless code changed.
- **GitHub protected Main is not merged** with integration candidate; Vercel production SHA is on isolated reviewed integration branch. This is recorded as release discipline risk to reconcile later; do not silently claim Main updated.
- No T077 correction/unpublish/republish lifecycle was performed by T076. T077 source-only CI is not lifecycle proof.
- Any GoDaddy/SSL issue reopening would reopen this gate; no fake pass.

**Result 29 Oct 2026:** **P4-T076 FINAL PASS + LOCK for its explicitly scoped E1/E6/E7 hosting, domain, valid TLS, protected source/CI and public/Admin/Auth HTTP route checks.** Evidence: mobile screenshot 12:18 IST + Action 40831061538 attempt 2 (6/6 PASS) + 40830173701 attempt 2 (6/6 PASS) + Vercel DNS/cert/production + rollback and re-promotion alias proof. This lock does **not** override protected Main being unmerged, B11 E8 real restoration HOLD, Founder full prod permission lifecycle or B12 overall launch signoff. **T077 is NEXT; its actual authorized correction/unpublish/republish E2/E4 remains NOT RUN.** 
