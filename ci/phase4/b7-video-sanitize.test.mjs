import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {sanitizeB7PrivateVideo,validateB7VideoCandidatePolicy}
 from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-video-sanitize.mjs';
const run=promisify(execFile);
const quota={maxSourceBytes:5*1024*1024,maxDerivedBytes:5*1024*1024,
 maxPosterBytes:2*1024*1024,maxDurationSeconds:6,maxDecodedPixels:1920*1080};
const fixture=async()=> {
 const dir=await mkdtemp(join(tmpdir(),'jb-video-ci-'));const f=join(dir,'input.mp4');
 try{
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y',
   '-f','lavfi','-i','testsrc2=size=720x400:rate=12',
   '-f','lavfi','-i','sine=frequency=520:sample_rate=44100',
   '-t','1','-metadata','comment=GPS SECRET private coordinates',
   '-metadata','location=+18.52+73.85/',
   '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',
   '-threads','1','-c:a','aac','-b:a','64k',f],{timeout:30000});
  return new Uint8Array(await readFile(f));
 }finally{await rm(dir,{recursive:true,force:true})}
};
test('ACTUAL ffmpeg input MP4 H264/AAC -> stripped MP4 H264/AAC + real PNG poster (private only)',async()=>{
 const original=await fixture();
 const output=await sanitizeB7PrivateVideo({
  source:original,name:'field-ad.mp4',mime:'video/mp4',policy:quota});
 assert.equal(output.status,'PRIVATE_VIDEO_AND_POSTER_NOT_STORED_NOT_APPROVED');
 assert.equal(output.canApprove,false);assert.equal(output.canPublish,false);
 assert.equal(output.original.codec,'h264');
 assert.equal(output.original.audioCodec,'aac');
 assert.equal(output.derived.codec,'h264');
 assert.equal(output.derived.audioCodec,'aac');
 assert.equal(output.derived.width,720);
 assert.equal(output.derived.height,400);
 assert.equal(output.derived.width,720);assert.equal(output.derived.height,400);
 assert(output.privateCleanMp4.length>1024);
 assert.deepEqual(Array.from(output.privatePosterPng.subarray(0,8)),
  [137,80,78,71,13,10,26,10]);
 assert.equal(output.sourceSha256.length,64);
 assert.equal(output.videoSha256.length,64);
 assert.equal(output.posterSha256.length,64);
 assert(!JSON.stringify({...output,privateCleanMp4:undefined,privatePosterPng:undefined}).includes('publicUrl'));
});
test('Malicious unsupported MIME, MOV and impossible policy fail before executing decoder',async()=>{
 const genuine=await fixture();
 for(const modified of [
  {source:genuine,name:'ad.mov',mime:'video/quicktime',policy:quota},
  {source:genuine,name:'ad.mp4',mime:'image/png',policy:quota},
  {source:Uint8Array.from({length:1500},()=>1),name:'ad.mp4',mime:'video/mp4',policy:quota},
  {source:genuine,name:'ad.mp4',mime:'video/mp4',policy:{...quota,maxSourceBytes:1024}},
 ]){
  await assert.rejects(sanitizeB7PrivateVideo(modified),/B7_VIDEO_/);
 }
 assert.throws(()=>validateB7VideoCandidatePolicy({
  ...quota,maxSourceBytes:999999999}),/CAPACITY_POLICY_NOT_APPROVED/);
});
test('Truncated signed MP4 header is not a video and fails closed',async()=>{
 const fake=Uint8Array.from({length:2000},()=>0);
 fake.set([102,116,121,112],4);
 await assert.rejects(sanitizeB7PrivateVideo({
  source:fake,name:'fake.mp4',mime:'video/mp4',policy:quota
 }),/B7_VIDEO_CODEC_TOOL_FAILED|B7_VIDEO_UNVERIFIED_MP4_STREAM/);
});
