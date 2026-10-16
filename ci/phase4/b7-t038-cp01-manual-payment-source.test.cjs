'use strict';
// JANTA BOL T038 CP01: SOURCE/E1 acceptance mapping + OWNER UI fail-closed.
// This is not real bank verification, hosted E2/E5, or provider E6.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const base='JANTA_BOL_PHASE_3C_WORKING/';
const pack='JANTA_BOL_PHASE_4_WORKING/';
const manifest=JSON.parse(fs.readFileSync(pack+'review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
test('Official P4-T038 = ADS035..040 and external provider E6 remains DUE',()=>{
 const t=manifest.canonical_tests.find(x=>x.id==='P4-T038');
 assert.deepEqual(t.range,[35,40]);
 assert.deepEqual(t.required_evidence,['E2','E5','E6']);
 assert.equal(t.final_status,'DUE');
 const rows=manifest.ads.filter(x=>x.canonical_test==='P4-T038');
 assert.deepEqual(rows.map(x=>x.id),['ADS-035','ADS-036','ADS-037','ADS-038','ADS-039','ADS-040']);
 assert.ok(rows.every(x=>x.final_status==='DUE'));
});
function stub(owner=true){
 const calls=[];const g={};
 g.JBBackend={
  requireOwner:async()=>{if(!owner)throw Error('OWNER_AAL2_REQUIRED')},
  client:{rpc:async (name,args)=>{calls.push({name,args});return{data:'TEST_ONLY',error:null}}}
 };
 vm.runInNewContext(fs.readFileSync(base+'phase4-domain-client.js','utf8'),{window:g,Error,Date,URL});
 return {api:g.JBPhase4,calls};
}
test('Old 3-field legacy confirm remains DISABLED even for authenticated Owner',async()=>{
 const s=stub();await assert.rejects(()=>s.api.adConfirmPayment('x','ANY',100),
 /B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE/);
 assert.equal(s.calls.length,0);
});
test('AAL2 refusal blocks both manual quote and receipt before any RPC',async()=>{
 const s=stub(false);
 await assert.rejects(()=>s.api.adSetApprovedQuote('x',50000,'SIGNED-TERMS'),/OWNER_AAL2_REQUIRED/);
 await assert.rejects(()=>s.api.adConfirmManualPayment('x',{}),/OWNER_AAL2_REQUIRED/);
 assert.equal(s.calls.length,0);
});
const valid={
 amountMinor:50000,method:'upi',reference:'SYNTHETIC-UTR-ONLY',
 evidenceRef:'FAKE-DO-NOT-USE',acceptanceRef:'SYNTHETIC-ACCEPT',
 verificationNote:'SYNTHETIC-RECEIPT-NOT-REAL',
 // fixed past ISO instants, not a legitimate bank or buyer acknowledgment
 receiptAt:'2026-10-15T11:30:00Z',acceptedAt:'2026-10-15T11:00:00Z',
 confirm:'CONFIRM'
};
test('Missing/low payment amount, method, receipt reference, consent and CONFIRM fail before SQL',async()=>{
 const edits=[
 {confirm:'confirm'}, {confirm:''},{amountMinor:0},{amountMinor:-1},{amountMinor:1.5},
 {amountMinor:'NaN'}, {method:'paypal'},{method:'gift_card'},
 {reference:'UTR'},{evidenceRef:''},{acceptanceRef:''},
 {verificationNote:'short'},
 {acceptedAt:'2026-10-15T12:00:00Z'}, {acceptedAt:'no-date'},
 {receiptAt:'2026-10-15T10:00:00Z'}
 ];
 const x=stub();
 for(const change of edits){
  await assert.rejects(()=>x.api.adConfirmManualPayment(
   '30000000-0000-0000-0000-000000000001',{...valid,...change}
  ),/MANUAL_PAYMENT_EVIDENCE_REQUIRED|INVALID_PAYMENT_TIMESTAMP/);
 }
 assert.equal(x.calls.length,0);
});
test('One explicitly filled synthetic tuple only invokes reviewed manual RPC; no 3-field fallback',async()=>{
 const x=stub();
 await x.api.adConfirmManualPayment('30000000-0000-0000-0000-000000000001',valid);
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].name,'jb_ad_confirm_manual_payment_internal');
 assert.equal(x.calls[0].args.p_confirm,'CONFIRM');
 assert.equal(x.calls[0].args.p_amount_minor,50000);
 assert.equal(x.calls[0].args.p_method,'upi');
 assert.equal(x.calls[0].args.p_acceptance_ref,valid.acceptanceRef);
 assert.equal(x.calls[0].args.p_evidence_ref,valid.evidenceRef);
});
test('Owner payment HTML requires explicit method, acceptance, receipt and no legacy path',()=>{
 const html=fs.readFileSync(base+'ads.html','utf8'),js=fs.readFileSync(base+'phase4-domain-client.js','utf8');
 assert.match(html,/Owner manual payment — verified receipt and written consent required/);
 assert.match(html,/Type CONFIRM/);
 assert.match(html,/Record verified manual payment/);
 assert.match(html,/Payment does not activate ads/);
 assert.match(html,/JBPhase4\.adConfirmManualPayment\(id,/);
 assert.doesNotMatch(html,/JBPhase4\.adConfirmPayment\(/);
 assert.match(js,/B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE/);
});
test('Reviewed DB contract: immutable receipt, verified advertiser, positive amount, schedule',()=>{
 const sql=fs.readFileSync(pack+'db/20261010_b7_manual_payment_REVIEW_ONLY.sql','utf8');
 for(const c of ['OWNER_APPROVAL_REQUIRED_BEFORE_PAYMENT','TERMS_ACCEPTANCE_CHRONOLOGY_INVALID',
 'APPROVED_PRICE_TERMS_MISMATCH','MANUAL_PAYMENT_EVIDENCE_REQUIRED','CONFIRMED_PAYMENT_IMMUTABLE',
 'ADVERTISER_VERIFICATION_REQUIRED','EXPLICIT_CONFIRM_REQUIRED','AD_NOT_ELIGIBLE_FOR_LIVE',
 'b7_one_confirmed_payment_per_campaign','b7_confirmed_payment_reference_unique']){
  assert.ok(sql.includes(c),'REVIEW_ONLY_SOURCE_MISSING_'+c);
 }
});
