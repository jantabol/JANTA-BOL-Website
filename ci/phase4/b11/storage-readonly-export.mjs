// JANTA BOL Phase-4 B11 — original Supabase Storage FILE BYTE exporter.
// Read only: GET bucket listing, POST list (read operation), GET authenticated object.
// NEVER runs in B11 CI against LIVE. Requires separately authorized manual Owner context.
// No mutation, S3 delete, generation of signed URLs, shared public-media endpoints, or
// reading the separate Cricket project. Source may change during export: double-scan HOLD.
import {mkdirSync,existsSync,lstatSync,writeFileSync,rmSync,renameSync,createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash,randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve,relative,isAbsolute,join,dirname,sep} from 'node:path';
export const REF='vrffsnkycvjithwtiylt';
export const HOST='https://'+REF+'.supabase.co';
export const BUCKETS=Object.freeze(['grievance-private','private-editorial','public-media']);
const MAX_FILES=3000,MAX_FOLDERS=1000,MAX_PAGES=3000,MAX_FILE=256*1024*1024;
const MAX_TOTAL=2*1024*1024*1024;
function fail(code){throw new Error('B11_STORAGE_'+code)}
function under(child,base){const r=relative(base,child);return !!r&&r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r)}
export function guardManual(env=process.env){
 const checks={
  GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',
  GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website',
  GITHUB_ACTOR:'jantabol',GITHUB_REF:'refs/heads/main',
  GITHUB_RUN_ATTEMPT:'1',
  GITHUB_WORKFLOW_REF:'jantabol/JANTA-BOL-Website/.github/workflows/b11-storage-media-MANUAL.yml@refs/heads/main',
  B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_MEDIA_EXPORT_ONLY'
 };
 if(!Object.entries(checks).every(([k,v])=>env[k]===v))fail('FOUNDER_EXACT_MANUAL_APPROVAL_REQUIRED');
 return true;
}
function cleanKey(name){
 if(typeof name!=='string'||!name||name.length>800||
 name.startsWith('/')||name.endsWith('/')||name.includes('\\')||name.includes('\0')||
 name.split('/').some(x=>!x||x==='.'||x==='..')||/(^|\/)\.env(?:\..*)?$/i.test(name))fail('OBJECT_PATH_INVALID');
 return name;
}
const authHeaders=token=>({apikey:token,authorization:'Bearer '+token});
async function responseOrHold(fetchImpl,url,options){
 const res=await fetchImpl(url,{...options,redirect:'error',
  signal:AbortSignal.timeout(35000)});
 if(!res||!res.ok)fail('REMOTE_RETRIEVAL_OR_AUTH_DENIED_'+String(res?.status??'UNKNOWN'));
 return res;
}
async function jsonOrHold(res){let data;try{data=await res.json()}catch{fail('REMOTE_JSON_INVALID')}return data}
function guardSourceDir(outDir){
 if(typeof outDir!=='string'||!outDir)fail('OUTPUT_REQUIRED');
 const root=resolve(outDir),tmp=resolve(tmpdir());
 if(!under(root,tmp)||root===tmp)fail('OUTSIDE_DISPOSABLE_TEMP');
 let parent=root;
 while(parent!==dirname(parent)){
  if(existsSync(parent)&&lstatSync(parent).isSymbolicLink())fail('SYMLINK_PARENT');
  parent=dirname(parent);
 }
 if(!existsSync(root)||!lstatSync(root).isDirectory()||existsSync(join(root,'storage'))||
 existsSync(join(root,'JANTA_BOL_B11_MANIFEST.json')))fail('OUTPUT_NOT_EMPTY_OR_ALREADY_SEALED');
 return root;
}
function encode(p){return p.split('/').map(encodeURIComponent).join('/')}
async function listBucket(fetchImpl,token,bucket){
 const entries=[],folders=[''],visited=new Set();
 let calls=0;
 while(folders.length){
  if(visited.size>MAX_FOLDERS)fail('TOO_MANY_FOLDERS');
  const prefix=folders.shift();
  if(visited.has(prefix))fail('DUPLICATE_FOLDER');
  visited.add(prefix);
  for(let offset=0;;offset+=100){
   if(++calls>MAX_PAGES)fail('TOO_MANY_LIST_PAGES');
   const res=await responseOrHold(fetchImpl,HOST+'/storage/v1/object/list/'+encodeURIComponent(bucket),{
    method:'POST',
    headers:{...authHeaders(token),'content-type':'application/json'},
    body:JSON.stringify({prefix,limit:100,offset,sortBy:{column:'name',order:'asc'}})
   });
   const page=await jsonOrHold(res);
   if(!Array.isArray(page)||page.length>100)fail('MALFORMED_LIST_PAGE');
   for(const item of page){
    if(!item||typeof item.name!=='string')fail('MALFORMED_OBJECT');
    const name=cleanKey(item.name);
    const key=cleanKey(prefix+name);
    // Folder entries have no object id and must be traversed, not downloaded.
    if(!item.id){folders.push(key+'/');continue}
    if(typeof item.id!=='string'||typeof item.updated_at!=='string')fail('MISSING_FILE_IDENTITY');
    entries.push({bucket,key,id:item.id,updated_at:item.updated_at,
     etag:typeof item.metadata?.eTag==='string'?item.metadata.eTag:
          typeof item.metadata?.etag==='string'?item.metadata.etag:null,
     size:Number.isSafeInteger(item.metadata?.size)?item.metadata.size:null});
    if(entries.length>MAX_FILES)fail('TOO_MANY_OBJECTS');
   }
   if(page.length<100)break;
  }
 }
 return entries.sort((a,b)=>a.key.localeCompare(b.key,'en'));
}
async function listing(fetchImpl,token){
 const result=[];
 for(const bucket of BUCKETS){
  const b=await listBucket(fetchImpl,token,bucket);
  result.push(...b);
 }
 const seen=new Set();
 for(const e of result){
  const key=e.bucket+'/'+e.key;
  if(seen.has(key))fail('DUPLICATE_OBJECT');
  seen.add(key);
 }
 return result.sort((a,b)=>(a.bucket+'/'+a.key).localeCompare(b.bucket+'/'+b.key,'en'));
}
export async function exportStorageBytes({outDir,fetchImpl=globalThis.fetch,token,
 manual=true,env=process.env}){
 if(manual)guardManual(env);
 if(typeof token!=='string'||token.length<24||!fetchImpl)fail('PRIVATE_SERVICE_TOKEN_REQUIRED');
 const root=guardSourceDir(outDir);
 let total=0,downloaded=0;
 const before=await listing(fetchImpl,token);
 if(!before.length)fail('SOURCE_HAS_NO_OBJECTS');
 const stage=join(root,'storage.b11-staging-'+randomUUID());
 mkdirSync(stage,{mode:0o700});
 try{
  const evidence=[];
  for(const item of before){
   const save=join(stage,item.bucket,...item.key.split('/'));
   mkdirSync(dirname(save),{recursive:true,mode:0o700});
   const src=HOST+'/storage/v1/object/authenticated/'+encodeURIComponent(item.bucket)+'/'+encode(item.key);
   const res=await responseOrHold(fetchImpl,src,{method:'GET',headers:authHeaders(token)});
   if(!res.body)fail('EMPTY_OBJECT_BODY');
   const sha=createHash('sha256');let size=0;
   const meter=new Transform({transform(chunk,encoding,cb){
    size+=chunk.length;total+=chunk.length;
    if(size>MAX_FILE||total>MAX_TOTAL){cb(new Error('B11_STORAGE_BYTE_CAP_EXCEEDED'));return}
    sha.update(chunk);cb(null,chunk);
   }});
   await pipeline(Readable.fromWeb(res.body),meter,
     createWriteStream(save,{flags:'wx',mode:0o600}));
   if(item.size!==null&&item.size!==size)fail('OBJECT_LENGTH_CHANGED');
   evidence.push({bucket:item.bucket,key:item.key,id:item.id,
    original_updated_at:item.updated_at,original_etag:item.etag,
    size,sha256:sha.digest('hex')});
   downloaded++;
  }
  const after=await listing(fetchImpl,token);
  if(JSON.stringify(before)!==JSON.stringify(after))fail('SOURCE_CHANGED_DURING_EXPORT');
  renameSync(stage,join(root,'storage'));
  // No standalone 'complete archive' claim: only storage files exported.
  // Original full T034 encrypted DB archive and Founder-signed B11 bundle
  // are required separately for recovery attestation.
  return {mode:manual?'MANUAL_READ_ONLY':'SYNTHETIC_TEST',
   project_ref:REF,buckets:BUCKETS,
   object_count:downloaded,byte_count:total,stable_double_listing:true,
   actual_files_exported:true,db_snapshot_bound:false,
   storage_manifest_records:evidence};
 }catch(e){
  rmSync(stage,{recursive:true,force:true});
  throw e;
 }
}
