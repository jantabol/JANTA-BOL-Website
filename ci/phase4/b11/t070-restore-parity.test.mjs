import test from 'node:test';
import assert from 'node:assert/strict';
import {assessT070Restore,REQUIRED_TABLES} from './t070-restore-parity.mjs';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),digest='a'.repeat(64);
function fixture(){
 const tables=Object.fromEntries(Object.keys(REQUIRED_TABLES).map(t=>[t,[]]));
 tables.auth_users=[{id:uuid(1)}];tables.advertisers=[{id:uuid(2)}];
 tables.ad_packages=[{id:uuid(3),version:1}];
 tables.articles=[{id:uuid(4),slug:'stable-master-url',version:3}];
 tables.article_versions=[{id:11,article_id:uuid(4),article_version:3}];
 tables.grievances=[{id:uuid(5),public_id:'GRV-ONE',article_id:uuid(4)}];
 tables.grievance_history=[{id:20,grievance_id:uuid(5)}];
 tables.grievance_evidence=[{id:uuid(6),grievance_id:uuid(5)}];
 tables.live_sessions=[{id:uuid(7),article_id:uuid(4)}];
 tables.live_updates=[{id:uuid(8),live_session_id:uuid(7)}];
 tables.ad_campaigns=[{id:uuid(9),advertiser_id:uuid(2),package_id:uuid(3),status:'review'}];
 tables.ad_payments=[{id:uuid(10),campaign_id:uuid(9),amount_minor:5000,status:'manual'}];
 const media=[{bucket:'grievance-private',path:'demo.bin',sha256:digest,bytes:42}];
 return {project:'vrffsnkycvjithwtiylt',isolated:true,snapshot_id:'audit-mock-snapshot-2026-10-25',
 captured_at:'2026-10-25T10:00:00Z',tables,media,
 settings_fingerprint:digest,rls_fingerprint:digest};
}
const E={destination:'ISOLATED_DISPOSABLE',production_untouched:true,overwrite_existing:false,
restore_performed:true,actual_media_bytes_checked:true,auth_permissions_checked:true,
config_restored_verified:true,reconciliation_performed:true,restore_run_id:'synthetic-fixture-only'};
const pair=()=>{const a=fixture();return {source:a,restored:structuredClone(a),evidence:structuredClone(E)}};
test('T070 synthetic exact Article/PURL, Grievance, Live, payment, auth parity candidate passes comparator',()=>{
 const result=assessT070Restore(pair());
 assert.equal(result.status,'READY_FOR_INDEPENDENT_E8_REVIEW');
 assert.equal(result.table_counts.articles,1);
 assert.equal(result.table_counts.auth_users,1);
 assert.equal(result.media_count,1);
 assert.notEqual(result.proof_kind,'LIVE_RESTORE_PROVEN');
});
test('T070 rejects recreated article ID even if slug identical',()=>{
 const p=pair();p.restored.tables.articles[0].id=uuid(81);
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED/);
});
test('T070 rejects duplicate or changed permanent URL',()=>{
 const p=pair();p.restored.tables.articles[0].slug='wrong-permanent-url';
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_SOURCE_RESTORE_IDENTITY_MISMATCH/);
});
test('T070 rejects changed Grievance public ID',()=>{
 const p=pair();p.restored.tables.grievances[0].public_id='GRV-OTHER';
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED/);
});
test('T070 rejects missing Live final/update history identity',()=>{
 const p=pair();p.restored.tables.live_updates=[];
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED/);
});
test('T070 rejects changed campaign payment relationship',()=>{
 const p=pair();p.restored.tables.ad_payments[0].campaign_id=uuid(80);
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED/);
});
test('T070 rejects recreated Auth user identity',()=>{
 const p=pair();p.restored.tables.auth_users[0].id=uuid(80);
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED/);
});
test('T070 rejects weakened RLS/permissions fingerprint',()=>{
 const p=pair();p.restored.rls_fingerprint='b'.repeat(64);
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_SECURITY_OR_PLATFORM_CONFIG_MISMATCH/);
});
test('T070 rejects missing real media or a different digest',()=>{
 const p=pair();p.restored.media[0].sha256='b'.repeat(64);
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_MEDIA_BYTES_OR_IDENTITY_MISMATCH/);
});
test('T070 rejects wrong source point in time even with same IDs',()=>{
 const p=pair();p.restored.captured_at='2026-10-25T12:00:00Z';
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_NOT_SAME_TRUSTED_SNAPSHOT/);
});
test('T070 cannot PASS if no isolated restore actually executed',()=>{
 const p=pair();p.evidence.restore_performed=false;
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_REAL_RESTORE_EVIDENCE_MISSING/);
});
test('T070 cannot overwrite existing live DB or production',()=>{
 for(const [key,value] of [['destination','PRODUCTION'],['production_untouched',false],['overwrite_existing',true]]){
  const p=pair();p.evidence[key]=value;
  assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_REAL_RESTORE_EVIDENCE_MISSING/);
 }
});
test('T070 cannot PASS with no file bytes or verification',()=>{
 const p=pair();p.evidence.actual_media_bytes_checked=false;
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_REAL_RESTORE_EVIDENCE_MISSING/);
});
test('T070 reports empty payment/live-history coverage as NOT_EXERCISED, not PASS',()=>{
 const p=pair();p.source.tables.live_updates=[];p.restored.tables.live_updates=[];
 p.source.tables.ad_payments=[];p.restored.tables.ad_payments=[];
 const r=assessT070Restore(p);
 assert.equal(r.status,'INCOMPLETE_COVERAGE');
 assert.deepEqual(r.not_exercised,['live_updates','ad_payments']);
});
test('T070 missing table is never silently accepted as empty',()=>{
 const p=pair();delete p.restored.tables.grievance_history;
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_MISSING_grievance_history/);
});
test('T070 rejects duplicate grievance identifier',()=>{
 const p=pair();p.source.tables.grievances.push({...p.source.tables.grievances[0],id:uuid(21)});
 assert.throws(()=>assessT070Restore(p),/T070_FAIL_CLOSED_DUPLICATE_GRIEVANCE_ID/);
});
