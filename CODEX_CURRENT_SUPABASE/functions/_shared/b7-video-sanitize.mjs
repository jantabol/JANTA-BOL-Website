/**
 * JANTA BOL B7 ADS-011/015 — ISOLATED VIDEO WORKER CANDIDATE.
 * REVIEW ONLY. NOT an Edge Function, browser upload or public URL.
 * Requires isolated private worker with real ffprobe/ffmpeg. No shell.
 * Unsupported MOV/HEVC/AV1, oversized/corrupt/polyglot, excessive
 * duration/pixels and audio codecs other than AAC are DENIED.
 * Source bytes are never published. Sanitized H264/AAC + clean static
 * PNG poster must be reviewed and linked to canonical Creative by Owner.
 * The quota policy is explicit and deployment-dependent (NOT locked).
 */
import {mkdtemp,writeFile,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {crc32} from 'node:zlib';
import {inspectCleanPngContainer} from './b7-media-byte-policy.mjs';
const exec=promisify(execFile);
const LIMIT=50*1024*1024;
const fail=s=>{throw Error('B7_VIDEO_'+s)};
export function validateB7VideoCandidatePolicy(p){
 if(!p||!Number.isInteger(p.maxSourceBytes)||p.maxSourceBytes<1024||
    p.maxSourceBytes>LIMIT||!Number.isInteger(p.maxDerivedBytes)||
    p.maxDerivedBytes<1024||p.maxDerivedBytes>LIMIT||
    !Number.isInteger(p.maxPosterBytes)||p.maxPosterBytes<1024||
    p.maxPosterBytes>8*1024*1024||
    !Number.isFinite(p.maxDurationSeconds)||p.maxDurationSeconds<=0||
    p.maxDurationSeconds>60||!Number.isInteger(p.maxDecodedPixels)||
    p.maxDecodedPixels<4096||p.maxDecodedPixels>16000000)
  fail('CAPACITY_POLICY_NOT_APPROVED');
 return Object.freeze({...p});
}
async function tool(bin,args,timeout=30000){
 try{
  const r=await exec(bin,args,{timeout,maxBuffer:2*1024*1024,
   windowsHide:true,env:{...process.env,LC_ALL:'C'}});
  return r.stdout;
 }catch(_){fail('CODEC_TOOL_FAILED')}
}
async function probe(path){
 const out=await tool('ffprobe',[
 '-v','error','-show_entries',
 'stream=index,codec_type,codec_name,width,height,channels:format=format_name,duration:format_tags',
 '-of','json','-i',path],15000);
 try{return JSON.parse(out)}catch{fail('INVALID_FFPROBE_OUTPUT')}
}
function verifyStreams(info,policy,output=false){
 if(!info||!Array.isArray(info.streams)||
    typeof info.format?.duration!=='string')fail('UNVERIFIED_MP4_STREAM');
 const format=String(info.format.format_name||'').split(',');
 if(!format.includes('mp4'))fail('UNSUPPORTED_CONTAINER');
 const major=String(info.format.tags?.major_brand||'').trim();
 if(!['isom','iso2','iso4','iso5','iso6','mp41','mp42','avc1','M4V'].includes(major))
  fail('UNSUPPORTED_MOV_OR_MP4_BRAND');
 const streams=info.streams;
 const videos=streams.filter(x=>x.codec_type==='video');
 const audios=streams.filter(x=>x.codec_type==='audio');
 if(videos.length!==1||audios.length>1||
    streams.some(x=>!['video','audio'].includes(x.codec_type)))
  fail('AMBIGUOUS_STREAMS');
 const v=videos[0],a=audios[0];
 if(v.codec_name!=='h264'||a&&a.codec_name!=='aac')
  fail('UNSUPPORTED_H264_AAC_CODEC');
 if(!Number.isInteger(v.width)||!Number.isInteger(v.height)||
    v.width<2||v.height<2||v.width*v.height>policy.maxDecodedPixels)
  fail('VIDEO_PIXEL_LIMIT');
 const duration=Number(info.format.duration);
 if(!Number.isFinite(duration)||duration<=0||
    duration>policy.maxDurationSeconds)
  fail('VIDEO_DURATION_LIMIT');
 if(a&&(!Number.isInteger(a.channels)||a.channels<1||a.channels>2))
  fail('AUDIO_CHANNEL_LIMIT');
 if(output&&(v.width>1280||v.height>720))
  fail('DERIVED_VIDEO_DIMENSION_LIMIT');
 return Object.freeze({width:v.width,height:v.height,
  durationSeconds:duration,hasAudio:!!a,codec:'h264',
  audioCodec:a?'aac':'none'});
}
// FFmpeg's PNG encoder inserts pHYs pixel-density ancillary even when
// -map_metadata -1 is used. It is not required for an ad poster. Drop ONLY
// that fully CRC-verified chunk; refuse a duplicate/corrupt chunk. All
// remaining chunks must pass the EXISTING strict clean-PNG policy.
export function stripFfmpegPosterDensity(png){
 if(!(png instanceof Uint8Array)||png.length<33)fail('POSTER_BYTES_INVALID');
 const be=i=>(png[i]*16777216+png[i+1]*65536+png[i+2]*256+png[i+3])>>>0;
 const pieces=[png.subarray(0,8)];
 let pos=8,removed=0,seenIHDR=false,seenIDAT=false;
 while(pos<png.length){
  if(pos+12>png.length)fail('POSTER_PNG_TRUNCATED');
  const n=be(pos),end=pos+12+n;
  if(n>8388608||end>png.length)fail('POSTER_PNG_CHUNK_BOUNDS');
  const type=String.fromCharCode(...png.subarray(pos+4,pos+8));
  if(type==='pHYs'){
   // The sole accepted density chunk must be between IHDR and IDAT.
   // Never scrub trailing/polyglot data after an IEND into apparent safety.
   if(!seenIHDR||seenIDAT||n!==9||removed++)
    fail('POSTER_PNG_DENSITY_INVALID');
   if(crc32(png.subarray(pos+4,pos+8+n))!==be(pos+8+n))
    fail('POSTER_PNG_DENSITY_CRC');
  }else pieces.push(png.subarray(pos,end));
  if(type==='IHDR')seenIHDR=true;
  if(type==='IDAT')seenIDAT=true;
  pos=end;
 }
 // Original non-density chunks, including critical ordering/CRC, still
 // require full validation by inspectCleanPngContainer at call site.
 return Uint8Array.from(Buffer.concat(pieces));
}
const hex=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function sanitizeB7PrivateVideo({
 source,name,mime,policy
}){
 validateB7VideoCandidatePolicy(policy);
 if(!(source instanceof Uint8Array)||source.length<1024||
    source.length>policy.maxSourceBytes||
    !/^[^/\\\0]{1,150}\.mp4$/i.test(String(name||''))||
    mime!=='video/mp4')fail('SOURCE_TYPE_OR_SIZE_INVALID');
 // MP4 initial bytes are NOT sufficient validation; FFprobe MUST parse.
 if(source.length<24||String.fromCharCode(...source.subarray(4,8))!=='ftyp')
  fail('INVALID_MP4_MAGIC');
 const dir=await mkdtemp(join(tmpdir(),'jb-b7-private-video-'));
 const src=join(dir,'input.mp4'),dest=join(dir,'clean.mp4'),
  poster=join(dir,'poster.png');
 try{
  await writeFile(src,source,{mode:0o600,flag:'wx'});
  const inputProof=verifyStreams(await probe(src),policy);
  // Hard-deny untrusted additional streams and codecs before reencode.
  await tool('ffmpeg',['-hide_banner','-loglevel','error',
   '-nostdin','-y','-threads','1','-i',src,
   '-map','0:v:0','-map','0:a:0?','-map_metadata','-1',
   '-map_chapters','-1','-sn','-dn',
   '-vf','scale=w=min(1280\\,iw):h=min(720\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p',
   '-c:v','libx264','-preset','ultrafast','-crf','26',
   '-pix_fmt','yuv420p','-profile:v','main','-level','3.1',
   '-threads','1','-c:a','aac','-ac','2','-b:a','96k',
   '-movflags','+faststart',dest],60000);
  if((await stat(dest)).size>policy.maxDerivedBytes)
   fail('DERIVED_VIDEO_CAPACITY_LIMIT');
  const cleanVideo=await readFile(dest);
  if(cleanVideo.length<1024)fail('EMPTY_ENCODED_VIDEO');
  const derivedProbe=await probe(dest);
  const outputProof=verifyStreams(derivedProbe,policy,true);
  const normalizedTags=JSON.stringify(derivedProbe.format?.tags||{}).toLowerCase();
  if(/location|gps|latitude|longitude|comment|artist|copyright/.test(normalizedTags))
   fail('PRIVACY_METADATA_SURVIVED_TRANSCODE');
  // Poster must be an actual decoded frame, never a user-provided URL.
  await tool('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
   '-y','-threads','1','-i',dest,'-map','0:v:0',
   '-frames:v','1','-vf','scale=w=min(800\\,iw):h=min(800\\,ih):force_original_aspect_ratio=decrease',
   '-map_metadata','-1','-f','image2',poster],30000);
  if((await stat(poster)).size>policy.maxPosterBytes)
   fail('POSTER_CAPACITY_LIMIT');
  const rawPoster=await readFile(poster);
  const cleanPoster=stripFfmpegPosterDensity(rawPoster);
  // A PNG signature alone misses malicious trailing bytes, broken chunk CRC,
  // unknown ancillary metadata (including GPS-like text) and fake dimensions.
  // Reuse the EXISTING private image derivative policy: no new media authority.
  let posterProof;
  try{posterProof=inspectCleanPngContainer(cleanPoster)}
  catch{fail('POSTER_CONTAINER_OR_METADATA_UNVERIFIED')}
  if(posterProof.containsMetadata!==false||posterProof.width<1||
     posterProof.height<1||posterProof.width>800||posterProof.height>800||
     posterProof.width>outputProof.width||posterProof.height>outputProof.height)
    fail('POSTER_DIMENSION_OR_PRIVACY_MISMATCH');
  // NEVER return process stdout, private temp file paths, uploaded object
  // identifiers or approval. They are caller-owned private byte arrays.
  return Object.freeze({
   sourceSha256:hex(source),
   videoSha256:hex(cleanVideo),posterSha256:hex(cleanPoster),
   privateCleanMp4:Uint8Array.from(cleanVideo),
   privatePosterPng:Uint8Array.from(cleanPoster),
   original:inputProof,derived:outputProof,
   status:'PRIVATE_VIDEO_AND_POSTER_NOT_STORED_NOT_APPROVED',
   canApprove:false,canPublish:false,
   remaining:['OWNER_AAL2','PRIVATE_QUARANTINE_STORAGE',
     'IMMUTABLE_VIDEO_AND_POSTER_RECEIPT','OWNER_POSTER_VIDEO_REVIEW']
  });
 }finally{
  await rm(dir,{recursive:true,force:true});
 }
}
