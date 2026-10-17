'use strict';
// T036 CP03 SOURCE AUTHORITY: never confuse isolated expiry with live E2/E5.
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='JANTA_BOL_PHASE_4_WORKING/db/20261016_b7_t036_expiry_replay_REVIEW_ONLY.sql';
const body=fs.readFileSync(file,'utf8').toLowerCase();
const register=JSON.parse(fs.readFileSync(
 'JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
const t=register.canonical_tests.find(x=>x.id==='P4-T036');
assert.deepEqual(t.range,[16,23]);
assert.deepEqual(t.required_evidence,['E2','E5']);
assert.equal(t.final_status,'DUE');
for(const id of ['ADS-016','ADS-017','ADS-018','ADS-019','ADS-020',
 'ADS-021','ADS-022','ADS-023']){
 const test=register.ads.find(x=>x.id===id);
 assert.ok(test&&test.canonical_test==='P4-T036');
 assert.equal(test.final_status,'DUE');
}
for(const item of ['for update skip locked','ends_at<=clock_timestamp()',
  "status in('live','paused')","status='expired'",
  'insert into public.ad_history','insert into public.audit_logs',
  'revoke all on function','service_role','security definer']){
 assert.ok(body.includes(item),'EXPIRY_GUARD_MISSING '+item);
}
assert.ok(!body.includes('cron.schedule'),'NO_CRON_SCHEDULE_PRE_FIRST_PAID_AD');
assert.ok(!body.includes('update public.articles'),'NO_NEWS_PUBLISHING_WRITE');
assert.ok(!body.includes('delete from public.ad_history'),'NO_HISTORY_ERASE');
assert.ok(!body.includes('delete from public.ad_payments'),'NO_FINANCIAL_ERASE');
assert.ok(!body.includes('grant execute on function private.b7_ad_expire_due_core(integer) to authenticated'));
assert.ok(!body.includes('grant execute on function private.b7_ad_expire_due_core(integer) to anon'));
console.log('T036_CP03_CANONICAL_ADS016_023=8 DUE; E2+E5; NO_FAKE_PASS');
console.log('T036_CP03_MINIMAL_SOURCE_SAFE=PASS; NO_PROD_CRON_SCHEDULED');
console.log('T036_CP03_ONLY_DISPOSABLE_PG17; HOSTED_E2/E5=HOLD; FINAL_P4_T036=HOLD');
