'use strict';
// P4-T040 CP04 SOURCE-ONLY PAIRING/READINESS. NOT full E2 or Android E3.
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const root='JANTA_BOL_PHASE_3C_WORKING/';
const db='JANTA_BOL_PHASE_4_WORKING/db/';
const read=p=>fs.readFileSync(p,'utf8');
const master=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json'));
const view=read(db+'20261010_b7_qualified_impressions_REVIEW_ONLY.sql');
const cta=read(db+'20261010_b7_cta_click_REVIEW_ONLY.sql');
test('Official ADS048..050 still needs REAL hosted E2 and Android E3',()=>{
 const t=master.canonical_tests.find(x=>x.id==='P4-T040');
 a.deepEqual(t.range,[48,50]);
 a.deepEqual(t.required_evidence,['E1','E2','E3']);
 a.equal(t.final_status,'DUE');
 a.ok(master.ads.filter(x=>x.canonical_test==='P4-T040').every(x=>x.final_status==='DUE'));
});
test('Host readiness: do NOT half-wire public analytics before paired backend deployment',()=>{
 for(const p of [root+'index.html',root+'article.html']){
  const s=read(p);
  a.match(s,/public-ads\.js/);
  a.doesNotMatch(s,/<script[^>]*\bsrc=["'][^"']*ad-analytics-client\.js/i);
  a.doesNotMatch(s,/<script[^>]*\bsrc=["'][^"']*ad-viewability\.js/i);
 }
 a.match(read(root+'ad-analytics-client.js'),/NOT linked into article.html\/index.html/);
});
test('Qualified SQL candidate requires no unauthenticated raw-event path',()=>{
 a.match(view,/revoke all on function public\.jb_ad_event\(uuid,text\)/);
 a.match(view,/revoke all on function public\.jb_ad_record_event\(uuid,text\)/);
 a.match(view,/revoke all on public\.ad_events from public,anon,authenticated/);
 a.match(view,/revoke all on public\.ad_view_tickets from public,anon,authenticated/);
 a.match(view,/client_reported_50pct_1000ms/);
 a.match(view,/v_now<v\.issued_at\+interval '1 second'/);
 a.match(view,/ARTICLE_VIEW_ALREADY_TICKETED/);
 a.match(view,/client_reported_estimate_not_unique_people/);
 a.match(view,/anti_bot_verified',false/);
});
test('Ticket CTA backend depends on real verified Article+Creative eligibility and Owner HIDE gate',()=>{
 a.match(cta,/private\.b7_eligible_article_creatives\(v\.article_id\)/);
 a.match(cta,/e\.campaign_id=v\.campaign_id and e\.creative_id=v\.creative_id/);
 a.match(cta,/v_now>=v\.issued_at\+interval '30 minutes'/);
 a.match(cta,/private\.b7_safe_public_ad_https\(cr\.cta_target\)/);
 a.match(cta,/client_reported_cta_click/);
 a.match(cta,/clicks_verified',0/);
});
test('Both Owner Today reports use identical Asia/Kolkata midnight independent of DB session timezone',()=>{
 const phrase="date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata')";
 a.ok(view.includes(phrase));
 a.ok(cta.includes(phrase));
 a.doesNotMatch(view,/created_at>=date_trunc\('day',now\(\)\)/);
 a.doesNotMatch(cta,/created_at>=date_trunc\('day',now\(\)\)/);
});
test('Reusable genuine Supabase E2 preflight is READ-ONLY, not a fake test transaction',()=>{
 const sql=read('ci/phase4/b7-t040-cp04-HOSTED-E2-PREFLIGHT-READ_ONLY.sql');
 a.match(sql,/BEGIN READ ONLY;/);
 a.match(sql,/SET LOCAL ROLE anon;/);
 a.match(sql,/ROLLBACK;/);
 a.match(sql,/to_regprocedure\('public\.jb_ad_record_ticket_click\(text\)'\)/);
 a.match(sql,/has_table_privilege\('anon'/);
 a.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\s+(?:INTO\s+|TABLE\s+|FUNCTION\s+|ON\s+)?public\./i);
});
