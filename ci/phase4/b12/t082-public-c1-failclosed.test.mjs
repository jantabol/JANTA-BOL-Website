// T082 P4: original public C1 projection security & isolation tests.
// All tests execute real production JS against in-memory mocks. No Supabase
// credentials, real user tokens, production writes or private row uploads.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const src=readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-c1-projection.js','utf8');
const article=readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
const id='f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const draftId='fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14';
const secret='DO_NOT_LEAK_INTERNAL_SOURCE_TOKEN';
const record={
  id,slug:'jb-historic-source',title:'ISRO Testing Evidence',
  excerpt:'safe public excerpt',body:'safe public body',
  status:'published',published_at:'2026-10-28T04:30:02Z',version:15,
  category:'Technology',geography_level:'India',location:'India',
  created_at:'2026-10-28T04:30:02Z',updated_at:'2026-10-31T12:30:00Z',
  cover_image_url:'',additional_media_urls:[],public_attribution:'Public ISRO',
  internal_note:secret,source_url:secret,verification_evidence:secret,
  private_contact:secret,reporter_private_email:secret
};
function harness({rows=[record],error=null,missingData=false}={}){
 const rpcCalls=[];const root={JBBackend:{client:{rpc:async(fn,args)=>{
   rpcCalls.push({fn,args});
   if(error)return {data:null,error};
   if(missingData)return {data:{items:null},error:null};
   return {data:{items:rows},error:null};
 }}}};
 runInNewContext(src,{window:root,console:{log(){},warn(){}},Number,String,Math,Array,RegExp,Object},
  {filename:'public-c1-projection.js',timeout:2500});
 assert(root.JBPublicC1,'production public projection loaded');
 return {public:root.JBPublicC1,rpcCalls};
}
const safeKeys=['id','slug','version','status','headline','summary','content','category','location','author','geoLevel','district','newsDate','newsTime','breaking','topStory','publishedAt','createdAt','updatedAt','media','internalSource'];
test('T082 valid published row is available by exact immutable UUID and explicit public-field allowlist',async()=>{
 const h=harness();
 const found=await h.public.get(id);
 assert(found);assert.equal(found.id,id);assert.equal(found.headline,record.title);
 assert.equal(found.status,'published');
 assert.deepEqual(Object.keys(found).sort(),[...safeKeys].sort());
 assert.equal(h.rpcCalls.length,1);
 assert.equal(h.rpcCalls[0].fn,'jb_c1_public_articles');
 assert.equal(h.rpcCalls[0].args.p_article_id,id);
});
test('T082 all source/email/evidence/private fields are redacted even if provider response is poisoned',async()=>{
 const found=await harness().public.get(id);
 assert.equal(JSON.stringify(found).includes(secret),false);
 assert.deepEqual(Object.keys(found.internalSource),['publicAttribution']);
 assert.equal(found.internalSource.publicAttribution,'Public ISRO');
});
test('T082 draft/unpublished/deleted review records are denied even if fake backend returns them',async()=>{
 for(const status of ['draft','review','unpublished','deleted']){
   const h=harness({rows:[{...record,id:draftId,status}]});
   assert.equal(await h.public.get(draftId),null,status+' must be private');
 }
});
test('T082 published status without published_at or title does not leak',async()=>{
 for(const patch of [{published_at:null},{title:'   '},{id:'bad-uuid'}]){
  const h=harness({rows:[{...record,...patch}]});
  assert.equal(await h.public.get(id),null);
 }
});
test('T082 never return a different published Article ID from a mismatched RPC response',async()=>{
 const h=harness({rows:[record]});
 assert.equal(await h.public.get(draftId),null);
 assert.equal(h.rpcCalls[0].args.p_article_id,draftId);
});
test('T082 malformed/non-UUID public IDs never trigger any RPC',async()=>{
 const h=harness();
 for(const x of ['','not-a-uuid',null,undefined,'../source',' '+id,id+'?preview=admin'])
  assert.equal(await h.public.get(x),null);
 assert.equal(h.rpcCalls.length,0);
});
test('T082 failed public RPC does not forward private provider error to visitor',async()=>{
 const h=harness({error:{message:'PROVIDER_DSN_'+secret}});
 await assert.rejects(h.public.get(id),e=>e?.message==='PUBLIC_C1_RPC_UNAVAILABLE');
});
test('T082 malformed RPC response always fails closed',async()=>{
 const h=harness({missingData:true});
 await assert.rejects(h.public.get(id),e=>e?.message==='PUBLIC_C1_INVALID_PROJECTION');
});
test('T082 public feed clamps overlarge/empty limits to 30/1 without arbitrary private queries',async()=>{
 const h=harness({rows:[]});
 await h.public.list(10000);
 await h.public.list(0);
 assert.equal(h.rpcCalls[0].args.p_limit,30);
 assert.equal(h.rpcCalls[1].args.p_limit,1);
 assert.equal(h.rpcCalls[0].args.p_article_id,null);
});
test('T082 Article UI uses Owner-only admin preview, C1 otherwise, and fail-closed public status',()=>{
 assert.match(article,/if\(adminPreview\)await JBBackend\.requireOwner\(\)/);
 assert.match(article,/adminPreview\?await JBBackend\.getArticle\(id,\{privateData:false\}\):await JBPublicC1\.get\(id\)/);
 assert.match(article,/!adminPreview&&item\.status!=='published'/);
 assert.match(article,/ADMIN PREVIEW — public sharing disabled until publish/);
 assert.match(article,/JBBackend\.esc\(item\.content\|\|''\)/);
});
