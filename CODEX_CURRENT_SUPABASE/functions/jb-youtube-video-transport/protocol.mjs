/* P4-T079: server-only Google YouTube resumable upload protocol, no public effect.
 * NOT deployed / NOT integrated until a durable unique DB ledger, media provenance,
 * Owner E6 consent, and rollback review are independently proved.
 * Functions return states but never mark "Posted" or modify a JANTA BOL article.
 * All requests must be made server-side with a Google short-lived access token.
 */
const START="https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet%2Cstatus";
const STATUS="https://www.googleapis.com/youtube/v3/videos";
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const URL_PREFIX=/^https:\/\/(?:www\.googleapis\.com|upload\.youtube\.com)\//;
const MAX=50*1024*1024;
function fail(code){const e=new Error(code);e.code=code;throw e}
function mediaDescriptor(input){
 if(!input||typeof input!=="object"||Array.isArray(input))fail("MEDIA_DESCRIPTOR_INVALID");
 const {byteLength,mime,sha256,sourceBucket,sourcePath,ownerApproved,rightsVerified}=input;
 if(!Number.isSafeInteger(byteLength)||byteLength<1||byteLength>MAX)fail("MEDIA_SIZE_UNSUPPORTED");
 if(mime!=="video/mp4")fail("MEDIA_MIME_UNSUPPORTED");
 if(typeof sha256!=="string"||!/^[a-f0-9]{64}$/i.test(sha256))fail("MEDIA_HASH_UNVERIFIED");
 if(sourceBucket!=="private-editorial")fail("MEDIA_SOURCE_DENIED");
 if(typeof sourcePath!=="string"||!/^youtube-news\/[a-f0-9-]{36}\/[a-zA-Z0-9_-]+\.mp4$/.test(sourcePath))fail("MEDIA_PATH_UNVERIFIED");
 if(ownerApproved!==true||rightsVerified!==true)fail("FOUNDER_MEDIA_APPROVAL_DUE");
 return Object.freeze({byteLength,mime,sha256:sha256.toLowerCase(),sourceBucket,sourcePath});
}
function reserveGate(l){
 if(!l||typeof l!=="object"||Array.isArray(l))fail("LEDGER_REQUIRED");
 if(l.provider!=="youtube"||l.status!=="RESERVED"||l.durable!==true||l.exclusive_lease!==true)fail("LEDGER_NOT_RESERVED");
 if(l.unknown_outcome===true||l.provider_video_id)fail("DUPLICATE_OR_UNKNOWN_DENIED");
 if(typeof l.idempotency_key!=="string"||!(/^[a-f0-9]{64}$/).test(l.idempotency_key))fail("LEDGER_KEY_MISSING");
 return true;
}
function metadata(input){
 if(!input||typeof input!=="object"||Array.isArray(input))fail("VIDEO_METADATA_INVALID");
 const {title,description,madeForKids,approved,privacy}=input;
 if(approved!==true||privacy!=="private"||typeof madeForKids!=="boolean")fail("FOUNDER_VIDEO_APPROVAL_DUE");
 if(typeof title!=="string"||!title.trim()||title.length>100)fail("VIDEO_TITLE_INVALID");
 if(typeof description!=="string"||description.length>5000)fail("VIDEO_DESCRIPTION_INVALID");
 return {snippet:{title:title.trim(),description,categoryId:"25"},
         status:{privacyStatus:"private",selfDeclaredMadeForKids:madeForKids}};
}
function validateSessionUrl(uri){
 if(typeof uri!=="string"||uri.length>2048||!URL_PREFIX.test(uri))fail("UPLOAD_SESSION_ORIGIN_DENIED");
 const url=new URL(uri);
 if(url.protocol!=="https:"||url.username||url.password||url.hash||url.port)fail("UPLOAD_SESSION_ORIGIN_DENIED");
 return url.href;
}
function resumeRange(status,range,total){
 if(!Number.isSafeInteger(total)||total<1||total>MAX)fail("MEDIA_SIZE_UNSUPPORTED");
 if(status===308){
  if(!range)return {state:"INCOMPLETE",nextByte:0};
  const m=/^bytes=0-(\d+)$/.exec(range);
  if(!m)fail("UPLOAD_RANGE_INVALID");
  const next=Number(m[1])+1;
  if(!Number.isSafeInteger(next)||next<1||next>total)fail("UPLOAD_RANGE_INVALID");
  return {state:"INCOMPLETE",nextByte:next};
 }
 if([500,502,503,504,429].includes(status))return {state:"UNKNOWN_RECONCILE_ONLY"};
 if(status===404||status===410)return {state:"EXPIRED_SESSION_HOLD"};
 if(status===401||status===403)return {state:"AUTH_OR_PROVIDER_PERMISSION_HOLD"};
 if(status>=400)return {state:"FAILED_NO_AUTO_RETRY"};
 fail("UPLOAD_RESPONSE_NOT_HANDLED");
}
async function initiate({fetcher,accessToken,ledger,media,info}){
 if(typeof fetcher!=="function"||typeof accessToken!=="string"||accessToken.length<10)fail("SERVER_AUTH_REQUIRED");
 reserveGate(ledger);const source=mediaDescriptor(media);
 const video=metadata(info);
 // Do not retry this create-session POST on ambiguous/network error; a unique
 // durable reservation MUST be retained and reconciled before any new attempt.
 let response;
 try { response=await fetcher(START,{method:"POST",redirect:"manual",
   headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json; charset=UTF-8",
    "X-Upload-Content-Length":String(source.byteLength),"X-Upload-Content-Type":source.mime},
   body:JSON.stringify(video),signal:AbortSignal.timeout(15000)});}
 catch {return Object.freeze({state:"UNKNOWN_RECONCILE_ONLY"});}
 if(!response||response.status!==200){
  return Object.freeze({state:[500,502,503,504,429].includes(response?.status)?"UNKNOWN_RECONCILE_ONLY":"FAILED_NO_AUTO_RETRY"});
 }
 const uri=response.headers.get("location");
 if(!uri)return Object.freeze({state:"UNKNOWN_RECONCILE_ONLY"});
 try{return Object.freeze({state:"SESSION_OPEN",sessionUrl:validateSessionUrl(uri),nextByte:0});}
 catch{return Object.freeze({state:"UNKNOWN_RECONCILE_ONLY"});}
}
async function querySession({fetcher,accessToken,sessionUrl,totalBytes}){
 if(typeof fetcher!=="function"||typeof accessToken!=="string"||accessToken.length<10)fail("SERVER_AUTH_REQUIRED");
 const valid=validateSessionUrl(sessionUrl);
 if(!Number.isSafeInteger(totalBytes)||totalBytes<1||totalBytes>MAX)fail("MEDIA_SIZE_UNSUPPORTED");
 let response;
 try {response=await fetcher(valid,{method:"PUT",redirect:"manual",
  headers:{Authorization:`Bearer ${accessToken}`,"Content-Length":"0",
   "Content-Range":`bytes */${totalBytes}`},signal:AbortSignal.timeout(15000)})}
 catch{return Object.freeze({state:"UNKNOWN_RECONCILE_ONLY"})}
 if(response.status===200||response.status===201){
  const obj=await response.json().catch(()=>null);
  if(!obj||!VIDEO_ID.test(obj.id||""))return Object.freeze({state:"RECEIPT_UNVERIFIED_HOLD"});
  return Object.freeze({state:"UPLOAD_RESPONSE_PENDING_CHANNEL_VERIFY",videoId:obj.id});
 }
 return Object.freeze(resumeRange(response.status,response.headers?.get("range"),totalBytes));
}
async function uploadChunk({fetcher,accessToken,sessionUrl,totalBytes,startByte,bytes}){
 if(typeof fetcher!=="function"||typeof accessToken!=="string"||accessToken.length<10)fail("SERVER_AUTH_REQUIRED");
 const valid=validateSessionUrl(sessionUrl);
 if(!Number.isSafeInteger(totalBytes)||totalBytes<1||totalBytes>MAX)fail("MEDIA_SIZE_UNSUPPORTED");
 if(!Number.isSafeInteger(startByte)||startByte<0||startByte>=totalBytes)fail("UPLOAD_RANGE_INVALID");
 if(!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>4*1024*1024)fail("UPLOAD_CHUNK_INVALID");
 const end=startByte+bytes.length-1;
 if(end>=totalBytes) {
  if(end!==totalBytes-1)fail("UPLOAD_RANGE_INVALID");
 }else if(bytes.length%(256*1024)!==0)fail("UPLOAD_CHUNK_ALIGN_INVALID");
 let response;
 try{response=await fetcher(valid,{method:"PUT",redirect:"manual",
  headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"video/mp4",
   "Content-Length":String(bytes.length),"Content-Range":`bytes ${startByte}-${end}/${totalBytes}`},
  body:bytes,signal:AbortSignal.timeout(20000)});
 }catch{return Object.freeze({state:"UNKNOWN_RECONCILE_ONLY"})}
 if(response.status===200||response.status===201){
  const data=await response.json().catch(()=>null);
  if(!data||!VIDEO_ID.test(data.id||""))return Object.freeze({state:"RECEIPT_UNVERIFIED_HOLD"});
  return Object.freeze({state:"UPLOAD_RESPONSE_PENDING_CHANNEL_VERIFY",videoId:data.id});
 }
 return Object.freeze(resumeRange(response.status,response.headers?.get("range"),totalBytes));
}
async function verifyPrivateVideo({fetcher,accessToken,videoId,expectedChannelId}){
 if(typeof fetcher!=="function"||typeof accessToken!=="string"||accessToken.length<10)fail("SERVER_AUTH_REQUIRED");
 if(!VIDEO_ID.test(videoId||"")||!/^UC[A-Za-z0-9_-]{22}$/.test(expectedChannelId||""))fail("VIDEO_OR_CHANNEL_INVALID");
 const url=STATUS+"?part=snippet%2Cstatus&id="+encodeURIComponent(videoId);
 let response;
 try {response=await fetcher(url,{method:"GET",redirect:"manual",
  headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(15000)});}
 catch{return Object.freeze({state:"UNKNOWN_VERIFY_RETRY_SAME_VIDEO_ID"})}
 if(response.status!==200)return Object.freeze({state:"UNKNOWN_VERIFY_RETRY_SAME_VIDEO_ID"});
 const body=await response.json().catch(()=>null),item=body?.items?.[0];
 if(item?.id!==videoId||item?.snippet?.channelId!==expectedChannelId)return Object.freeze({state:"WRONG_CHANNEL_HOLD"});
 if(item?.status?.privacyStatus!=="private")return Object.freeze({state:"NOT_PRIVATE_HOLD"});
 return Object.freeze({state:"PRIVATE_VIDEO_VERIFIED",videoId,channelMatch:true,posted:false});
}
export {mediaDescriptor,reserveGate,metadata,validateSessionUrl,resumeRange,initiate,querySession,uploadChunk,verifyPrivateVideo};
