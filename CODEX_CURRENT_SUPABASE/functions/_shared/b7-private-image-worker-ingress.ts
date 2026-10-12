/**
 * B7 ADS-015 — private, INTERNAL-ONLY image ingest boundary.
 * REVIEW ONLY. No Deno.serve / public route / production deployment.
 *
 * Only an isolated worker holding a privileged server client may inject
 * executeImageJob = processB7PrivateImageJob. A separate command gateway
 * must authenticate the internal dispatch (verifyInternalCommand) BEFORE
 * any untrusted multipart bytes are read. This module has no service key.
 * The existing canonical worker re-verifies LIVE Owner + AAL2, latest
 * Creative/version, private buckets, SHA readback and immutable receipt.
 *
 * This is NOT a durable queue or approval endpoint. Production use remains
 * blocked on the durable command queue, deployment E7 and real E3/E5.
 */
export const B7_IMAGE_INGRESS_BODY_CAP=8*1024*1024+16*1024;
const IMAGE_CAP=8*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type VerifiedPrivateReceipt={
 assetId:string;creativeId:string;version:number;state:string;
 approved:boolean;publishable:boolean;
};
type InternalImageDeps={
 verifyInternalCommand:(request:Request)=>Promise<boolean>;
 executeImageJob:(input:{
  token:string;creativeId:string;bytes:Uint8Array;name:string;mime:string;
 })=>Promise<VerifiedPrivateReceipt>;
};
const headers={'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'"};
function denied(code:string,status:number){
 return new Response(JSON.stringify({ok:false,error:code}),{status,headers});
}
async function readExactBoundedBody(req:Request,cap:number){
 const stream=req.body;
 if(!stream)throw Error('BODY_ABSENT');
 const reader=stream.getReader(),parts:Uint8Array[]=[];let total=0;
 try{
  while(true){
   const chunk=await reader.read();
   if(chunk.done)break;
   if(!(chunk.value instanceof Uint8Array))throw Error('BODY_TYPE');
   total+=chunk.value.length;
   if(total>cap){await reader.cancel().catch(()=>{});throw Error('BODY_TOO_LARGE');}
   parts.push(chunk.value);
  }
 }finally{reader.releaseLock();}
 if(total<1)throw Error('BODY_EMPTY');
 const buf=new ArrayBuffer(total),dest=new Uint8Array(buf);let p=0;
 for(const chunk of parts){dest.set(chunk,p);p+=chunk.length;}
 return buf;
}
export async function handleB7InternalImageIngest(req:Request,dep:InternalImageDeps){
 if(req.method!=='POST')return denied('METHOD_NOT_ALLOWED',405);
 if(typeof dep?.verifyInternalCommand!=='function'||
    typeof dep?.executeImageJob!=='function')
  return denied('INTERNAL_WORKER_NOT_CONFIGURED',503);
 // The internal gateway attestation is separate from the USER Owner token.
 // Never rely on CORS or Owner JWT alone to expose a privileged worker.
 let internal=false;
 try{internal=(await dep.verifyInternalCommand(req))===true;}catch{}
 if(!internal)return denied('INTERNAL_COMMAND_DENIED',403);
 const bearer=/^Bearer ([A-Za-z0-9._-]{40,8000})$/.exec(
  req.headers.get('authorization')||'');
 if(!bearer)return denied('OWNER_AUTH_REQUIRED',401);
 const len=req.headers.get('content-length')||'';
 if(!/^[1-9][0-9]*$/.test(len)||!Number.isSafeInteger(Number(len)))
  return denied('CONTENT_LENGTH_REQUIRED',411);
 if(Number(len)>B7_IMAGE_INGRESS_BODY_CAP)return denied('PAYLOAD_TOO_LARGE',413);
 const type=req.headers.get('content-type')||'';
 if(!/^multipart\/form-data;\s*boundary=[A-Za-z0-9_-]{1,70}$/i.test(type))
  return denied('INVALID_MULTIPART',415);
 let raw:ArrayBuffer;
 try{raw=await readExactBoundedBody(req,B7_IMAGE_INGRESS_BODY_CAP);}
 catch{return denied('INVALID_OR_OVERSIZED_BODY',413);}
 if(raw.byteLength!==Number(len))return denied('BODY_LENGTH_MISMATCH',400);
 let entries:Array<[string,FormDataEntryValue]>;
 try{
  const form=await new Request('https://internal.invalid/',{
   method:'POST',headers:{'content-type':type},body:raw}).formData();
  entries=[...form.entries()];
 }catch{return denied('MALFORMED_MULTIPART',400);}
 if(entries.length!==2||
    entries.filter(([key])=>key==='creative_id').length!==1||
    entries.filter(([key])=>key==='file').length!==1)
  return denied('EXACT_CREATIVE_AND_FILE_REQUIRED',400);
 const id=entries.find(([key])=>key==='creative_id')?.[1];
 const file=entries.find(([key])=>key==='file')?.[1];
 if(typeof id!=='string'||!UUID.test(id)||!(file instanceof File)||
    file.size<16||file.size>IMAGE_CAP)
  return denied('INVALID_CREATIVE_OR_FILE',422);
 const allowed:{[key:string]:string[]}={
  'image/png':['png'],'image/jpeg':['jpg','jpeg'],'image/webp':['webp']
 };
 const ext=file.name.toLowerCase().split('.').pop()||'';
 if(!allowed[file.type]?.includes(ext))
  return denied('UNSUPPORTED_MEDIA',415);
 let receipt:VerifiedPrivateReceipt;
 try{
  receipt=await dep.executeImageJob({token:bearer[1],creativeId:id,
   bytes:new Uint8Array(await file.arrayBuffer()),name:file.name,mime:file.type});
 }catch{return denied('PRIVATE_INGEST_FAILED',422);}
 // A successful submission is PRIVATE receipt only; never advertise that
 // Media Studio approval, LIVE feed, queue or publication has occurred.
 if(!receipt||receipt.state!=='VERIFIED_PRIVATE_EVIDENCE_ONLY'||
    receipt.approved!==false||receipt.publishable!==false||
    receipt.creativeId!==id||!UUID.test(receipt.assetId)||
    !Number.isSafeInteger(receipt.version)||receipt.version<1)
  return denied('UNVERIFIED_PRIVATE_RECEIPT',502);
 return new Response(JSON.stringify({
  ok:true,asset_id:receipt.assetId,creative_id:receipt.creativeId,
  creative_version:receipt.version,state:'PRIVATE_QUARANTINED',
  approved:false,publishable:false
 }),{status:200,headers});
}
