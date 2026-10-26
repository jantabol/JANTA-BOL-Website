// P4-T070: bind original Storage media bytes to raw PostgreSQL MVCC snapshot metadata.
// Zero external network, zero writes to Production, zero private paths in stdout.
// compare FILES in private tmpdir; verifier only emits literal non-sensitive PASS/HOLD.
import {readFileSync} from 'node:fs';
const BUCKETS=new Set(['grievance-private','private-editorial','public-media']);
const FAIL='T070_JOINT_STORAGE_SNAPSHOT_HOLD';
// PostgreSQL and Supabase object timestamps contain microseconds. Date.parse drops
// the final 3 digits: matching at millisecond precision could silently accept a
// changed original object within the same ms. Compare exact UTC microseconds.
const iso=x=>{
 const m=typeof x==='string'?x.match(/^((?:19|20|21)\d\d-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,6}))?(Z|\+00:00)$/):null;
 if(!m)throw Error(FAIL+'_INVALID_TIMESTAMP');
 const at=Date.parse(m[1]+'Z');
 if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,19)!==m[1])
  throw Error(FAIL+'_INVALID_TIMESTAMP');
 return String(at)+':'+(m[2]||'').padEnd(6,'0');
};
const key=x=>{if(typeof x!=='string'||!x||x.length>800||x.startsWith('/')||x.includes('\\')||x.split('/').some(t=>!t||t==='..'||t==='.'))throw Error(FAIL+'_INVALID_KEY');return x};
export function verifyJointStorageBinding(dbRows,receipt){
 if(!Array.isArray(dbRows)||dbRows.length!==5||!receipt||receipt.project_ref!=='vrffsnkycvjithwtiylt'||
 receipt.schema!=='janta-bol-b11-storage-readonly-receipt-v1'||
 receipt.capture_method!=='MANUAL_OWNER_SERVICE_ROLE_READ_ONLY'||
 receipt.stable_double_listing!==true||receipt.object_count!==5||
 !Array.isArray(receipt.sha_records)||receipt.sha_records.length!==5||
 JSON.stringify(receipt.buckets)!==JSON.stringify(['grievance-private','private-editorial','public-media']))
  throw Error(FAIL+'_WRONG_SCOPE_OR_COUNT');
 const map=new Map(),counts={};
 for(const row of dbRows){
  if(!BUCKETS.has(row.bucket)||!row.id||typeof row.id!=='string')throw Error(FAIL+'_DB_IDENTITY_INVALID');
  const id=row.bucket+'/'+key(row.key);
  if(map.has(id))throw Error(FAIL+'_DUPLICATE_DB_OBJECT');
  map.set(id,row); counts[row.bucket]=(counts[row.bucket]||0)+1;
 }
 if(counts['grievance-private']!==2||counts['private-editorial']!==1||counts['public-media']!==2)
  throw Error(FAIL+'_BUCKET_COUNTS_INVALID');
 const seen=new Set();
 for(const obj of receipt.sha_records){
  if(!BUCKETS.has(obj.bucket)||typeof obj.id!=='string')throw Error(FAIL+'_RECEIPT_ID_INVALID');
  const id=obj.bucket+'/'+key(obj.key);
  if(seen.has(id)||!map.has(id))throw Error(FAIL+'_ORIGINAL_OBJECT_MISSING');
  seen.add(id);
  const db=map.get(id);
  if(db.id!==obj.id)throw Error(FAIL+'_DB_MEDIA_OBJECT_VERSION_MISMATCH_ID');
  if(iso(db.updated_at)!==iso(obj.original_updated_at))
   throw Error(FAIL+'_DB_MEDIA_OBJECT_VERSION_MISMATCH_TIMESTAMP');
  if(!/^[a-f0-9]{64}$/.test(obj.sha256)||!Number.isSafeInteger(obj.size)||obj.size<0)
   throw Error(FAIL+'_ORIGINAL_BYTES_MANIFEST_INVALID');
 }
 if(seen.size!==5||map.size!==seen.size)throw Error(FAIL+'_FILES_NOT_EXACTLY_BIJECTIVE');
 return Object.freeze({schema:'JB_T070_JOINT_STORAGE_BINDING_V1',project:'vrffsnkycvjithwtiylt',
  exact_5_original_metadata_ids_timestamps:true,
  exactly_2_private_grievance_files:true,
  source_db_snapshot_storage_metadata_mapped_to_byte_verified_media:true,
  source_files_can_change_after_capture:true,
  universal_write_fence_proven:false,
  auth_go_true_or_edge_runtime_restored:false,
  production_mutated:false,
  no_private_names_emitted:true,
  t070_final_lock:false});
}
if(process.argv[1]?.endsWith('t070-joint-storage-snapshot-identity.mjs')){
 try{
  if(process.argv.length!==4)throw Error(FAIL+'_USAGE');
  const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const receipt=JSON.parse(readFileSync(process.argv[3],'utf8'));
  const result=verifyJointStorageBinding(rows,receipt);
  console.log('T070_REAL_SOURCE_DB_SNAPSHOT_FIVE_ORIGINAL_STORAGE_METADATA_BOUND=PASS');
  console.log('T070_DB_STORAGE_UNIVERSAL_ATOMIC_FREEZE_PROVEN=false');
  console.log('T070_AUTH_EDGE_VERCEL_RUNTIME_REBUILT=false');
  console.log('T070_FINAL_LOCK=false');
 }catch(e){
  // Log ONLY fixed, reviewed failure classes. No bucket keys, IDs, bytes, timestamps,
  // secret values or parser exception contents are ever printed on a real run.
  const allow=new Set([
   'WRONG_SCOPE_OR_COUNT','INVALID_TIMESTAMP','INVALID_KEY','DB_IDENTITY_INVALID',
   'DUPLICATE_DB_OBJECT','BUCKET_COUNTS_INVALID','RECEIPT_ID_INVALID',
   'ORIGINAL_OBJECT_MISSING','DB_MEDIA_OBJECT_VERSION_MISMATCH_ID',
   'DB_MEDIA_OBJECT_VERSION_MISMATCH_TIMESTAMP','ORIGINAL_BYTES_MANIFEST_INVALID',
   'FILES_NOT_EXACTLY_BIJECTIVE',
  ]);
  const raw=String(e?.message??''),tag=raw.startsWith(FAIL+'_')?raw.slice(FAIL.length+1):'';
  const safe=allow.has(tag)?tag:'UNCLASSIFIED';
  console.error(FAIL+'_INVALID_OR_INCONSISTENT_REASON='+safe);
  process.exitCode=3;
 }
}
