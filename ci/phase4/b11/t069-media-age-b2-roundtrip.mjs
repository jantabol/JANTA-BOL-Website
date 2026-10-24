// JANTA BOL B11 T069 — offsite encrypted media bundle (development only).
// Inputs must come from an independently verified Founder AAL2 gateway.
// No B2 secret, service key, JWT, original media, or decryption key in logs.
export const PROJECT='vrffsnkycvjithwtiylt';
export const BUCKETS=Object.freeze(['grievance-private','private-editorial','public-media']);
const MAX_ITEMS=48,MAX_EACH=24*1024*1024,MAX_TOTAL=48*1024*1024;
const MAGIC=new TextEncoder().encode('JBT06901');
const te=new TextEncoder(),td=new TextDecoder('utf-8',{fatal:true});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hex=a=>[...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const hash=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
const reject=()=>{throw Error('T069_FAIL_CLOSED')};
function checkDescriptor(d){
 if(!d||!BUCKETS.includes(d.bucket)||typeof d.path!=='string'||d.path.length>600||
 !d.path||d.path.startsWith('/')||d.path.endsWith('/')||
 /[\u0000-\u001f\\]/.test(d.path)||d.path.split('/').some(x=>!x||x==='.'||x==='..')||
 !UUID.test(d.id)||typeof d.updated_at!=='string'||
 !Number.isFinite(Date.parse(d.updated_at))||!Number.isSafeInteger(d.size)||
 d.size<0||d.size>MAX_EACH)reject();
 return {bucket:d.bucket,path:d.path,id:d.id,updated_at:d.updated_at,size:d.size};
}
function sortedDescriptors(items){
 if(!Array.isArray(items)||items.length<3||items.length>MAX_ITEMS)reject();
 const out=items.map(checkDescriptor).sort((a,b)=>
 (a.bucket+'/'+a.path).localeCompare(b.bucket+'/'+b.path,'en'));
 if(BUCKETS.some(b=>!out.some(x=>x.bucket===b)))reject();
 for(let i=1;i<out.length;i++)if(out[i].bucket===out[i-1].bucket&&
 out[i].path===out[i-1].path)reject();
 if(out.reduce((n,d)=>n+d.size,0)>MAX_TOTAL)reject();
 return out;
}
function toBytes(x){
 if(x instanceof Uint8Array)return x;
 if(x instanceof ArrayBuffer)return new Uint8Array(x);
 reject();
}
function encode(entries){
 const positions=[];let cursor=0;
 for(const entry of entries){positions.push({...entry.descriptor,
  sha256:entry.sha256,offset:cursor,length:entry.bytes.length});cursor+=entry.bytes.length}
 const header=te.encode(JSON.stringify({format:'JB-T069-V1',project:PROJECT,
  atomic_database_snapshot:false,objects:positions}));
 if(header.length>50000||cursor>MAX_TOTAL)reject();
 const data=new Uint8Array(MAGIC.length+4+header.length+cursor);
 data.set(MAGIC,0);new DataView(data.buffer).setUint32(8,header.length,false);
 data.set(header,12);let n=12+header.length;
 for(const entry of entries){data.set(entry.bytes,n);n+=entry.bytes.length}
 return data;
}
export async function verifyBundle(bytes,expected){
 const raw=toBytes(bytes);
 if(raw.length<12||!same(raw.subarray(0,8),MAGIC))reject();
 const len=new DataView(raw.buffer,raw.byteOffset,raw.byteLength).getUint32(8,false);
 if(!len||len>50000||12+len>raw.length)reject();
 let data;try{data=JSON.parse(td.decode(raw.subarray(12,12+len)))}catch{reject()}
 if(data?.format!=='JB-T069-V1'||data?.project!==PROJECT||
 data.atomic_database_snapshot!==false||
 !Array.isArray(data.objects)||data.objects.length!==expected.length)reject();
 let cursor=0;const base=12+len;
 for(let i=0;i<data.objects.length;i++){
  const o=data.objects[i],e=expected[i];
  const d=checkDescriptor(o);
  if(JSON.stringify(d)!==JSON.stringify(e.descriptor)||o.offset!==cursor||
   o.length!==e.bytes.length||!Number.isSafeInteger(o.length)||
   typeof o.sha256!=='string'||o.sha256!==e.sha256)reject();
  const segment=raw.subarray(base+cursor,base+cursor+o.length);
  if(segment.length!==o.length||await hash(segment)!==o.sha256)reject();
  cursor+=o.length;
 }
 if(base+cursor!==raw.length)reject();
 return {objects:data.objects.length,bytes:cursor,archive_sha256:await hash(raw)};
}
export async function encryptedB2MediaRoundTrip({authorizeFounder,inventory,readOriginal,age,b2,founderRecipient,now=()=>new Date(),uuid=()=>crypto.randomUUID()}){
 if(typeof authorizeFounder!=='function'||typeof inventory!=='function'||typeof readOriginal!=='function'||
 !age||typeof age.generateIdentity!=='function'||
 typeof b2?.put!=='function'||typeof b2?.get!=='function'||
 !/^age1[0-9ac-hj-np-z]{30,150}$/.test(founderRecipient||''))reject();
 if(await authorizeFounder()!==true)reject();
 // Two independent inventory reads: don't silently skip files.
 const first=sortedDescriptors(await inventory());
 const entries=[];
 for(const descriptor of first){
  const bytes=toBytes(await readOriginal({...descriptor}));
  if(bytes.length!==descriptor.size||bytes.length>MAX_EACH)reject();
  entries.push({descriptor,bytes,sha256:await hash(bytes)});
 }
 const last=sortedDescriptors(await inventory());
 if(JSON.stringify(first)!==JSON.stringify(last))reject();
 if(await authorizeFounder()!==true)reject(); // expired/revoked Owner AAL2 gate before B2 write
 const plain=encode(entries);
 const ephemeral=await age.generateIdentity();
 const ephemeralRecipient=await age.identityToRecipient(ephemeral);
 const encryptor=new age.Encrypter();
 encryptor.addRecipient(founderRecipient);
 encryptor.addRecipient(ephemeralRecipient);
 const cipher=toBytes(await encryptor.encrypt(plain));
 if(cipher.length<plain.length||cipher.length>MAX_TOTAL+100000)reject();
 const stamp=now();
 if(!(stamp instanceof Date)||!Number.isFinite(stamp.getTime()))reject();
 const run=uuid();
 if(!UUID.test(run))reject();
 const key='production/media/'+stamp.toISOString().replace(/[:.]/g,'-')+'/'+run+'.jbt069.age';
 // Immutable name per run; the B2 adapter must use isolated bucket/prefix,
 // reject overwrite and cannot perform deletion. Never accepts caller URL.
 await b2.put(key,cipher);
 const remote=toBytes(await b2.get(key));
 if(!same(remote,cipher)||await hash(remote)!==await hash(cipher))reject();
 const decryptor=new age.Decrypter();
 decryptor.addIdentity(ephemeral);
 const roundtrip=toBytes(await decryptor.decrypt(remote));
 if(!same(roundtrip,plain))reject();
 const verified=await verifyBundle(roundtrip,entries);
 return Object.freeze({status:'OFFSITE_ENCRYPTED_ORIGINAL_BYTES_RESTORED',
  objects:verified.objects,media_bytes:verified.bytes,
  archive_sha256:verified.archive_sha256,cipher_sha256:await hash(remote),
  ciphertext_bytes:remote.length,b2_object_key:key,
  origin:'JANTA_BOL_ONLY',atomic_db_snapshot:false});
}
