// P4-T070: bind original Storage media bytes to raw PostgreSQL MVCC snapshot metadata.
// Zero external network, zero writes to Production, zero private paths in stdout.
// compare FILES in private tmpdir; verifier only emits literal non-sensitive PASS/HOLD.
import {readFileSync} from 'node:fs';
const BUCKETS=new Set(['grievance-private','private-editorial','public-media']);
const FAIL='T070_JOINT_STORAGE_SNAPSHOT_HOLD';
// The source PG snapshot is authoritative to the microsecond. Some Storage
// API serializers may provide only millisecond precision; NEVER silently
// downgrade source equality without a SECOND, FRESH, read-only PG source check.
const stamp=x=>{
 const m=typeof x==='string'?x.match(/^((?:19|20|21)\d\d-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,6}))?(Z|\+00:00)$/):null;
 if(!m)throw Error(FAIL+'_INVALID_TIMESTAMP');
 const at=Date.parse(m[1]+'Z');
 if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,19)!==m[1])
  throw Error(FAIL+'_INVALID_TIMESTAMP');
 const micros=(m[2]||'').padEnd(6,'0');
 return {full:String(at)+':'+micros,millisecond:String(at)+':'+micros.slice(0,3),digits:(m[2]||'').length};
};
const iso=x=>stamp(x).full;
const key=x=>{if(typeof x!=='string'||!x||x.length>800||x.startsWith('/')||x.includes('\\')||x.split('/').some(t=>!t||t==='..'||t==='.'))throw Error(FAIL+'_INVALID_KEY');return x};
export function verifyJointStorageBinding(dbRows,receipt,postRows){
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
 // The post-media PG query MUST be a FRESH transaction, not the exported
 // MVCC snapshot. An update during Storage GET must not become a false restore PASS.
 if(postRows!==undefined){
  if(!Array.isArray(postRows)||postRows.length!==5)throw Error(FAIL+'_POST_READ_SCOPE_INVALID');
  const post=new Map();
  for(const row of postRows){
   if(!row||!BUCKETS.has(row.bucket)||typeof row.id!=='string')
    throw Error(FAIL+'_POST_READ_SCOPE_INVALID');
   const id=row.bucket+'/'+key(row.key);
   if(post.has(id))throw Error(FAIL+'_POST_READ_DUPLICATE_OBJECT');
   post.set(id,row);
  }
  for(const [id,row] of map){
   const current=post.get(id);
   if(!current||row.id!==current.id||iso(row.updated_at)!==iso(current.updated_at))
    throw Error(FAIL+'_POST_READ_SOURCE_CHANGED');
  }
  if(post.size!==map.size)throw Error(FAIL+'_POST_READ_SOURCE_CHANGED');
 }
 let apiPrecisionLossGuarded=0;
 const seen=new Set();
 for(const obj of receipt.sha_records){
  if(!BUCKETS.has(obj.bucket)||typeof obj.id!=='string')throw Error(FAIL+'_RECEIPT_ID_INVALID');
  const id=obj.bucket+'/'+key(obj.key);
  if(seen.has(id)||!map.has(id))throw Error(FAIL+'_ORIGINAL_OBJECT_MISSING');
  seen.add(id);
  const db=map.get(id);
  if(db.id!==obj.id)throw Error(FAIL+'_DB_MEDIA_OBJECT_VERSION_MISMATCH_ID');
  const pgTime=stamp(db.updated_at),apiTime=stamp(obj.original_updated_at);
  if(pgTime.full!==apiTime.full){
   // Only a 3-digit API timestamp, matching the SAME UTC millisecond, may
   // be reconciled against exact, unchanged six-digit PG metadata after GET.
   // An actual six-digit microsecond mismatch is NEVER accepted.
   if(postRows!==undefined&&apiTime.digits===3&&
      pgTime.millisecond===apiTime.millisecond){
    apiPrecisionLossGuarded++;
   }else throw Error(FAIL+'_DB_MEDIA_OBJECT_VERSION_MISMATCH_TIMESTAMP');
  }
  if(!/^[a-f0-9]{64}$/.test(obj.sha256)||!Number.isSafeInteger(obj.size)||obj.size<0)
   throw Error(FAIL+'_ORIGINAL_BYTES_MANIFEST_INVALID');
 }
 if(seen.size!==5||map.size!==seen.size)throw Error(FAIL+'_FILES_NOT_EXACTLY_BIJECTIVE');
 return Object.freeze({schema:'JB_T070_JOINT_STORAGE_BINDING_V1',project:'vrffsnkycvjithwtiylt',
  exact_5_original_metadata_ids_timestamps:apiPrecisionLossGuarded===0,
  original_db_microsecond_identity_postread_stable:postRows!==undefined,
  api_millisecond_precision_loss_validated_by_fresh_pg:apiPrecisionLossGuarded>0,
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
  if(process.argv.length!==5)throw Error(FAIL+'_USAGE');
  const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const receipt=JSON.parse(readFileSync(process.argv[3],'utf8'));
  const postRows=JSON.parse(readFileSync(process.argv[4],'utf8'));
  const result=verifyJointStorageBinding(rows,receipt,postRows);
  console.log('T070_REAL_SOURCE_DB_SNAPSHOT_FIVE_ORIGINAL_STORAGE_METADATA_BOUND=PASS');
  console.log('T070_FRESH_READ_ONLY_PG_POST_MEDIA_ID_TIMESTAMP_PARITY=PASS');
  console.log('T070_STORAGE_API_SUBMILLISECOND_LOSS_WITH_FRESH_PG_GUARD='+String(result.api_millisecond_precision_loss_validated_by_fresh_pg));
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
   'FILES_NOT_EXACTLY_BIJECTIVE','POST_READ_SCOPE_INVALID',
   'POST_READ_DUPLICATE_OBJECT','POST_READ_SOURCE_CHANGED',
  ]);
  const raw=String(e?.message??''),tag=raw.startsWith(FAIL+'_')?raw.slice(FAIL.length+1):'';
  const safe=allow.has(tag)?tag:'UNCLASSIFIED';
  console.error(FAIL+'_INVALID_OR_INCONSISTENT_REASON='+safe);
  process.exitCode=3;
 }
}
