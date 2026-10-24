// JANTA BOL B11 safe offline evidence/restore engine.
// No Supabase, Backblaze, production URL, secrets or network calls.
// Actual PostgreSQL full restore MUST use the pre-existing vetted T034 helper;
// this engine verifies immutable file-byte evidence and stages a safe offline copy.
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,statSync,lstatSync,readdirSync,mkdirSync,openSync,closeSync,copyFileSync,fsyncSync,renameSync,rmSync,existsSync} from 'node:fs';
import {resolve,relative,isAbsolute,join,dirname,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
export const PROJECT='vrffsnkycvjithwtiylt';
export const SCHEMA='janta-bol-b11-offline-evidence-v1';
export const MANIFEST='JANTA_BOL_B11_MANIFEST.json';
export const STAMP='.JANTA_BOL_B11_RESTORE_ATTESTATION.json';
const MAX_FILES=20000, MAX_FILE_BYTES=10*1024*1024*1024;
const forbidden=/(?:^|\/)(?:\.env(?:\..*)?|\.git|\.ssh|node_modules|service_role|recovery[-_]?key|private[-_]?key|age[-_]?identity|secrets?)(?:\/|$)/i;
function fail(code){throw new Error('B11_'+code)}
export function hash(buf){return createHash('sha256').update(buf).digest('hex')}
function digest(path){const data=readFileSync(path);return hash(data)}
function isHash(x){return /^[a-f0-9]{64}$/.test(x)}
export function safeRel(p){
 if(typeof p!=='string'||p.length<2||p.length>600||p.includes('\\')||p.includes('\0')||
 isAbsolute(p)||p.startsWith('/')||p.endsWith('/')||p.split('/').some(a=>!a||a==='.'||a==='..')||
 !/^(db|identity|storage|config)\//.test(p)||forbidden.test(p))fail('UNSAFE_RELATIVE_PATH');
 return p;
}
function assertSafeParents(root,relPath){
 const parts=relPath.split('/');let at=root;
 if(lstatSync(root).isSymbolicLink())fail('ROOT_SYMLINK');
 for(const p of parts){at=join(at,p);if(lstatExists(at)&&lstatSync(at).isSymbolicLink())fail('SYMLINK_REJECTED')}
 return at;
}
function lstatExists(p){try{lstatSync(p);return true}catch(e){if(e.code==='ENOENT')return false;throw e}}
function rootFolder(dir){
 if(typeof dir!=='string'||!dir.length)fail('ROOT_REQUIRED');
 const root=resolve(dir);if(!existsSync(root)||!statSync(root).isDirectory()||lstatSync(root).isSymbolicLink())
 fail('INVALID_ROOT');
 return root;
}
function filesUnder(root){
 const list=[];
 function scan(base,depth){
  if(depth>16)fail('MAX_NESTING');
  for(const d of readdirSync(base,{withFileTypes:true})){
   if(d.isSymbolicLink())fail('SYMLINK_REJECTED');
   const full=join(base,d.name),rel=relative(root,full).split(sep).join('/');
   if(rel===MANIFEST||rel===STAMP)continue;
   if(d.isDirectory()){safeRel(rel+'/dummy');scan(full,depth+1)}
   else if(d.isFile()){
    safeRel(rel);const st=statSync(full);
    if(st.size<1||st.size>MAX_FILE_BYTES)fail('INVALID_FILE_SIZE');
    list.push({path:rel,size:st.size,sha256:digest(full)});
    if(list.length>MAX_FILES)fail('TOO_MANY_FILES');
   }else fail('UNSUPPORTED_FILE_TYPE');
  }
 }
 scan(root,0);return list.sort((a,b)=>a.path.localeCompare(b.path,'en'));
}
function json(path){try{return JSON.parse(readFileSync(path,'utf8'))}catch{fail('INVALID_JSON')}}
function mustHave(list){
 const paths=new Set(list.map(x=>x.path));
 for(const required of ['db/raw_full.dump','db/source_db_identity.json','identity/stable-ids.json','config/deployment-refs.json'])
 if(!paths.has(required))fail('MISSING_REQUIRED_COMPONENT');
 if(!list.some(x=>x.path.startsWith('storage/')))fail('STORAGE_BYTES_NOT_PRESENT');
}
function safeSemantic(root){
 const id=json(join(root,'identity/stable-ids.json'));
 if(id.project_ref!==PROJECT||!Array.isArray(id.articles)||id.articles.length<1)fail('WRONG_PROJECT_OR_MISSING_ARTICLES');
 const names=new Set(),urls=new Set();
 for(const a of id.articles){
  if(typeof a.id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(a.id)||
  typeof a.permanent_url!=='string'||!a.permanent_url.startsWith('/news/')||
  a.permanent_url.includes('..')||typeof a.version_count!=='number'||!Number.isInteger(a.version_count)||
  a.version_count<1||names.has(a.id)||urls.has(a.permanent_url))fail('ARTICLE_MASTER_IDENTITY_INVALID');
  names.add(a.id);urls.add(a.permanent_url);
 }
 const config=json(join(root,'config/deployment-refs.json'));
 if(config.project_ref!==PROJECT||typeof config.git_commit!=='string'||
 !/^[a-f0-9]{40}$/i.test(config.git_commit))fail('SOURCE_IDENTITY_INVALID');
 // Config may record safe identifiers, never credential-bearing connection data.
 const cfg=readFileSync(join(root,'config/deployment-refs.json'),'utf8');
 if(/"(?:password|token|access_key|refresh_token|service_role|private_key|secret)"\s*:/i.test(cfg)||
 /(?:sb_secret_|eyJ[a-zA-Z0-9_-]{100,})/.test(cfg))fail('CONFIG_SECRET_CONTENT');
 const db=json(join(root,'db/source_db_identity.json'));
 if(db.project_ref!==PROJECT||!Array.isArray(db.required_schemas)||
 !['public','auth','storage'].every(s=>db.required_schemas.includes(s)))fail('DB_IDENTITY_INVALID');
 return {identity:id,config,db};
}
function assertManifest(m){
 if(!m||m.schema!==SCHEMA||m.project_ref!==PROJECT||m.mode!=='OFFLINE_ONLY'||
 typeof m.created_at!=='string'||!Number.isFinite(Date.parse(m.created_at))||
 !Array.isArray(m.files)||m.files.length<5||m.files.length>MAX_FILES||
 typeof m.generation_id!=='string'||!m.generation_id.trim())fail('MANIFEST_HEADER_INVALID');
 let previous='';
 for(const f of m.files){
  safeRel(f.path);
  if(f.path<=previous||!Number.isSafeInteger(f.size)||f.size<1||!isHash(f.sha256))
   fail('MANIFEST_FILE_ORDER_OR_HASH_INVALID');
  previous=f.path;
 }
 mustHave(m.files);
 if(m.storage_count!==m.files.filter(x=>x.path.startsWith('storage/')).length)
 fail('STORAGE_COVERAGE_DRIFT');
 if(!isHash(m.identity_digest)||!isHash(m.config_digest))fail('IDENTITY_DIGEST_MISSING');
}
export function seal(rootDir,{generation=randomUUID(),clock=new Date().toISOString()}={}){
 const root=rootFolder(rootDir);
 if(existsSync(join(root,MANIFEST)))fail('EXISTING_MANIFEST_IMMUTABLE');
 const files=filesUnder(root);mustHave(files);
 const {identity,config}=safeSemantic(root);
 const m={schema:SCHEMA,project_ref:PROJECT,mode:'OFFLINE_ONLY',
 generation_id:generation,created_at:clock,
 scope:{db_bytes:true,storage_file_bytes:true,
 full_postgres_restored:false,platform_config_restored:false,
 encrypted_offsite_independent:false,owner_device_loss_rehearsed:false},
 identity_digest:hash(Buffer.from(JSON.stringify(identity))),
 config_digest:hash(Buffer.from(JSON.stringify(config))),
 storage_count:files.filter(x=>x.path.startsWith('storage/')).length,
 files};
 assertManifest(m);
 const dest=join(root,MANIFEST);
 const fd=openSync(dest,'wx',0o600);
 try{writeFileSync(fd,JSON.stringify(m,null,2)+'\n');fsyncSync(fd)}finally{closeSync(fd)}
 return m;
}
export function verify(rootDir){
 const root=rootFolder(rootDir);
 const m=json(join(root,MANIFEST));assertManifest(m);
 const files=filesUnder(root);
 if(files.length!==m.files.length)fail('ADDED_OR_DELETED_FILE');
 for(let i=0;i<files.length;i++){
  const actual=files[i],expected=m.files[i];
  if(actual.path!==expected.path||actual.size!==expected.size||actual.sha256!==expected.sha256)
   fail('FILE_HASH_OR_IDENTITY_MISMATCH');
 }
 const {identity,config}=safeSemantic(root);
 if(hash(Buffer.from(JSON.stringify(identity)))!==m.identity_digest||
 hash(Buffer.from(JSON.stringify(config)))!==m.config_digest)fail('SEMANTIC_DIGEST_DRIFT');
 return m;
}
function isUnder(child,base){
 const rel=relative(base,child);
 return rel!==''&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel);
}
function safeDest(dest,source){
 if(typeof dest!=='string'||!dest.trim())fail('DEST_REQUIRED');
 const output=resolve(dest);
 const temp=resolve(tmpdir());
 if(!isUnder(output,temp)||output===source||isUnder(source,output)||isUnder(output,source)||
 output===temp||output===resolve('/'))fail('DEST_OUTSIDE_DISPOSABLE_TEMP');
 let parent=dirname(output);
 while(parent!==dirname(parent)){
  if(lstatExists(parent)&&lstatSync(parent).isSymbolicLink())fail('DEST_PARENT_SYMLINK');
  parent=dirname(parent);
 }
 return output;
}
function matchExisting(dest,m){
 try{
  const stamped=json(join(dest,STAMP));
  if(stamped.manifest_sha256!==hash(Buffer.from(JSON.stringify(m))))return false;
  const restored=verify(dest);
  return restored.generation_id===m.generation_id;
 }catch{return false}
}
export function stageDisposable(sourceDir,destPath,{confirmation,injectFailureAfter=0}={}){
 if(confirmation!=='JANTA_BOL_DISPOSABLE_ONLY')fail('DISPOSABLE_CONFIRMATION_REQUIRED');
 const src=rootFolder(sourceDir),m=verify(src),dest=safeDest(destPath,src);
 if(lstatExists(dest)){
  if(lstatSync(dest).isSymbolicLink())fail('DEST_SYMLINK');
  if(matchExisting(dest,m))return {state:'ALREADY_VERIFIED',file_count:m.files.length,generation_id:m.generation_id};
  fail('DEST_EXISTS_DIFFERENT_OR_CORRUPT');
 }
 const staging=dest+'.jb-b11-staging-'+randomUUID();
 let renamed=false;
 try{
  mkdirSync(staging,{recursive:false,mode:0o700});
  let count=0;
  for(const file of m.files){
   const from=assertSafeParents(src,file.path);
   const to=join(staging,file.path);
   mkdirSync(dirname(to),{recursive:true,mode:0o700});
   copyFileSync(from,to);
   if(digest(to)!==file.sha256)fail('DISPOSABLE_COPY_DIGEST_MISMATCH');
   count++;
   if(injectFailureAfter>0&&count===injectFailureAfter)fail('INJECTED_PARTIAL_WRITE');
  }
  copyFileSync(join(src,MANIFEST),join(staging,MANIFEST));
  verify(staging);
  const stamp={schema:'jb-b11-disposable-restore-stamp-v1',
   manifest_sha256:hash(Buffer.from(JSON.stringify(m))),generation_id:m.generation_id,
   source_project_ref:PROJECT,verified_file_count:m.files.length,
   db_sql_restore_executed:false,production_mutation:false};
  writeFileSync(join(staging,STAMP),JSON.stringify(stamp,null,2)+'\n',{mode:0o600,flag:'wx'});
  renameSync(staging,dest);renamed=true;
  return {state:'VERIFIED_DISPOSABLE_COPY',file_count:m.files.length,
  generation_id:m.generation_id,db_sql_restore_executed:false};
 }finally{
  if(!renamed&&lstatExists(staging))rmSync(staging,{recursive:true,force:true});
 }
}
export function evaluateHealth({last_backup_at,last_verified_restore_at,observed_at,
 measured_rpo_seconds=null,measured_rto_seconds=null,approved_rpo_seconds=null,approved_rto_seconds=null,
 offsite_verified=false,storage_bytes_verified=false,platform_config_verified=false}){
 if(!observed_at||!Number.isFinite(Date.parse(observed_at)))fail('HEALTH_OBSERVATION_INVALID');
 const now=Date.parse(observed_at);
 const goodDate=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&Date.parse(x)<=now;
 const goodNum=x=>Number.isFinite(x)&&x>=0;
 const checks={
 recent_backup:goodDate(last_backup_at) && goodNum(approved_rpo_seconds) &&
 (now-Date.parse(last_backup_at))/1000<=approved_rpo_seconds,
 verified_restore:goodDate(last_verified_restore_at),
 rpo_within_approved:goodNum(measured_rpo_seconds)&&goodNum(approved_rpo_seconds)&&
 measured_rpo_seconds<=approved_rpo_seconds,
 rto_within_approved:goodNum(measured_rto_seconds)&&goodNum(approved_rto_seconds)&&
 measured_rto_seconds<=approved_rto_seconds,
 offsite_independent:offsite_verified===true,
 storage_file_bytes:storage_bytes_verified===true,
 platform_config:platform_config_verified===true
 };
 return {status:Object.values(checks).every(Boolean)?'HEALTHY':'HOLD',
 checks,measured_rpo_seconds,measured_rto_seconds,
 targets_approved:goodNum(approved_rpo_seconds)&&goodNum(approved_rto_seconds),
 no_automatic_restore:true};
}
export function recoveryDecision(fault,{known_clean_device=false,verified_restore=false}={}){
 const dictionary={
 compromised_session:['CONTAIN','REVOKE_AFFECTED_SESSION','PRESERVE_AUDIT','VERIFY_OTHER_SESSIONS'],
 corrupt_backup:['QUARANTINE_CORRUPT_OBJECT','SELECT_IMMUTABLE_PRIOR_GENERATION','VERIFY_DECRYPT_HASH'],
 deleted_article:['FREEZE_FURTHER_DELETIONS','RESTORE_TO_ISOLATED_CLONE','VERIFY_PERMANENT_URL_AND_AUDIT'],
 lost_founder_device:['FREEZE_PRIVILEGED_CHANGES','USE_OTHER_KNOWN_CLEAN_FACTOR','REVOKE_AFFECTED_SESSION','REBUILD_MFA_ONLY_AFTER_VERIFICATION'],
 failed_storage:['ISOLATE_MEDIA_ONLY','PRESERVE_NEWSROOM_PUBLISHING','VERIFY_OFFSITE_BYTES'],
 credential_compromise:['STOP_SENSITIVE_OPERATIONS','PRESERVE_EVIDENCE','ROTATE_THROUGH_FOUNDER_APPROVAL','REVALIDATE_RLS'],
 partial_database_write:['ROLLBACK_AFFECTED_TRANSACTION','RETRY_WITH_STABLE_ACTION_ID','VERIFY_NO_DUPLICATE_RECORD']
 };
 if(!Object.hasOwn(dictionary,fault))fail('UNKNOWN_INCIDENT_CLASS');
 const blocked=(fault==='lost_founder_device'&&!known_clean_device)||
 ((fault==='corrupt_backup'||fault==='deleted_article')&&!verified_restore);
 return {fault,steps:dictionary[fault],decision:blocked?'HOLD_FOR_SAFE_EVIDENCE':'FOUNDER_APPROVAL_REQUIRED',
 automatic_destructive_action:false,automatic_session_reset:false,
 preserves_article_master_identity:true};
}
export function syntheticFixture(dir){
 if(lstatExists(dir))fail('FIXTURE_DEST_EXISTS');
 const root=resolve(dir);if(!isUnder(root,resolve(tmpdir())))fail('FIXTURE_OUTSIDE_TEMP');
 const items={
 'db/raw_full.dump':'FAKE_DB_ARCHIVE_NOT_A_POSTGRES_DUMP\n',
 'db/source_db_identity.json':JSON.stringify({project_ref:PROJECT,required_schemas:['public','auth','storage','private'],historical_audit_count:5})+'\n',
 'identity/stable-ids.json':JSON.stringify({project_ref:PROJECT,articles:[
  {id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',permanent_url:'/news/one-permanent-url',version_count:3}
 ],audit_append_only:true,grievance_id_stable:true,ad_campaign_id_stable:true})+'\n',
 'config/deployment-refs.json':JSON.stringify({project_ref:PROJECT,git_commit:'0'.repeat(40),env_separation_approved:false})+'\n',
 'storage/public-media/cover.jpg':'FAKE_IMAGE_BYTES_V1',
 'storage/private-grievance/evidence.bin':'FAKE_PRIVATE_EVIDENCE_BYTES_V1'
 };
 for(const [path,value] of Object.entries(items)){
  mkdirSync(dirname(join(root,path)),{recursive:true,mode:0o700});
  writeFileSync(join(root,path),value,{mode:0o600,flag:'wx'});
 }
 return seal(root,{generation:'B11-SYNTHETIC-ONLY'});
}
