// P4-T070 G2: verify ACTUAL recovered object bytes on a disconnected filesystem.
// This helper cannot fetch live storage or B2, and cannot by itself prove E8 PASS.
// Never log source object names, paths, raw bytes or private data.
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat} from 'node:fs/promises';
import {isAbsolute, join} from 'node:path';

const BUCKETS=new Set(['grievance-private','private-editorial','public-media']);
const bad=code=>{throw Error('T070_MEDIA_HOLD_'+code)};
const digest=data=>createHash('sha256').update(data).digest('hex');
function validate(expected){
 if(!Array.isArray(expected)||expected.length===0||expected.length>10000)bad('INVENTORY');
 const seen=new Set();
 for(const x of expected){
  if(!x||typeof x!=='object'||!BUCKETS.has(x.bucket)||
     typeof x.path!=='string'||x.path.length===0||x.path.length>2000||
     x.path.includes('\\')||/[\x00-\x1f\x7f]/.test(x.path)||
     x.path.split('/').some(part=>!part||part==='.'||part==='..')||
     typeof x.sha256!=='string'||!/^[0-9a-f]{64}$/.test(x.sha256)||
     !Number.isSafeInteger(x.bytes)||x.bytes<0)bad('BAD_OBJECT');
  const k=x.bucket+'/'+x.path;
  if(seen.has(k))bad('DUPLICATE');seen.add(k);
 }
 return [...expected].sort((a,b)=>(a.bucket+'/'+a.path).localeCompare(b.bucket+'/'+b.path));
}
async function checkedStat(path){
 let s;try{s=await lstat(path)}catch{bad('OBJECT_MISSING')}
 if(s.isSymbolicLink())bad('SYMLINK');
 return s;
}
export async function verifyRecoveredMediaBytes({root,expected}){
 if(typeof root!=='string'||!isAbsolute(root))bad('ROOT');
 const r=await checkedStat(root);
 if(!r.isDirectory())bad('ROOT_NOT_DIRECTORY');
 const objects=validate(expected);
 let total=0;
 for(const x of objects){
  const parts=[x.bucket,...x.path.split('/')];
  let current=root;
  for(let i=0;i<parts.length;i++){
   current=join(current,parts[i]);
   const s=await checkedStat(current);
   if(i===parts.length-1){
    if(!s.isFile()||s.size!==x.bytes)bad('SIZE_OR_TYPE');
   }else if(!s.isDirectory())bad('PARENT_NOT_DIRECTORY');
  }
  let actualBytes=0;
  const h=createHash('sha256');
  try{
   for await(const buf of createReadStream(current)){
    actualBytes+=buf.length;
    if(actualBytes>x.bytes)bad('SIZE_CHANGED_DURING_READ');
    h.update(buf);
   }
  }catch(e){
   if(e?.message?.startsWith('T070_MEDIA_HOLD_'))throw e;
   bad('READ_FAILED');
  }
  if(actualBytes!==x.bytes||h.digest('hex')!==x.sha256)bad('BYTES_MISMATCH');
  total+=actualBytes;
  if(!Number.isSafeInteger(total))bad('TOTAL_OVERFLOW');
 }
 // A receipt is supporting evidence only. Reviewers must independently bind
 // manifest to one trusted DB snapshot, original source hashes and restore run.
 return Object.freeze({scope:'DISCONNECTED_RECOVERED_FILES_ONLY',
  verified_objects:objects.length,verified_bytes:total,
  inventory_sha256:digest(JSON.stringify(objects.map(x=>({
   bucket:x.bucket,path:x.path,sha256:x.sha256,bytes:x.bytes
  })))),final_t070_pass:false});
}
