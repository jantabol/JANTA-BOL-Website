import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createOwnerAndIntentPorts,createLedgerPorts,createSealedSessionPorts}
 from '../../../CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/trusted-adapters.mjs';
const articleId='00000000-0000-4000-8000-000000000001';
const channelId='UC'+'A'.repeat(22),sessionId='00000000-0000-4000-8000-000000000010';
const userId='00000000-0000-4000-8000-000000000011';
const jobId='00000000-0000-4000-8000-000000000012';
const encoder=new TextEncoder();
const payload={sub:userId,aal:'aal2',session_id:sessionId};
const jwt=(p)=>'header.'+Buffer.from(JSON.stringify(p)).toString('base64url')+'.test-signature';
const media={byteLength:100,mime:'video/mp4',sha256:'a'.repeat(64),
 sourceBucket:'private-editorial',sourcePath:`youtube-news/${articleId}/original.mp4`,
 ownerApproved:true,rightsVerified:true};
const proof={serverVerified:true,articleId,articleVersion:4,channelId,
 founderApprovalHash:'b'.repeat(64),rightsProofHash:'c'.repeat(64),media,
 video:{title:'Founder approved private video',description:'Rights attested',madeForKids:false,
 approved:true,privacy:'private'}};
function mock({allow=true,proofOk=true,status='published',youtube=true,aal='aal2',
 sessionActive=true,oauthOk=true,storageOk=true,readErr=false,
 roles='owner',outboundToken=true,untrustedProof=false}={}){
 let calls=[],reads=0,tokenRequests=0;const token=jwt({...payload,aal});
 let issuerCalls=0;
 const results={
  articles:{data:{id:articleId,version:4,status,deleted_at:null},error:null},
  social_settings:{data:{global_enabled:true},error:null},
  social_distribution:{data:{enabled:true,youtube,provider_mode:'API'},error:null},
  youtube_integration:{data:{connection_state:oauthOk?'CONNECTED':'REAUTH_REQUIRED',
   control_auth_state:'OK',credential_incident_state:'CLEAR',
   expected_channel_id:channelId,verified_channel_id:channelId,last_refresh_status:'OK',
   granted_scopes:['https://www.googleapis.com/auth/youtube.force-ssl']},error:null}
 };
 const service={
  from(table){
   if(!(table in results))throw Error('Unexpected table '+table);
   const obj={
    select:()=>obj,eq:()=>obj,maybeSingle:async()=>{reads++;return results[table];}
   };return obj;
  },
  rpc:async(name,args)=>{
   calls.push({name,args});
   if(name==='jb_live_actor_context_internal')
    return {data:{session_active:sessionActive,app_role:roles},error:null};
   throw Error('Unexpected RPC '+name)
  },
  storage:{
   from(bucket){
    assert.equal(bucket,'private-editorial');
    return {download:async(path)=>{
     assert.equal(path,media.sourcePath);
     return storageOk?{data:{arrayBuffer:async()=>encoder.encode('yes').buffer},error:null}
      :{data:null,error:{message:'hidden'}};
    }};
   }
  }
 };
 const userClient={auth:{getUser:async(t)=>{
  tokenRequests++;
  return allow&&t===token?{data:{user:{id:userId}},error:null}:{data:null,error:{message:'no'}};
 }}};
 const approvals={lookup:async()=>proofOk?({...proof,serverVerified:!untrustedProof}):null};
 const credentialIssuer=async()=>{issuerCalls++;return outboundToken?
  {channelVerified:true,scopeVerified:true,accessToken:'mock_token_server_only_123456'}:
  {channelVerified:false,accessToken:'bad'}};
 return {
  cfg:{service,userClient,jwt:token,expectedChannelId:channelId,approvals,credentialIssuer},
  calls,results,readCount:()=>reads,tokenCount:()=>tokenRequests,
  issuerCount:()=>issuerCalls
 };
}
test('authorizer requires actual verified getUser with AAL2 and server active Owner session',async()=>{
 const m=mock();
 const api=createOwnerAndIntentPorts(m.cfg);
 const r=await api.authorize({articleId,requiredRole:'owner',requiredAal:'aal2'});
 assert.deepEqual(r,{owner:true,aal:'aal2',sessionActive:true,articleId,channelMatch:true});
 assert.equal(m.calls[0].name,'jb_live_actor_context_internal');
 assert.equal(m.calls[0].args.p_session_id,sessionId);
 for(const variant of [{allow:false},{aal:'aal1'},{sessionActive:false},{roles:'editor'},{oauthOk:false}]){
  const n=mock(variant);
  await assert.rejects(createOwnerAndIntentPorts(n.cfg).authorize({articleId,requiredRole:'owner',requiredAal:'aal2'}));
 }
});
test('published Article + B4 flags + server-only independently approved media required',async()=>{
 const m=mock();const port=createOwnerAndIntentPorts(m.cfg);
 const value=await port.loadApprovedIntent({articleId});
 assert.equal(value.articleStatus,'published');
 assert.equal(value.founderApprovalHash,proof.founderApprovalHash);
 assert.equal(value.video.privacy,'private');
 assert.equal(m.readCount(),4);
 for(const variant of [{status:'draft'},{youtube:false},{proofOk:false},{untrustedProof:true},{oauthOk:false}]){
  const z=mock(variant);
  await assert.rejects(createOwnerAndIntentPorts(z.cfg).loadApprovedIntent({articleId}));
 }
});
test('storage-only original: never accepts grievance bucket, URL or missing file',async()=>{
 const m=mock();const p=createOwnerAndIntentPorts(m.cfg);
 const data=await p.readPrivateOriginal({bucket:'private-editorial',path:media.sourcePath});
 assert.deepEqual([...data],[121,101,115]);
 await assert.rejects(p.readPrivateOriginal({bucket:'grievance-private',path:media.sourcePath}));
 await assert.rejects(p.readPrivateOriginal({bucket:'private-editorial',path:'https://169.254.169.254/asset.mp4'}));
 const missing=mock({storageOk:false});
 await assert.rejects(createOwnerAndIntentPorts(missing.cfg).readPrivateOriginal({bucket:'private-editorial',path:media.sourcePath}));
});
test('Google access-token receipt must have exact attested channel+scope, no browser return',async()=>{
 const ok=mock();const p=createOwnerAndIntentPorts(ok.cfg);
 assert.equal(await p.getAccessToken(),'mock_token_server_only_123456');
 assert.equal(ok.issuerCount(),1);
 const err=mock({outboundToken:false});
 await assert.rejects(createOwnerAndIntentPorts(err.cfg).getAccessToken());
});
test('sealed Google upload session AES-GCM bound to job UUID, tampering rejected',async()=>{
 const key=new Uint8Array(crypto.randomBytes(32));
 const a=createSealedSessionPorts({keyBytes:key});
 const sessionUrl='https://www.googleapis.com/upload/youtube/v3/videos?upload_id=review_fixture';
 const encrypted=await a.sealSession({sessionUrl,jobId});
 assert.notEqual(encrypted.ciphertext,sessionUrl);
 assert.ok(encrypted.ciphertext.length>30);
 assert.equal(await a.openSession({...encrypted,jobId}),sessionUrl);
 await assert.rejects(a.openSession({...encrypted,jobId:articleId}));
 const bytes=Uint8Array.from(atob(encrypted.ciphertext),x=>x.charCodeAt(0));
 bytes[3]^=255;const mutated=btoa(String.fromCharCode(...bytes));
 await assert.rejects(a.openSession({ciphertext:mutated,ivB64:encrypted.ivB64,jobId}));
 await assert.rejects(a.sealSession({sessionUrl:'https://evil.example/upload',jobId}));
 assert.throws(()=>createSealedSessionPorts({keyBytes:new Uint8Array(16)}));
});
test('ledger adapter maps public service-role-only RPC contract and fails closed',async()=>{
 let calls=[];const service={rpc:async(name,params)=>{
  calls.push({name,params});
  if(name==='jb_t079_video_reserve_internal')return {data:[{out_job_id:jobId,out_state:'RESERVED',out_created:true}],error:null};
  if(name==='jb_t079_video_begin_internal'||name==='jb_t079_video_transition_internal')return {data:true,error:null};
  if(name==='jb_t079_video_get_internal')return {data:{
   job_id:jobId,article_id:articleId,article_version:4,channel_id:channelId,media_sha256:'a'.repeat(64),
   source_bucket:'private-editorial',source_path:media.sourcePath,media_size_bytes:100,
   state:'SESSION_OPEN',attempt_count:1,lease_id:sessionId,provider_video_id:null,
   provider_session_ciphertext:'sealed',provider_session_iv_b64:'validiv'
  },error:null};
 }};
 const api=createLedgerPorts({service});
 const reserve=await api.reserve({articleId,articleVersion:4,channelId,mediaSha256:'a'.repeat(64),
  sourcePath:media.sourcePath,mediaSizeBytes:100,founderApprovalHash:'b'.repeat(64),
  rightsProofHash:'c'.repeat(64),idempotencyKey:'d'.repeat(64)});
 assert.equal(reserve.created,true);
 assert.equal(reserve.jobId,jobId);
 assert.equal(await api.begin({jobId,leaseId:sessionId}),true);
 assert.equal(await api.transition({jobId,leaseId:sessionId,from:'INITIATING',to:'SESSION_OPEN',
  sessionCiphertext:'ciphertext',sessionIvB64:'iv'}),true);
 const row=await api.get({jobId});assert.equal(row.articleVersion,4);assert.equal(row.state,'SESSION_OPEN');
 assert.deepEqual(calls.map(x=>x.name),['jb_t079_video_reserve_internal',
  'jb_t079_video_begin_internal','jb_t079_video_transition_internal','jb_t079_video_get_internal']);
 const noRpc=createLedgerPorts({service:{rpc:async()=>({data:null,error:{code:'DENIED'}})}});
 await assert.rejects(noRpc.get({jobId}),{code:'LEDGER_RPC_NOT_DEPLOYED_OR_DENIED'});
});
