// JANTA BOL — P4-T070 isolated restore identity comparator.
// Run only on separately captured source and isolated restored manifests.
// This has NO Supabase credentials, no SQL writes and no production calls.
import {createHash} from 'node:crypto';
export const REQUIRED_TABLES=Object.freeze({
 articles:['id','slug','version'],
 article_versions:['id','article_id','article_version'],
 grievances:['id','public_id','article_id'],
 grievance_history:['id','grievance_id'],
 grievance_evidence:['id','grievance_id'],
 live_sessions:['id','article_id'],
 live_updates:['id','live_session_id'],
 advertisers:['id'],
 ad_packages:['id','version'],
 ad_campaigns:['id','advertiser_id','package_id','status'],
 ad_payments:['id','campaign_id','amount_minor','status'],
 auth_users:['id']
});
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const sha = value => createHash('sha256').update(value).digest('hex');
const STOP = reason => {throw Error('T070_FAIL_CLOSED_'+reason)};
const safe = x => typeof x==='string'&&x.length>0&&x.length<=500&&!/[\x00-\x1f]/.test(x);
function verifiedItems(manifest,table){
 const cols=REQUIRED_TABLES[table];
 if(!manifest||typeof manifest!=='object'||!Array.isArray(manifest[table]))STOP('MISSING_'+table);
 const ids=new Set(),rows=[];
 for(const row of manifest[table]){
  if(!row||typeof row!=='object'||Array.isArray(row))STOP('BAD_ROW_'+table);
  const id=row.id;
  const numericPk=table==='article_versions'||table==='grievance_history';
  if(numericPk?(!Number.isSafeInteger(id)||id<1):(typeof id!=='string'||!uuid.test(id)))
   STOP('BAD_ID_'+table);
  const idkey=String(id);if(ids.has(idkey))STOP('DUP_ID_'+table);ids.add(idkey);
  const normalized={};
  for(const col of cols){
   if(!(col in row)||row[col]===undefined)STOP('MISSING_'+table+'_'+col);
   const value=row[col];
   if(value!==null&&typeof value!=='string'&&typeof value!=='number')STOP('BAD_FIELD_'+table+'_'+col);
   if(typeof value==='number'&&!Number.isSafeInteger(value))STOP('BAD_NUMBER');
   normalized[col]=value;
  }
  rows.push(normalized);
 }
 return rows.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
}
function childParents(items){
 const article=new Set(items.articles.map(x=>x.id));
 const grievance=new Set(items.grievances.map(x=>x.id));
 const session=new Set(items.live_sessions.map(x=>x.id));
 const campaign=new Set(items.ad_campaigns.map(x=>x.id));
 const advertiser=new Set(items.advertisers.map(x=>x.id));
 const packages=new Set(items.ad_packages.map(x=>x.id));
 const users=new Set(items.auth_users.map(x=>x.id));
 const foreign=[
  ['article_versions','article_id',article],
  ['grievance_history','grievance_id',grievance],
  ['grievance_evidence','grievance_id',grievance],
  ['live_sessions','article_id',article],
  ['live_updates','live_session_id',session],
  ['ad_campaigns','advertiser_id',advertiser],
  ['ad_campaigns','package_id',packages],
  ['ad_payments','campaign_id',campaign]
 ];
 for(const [t,c,parent] of foreign)
  for(const row of items[t])if(row[c]!==null&&!parent.has(row[c]))STOP('ORPHAN_'+t+'_'+c);
 // Only source identities, not arbitrary app/user-editable metadata, are used for auth parity.
 for(const row of items.articles)if(!safe(row.slug))STOP('BAD_PERMANENT_URL');
 const slugs=new Set(items.articles.map(x=>x.slug));
 if(slugs.size!==items.articles.length)STOP('DUPLICATE_PERMANENT_URL');
 for(const row of items.grievances)if(!safe(row.public_id))STOP('BAD_GRIEVANCE_ID');
 const grievanceIds=items.grievances.map(x=>x.public_id);
 if(new Set(grievanceIds).size!==grievanceIds.length)STOP('DUPLICATE_GRIEVANCE_ID');
 // Keep users distinct; no silent account recreation during restore.
 if(users.size!==items.auth_users.length)STOP('DUPLICATE_AUTH_ID');
}
function stableInventory(m, origin){
 // A production-source manifest MUST NOT pretend to be an isolated restore.
 const shouldBeIsolated=origin==='RESTORED';
 if(!m||m.project!=='vrffsnkycvjithwtiylt'||m.isolated!==shouldBeIsolated||
    !safe(m.snapshot_id)||!safe(m.captured_at)||!Number.isFinite(Date.parse(m.captured_at)))
  STOP('MANIFEST_IDENTITY');
 const items={};
 for(const t of Object.keys(REQUIRED_TABLES))items[t]=verifiedItems(m.tables,t);
 childParents(items);
 if(typeof m.settings_fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(m.settings_fingerprint)||
    typeof m.rls_fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(m.rls_fingerprint))
  STOP('PLATFORM_SECURITY_PROOF');
 if(!Array.isArray(m.media)||!m.media.every(x=>['grievance-private','private-editorial','public-media'].includes(x.bucket)&&
     safe(x.path)&&!x.path.includes('\\')&&x.path.split('/').every(p=>p!==''&&p!=='.'&&p!=='..')&&/^[a-f0-9]{64}$/.test(x.sha256)&&Number.isSafeInteger(x.bytes)&&x.bytes>=0))
  STOP('MEDIA_MANIFEST_INVALID');
 const med=m.media.map(x=>({bucket:x.bucket,path:x.path,sha256:x.sha256,bytes:x.bytes}))
  .sort((a,b)=>(a.bucket+'/'+a.path).localeCompare(b.bucket+'/'+b.path));
 const paths=med.map(x=>x.bucket+'/'+x.path);
 if(new Set(paths).size!==paths.length)STOP('DUPLICATE_MEDIA_PATH');
 return {items,media:med,rls:m.rls_fingerprint,settings:m.settings_fingerprint,
  captured_at:m.captured_at,snapshot_id:m.snapshot_id};
}
export function assessT070Restore({source,restored,evidence}){
 const src=stableInventory(source,'SOURCE'),dst=stableInventory(restored,'RESTORED');
 if(src.snapshot_id!==dst.snapshot_id||src.captured_at!==dst.captured_at)
  STOP('NOT_SAME_TRUSTED_SNAPSHOT');
 const expected={...src},actual={...dst};
 if(sha(JSON.stringify(expected.items))!==sha(JSON.stringify(actual.items)))
  STOP('SOURCE_RESTORE_IDENTITY_MISMATCH');
 if(src.rls!==dst.rls||src.settings!==dst.settings)
  STOP('SECURITY_OR_PLATFORM_CONFIG_MISMATCH');
 if(sha(JSON.stringify(src.media))!==sha(JSON.stringify(dst.media)))
  STOP('MEDIA_BYTES_OR_IDENTITY_MISMATCH');
 if(!evidence||evidence.destination!=='ISOLATED_DISPOSABLE'||
    evidence.production_untouched!==true||evidence.overwrite_existing!==false||
    evidence.restore_performed!==true||evidence.actual_media_bytes_checked!==true||
    evidence.auth_permissions_checked!==true||evidence.config_restored_verified!==true||
    evidence.reconciliation_performed!==true||!safe(evidence.restore_run_id))
  STOP('REAL_RESTORE_EVIDENCE_MISSING');
 const notExercised=[];
 for(const t of ['live_updates','ad_payments'])
  if(src.items[t].length===0)notExercised.push(t);
 if(src.media.length===0)notExercised.push('original_media');
 return {status:notExercised.length?'INCOMPLETE_COVERAGE':'READY_FOR_INDEPENDENT_E8_REVIEW',
  snapshot_id:src.snapshot_id,
  table_counts:Object.fromEntries(Object.entries(src.items).map(([t,rows])=>[t,rows.length])),
  media_count:src.media.length,
  not_exercised:notExercised,
  manifest_fingerprint:sha(JSON.stringify(expected)),
  proof_kind:'ISOLATED_RESTORE_COMPARISON_ONLY',
  warning:'Never label final PASS from synthetic fixtures or this function alone.'};
}
