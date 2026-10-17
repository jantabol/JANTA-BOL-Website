import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {processB7CleanReleaseCandidate,b7CleanPublicSupabaseStore} from
 '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-clean-public-supabase.mjs';
const owner='11111111-1111-4111-8111-111111111111';
const cid='22222222-2222-4222-8222-222222222222';
const campaign='33333333-3333-4333-8333-333333333333';
const asset='44444444-4444-4444-8444-444444444444';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture({wrongBucket=false,missingRpc=false,noOwner=false,publicHashDrift=false}={}){
 const bytes=new Uint8Array(64).fill(0x58),h=hash(bytes);
 const stored=new Map([['jb-ad-previews-private/staged/'+asset+'/'+h+'.png',bytes]]);
 const publicCopies=[],rpc=[];
 const receipt={asset_id:asset,creative_id:cid,campaign_id:campaign,
  creative_version:2,owner_user_id:owner,approval_state:'private_quarantined',
  derivative_path:'staged/'+asset+'/'+h+'.png',derivative_sha256:h};
 let release=null;
 const fetcher=async u=>{
  if(String(u).endsWith('/auth/v1/user'))
   return new Response(JSON.stringify({id:owner}),{status:200});
  if(String(u).endsWith('/rest/v1/rpc/jb_ad_creative_workflow_capability_internal'))
   return noOwner?new Response('{}',{status:403}):
    new Response(JSON.stringify('B7_DRAFT_THEN_EXPLICIT_APPROVE_V1'),{status:200});
  throw Error('UNEXPECTED_AUTHORITY_HOST');
 };
 const client={
  storage:{
   async getBucket(id){return {data:{id,public:!wrongBucket,file_size_limit:8388608,
    allowed_mime_types:['image/png','video/mp4']},error:null};},
   from(bucket){return {
    async upload(path,data,opts){
     assert.equal(opts.upsert,false);
     assert.equal(bucket,'jb-ad-clean-public');
     publicCopies.push(bucket+'/'+path);
     stored.set(bucket+'/'+path,new Uint8Array(await data.arrayBuffer()));
     return {error:null};
    },
    async download(path){
     const x=stored.get(bucket+'/'+path);
     const d=publicHashDrift&&bucket==='jb-ad-clean-public'?new Uint8Array(45):x;
     return {data:d?new Blob([d]):null,error:d?null:'missing'};
    }
   }}
  },
  from(table){
   const conditions=[];
   const q={select(){return q},eq(k,v){conditions.push([k,v]);return q},
    order(){return q},limit(){return q},
    async single(){
     if(table==='ad_campaigns')return {data:{status:'requested'},error:null};
     if(conditions.some(([k])=>k==='id'))return {data:{
      id:cid,campaign_id:campaign,creative_type:'image',approved:false,version:2},error:null};
     return {data:{version:2},error:null};
    }};
   return q;
  },
  async rpc(name,args){
   rpc.push(name);
   if(missingRpc)return {data:null,error:'not deployed'};
   if(name==='jb_ad_media_read_receipt_server')return {data:receipt,error:null};
   if(name==='jb_ad_clean_record_release_server'){
    release={...args.p};return {data:args.p.asset_id,error:null};
   }
   if(name==='jb_ad_clean_read_release_server')
    return {data:{...release},error:null};
   if(name==='jb_ad_clean_orphan_release_server')
    return {data:true,error:null};
   return {data:null,error:'unknown'};
  }
 };
 return {
  env:{client,fetcher,supabaseUrl:'https://vrffsnkycvjithwtiylt.supabase.co',
   anonKey:'PUBLIC_ANON_TEST'},
  input:{token:'T'.repeat(80),creativeId:cid,assetId:asset,approvalIntent:{
    action:'B7_EXPLICIT_MEDIA_RELEASE_V1',creativeId:cid,assetId:asset,version:2}},
  stored,publicCopies,rpc,get release(){return release;}
 };
}
test('Canonical Owner Auth+AAL2 -> private SHA -> PUBLIC sanitized PNG -> immutable service RPC, still not approved',async()=>{
 const f=fixture(),x=await processB7CleanReleaseCandidate(f.input,f.env);
 assert.equal(x.approved,false);assert.equal(x.publishable,false);
 assert.equal(f.publicCopies.length,1);
 assert(f.publicCopies[0].startsWith('jb-ad-clean-public/creative/'+cid));
 assert.equal(f.release.approval_state,'awaiting_atomic_owner_approval');
 assert.deepEqual(f.rpc,['jb_ad_media_read_receipt_server',
  'jb_ad_clean_record_release_server','jb_ad_clean_read_release_server']);
 assert(!JSON.stringify(x).includes('publicUrl'));
});
test('No Owner AAL2 or missing private ledger means no clean media publish candidate',async()=>{
 for(const opts of [{noOwner:true},{missingRpc:true},{wrongBucket:true}]){
  const f=fixture(opts);
  await assert.rejects(processB7CleanReleaseCandidate(f.input,f.env),/B7_/);
  assert.equal(f.publicCopies.length,0);
 }
});
test('Hash mismatch from PUBLIC Storage cannot claim success and requires durable forensic event',async()=>{
 const f=fixture({publicHashDrift:true});
 await assert.rejects(processB7CleanReleaseCandidate(f.input,f.env),/PUBLIC_RELEASE_NOT_VERIFIED/);
 assert.equal(f.publicCopies.length,1);
 assert.equal(f.rpc.at(-1),'jb_ad_clean_orphan_release_server');
});
test('Storage adapter refuses shared article/grievance/unknown and PUBLIC buckets with wrong privacy',async()=>{
 const f=fixture();
 const api=b7CleanPublicSupabaseStore(f.env.client);
 assert.equal(await api.checkPublicBucket('public-media'),false);
 assert.equal(await api.putPublicCreateOnly('grievance-private','../foo',new Uint8Array(50),'image/png'),false);
 assert.equal(await api.putPublicCreateOnly('jb-ad-clean-public','../foo',
  new Uint8Array(50),'image/png'),false);
 const changed=fixture({wrongBucket:true});
 assert.equal(await b7CleanPublicSupabaseStore(changed.env.client)
  .checkPublicBucket('jb-ad-clean-public'),false);
});
