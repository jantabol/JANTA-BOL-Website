/**
 * B7 Owner Media Studio preview HTTP boundary — REVIEW ONLY.
 * NO production deployment, storage, creative approval, or public ad feed.
 * The raw body is bounded BEFORE multipart parsing, not by Content-Length alone.
 */
export const MAX_IMAGE_MULTIPART_BYTES=8*1024*1024+16*1024;
type SanitizedPreview={
 status:string;
 canApprove:boolean;
 canPublish:boolean;
 privatePreviewPng:Uint8Array;
};
type PreviewDependencies={
 authorize:(token:string)=>Promise<boolean>;
 convert:(source:Uint8Array,name:string,mime:string)=>Promise<SanitizedPreview>;
};
const deny=(code:string,status:number)=>new Response(JSON.stringify({ok:false,error:code}),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
function safePng(binary:Uint8Array){
 const own=new ArrayBuffer(binary.byteLength);
 new Uint8Array(own).set(binary);
 return new Response(own,{status:200,headers:{
  'Content-Type':'image/png','Content-Disposition':'inline',
  'Cache-Control':'no-store, private','Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'none'",
  'X-JB-Media-State':'PRIVATE_PREVIEW_NOT_STORED_NOT_APPROVED'
 }});
}
async function boundedPayload(req:Request,max:number){
 if(!req.body)throw Error('INVALID_EMPTY_STREAM');
 const rd=req.body.getReader();const parts:Uint8Array[]=[];let total=0;
 try{
  while(true){
   const {done,value}=await rd.read();
   if(done)break;
   if(!(value instanceof Uint8Array))throw Error('INVALID_MULTIPART_BYTES');
   total+=value.length;
   if(total>max){await rd.cancel().catch(()=>{});throw Error('MAX_MULTIPART_BODY_EXCEEDED');}
   parts.push(value);
  }
 }finally{rd.releaseLock();}
 if(total<1)throw Error('INVALID_EMPTY_STREAM');
 const out=new ArrayBuffer(total),dest=new Uint8Array(out);let pos=0;
 for(const part of parts){dest.set(part,pos);pos+=part.length;}
 return out;
}
export async function handlePrivateAdMediaPreview(req:Request,{authorize,convert}:PreviewDependencies){
 if(req.method!=='POST')return deny('METHOD_NOT_ALLOWED',405);
 const auth=req.headers.get('authorization')||'';
 const match=/^Bearer ([A-Za-z0-9._-]{40,8000})$/.exec(auth);
 if(!match)return deny('AUTH_REQUIRED',401);
 // Eligibility before parsing any untrusted bytes: logged-in Owner + AAL2
 // verified by SERVER Auth and canonical Owner capability RPC, not JWT-only.
 let owner=false;
 try{owner=(await authorize(match[1]))===true;}catch(_){owner=false;}
 if(!owner)return deny('OWNER_AAL2_OR_SESSION_REQUIRED',403);
 const n=req.headers.get('content-length');
 const length=n&&/^[1-9][0-9]*$/.test(n)?Number(n):NaN;
 if(!Number.isSafeInteger(length))return deny('CONTENT_LENGTH_REQUIRED',411);
 if(length>MAX_IMAGE_MULTIPART_BYTES)return deny('PAYLOAD_TOO_LARGE',413);
 const type=req.headers.get('content-type')||'';
 if(!/^multipart\/form-data;\s*boundary=[A-Za-z0-9_-]{1,70}$/i.test(type))
  return deny('INVALID_MULTIPART_CONTENT_TYPE',415);
 let raw;
 try{raw=await boundedPayload(req,MAX_IMAGE_MULTIPART_BYTES);}
 catch(_){return deny('INVALID_OR_TOO_LARGE_MULTIPART_BODY',413);}
 let form;
 try{
  form=await new Request('https://internal.invalid/',{method:'POST',
   headers:{'Content-Type':type},body:raw}).formData();
 }catch(_){return deny('MALFORMED_MULTIPART_BODY',400);}
 const entries=[...form.entries()];
 if(entries.length!==1||entries[0][0]!=='file'||!(entries[0][1] instanceof File))
  return deny('EXACT_ONE_MEDIA_FILE_REQUIRED',400);
 const file=entries[0][1];
 if(file.size<16||file.size>8*1024*1024)
  return deny('INVALID_FILE_SIZE',413);
 try{
  const source=new Uint8Array(await file.arrayBuffer());
  const result=await convert(source,file.name,file.type);
  if(!result||result.canPublish!==false||result.canApprove!==false||
     result.status!=='PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED'||
     !(result.privatePreviewPng instanceof Uint8Array)||
     result.privatePreviewPng.length<16||
     result.privatePreviewPng.length>8*1024*1024)
   throw Error('UNVERIFIED_SANITIZER_RECEIPT');
  return safePng(result.privatePreviewPng);
 }catch(_){return deny('MEDIA_SERVER_CHECK_FAILED',422);}
}
