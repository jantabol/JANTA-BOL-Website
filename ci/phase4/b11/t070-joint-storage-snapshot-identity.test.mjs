import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyJointStorageBinding} from './t070-joint-storage-snapshot-identity.mjs';
const buckets=['grievance-private','grievance-private','private-editorial','public-media','public-media'];
const keys=['evidence/a.pdf','evidence/b.pdf','editorial/c.pdf','news/d.jpg','news/e.jpg'];
const rows=buckets.map((bucket,i)=>({bucket,key:keys[i],id:'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),updated_at:'2026-10-18T05:57:15.146691Z'}));
function receipt(){
 return {schema:'janta-bol-b11-storage-readonly-receipt-v1',project_ref:'vrffsnkycvjithwtiylt',capture_method:'MANUAL_OWNER_SERVICE_ROLE_READ_ONLY',stable_double_listing:true,object_count:5,buckets:['grievance-private','private-editorial','public-media'],
 sha_records:rows.map(r=>({bucket:r.bucket,key:r.key,id:r.id,original_updated_at:'2026-10-18T05:57:15.146691+00:00',size:1,sha256:'a'.repeat(64)}))};
}
test('five real-structure original bytes receipts correspond to the identical PostgreSQL snapshot version identities',()=>{
 const r=verifyJointStorageBinding(rows,receipt());
 assert.equal(r.source_db_snapshot_storage_metadata_mapped_to_byte_verified_media,true);
 assert.equal(r.universal_write_fence_proven,false);
 assert.equal(r.t070_final_lock,false);
});
test('file byte receipt missing actual DB object fails closed',()=>{
 const r=receipt();r.sha_records[1].key='tampered-other';assert.throws(()=>verifyJointStorageBinding(rows,r),/T070_JOINT_STORAGE_SNAPSHOT_HOLD/);
});
test('DB snapshot original object id changed while filename identical fails closed',()=>{
 const r=receipt();r.sha_records[0].id='untrusted';assert.throws(()=>verifyJointStorageBinding(rows,r),/VERSION_MISMATCH/);
});
test('DB snapshot original object updated timestamp changed without object id change fails closed',()=>{
 const r=receipt();r.sha_records[0].original_updated_at='2026-10-18T06:00:00Z';
 assert.throws(()=>verifyJointStorageBinding(rows,r),/VERSION_MISMATCH/);
});
test('do not silently allow different private grievance file count or wrong project',()=>{
 const r=receipt();r.project_ref='hriakdazkcvplsdwgfle';assert.throws(()=>verifyJointStorageBinding(rows,r),/WRONG_SCOPE/);
 const a=structuredClone(rows);a[1].bucket='public-media';assert.throws(()=>verifyJointStorageBinding(a,receipt()),/BUCKET_COUNTS/);
});
test('public byte metadata no original SHA digest is rejected',()=>{
 const r=receipt();r.sha_records[2].sha256='BAD';assert.throws(()=>verifyJointStorageBinding(rows,r),/ORIGINAL_BYTES_MANIFEST_INVALID/);
});
test('no mismatch is hidden by duplicate receipt or list',()=>{
 const r=receipt();r.sha_records[1]=r.sha_records[0];assert.throws(()=>verifyJointStorageBinding(rows,r),/ORIGINAL_OBJECT_MISSING/);
 const a=structuredClone(rows);a[1]=a[0];assert.throws(()=>verifyJointStorageBinding(a,receipt()),/DUPLICATE_DB_OBJECT/);
});
test('cannot infer missing LIVE update or ad payment records as real identities',()=>{
 const r=verifyJointStorageBinding(rows,receipt());
 assert.equal(r.auth_go_true_or_edge_runtime_restored,false);
 assert.equal(r.source_files_can_change_after_capture,true);
});
