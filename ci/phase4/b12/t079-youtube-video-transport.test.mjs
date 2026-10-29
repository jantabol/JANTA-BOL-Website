import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {mediaDescriptor,reserveGate,metadata,validateSessionUrl,resumeRange,initiate,querySession,uploadChunk,verifyPrivateVideo} from '../../../CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-transport/protocol.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const src=readFileSync(path.join(root,'CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-transport/protocol.mjs'),'utf8');
const media={byteLength:1024*1024,mime:'video/mp4',sha256:'a'.repeat(64),sourceBucket:'private-editorial',
 sourcePath:'youtube-news/00000000-0000-4000-8000-000000000001/clip_01.mp4',ownerApproved:true,rightsVerified:true};
const ledger={provider:'youtube',status:'RESERVED',durable:true,exclusive_lease:true,unknown_outcome:false,idempotency_key:'b'.repeat(64)};
const info={title:'Verified News Video — Founder reviewed',description:'JANTA BOL owned test video',madeForKids:false,approved:true,privacy:'private'};
const token='server_only_fake_token_fixture_012345';
const session='https://www.googleapis.com/upload/youtube/v3/videos?upload_id=fake-unit-session';
const videoId='abcDEF123_-';
const channelId='UC'+'A'.repeat(22);
const makeResponse=(status,data,headers={})=>({status,headers:new Headers(headers),json:async()=>data});
test('real object and Founder/rights/pinned private media metadata required',()=>{
 assert.equal(mediaDescriptor(media).sourceBucket,'private-editorial');
 for(const bad of [
 {...media,sourceBucket:'grievance-private'}, {...media,sourceBucket:'public-media'},
 {...media,sourcePath:'https://169.254.169.254/any.mp4'}, {...media,sourcePath:'../../clip.mp4'},
 {...media,mime:'video/webm'}, {...media,sha256:'fake'}, {...media,byteLength:51*1024*1024},
 {...media,ownerApproved:false},{...media,rightsVerified:false}
 ])assert.throws(()=>mediaDescriptor(bad));
});
test('unique ledger and unknown/duplicate attempts fail before Google',()=>{
 assert.equal(reserveGate(ledger),true);
 for(const invalid of [
  {...ledger,durable:false},{...ledger,exclusive_lease:false},{...ledger,status:'UPLOADING'},
  {...ledger,unknown_outcome:true},{...ledger,provider_video_id:videoId},{...ledger,idempotency_key:'bad'}
 ])assert.throws(()=>reserveGate(invalid));
});
test('private only metadata, explicit kids selection and Founder approval',()=>{
 assert.equal(metadata(info).status.privacyStatus,'private');
 assert.equal(metadata(info).status.selfDeclaredMadeForKids,false);
 for(const invalid of [{...info,privacy:'public'},{...info,privacy:'unlisted'},{...info,approved:false},
 {...info,madeForKids:undefined},{...info,title:''},{...info,title:'x'.repeat(101)}])assert.throws(()=>metadata(invalid));
});
test('session URL host and origin cannot be SSRF or redirect',()=>{
 assert.equal(validateSessionUrl(session),session);
 for(const uri of ['http://www.googleapis.com/upload/youtube/v3/videos','https://evil.com/upload',
 'https://www.googleapis.com.evil.com/upload','https://user:pass@www.googleapis.com/upload',
 'https://www.googleapis.com:8443/upload','https://www.googleapis.com/upload#secret',
 'https://169.254.169.254/upload','javascript:fetch'])assert.throws(()=>validateSessionUrl(uri));
});
test('Google create-session request explicitly PRIVATE; no duplicate on network ambiguity',async()=>{
 let calls=0,request;
 const fetcher=async(url,options)=>{calls++;request={url,options};return makeResponse(200,{}, {location:session})};
 const out=await initiate({fetcher,accessToken:token,ledger,media,info});
 assert.equal(out.state,'SESSION_OPEN');assert.equal(out.sessionUrl,session);
 assert.equal(calls,1);assert.equal(request.options.method,'POST');
 assert.equal(request.options.redirect,'manual');
 const payload=JSON.parse(request.options.body);
 assert.equal(payload.status.privacyStatus,'private');
 assert.equal(request.options.headers['X-Upload-Content-Length'],String(media.byteLength));
 calls=0;
 await assert.rejects(initiate({fetcher,accessToken:token,ledger:{...ledger,unknown_outcome:true},media,info}));
 assert.equal(calls,0);
 const ambiguous=await initiate({fetcher:async()=>{throw Error('timeout')},accessToken:token,ledger,media,info});
 assert.equal(ambiguous.state,'UNKNOWN_RECONCILE_ONLY');
});
test('session 308 range advances exactly, 5xx quarantines, expired session HOLD',()=>{
 assert.deepEqual(resumeRange(308,'bytes=0-262143',1048576),{state:'INCOMPLETE',nextByte:262144});
 assert.deepEqual(resumeRange(308,null,1048576),{state:'INCOMPLETE',nextByte:0});
 assert.equal(resumeRange(503,null,1048576).state,'UNKNOWN_RECONCILE_ONLY');
 assert.equal(resumeRange(404,null,1048576).state,'EXPIRED_SESSION_HOLD');
 assert.throws(()=>resumeRange(308,'bytes=99-500',1048576));
});
test('status query has no body, same session, never initiates another upload',async()=>{
 let seen;
 const fetcher=async(url,options)=>{seen={url,options};return makeResponse(308,{}, {'range':'bytes=0-262143'})};
 const result=await querySession({fetcher,accessToken:token,sessionUrl:session,totalBytes:1048576});
 assert.equal(result.nextByte,262144);
 assert.equal(seen.url,session);
 assert.equal(seen.options.headers['Content-Range'],'bytes */1048576');
 assert.equal(seen.options.headers['Content-Length'],'0');
});
test('chunk alignment/range, 308 and ambiguous failure never triggers automatic retry',async()=>{
 let calls=0,seen;
 const fetcher=async(url,options)=>{calls++;seen=options;return makeResponse(308,{}, {'range':'bytes=0-262143'})};
 const one=await uploadChunk({fetcher,accessToken:token,sessionUrl:session,totalBytes:1048576,startByte:0,bytes:new Uint8Array(262144)});
 assert.equal(one.nextByte,262144);assert.equal(calls,1);
 assert.equal(seen.headers['Content-Range'],'bytes 0-262143/1048576');
 await assert.rejects(uploadChunk({fetcher,accessToken:token,sessionUrl:session,totalBytes:1048576,startByte:262144,bytes:new Uint8Array(13)}));
 assert.equal(calls,1);
 const unknown=await uploadChunk({fetcher:async()=>{throw Error('network')},accessToken:token,sessionUrl:session,totalBytes:100,startByte:0,bytes:new Uint8Array(100)});
 assert.equal(unknown.state,'UNKNOWN_RECONCILE_ONLY');
});
test('private video ID receipt is not Posted until Google video ID belongs to same channel',async()=>{
 const partial=await uploadChunk({fetcher:async()=>makeResponse(201,{id:videoId}),accessToken:token,sessionUrl:session,totalBytes:100,startByte:0,bytes:new Uint8Array(100)});
 assert.equal(partial.state,'UPLOAD_RESPONSE_PENDING_CHANNEL_VERIFY');
 const good=await verifyPrivateVideo({fetcher:async()=>makeResponse(200,{items:[{id:videoId,snippet:{channelId},status:{privacyStatus:'private'}}]}),accessToken:token,videoId,expectedChannelId:channelId});
 assert.equal(good.state,'PRIVATE_VIDEO_VERIFIED');
 assert.equal(good.posted,false);
 const wrong=await verifyPrivateVideo({fetcher:async()=>makeResponse(200,{items:[{id:videoId,snippet:{channelId:'UC'+'B'.repeat(22)},status:{privacyStatus:'private'}}]}),accessToken:token,videoId,expectedChannelId:channelId});
 assert.equal(wrong.state,'WRONG_CHANNEL_HOLD');
 const publicCase=await verifyPrivateVideo({fetcher:async()=>makeResponse(200,{items:[{id:videoId,snippet:{channelId},status:{privacyStatus:'public'}}]}),accessToken:token,videoId,expectedChannelId:channelId});
 assert.equal(publicCase.state,'NOT_PRIVATE_HOLD');
});
test('transport remains review-only and cannot leak token or become successful social Posted',()=>{
 assert.doesNotMatch(src,/console\.(log|warn|error)|service_role|social_distribution|grievance-private.*fetch|setTimeout\(|setInterval\(/);
 assert.doesNotMatch(src,/privacyStatus:"public"|privacyStatus:"unlisted"|posted:true/);
 const report=readFileSync(path.join(root,'JANTA_BOL_PHASE_4_WORKING/b12/P4_T079_YOUTUBE_VIDEO_DISTRIBUTION_BACKEND_20261029.md'),'utf8');
 assert.ok(report.includes('NO ACTUAL UPLOAD'));
});
