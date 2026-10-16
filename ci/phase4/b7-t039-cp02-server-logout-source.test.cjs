'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const ui=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html','utf8');
const sql=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261016_b7_t039_portal_server_logout_REVIEW_ONLY.sql','utf8');
test('ADS041: local browser logout cannot falsely claim SERVER session revoked',()=>{
 assert.match(ui,/rpc\('jb_ad_portal_logout',\s*\{\s*p_token\s*:/);
 assert.doesNotMatch(ui,/addEventListener\('click',\(\)=>\{clear\(\);feedback\('आप लॉगआउट हो गए हैं।'\)/);
 assert.match(ui,/sessionStorage\.removeItem\(key\)/);
 assert.match(ui,/jb_ad_portal_logout/);
});
test('ADS041: backend logout revokes only exact 48hex session, never weakens other rights',()=>{
 assert.match(sql,/p_token !~ '\^\[0-9a-f\]\{48\}\$'/);
 assert.match(sql,/s\.token_hash=encode\(extensions\.digest\(p_token,'sha256'\),'hex'\)/);
 assert.match(sql,/and s\.revoked_at is null and s\.expires_at>now\(\)/);
 assert.match(sql,/return false/);
 assert.match(sql,/revoke all on function public\.jb_ad_portal_logout\(text\)/);
 assert.doesNotMatch(sql,/update public\.ad_campaigns/i);
 assert.doesNotMatch(sql,/update public\.ad_creatives/i);
 assert.doesNotMatch(sql,/update public\.ad_payments/i);
});
test('ADS041 final release gate: no hosted Owner or Android E3 PASS inferred from source',()=>{
 const m=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
 const t=m.canonical_tests.find(x=>x.id==='P4-T039');
 assert.equal(t.final_status,'DUE');
 assert.deepEqual(t.required_evidence,['E2','E3','E5']);
 assert.ok(m.ads.filter(x=>x.canonical_test==='P4-T039').every(x=>x.final_status==='DUE'));
});
