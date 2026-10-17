/** JANTA BOL B8 G2 CP03 PRIVATE evidence gateway — REVIEW ONLY, NOT DEPLOYED.
 * Requires paired PG review migrations and explicit Founder production release gate.
 * No public asset URLs, no browser direct service_role or Storage client, no paid plan.
 * A media hash validates storage INTEGRITY, NOT documentary truth.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
import {
 processPrivateEvidence,MAX_PRIVATE_UPLOAD_BYTES
} from "../_shared/b8-private-evidence-gateway.mjs";

const baseUrl=Deno.env.get("SUPABASE_URL")??"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const allowed=(Deno.env.get("B8_ALLOWED_ORIGINS")??"")
 .split(",").map(v=>v.trim()).filter(Boolean);
const cors=(origin:string|null)=>{
 const originOK=origin!==null&&allowed.includes(origin);
 return originOK?{
  "Access-Control-Allow-Origin":origin,
  "Vary":"Origin",
  "Access-Control-Allow-Headers":"authorization, x-b8-case-id, x-b8-mime-type, x-b8-file-name, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Max-Age":"300"
 }:{"Vary":"Origin"};
};
function respond(origin:string|null,body:Record<string,unknown>,status=200){
 return new Response(JSON.stringify(body),{status,headers:{
  ...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}});
}
async function boundedBody(req:Request){
 if(!req.body)throw Error("EMPTY_BODY");
 const len=req.headers.get("content-length");
 if(len&&(!/^\d+$/.test(len)||Number(len)>MAX_PRIVATE_UPLOAD_BYTES))throw Error("TOO_LARGE");
 const reader=req.body.getReader();
 const parts:Uint8Array[]=[];
 let total=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>MAX_PRIVATE_UPLOAD_BYTES)throw Error("TOO_LARGE");
   parts.push(value);
  }
 }catch(e){try{await reader.cancel();}catch{}throw e;}
 if(total<8)throw Error("TOO_SMALL");
 const result=new Uint8Array(total);let offset=0;
 for(const part of parts){result.set(part,offset);offset+=part.length;}
 return result;
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin");
 if(origin&&!allowed.includes(origin))
  return respond(origin,{ok:false,error:"ORIGIN_NOT_ALLOWED"},403);
 if(req.method==="OPTIONS")
  return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return respond(origin,{ok:false,error:"METHOD_NOT_ALLOWED"},405);
 if(!baseUrl||!anonKey||!serviceKey)return respond(origin,{ok:false,error:"SERVER_CONFIG_ERROR"},503);
 const auth=req.headers.get("authorization")??"";
 if(!auth.startsWith("Bearer ")||auth.length>8192)
  return respond(origin,{ok:false,error:"AUTH_REQUIRED"},401);
 const token=auth.slice(7);
 const caseId=req.headers.get("x-b8-case-id")??"";
 const label=req.headers.get("x-b8-file-name")??"";
 const mime=req.headers.get("x-b8-mime-type")??"";
 let bytes:Uint8Array;
 try{bytes=await boundedBody(req);}
 catch{return respond(origin,{ok:false,error:"BODY_INVALID_OR_TOO_LARGE"},413);}
 const user=createClient(baseUrl,anonKey,{
  global:{headers:{Authorization:`Bearer ${token}`}},
  auth:{persistSession:false,autoRefreshToken:false}
 });
 const service=createClient(baseUrl,serviceKey,{
  auth:{persistSession:false,autoRefreshToken:false}
 });
 try{
  const output=await processPrivateEvidence({
   token,caseId,label,mime,bytes,
   authenticate:async bearer=>{
    const {data,error}=await user.auth.getUser(bearer);
    if(error||!data?.user)throw Error("AUTH_FAILED");
    return data.user.id;
   },
   prepare:async ({caseId,label,mime,bytes})=>{
    const {data,error}=await user.rpc("jb_b8_g2_reporter_prepare_private_upload",{
     p_case_id:caseId,p_original_label:label,p_mime:mime,p_expected_bytes:bytes
    });
    if(error||typeof data!=="string")throw Error("SCOPED_INTENT_DENIED");
    return data;
   },
   getIntent:async id=>{
    const {data,error}=await service.rpc("jb_b8_g2_server_private_upload_intent",{
     p_intent_id:id
    });
    if(error||!data)throw Error("PRIVATE_INTENT_UNAVAILABLE");
    return data;
   },
   upload:async ({bucket,key,bytes,mime,upsert})=>{
    const {error}=await service.storage.from(bucket)
     .upload(key,bytes,{contentType:mime,cacheControl:"0",upsert});
    if(error)throw Error("PRIVATE_STORAGE_WRITE_FAILED");
   },
   readback:async ({bucket,key})=>{
    const {data,error}=await service.storage.from(bucket).download(key);
    if(error||!data)throw Error("PRIVATE_STORAGE_READBACK_FAILED");
    return new Uint8Array(await data.arrayBuffer());
   },
   remove:async ({bucket,key})=>{
    const {error}=await service.storage.from(bucket).remove([key]);
    if(error)throw Error("PRIVATE_STORAGE_REMOVE_FAILED");
   },
   finalize:async ({intentId,sha256,bytes,mime})=>{
    const {data,error}=await service.rpc("jb_b8_g2_server_finalize_private_upload",{
      p_intent_id:intentId,p_sha256:sha256,p_byte_count:bytes,p_mime:mime
    });
    if(error||typeof data!=="string")throw Error("SERVER_RECEIPT_REFUSED");
    return data;
   },
   orphan:async ({intentId,reason})=>{
    const {data,error}=await service.rpc("jb_b8_g2_server_private_orphan_event",{
      p_intent_id:intentId,p_reason:reason
    });
    if(error||data!==true)throw Error("ORPHAN_LEDGER_UNAVAILABLE");
   }
  });
  return respond(origin,output,201);
 }catch{
  // Never echo JWT, provider messages, private key, source, object path or uploaded file.
  return respond(origin,{ok:false,error:"PRIVATE_UPLOAD_REJECTED"},403);
 }
});
