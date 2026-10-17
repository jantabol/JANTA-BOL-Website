'use strict';
// P4-T039 CP01 exact Founder PDF ADS-041..047 authority/source & E2/E3/E5 HOLD.
// The tests here do not operate against production or authenticate a real user.
const fs=require('node:fs'), assert=require('node:assert/strict');
const {test}=require('node:test');
const root='JANTA_BOL_PHASE_4_WORKING/';
const manifest=JSON.parse(fs.readFileSync(root+'review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
const sql=fs.readFileSync(root+'db/20261010_b7_portal_text_change_REVIEW_ONLY.sql','utf8');
const ui=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html','utf8');
test('ADS041..047 canonical 7 tests, E2+E3+E5 and real Founder signoff are still DUE',()=>{
 const t=manifest.canonical_tests.find(x=>x.id==='P4-T039');
 assert.deepEqual(t.range,[41,47]);
 assert.deepEqual(t.required_evidence,['E2','E3','E5']);
 assert.equal(t.final_status,'DUE');
 const ads=manifest.ads.filter(a=>a.canonical_test==='P4-T039');
 assert.equal(ads.length,7);
 assert.deepEqual(ads.map(a=>a.id),Array.from({length:7},(_,i)=>'ADS-'+String(i+41).padStart(3,'0')));
 assert.ok(ads.every(a=>a.final_status==='DUE'));
});
test('ADS041 one-time temporary login and real token revocation are server-side only candidates',()=>{
 for(const term of ['consumed_at','for update','ADVERTISER_SESSION_REQUIRED',
  'token_hash','expires_at>now()','revoked_at is null','extensions.digest',
  'extensions.crypt','One-time credential consumed']){
  assert.ok(sql.toLowerCase().includes(term.toLowerCase()),'missing reviewer contract: '+term);
 }
 assert.match(sql,/where login_id=upper\(btrim\(p_login\)\)/);
 assert.match(sql,/consumed_at is null/);
 assert.match(sql,/set consumed_at=now\(\)/);
});
test('ADS042 own token binds session to campaign and credential while revoked/expired fails closed',()=>{
 for(const term of ['s.token_hash=encode','s.revoked_at is null',
  's.expires_at>now()','k.revoked_at is null','s.campaign_id']){
  assert.ok(sql.includes(term),'required own-token isolation predicate missing '+term);
 }
 assert.match(sql,/grant execute on function public\.jb_ad_portal_campaign\(text\)/);
});
test('ADS043/045 cannot mutate NEWS/media or approved asset from an advertiser text-only request',()=>{
 assert.match(sql,/revoke all on public\.ad_change_requests from public,anon,authenticated/);
 assert.match(sql,/p_type is distinct from 'text'/);
 assert.match(sql,/TEXT_CHANGE_REQUEST_ONLY/);
 assert.match(sql,/insert into public\.ad_change_requests\(campaign_id,request_text\)/);
 assert.doesNotMatch(sql,/update public\.articles/i);
 assert.doesNotMatch(sql,/update public\.ad_creatives/i);
});
test('ADS044/046 portal serves only approved creative and Owner request decision cannot flip ad',()=>{
 assert.match(sql,/cr\.approved=true/);
 assert.match(sql,/order by cr\.version desc/);
 assert.match(sql,/CHANGE_REQUEST_ALREADY_REVIEWED/);
 assert.match(sql,/approved_creative_unchanged/);
});
test('ADS047 renewal creates request only and does not silently mark paid or extend campaign',()=>{
 assert.match(sql,/insert into public\.ad_renewal_requests\(/);
 assert.match(sql,/RENEWAL_ALREADY_PENDING/);
 assert.match(sql,/requested_by is null/);
 assert.doesNotMatch(sql,/update public\.ad_campaigns set ends_at/i);
 assert.doesNotMatch(sql,/update public\.ad_payments/i);
});
test('Owner/advertiser distinction in actual page: no direct asset picker, NEWS publish or owner controls',()=>{
 assert.match(ui,/id="portalSecret"/);
 assert.match(ui,/id="changeText"/);
 assert.match(ui,/id="renewalEnd"/);
 assert.match(ui,/jb_ad_portal_request_renewal/);
 assert.match(ui,/jb_ad_portal_submit_creative/);
 assert.match(ui,/p_type:'text',p_media:null/);
 assert.doesNotMatch(ui,/<input[^>]+type="file"/i);
 assert.doesNotMatch(ui,/jb_ad_transition_internal|jb_ad_confirm_payment_internal|jb_news_publish/i);
});
