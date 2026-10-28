import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
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
test('G18 exact PostgreSQL microseconds: change in last microsecond must be rejected, not rounded to JS milliseconds',()=>{
 const r=receipt();
 r.sha_records[0].original_updated_at='2026-10-18T05:57:15.146692+00:00';
 assert.throws(()=>verifyJointStorageBinding(rows,r),/VERSION_MISMATCH/);
});
test('G18 cross-format identical UTC microseconds remain byte-for-byte equivalent',()=>{
 const r=receipt();
 r.sha_records[0].original_updated_at='2026-10-18T05:57:15.146691Z';
 assert.equal(verifyJointStorageBinding(rows,r).source_db_snapshot_storage_metadata_mapped_to_byte_verified_media,true);
});
test('G18 malformed or ambiguous Storage times fail closed',()=>{
 for(const bad of ['2026-10-18T05:57:15.14669','2026-10-18T05:57:15.146691+05:30','2026-10-18T05:57:15.1466911Z']){
  const r=receipt();r.sha_records[0].original_updated_at=bad;
  assert.throws(()=>verifyJointStorageBinding(rows,r),/INVALID_TIMESTAMP/);
 }
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

test('T070 precision adapter accepts millisecond-only API timestamps ONLY with an exact fresh source PostgreSQL postread',()=>{
 const r=receipt();
 for(const x of r.sha_records)x.original_updated_at='2026-10-18T05:57:15.146Z';
 assert.throws(()=>verifyJointStorageBinding(rows,r),/VERSION_MISMATCH_TIMESTAMP/);
 const proof=verifyJointStorageBinding(rows,r,structuredClone(rows));
 assert.equal(proof.api_millisecond_precision_loss_validated_by_fresh_pg,true);
 assert.equal(proof.exact_5_original_metadata_ids_timestamps,false);
 assert.equal(proof.original_db_microsecond_identity_postread_stable,true);
 const changed=structuredClone(rows);
 changed[0].updated_at='2026-10-18T05:57:15.146692Z';
 assert.throws(()=>verifyJointStorageBinding(rows,r,changed),/POST_READ_SOURCE_CHANGED/);
 const swapped=structuredClone(rows);
 swapped[0].id='changed-secret-id';
 assert.throws(()=>verifyJointStorageBinding(rows,r,swapped),/POST_READ_SOURCE_CHANGED/);
 const millisWrong=structuredClone(r);millisWrong.sha_records[0].original_updated_at='2026-10-18T05:57:15.147Z';
 assert.throws(()=>verifyJointStorageBinding(rows,millisWrong,structuredClone(rows)),/VERSION_MISMATCH_TIMESTAMP/);
 const fullMicrosWrong=structuredClone(r);fullMicrosWrong.sha_records[0].original_updated_at='2026-10-18T05:57:15.146692Z';
 assert.throws(()=>verifyJointStorageBinding(rows,fullMicrosWrong,structuredClone(rows)),/VERSION_MISMATCH_TIMESTAMP/);
});

test('Run1 real joint RCA distinguishes ID drift from microsecond timestamp drift without exposing metadata',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jb-t070-rca-'));
 const dbPath=join(dir,'db.json'),mediaPath=join(dir,'media.json'),postPath=join(dir,'post.json');
 const script=fileURLToPath(new URL('./t070-joint-storage-snapshot-identity.mjs',import.meta.url));
 try{
  const cases=[
   {change:r=>{r.sha_records[0].id='untrusted-private-id';},reason:'DB_MEDIA_OBJECT_VERSION_MISMATCH_ID'},
   {change:r=>{r.sha_records[0].original_updated_at='2026-10-18T05:57:15.146692Z';},reason:'DB_MEDIA_OBJECT_VERSION_MISMATCH_TIMESTAMP'},
   {change:r=>{r.sha_records[0].key='private-sensitive-path';},reason:'ORIGINAL_OBJECT_MISSING'},
  ];
  for(const c of cases){
   const media=receipt();c.change(media);
   writeFileSync(dbPath,JSON.stringify(rows));
   writeFileSync(mediaPath,JSON.stringify(media));
   writeFileSync(postPath,JSON.stringify(rows));
   const res=spawnSync(process.execPath,[script,dbPath,mediaPath,postPath],{encoding:'utf8'});
   assert.equal(res.status,3);
   assert.equal(res.stdout,'');
   assert.match(res.stderr,new RegExp('T070_JOINT_STORAGE_SNAPSHOT_HOLD_INVALID_OR_INCONSISTENT_REASON='+c.reason));
   assert.doesNotMatch(res.stderr,/evidence\/a\.pdf|untrusted-private-id|private-sensitive-path|146692/);
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
});
