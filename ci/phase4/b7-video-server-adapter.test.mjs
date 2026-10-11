import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {promisify} from 'node:util';
import {processB7IsolatedVideoCandidate} from
 '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-video-server-adapter.mjs';
const exec=promisify(execFile);
const owner='11111111-1111-4111-8111-111111111111';
const creative='22222222-2222-4222-8222-222222222222';
const campaign='33333333-3333-4333-8333-333333333333';
const policy={maxSourceBytes:8388608,maxDerivedBytes:8388608,
 maxPosterBytes:2097152,maxDurationSeconds:3,maxDecodedPixels:2073600};
async function original(){
 const d=await mkdtemp(join(tmpdir(),'b7-video-bridge-'));
 try{
  const f=join(d,'short.mp4');
  await exec('ffmpeg',['-hide_banner','-loglevel','error','-y',
   '-f','lavfi','-i','testsrc2=size=400x230:rate=8','-t','0.6',
   '-c:v','libx264','-preset','ultrafast','-threads','1',f],{timeout:30000});
  return new Uint8Array(await readFile(f));
 }finally{await rm(d,{recursive:true,force:true})}
}
function infra({noOwner=false,noServerRPC=false,badReadback=false}={}){
 const rpc=[],objects=new Map(),events=[],receipts=new Map();
 const storage={
  async getBucket(id){return {data:{id,public:false,file_size_limit:8388608},error:null};},
  from(bucket){return {
   async upload(path,blob,opts){
    assert.equal(opts.upsert,false);
    const key=bucket+'/'+path;
    if(objects.has(key))return {error:{message:'duplicate'}};
    objects.set(key,new Uint8Array(await blob.arrayBuffer()));return {error:null};
   },
   async download(path){
    const d=objects.get(bucket+'/'+path);
    return {error:d?null:'not found',data:d?new Blob([d]):null};
   }
  }}
 };
 const client={
  storage,
  from(table){
   const filt=[];
   const q={
    select(){return q},eq(key,val){filt.push([key,val]);return q},
    order(){return q},limit(){return q},
    async single(){
     if(table==='ad_campaigns')return {data:{status:'requested'},error:null};
     if(filt.some(([key])=>key==='id'))return {
      data:{id:creative,campaign_id:campaign,creative_type:'video',approved:false,version:2},
      error:null
     };
     return {data:{version:2},error:null};
    }
   };return q;
  },
  async rpc(name,args){
   rpc.push(name);
   if(noServerRPC)return {data:null,error:{message:'function not deployed'}};
   if(name==='jb_ad_video_record_receipt_server'){
    receipts.set(args.p.asset_id,{...args.p,approval_state:'private_quarantined'});
    return {data:args.p.asset_id,error:null};
   }
   if(name==='jb_ad_video_read_receipt_server'){
    return {data:badReadback?{asset_id:'forged'}:receipts.get(args.p_asset),error:null};
   }
   if(name==='jb_ad_video_log_orphan_server'){
    events.push(args.p);return {data:true,error:null};
   }
   throw Error('unexpected RPC: '+name);
  }
 };
 return {client,identifyOwner:async t=>!noOwner&&t==='OWNER_AUTH_JWT'?owner:null,
  allocateId:()=> '44444444-4444-4444-8444-444444444444',
  rpc,objects,events,receipts};
}
const input=src=>({token:'OWNER_AUTH_JWT',creativeId:creative,
 source:src,name:'clip.mp4',mime:'video/mp4',policy});
test('Real FFmpeg + canonical Creative + three storage readbacks -> 3 restricted SQL receipts, NO approval',async()=>{
 const server=infra();
 const {status,approved,publishable}=await processB7IsolatedVideoCandidate(
  input(await original()),server);
 assert.equal(status,'PRIVATE_VIDEO_POSTER_EVIDENCE_NOT_APPROVED');
 assert.equal(approved,false);assert.equal(publishable,false);
 assert.equal(server.objects.size,3);
 assert.equal(server.receipts.size,1);
 assert.deepEqual(server.rpc,['jb_ad_video_record_receipt_server',
  'jb_ad_video_read_receipt_server']);
 assert.equal(server.events.length,0);
});
test('Revoked AAL2 and absent server-only RPC never yield a completed video ad',async()=>{
 const sample=await original();
 const denied=infra({noOwner:true});
 await assert.rejects(processB7IsolatedVideoCandidate(input(sample),denied),
 /EXISTING_OWNER_AAL2_REQUIRED/);
 assert.equal(denied.objects.size,0);assert.equal(denied.rpc.length,0);
 const legacy=infra({noServerRPC:true});
 await assert.rejects(processB7IsolatedVideoCandidate(input(sample),legacy),
 /PRIVATE_EVIDENCE_UNVERIFIED/);
 assert.equal(legacy.objects.size,3);assert.equal(legacy.events.length,0,
 'missing orphan backend also fails closed, but real audit must be durable');
 const forged=infra({badReadback:true});
 await assert.rejects(processB7IsolatedVideoCandidate(input(sample),forged),
 /PRIVATE_EVIDENCE_UNVERIFIED/);
 assert.equal(forged.events.length,1);
});
