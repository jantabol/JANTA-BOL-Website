import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startPrivateUpload,resumeOneChunk}
 from '../../../CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/worker.mjs';

const articleId='00000000-0000-4000-8000-000000000001';
const channelId='UC'+'A'.repeat(22);
const providerVideoId='abcDEF123_-';
const session='https://www.googleapis.com/upload/youtube/v3/videos?upload_id=mock-session';
const cipherKey=crypto.randomBytes(32);
const b64=b=>Buffer.from(b).toString('base64');
const makeResponse=(status,body,headers={})=>({
 status,headers:new Headers(headers),json:async()=>body
});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const workerSource=readFileSync(path.join(root,'CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/worker.mjs'),'utf8');
function harness({size=100,wrongChannel=false,postNetworkError=false,
 chunkNetworkError=false,privateVideo=true,loadMutated=false,
 reservationPersistenceError=false,mediaChangedOnResume=false,stopPostResponse=false}={}){
 const content=new Uint8Array(Buffer.alloc(size,0x42));
 const digest=sha(content);
 const media={
  byteLength:size,mime:'video/mp4',sha256:digest,
  sourceBucket:'private-editorial',sourcePath:`youtube-news/${articleId}/original.mp4`,
  ownerApproved:true,rightsVerified:true
 };
 const intent={
  articleId,articleStatus:'published',articleDeleted:false,articleVersion:7,
  channelId,channelMatch:true,oauthConnected:true,refreshVerified:true,
  controlAuthOk:true,credentialIncidentClear:true,
  globalEnabled:true,perNewsEnabled:true,youtubeSelected:true,providerMode:'API',
  founderApprovalHash:'a'.repeat(64),rightsProofHash:'b'.repeat(64),
  media,video:{title:'JANTA BOL test video',description:'Owned original',privacy:'private',madeForKids:false,approved:true}
 };
 let row=null,uploaded=0,postCount=0,putCount=0,verifyCount=0,encryptedStored=false,readCount=0;
 const ledger={
  reserve:async params=>{
   if(row)return {created:false,jobId:row.jobId,state:row.state};
   row={jobId:'00000000-0000-4000-8000-000000000002',state:'RESERVED',
    articleId:params.articleId,articleVersion:params.articleVersion,channelId:params.channelId,
    mediaSha256:params.mediaSha256,sourceBucket:params.sourceBucket,sourcePath:params.sourcePath,
    mediaSizeBytes:params.mediaSizeBytes,attemptCount:0,leaseId:null,
    providerVideoId:null,sessionCiphertext:null,sessionIvB64:null};
   return {created:true,jobId:row.jobId,state:'RESERVED',durable:true,idempotencyKey:params.idempotencyKey};
  },
  begin:async({jobId,leaseId})=>{
   if(!row||row.jobId!==jobId||row.state!=='RESERVED'||row.attemptCount!==0)return false;
   row.state='INITIATING';row.leaseId=leaseId;row.attemptCount=1;return true;
  },
  get:async({jobId})=>row?.jobId===jobId?{...row}:null,
  transition:async({jobId,leaseId,from,to,sessionCiphertext,sessionIvB64,videoId})=>{
   if(reservationPersistenceError&&from==='INITIATING'&&to==='SESSION_OPEN')return false;
   if(!row||row.jobId!==jobId||row.leaseId!==leaseId||row.state!==from)return false;
   const legal={
    INITIATING:['SESSION_OPEN','UNKNOWN'],
    SESSION_OPEN:['UPLOADING','UNKNOWN','RECEIPT_PENDING'],
    UPLOADING:['SESSION_OPEN','UNKNOWN','RECEIPT_PENDING'],
    UNKNOWN:['RECEIPT_PENDING'],
    RECEIPT_PENDING:['PRIVATE_VERIFIED']
   };
   if(!legal[from]?.includes(to))return false;
   if(to==='SESSION_OPEN'&&from==='INITIATING'){
    if(!sessionCiphertext||!sessionIvB64) return false;
    row.sessionCiphertext=sessionCiphertext;row.sessionIvB64=sessionIvB64;encryptedStored=true;
   }
   if(to==='RECEIPT_PENDING'){
    if(typeof videoId!=='string'||videoId.length!==11)return false;
    row.providerVideoId=videoId;
   }
   row.state=to;return true;
  }
 };
 const ports={
  authorize:async({articleId:target})=>({owner:true,aal:'aal2',sessionActive:true,articleId:target,channelMatch:true}),
  loadApprovedIntent:async({articleId:target})=>target===articleId?intent:null,
  readPrivateOriginal:async({bucket,path})=>{
   readCount++;
   assert.equal(bucket,'private-editorial');assert.equal(path,intent.media.sourcePath);
   if(loadMutated||(mediaChangedOnResume&&readCount>1))
    return Uint8Array.from(content,x=>(x+1)%256);
   return new Uint8Array(content);
  },
  getAccessToken:async()=> 'server_only_mock_google_access_token',
  sealSession:async({sessionUrl,jobId})=>{
   assert.equal(sessionUrl,session);assert.equal(jobId,'00000000-0000-4000-8000-000000000002');
   const iv=crypto.randomBytes(12);
   const cipher=crypto.createCipheriv('aes-256-gcm',cipherKey,iv);
   const encrypted=Buffer.concat([cipher.update(sessionUrl,'utf8'),cipher.final()]);
   return {ciphertext:b64(Buffer.concat([encrypted,cipher.getAuthTag()])),ivB64:b64(iv)};
  },
  openSession:async({ciphertext,ivB64,jobId})=>{
   assert.equal(jobId,row.jobId);
   const binary=Buffer.from(ciphertext,'base64'),iv=Buffer.from(ivB64,'base64');
   const tag=binary.subarray(binary.length-16);
   const decipher=crypto.createDecipheriv('aes-256-gcm',cipherKey,iv);
   decipher.setAuthTag(tag);
   return Buffer.concat([decipher.update(binary.subarray(0,-16)),decipher.final()]).toString('utf8');
  },
  fetchGoogle:async(uri,options)=>{
   if(options.method==='POST'){
    assert.match(uri,/^https:\/\/www.googleapis.com\/upload\/youtube/);
    assert.equal(options.redirect,'manual');
    postCount++;
    if(postNetworkError)throw Error('network');
    if(stopPostResponse)return makeResponse(503,{error:'simulation'});
    return makeResponse(200,{}, {location:session});
   }
   if(options.method==='GET'){
    assert.match(uri,/^https:\/\/www.googleapis.com\/youtube\/v3\/videos\?/);
    verifyCount++;
    return makeResponse(200,{items:[{id:providerVideoId,
     snippet:{channelId:wrongChannel?'UC'+'B'.repeat(22):channelId},
     status:{privacyStatus:privateVideo?'private':'public'}}]});
   }
   assert.equal(options.method,'PUT');
   assert.equal(uri,session);
   putCount++;
   if(options.headers['Content-Range'].startsWith('bytes */')){
    if(uploaded===size)return makeResponse(201,{id:providerVideoId});
    if(uploaded===0)return makeResponse(308,{}, {});
    return makeResponse(308,{}, {range:`bytes=0-${uploaded-1}`});
   }
   if(chunkNetworkError)throw Error('offline');
   const [start,end,total]=options.headers['Content-Range'].match(/\d+/g).map(Number);
   assert.equal(start,uploaded);
   assert.equal(end-start+1,options.body.length);
   assert.equal(total,size);
   uploaded+=options.body.length;
   if(uploaded===size)return makeResponse(201,{id:providerVideoId});
   return makeResponse(308,{}, {range:`bytes=0-${uploaded-1}`});
  },
  ledger
 };
 return {ports,intent,ledger,content,get row(){return row},get counters(){return {postCount,putCount,verifyCount,uploaded,encryptedStored,readCount}}};
}
test('actual offline orchestration: one private uploaded, matching channel, never public/Posted',async()=>{
 const h=harness();
 const started=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal(started.state,'SESSION_OPEN');assert.equal(started.posted,false);
 assert.equal(h.row.attemptCount,1);
 assert.equal(h.counters.postCount,1);assert.equal(h.counters.putCount,0);
 assert.equal(h.counters.encryptedStored,true);
 assert.notEqual(h.row.sessionCiphertext,session);
 assert.equal(h.row.state,'SESSION_OPEN');
 const finished=await resumeOneChunk({ports:h.ports,jobId:started.jobId});
 assert.equal(finished.state,'PRIVATE_VERIFIED');
 assert.equal(finished.privacy,'private');assert.equal(finished.posted,false);
 assert.equal(finished.providerVideoId,providerVideoId);
 assert.equal(h.row.state,'PRIVATE_VERIFIED');assert.equal(h.counters.verifyCount,1);
 assert.equal(h.counters.postCount,1);
 assert.equal(h.counters.uploaded,100);
 const again=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal(again.state,'DUPLICATE_OR_EXISTING_JOB_HOLD');assert.equal(h.counters.postCount,1);
});
test('4MiB first part + unaligned final part resumes exact same session, no reinitiation',async()=>{
 const h=harness({size:4*1024*1024+123});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'CHUNK_ACKNOWLEDGED');
 assert.equal(h.row.state,'SESSION_OPEN');
 assert.equal(h.counters.uploaded,4*1024*1024);
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'PRIVATE_VERIFIED');
 assert.equal(h.counters.postCount,1);assert.equal(h.counters.uploaded,4*1024*1024+123);
});
test('no Google request if original storage content hash differs',async()=>{
 const h=harness({loadMutated:true});
 await assert.rejects(startPrivateUpload({ports:h.ports,articleId}),{code:'MEDIA_SHA256_MISMATCH'});
 assert.equal(h.counters.postCount,0);assert.equal(h.row,null);
});
test('no Google request if Founder AAL2/session or approval/per-article API is absent',async()=>{
 const cases=['badAuth','wrongChannel','wrongRights','globalOff','notPublished','wrongBucket'];
 for(const kind of cases){
  const h=harness();
  if(kind==='badAuth')h.ports.authorize=async()=>({owner:true,aal:'aal1',sessionActive:true,articleId,channelMatch:true});
  if(kind==='wrongChannel')h.intent.channelMatch=false;
  if(kind==='wrongRights')h.intent.rightsProofHash='';
  if(kind==='globalOff')h.intent.globalEnabled=false;
  if(kind==='notPublished')h.intent.articleStatus='draft';
  if(kind==='wrongBucket')h.intent.media.sourceBucket='grievance-private';
  await assert.rejects(startPrivateUpload({ports:h.ports,articleId}));
  assert.equal(h.counters.postCount,0,'Google must not run for '+kind);
 }
});
test('uncertain Google initiate quarantined; duplicate call cannot create another session',async()=>{
 const h=harness({postNetworkError:true});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal(s.state,'GOOGLE_INITIATION_UNKNOWN_HOLD');
 assert.equal(h.row.state,'UNKNOWN');
 assert.equal(h.row.attemptCount,1);
 assert.equal((await startPrivateUpload({ports:h.ports,articleId})).state,'DUPLICATE_OR_EXISTING_JOB_HOLD');
 assert.equal(h.counters.postCount,1);
});
test('failed durable session save stops before video bytes, no repeat create',async()=>{
 const h=harness({reservationPersistenceError:true});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal(s.state,'SESSION_PERSIST_UNKNOWN_HOLD');
 assert.equal(h.counters.putCount,0);
 assert.equal((await startPrivateUpload({ports:h.ports,articleId})).state,'DUPLICATE_OR_EXISTING_JOB_HOLD');
 assert.equal(h.counters.postCount,1);
});
test('chunk transport network failure sets UNKNOWN and no automatic byte retry',async()=>{
 const h=harness({chunkNetworkError:true});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'CHUNK_UNKNOWN_QUARANTINED');
 assert.equal(h.row.state,'UNKNOWN');
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'UNKNOWN_RECONCILIATION_REQUIRED');
 assert.equal(h.counters.postCount,1);
 assert.equal(h.counters.uploaded,0);
});
test('if original video changes after reservation no chunk leaves server',async()=>{
 const h=harness({mediaChangedOnResume:true});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 await assert.rejects(resumeOneChunk({ports:h.ports,jobId:s.jobId}),{code:'MEDIA_SHA256_MISMATCH'});
 assert.equal(h.counters.postCount,1);
 assert.equal(h.counters.uploaded,0);
});
test('wrong YouTube provider channel always stays RECEIPT_PENDING; never Posted',async()=>{
 const h=harness({wrongChannel:true});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'RECEIPT_VERIFICATION_HOLD');
 assert.equal(h.row.state,'RECEIPT_PENDING');assert.equal(h.counters.verifyCount,1);
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'RECEIPT_VERIFICATION_HOLD');
 assert.equal(h.counters.postCount,1);
});
test('public response is rejected even when video ID and channel match',async()=>{
 const h=harness({privateVideo:false});
 const s=await startPrivateUpload({ports:h.ports,articleId});
 assert.equal((await resumeOneChunk({ports:h.ports,jobId:s.jobId})).state,'RECEIPT_VERIFICATION_HOLD');
 assert.equal(h.row.state,'RECEIPT_PENDING');assert.equal(h.counters.postCount,1);
});
test('unsafe server job row, lease, owner, and metadata cannot resume upload',async()=>{
 const h=harness();
 const s=await startPrivateUpload({ports:h.ports,articleId});
 h.row.channelId='UC'+'Z'.repeat(22);
 await assert.rejects(resumeOneChunk({ports:h.ports,jobId:s.jobId}),{code:'LEDGER_FROZEN_INTENT_MISMATCH'});
 assert.equal(h.counters.putCount,0);
});
test('review-only source has no Edge entrypoint, cron, stored tokens, service secrets or social Posted',()=>{
 assert.doesNotMatch(workerSource,/Deno\.serve|setInterval\(|setTimeout\(|cron\.schedule|console\.log|\.from\("social_distribution"\)|posted:true|public_video_created:true/);
 assert.doesNotMatch(workerSource,/service_role|refresh_token|GOOGLE_CLIENT_SECRET|credentials\.txt/);
 assert.match(workerSource,/readAndVerify/);
 assert.match(workerSource,/SHA-256/);
 assert.match(workerSource,/DUPLICATE_OR_EXISTING_JOB_HOLD/);
 assert.match(workerSource,/UNKNOWN_RECONCILIATION_REQUIRED/);
 assert.match(workerSource,/privateVideo/);
});
