// JANTA BOL B11 T069: strict server-only Supabase source adapter.
// Must be instantiated only inside disabled-by-default Founder-only Edge backend.
// No source key is ever handed to GH CI, Android JS, or a browser response.
import {PROJECT,BUCKETS} from './t069-media-age-b2-roundtrip.mjs';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const MAX=48,MAX_BYTES=24*1024*1024;
const reject=()=>{throw Error('T069_PRIVATE_SOURCE_DENIED')};
function pathOK(s){return typeof s==='string'&&s.length>0&&s.length<=600&&
 !s.startsWith('/')&&!s.endsWith('/')&&!s.includes('\\')&&
 !/[\u0000-\u001f\u007f]/.test(s)&&s.split('/').every(v=>v&&v!=='.'&&v!=='..')}
function info(row){
 const size=row?.metadata?.size;
 if(!row||typeof row.id!=='string'||!UUID.test(row.id)||
 typeof row.updated_at!=='string'||!Number.isFinite(Date.parse(row.updated_at))||
 !Number.isSafeInteger(size)||size<0||size>MAX_BYTES)reject();
 return {id:row.id,updated_at:row.updated_at,size}
}
function sort(items){return items.sort((a,b)=>(a.bucket+'/'+a.path).localeCompare(b.bucket+'/'+b.path,'en'))}
export function createOwnerAAL2Source({authorization,getUserClient,getServiceClient,project=PROJECT}){
 if(project!==PROJECT||typeof authorization!=='string'||
 !/^Bearer [^\s]{10,4090}$/.test(authorization)||
 typeof getUserClient!=='function'||typeof getServiceClient!=='function')reject();
 let verified=false;
 async function authorizeFounder(){
  verified=false;
  try{
   const client=getUserClient(authorization);
   const u=await client.auth.getUser(authorization.slice(7));
   if(u.error||!u.data?.user?.id)return false;
   const r=await client.rpc('jb_owner_list_sessions');
   // Independently inspected live RPC requires private.current_owner_aal2();
   // Owner role + AAL2 + active session; fail closed on exceptions and empty.
   verified=!r.error&&Array.isArray(r.data)&&r.data.length>0;
   return verified;
  }catch{return false}
 }
 function privileged(){
  if(!verified)reject();
  const s=getServiceClient();
  if(!s?.storage?.from)reject();
  return s;
 }
 async function page(s,bucket,prefix,offset){
  const {data,error}=await s.storage.from(bucket).list(prefix,{
   limit:100,offset,sortBy:{column:'name',order:'asc'}});
  if(error||!Array.isArray(data)||data.length>100)reject();
  return data;
 }
 async function inventory(){
  const s=privileged(),all=[];
  for(const bucket of BUCKETS){
   const todo=[''],seen=new Set();let calls=0;
   while(todo.length){
    const prefix=todo.shift();
    if(seen.has(prefix)||seen.size>MAX||prefix.split('/').length>9)reject();
    seen.add(prefix);
    for(let offset=0;;offset+=100){
     if(++calls>MAX*3)reject();
     const rows=await page(s,bucket,prefix,offset);
     for(const row of rows){
      const path=prefix+row?.name;
      if(!pathOK(path))reject();
      if(!row.id){todo.push(path+'/');continue}
      const d=info(row);if(all.length>=MAX)reject();
      all.push({bucket,path,...d});
     }
     if(rows.length<100)break;
    }
   }
  }
  if(BUCKETS.some(b=>!all.some(x=>x.bucket===b)))reject();
  return sort(all);
 }
 async function readOriginal(d){
  const s=privileged();
  if(!d||!BUCKETS.includes(d.bucket)||!pathOK(d.path)||!UUID.test(d.id??''))reject();
  const cut=d.path.lastIndexOf('/'),prefix=cut<0?'':d.path.slice(0,cut+1),name=d.path.slice(cut+1);
  const exact=async()=>{
   const rows=await page(s,d.bucket,prefix,0);
   if(rows.length===100)reject();
   const matches=rows.filter(r=>r.name===name&&r.id===d.id);
   if(matches.length!==1)reject();
   return info(matches[0]);
  };
  const before=await exact();
  if(before.id!==d.id||before.updated_at!==d.updated_at||before.size!==d.size)reject();
  const r=await s.storage.from(d.bucket).download(d.path);
  if(r.error||!r.data||typeof r.data.arrayBuffer!=='function'||r.data.size>MAX_BYTES)reject();
  const bytes=new Uint8Array(await r.data.arrayBuffer());
  if(bytes.length!==before.size)reject();
  const after=await exact();
  if(JSON.stringify(after)!==JSON.stringify(before))reject();
  return bytes;
 }
 return {authorizeFounder,inventory,readOriginal};
}
