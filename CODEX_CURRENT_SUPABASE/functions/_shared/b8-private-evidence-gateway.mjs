/**
 * B8 G2 CP03 — PRIVATE server-side evidence ingress (REVIEW ONLY, NOT DEPLOYED).
 * Do NOT pass service keys or storage client to browsers. The caller supplies:
 * authenticated scoped USER RPC for intent, and distinct privileged SERVER RPC/storage.
 * Byte-integrity != authenticity of documentary/source assertions.
 */
const MAX=8_388_608;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const fail=code=>{throw Error('B8_PRIVATE_UPLOAD_'+code)};
const digest=async bytes=>{
 const b=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
};
const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const validMimes=Object.freeze(['image/png','image/jpeg','image/webp','application/pdf']);
export function detectMime(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<8)return null;
 if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&
    bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a)
  return 'image/png';
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff) return 'image/jpeg';
 if(bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46&&
    bytes[8]===0x57&&bytes[9]===0x45&&bytes[10]===0x42&&bytes[11]===0x50)
  return 'image/webp';
 if(bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46&&
    bytes[4]===0x2d) return 'application/pdf';
 return null;
}
export const MAX_PRIVATE_UPLOAD_BYTES=MAX;
export async function processPrivateEvidence({
 token,caseId,label,mime,bytes,authenticate,prepare,getIntent,
 upload,readback,remove,finalize,orphan
}){
 if(typeof token!=='string'||token.length<20)fail('AUTH_REQUIRED');
 if(!UUID.test(caseId))fail('CASE_ID_INVALID');
 if(typeof label!=='string'||label.trim().length<5||label.trim().length>120)fail('LABEL_INVALID');
 if(!validMimes.includes(mime))fail('MIME_DENIED');
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<8||bytes.byteLength>MAX)
   fail('FILE_SIZE_DENIED');
 if(detectMime(bytes)!==mime)fail('MAGIC_MISMATCH');
 for(const f of [authenticate,prepare,getIntent,upload,readback,remove,finalize,orphan]){
  if(typeof f!=='function')fail('SERVER_ADAPTER_REQUIRED');
 }
 const userId=await authenticate(token); // must verify actual Supabase user/token on SERVER
 if(!UUID.test(userId))fail('AUTH_REQUIRED');
 // Authenticated user RPC checks assigned active reporter, JWT session and quotas.
 const intentId=await prepare({token,caseId,label:label.trim(),mime,bytes:bytes.byteLength});
 if(!UUID.test(intentId))fail('SCOPED_INTENT_REQUIRED');
 const intent=await getIntent(intentId); // separate service-role RPC, never browser
 if(!intent||intent.intent_id!==intentId||intent.case_id!==caseId||
    intent.reporter_user_id!==userId||intent.mime!==mime||
    intent.byte_count!==bytes.byteLength||
    intent.object_key!==`b8/cases/${caseId}/${intentId}.bin`) fail('INTENT_BOUNDARY');
 const wantedHash=await digest(bytes);
 let uploaded=false;
 try{
  await upload({bucket:'private-editorial',key:intent.object_key,bytes,mime,upsert:false});
  uploaded=true;
  const stored=await readback({bucket:'private-editorial',key:intent.object_key});
  if(!(stored instanceof Uint8Array)||!equal(bytes,stored)||
     await digest(stored)!==wantedHash) fail('PRIVATE_READBACK_FAILED');
  // Service RPC atomically verifies this intent is still pending and Reporter active.
  const receiptId=await finalize({
   intentId,sha256:wantedHash,bytes:bytes.byteLength,mime
  });
  if(!UUID.test(receiptId))fail('FINALIZE_REJECTED');
  return Object.freeze({
   ok:true,receiptId,byteCount:bytes.byteLength,
   proof:'PRIVATE_READBACK_SHA256_ONLY',documentaryAuthenticityVerified:false
  });
 }catch(e){
  if(uploaded){
   const reason=String(e?.message??'').includes('READBACK')
     ?'PRIVATE_READBACK_FAILED':'FINALIZE_REJECTED';
   try{await remove({bucket:'private-editorial',key:intent.object_key});}
   catch {
    try{await orphan({intentId,reason:'CLEANUP_FAILED'});}catch{}
    fail('CLEANUP_FAILED_REQUIRE_OWNER_RECONCILIATION');
   }
   // Even a successfully cleaned failed upload is recorded as failed attempt.
   try{await orphan({intentId,reason});}catch{}
  }
  // Do not leak provider body, object path, actor phone or secret in errors.
  fail('SAFE_PRIVATE_INGRESS_FAILED');
 }
}
