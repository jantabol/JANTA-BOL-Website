'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const sql=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/p4_t035_public_ads_review.sql','utf8');
const security=fs.readFileSync('ci/phase3-regression/db-function-security-regression.sql','utf8');
const js=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
const cases=[
 ['canonical public feed signature',/create or replace function public\.jb_ad_public_feed\(p_placement text,p_scope text default 'global'\)/i.test(sql)],
 ['legacy RPC delegates to canonical feed',/create or replace function public\.jb_public_active_ads[\s\S]*?from public\.jb_ad_public_feed\(p_placement,'global'\)/i.test(sql)],
 ['only LIVE campaign',/c\.status='live'/i.test(sql)],
 ['requires paid timestamp',/c\.paid_at is not null/i.test(sql)],
 ['requires confirmed positive payment',/pay\.status='confirmed' and pay\.amount_minor>0/i.test(sql)],
 ['requires nonrefund acceptance',/c\.non_refund_accepted_at is not null/i.test(sql)],
 ['requires schedule bounds',/c\.starts_at<=now\(\) and c\.ends_at>now\(\)/i.test(sql)],
 ['requires verified high risk',/a\.risk_level='high' and a\.verification_state='verified'/i.test(sql)],
 ['requires approved creative',/x\.approved=true/i.test(sql)],
 ['blocks empty approved creative',/CREATIVE_CONTENT_REQUIRED/.test(sql)],
 ['media URL HTTPS validator',/INVALID_MEDIA_URL/.test(sql)],
 ['CTA validator',/HTTPS_CTA_REQUIRED/.test(sql)&&/PHONE_CTA_REQUIRED/.test(sql)],
 ['canonical feed exact anon grants',/grant execute on function public\.jb_ad_public_feed\(text,text\) to anon,authenticated,service_role/i.test(sql)],
 ['legacy exact anon grants',/grant execute on function public\.jb_public_active_ads\(text\) to anon,authenticated,service_role/i.test(sql)],
 ['trigger installed',/create trigger p4_validate_ad_creative_media/i.test(sql)],
 ['security regression checks both ad RPCs',/p\.proname in\('jb_ad_public_feed','jb_public_active_ads'\)/.test(security)],
 ['security regression retains T123',/3A-P3-T123/.test(security)],
 ['frontend no GPS',!/geolocation|navigator\.permissions|watchPosition|getCurrentPosition/.test(js)],
 ['frontend uses canonical RPC',/rpc\('jb_ad_public_feed'/.test(js)],
 ['frontend stale-response guard',/WeakMap/.test(js)&&/if\(!current\(\)/.test(js)],
 ['frontend text uses textContent',/e\.textContent=text/.test(js)],
 ['frontend blocks non-HTTPS media',/u\.protocol==='https:'/.test(js)],
 ['frontend image video text paths',/ad\.creative_type==='text'/.test(js)&&/ad\.creative_type==='image'/.test(js)&&/ad\.creative_type==='video'/.test(js)]
];
let fail=0;for(const [name,ok] of cases){console.log((ok?'PASS':'FAIL')+' [P4-T035-STATIC] '+name);if(!ok)fail++}
console.log('P4-T035 static contract: '+(cases.length-fail)+'/'+cases.length);
assert.equal(fail,0,'Candidate static contract failed');
