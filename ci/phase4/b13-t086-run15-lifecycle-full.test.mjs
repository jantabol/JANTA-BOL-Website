// B13 P4-T086 / RUN-15 — actual current backend in isolated JS VM with fake persistence.
// No production requests/credentials/articles, no fabricated provider or Founder actions.
// E1 regression only. E3/E4 real phone and E5 live audit are separate documented proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const backendSource=readFileSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js','utf8');
const articleSource=readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
const publishedSource=readFileSync('JANTA_BOL_PHASE_3C_WORKING/published.html','utf8');
const editorSource=readFileSync('JANTA_BOL_PHASE_3C_WORKING/add-news.html','utf8');
const publicSource=readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-c1-projection.js','utf8');
const userId='77777777-7777-4777-8777-777777777777';
const UUID='22222222-2222-4222-8222-222222222222';
const fresh=()=>({
  id:'',version:0,slug:'',headline:'FICTIONAL CI fixture — NOT PUBLIC NEWS',
  summary:'Synthetic CI fixture only',content:'Fixture text never published to JANTA BOL',
  category:'Technology',geoLevel:'India',location:'India',
  internalSource:{type:'Official',name:'CI Fixture ONLY',verificationStatus:'Verified'},
  media:{coverImageUrl:'',additionalMediaUrls:[],youtubeUrl:''}
});
function makeHarness(role='owner'){
 const db={articles:new Map(),sources:new Map(),verification:[],history:[],writes:[],attempts:0};
 const storage=new Map();
 const ls={getItem:k=>storage.has(k)?storage.get(k):null,
  setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 function supaClient(){
  function from(table){
   let operation='read', payload=null,filters=[];
   const q={
    eq(k,v){filters.push([k,v]);return q;},
    select(){return q;},
    upsert(v){operation='upsert';payload=v;return q;},
    insert(v){operation='insert';payload=v;return q;},
    update(v){operation='update';payload=v;return q;},
    async maybeSingle(){
     if(table==='user_roles')return {data:{role},error:null};
     if(table==='article_sources'){
      const id=filters.find(x=>x[0]==='article_id')?.[1];
      return {data:db.sources.get(id)||null,error:null};
     }
     if(table==='articles'){
      const match=[...db.articles.values()].find(r=>filters.every(([k,v])=>r[k]===v));
      return {data:match||null,error:null};
     }
     return {data:null,error:null};
    },
    async single(){
     if(operation==='insert'&&table==='articles'){
      db.attempts++;
      if(db.articles.has(payload.id))return {data:null,error:{code:'23505'}};
      const saved={...payload,version:1,created_at:new Date().toISOString()};
      db.articles.set(saved.id,saved);
      db.writes.push({kind:'create',id:saved.id,status:saved.status,version:saved.version,slug:saved.slug});
      return {data:saved,error:null};
     }
     return {data:null,error:{code:'UNEXPECTED_TEST_INSERT'}};
    },
    then(resolve,reject){
     (async()=>{
      if(operation==='upsert'&&table==='article_sources'){
       db.sources.set(payload.article_id,{...payload});return {data:payload,error:null};
      }
      if(operation==='insert'&&table==='verification_history'){
       db.verification.push(payload);return {data:payload,error:null};
      }
      if(operation==='update'&&table==='articles'){
       const prev=[...db.articles.values()].find(r=>filters.every(([k,v])=>r[k]===v));
       if(!prev)return {data:[],error:null};
       db.history.push({...prev});
       const after={...prev,...payload,version:prev.version+1};
       db.articles.set(after.id,after);
       db.writes.push({kind:'update',id:after.id,before:prev.status,
        status:after.status,version:after.version,slug:after.slug});
       return {data:[after],error:null};
      }
      return {data:null,error:null};
     })().then(resolve,reject);
    }
   };
   return q;
  }
  return {auth:{getSession:async()=>({data:{session:{user:{id:userId}}},error:null}),
    mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal2'},error:null})}},from};
 }
 const win={supabase:{createClient:supaClient},
  JB_SUPABASE_CONFIG:{url:'https://example.invalid',publishableKey:'SYNTHETIC_NONPROD'},
  location:{href:'https://example.invalid/add-news.html'}};
 const context={window:win,localStorage:ls,navigator:{onLine:true},
  crypto:{randomUUID:()=>UUID},URL,Date,JSON,console,
  document:{createElement:()=>({textContent:'',innerHTML:''})}};
 runInNewContext(backendSource,context,{filename:'backend-client.js',timeout:4000});
 return {db,b:win.JBBackend};
}

test('T086-CORE01 full Create→Draft→Publish→Correction→Unpublish→Republish on ORIGINAL id',async()=>{
 const {b,db}=makeHarness();
 const draft=await b.saveDraft(fresh());
 assert.equal(draft.id,UUID);
 assert.equal(draft.status,'draft');
 assert.equal(draft.version,1);
 const originalSlug=draft.slug;
 assert(originalSlug&&typeof originalSlug==='string');
 const first=await b.publish(draft,{expectedVersion:draft.version});
 assert.equal(first.id,UUID);
 assert.equal(first.status,'published');
 assert.equal(first.version,2);
 assert.equal(first.slug,originalSlug);
 assert.equal(db.articles.size,1);
 const corrected=await b.publish({...first,headline:'SYNTHETIC CORRECTED CI FIXTURE'},{expectedVersion:first.version});
 assert.equal(corrected.id,UUID);
 assert.equal(corrected.version,3);
 assert.equal(corrected.status,'published');
 assert.equal(corrected.slug,originalSlug);
 assert.equal(corrected.headline,'SYNTHETIC CORRECTED CI FIXTURE');
 const unpublished=await b.unpublish(corrected.id,corrected.version);
 assert.equal(unpublished.id,UUID);
 assert.equal(unpublished.status,'draft');
 assert.equal(unpublished.version,4);
 assert.equal(db.articles.get(UUID).published_at,null,'Unpublish must clear persisted published_at');
 assert.equal(unpublished.publishedAt||'', '', 'Normalized public publishedAt may be empty after Unpublish');
 const republished=await b.publish(unpublished,{expectedVersion:unpublished.version});
 assert.equal(republished.status,'published');
 assert.equal(republished.id,UUID);
 assert.equal(republished.slug,originalSlug);
 assert.equal(republished.version,5);
 assert.equal(republished.headline,'SYNTHETIC CORRECTED CI FIXTURE');
 assert.equal(db.articles.size,1,'no duplicate Article');
 assert.equal(db.attempts,1,'only first Create INSERT');
 assert.deepEqual(db.writes.map(x=>x.status),['draft','published','published','draft','published']);
 assert(db.writes.every(x=>x.id===UUID&&x.slug===originalSlug));
 assert.equal(db.history.length,4);
 assert.deepEqual(db.history.map(x=>x.status),['draft','published','published','draft']);
});
test('T086-CORE02 stale published correction or unpublish version is rejected, same Article intact',async()=>{
 const {b,db}=makeHarness();
 const first=await b.publish(fresh());
 const before=db.articles.get(UUID);
 await assert.rejects(
  b.publish({...first,headline:'SYNTHETIC STALE CORRECTION'},{expectedVersion:first.version-1}),
  /VERSION_CONFLICT/);
 await assert.rejects(b.unpublish(first.id,first.version-1),/VERSION_CONFLICT/);
 assert.equal(db.articles.size,1);
 assert.equal(db.articles.get(UUID).version,before.version);
 assert.equal(db.articles.get(UUID).title,before.title);
 assert.equal(db.articles.get(UUID).status,'published');
});
test('T086-CORE03 reporter role cannot create/publish/unpublish through Owner backend',async()=>{
 const {b,db}=makeHarness('reporter');
 await assert.rejects(b.saveDraft(fresh()));
 await assert.rejects(b.publish(fresh()));
 await assert.rejects(b.unpublish(UUID,1));
 assert.equal(db.articles.size,0);
});
test('T086-CORE04 Published correction editor NEVER auto-syncs a public version to draft',()=>{
 assert(editorSource.includes("editing && editing.status==='published'"));
 assert(editorSource.includes('LOCAL CORRECTION SAVED • NOT SYNCED'));
 assert(editorSource.includes('Final Review → Confirm Publish'));
 assert(publishedSource.includes("function editItem(id){location.href='add-news.html?edit='+encodeURIComponent(id)+'&from=published'}"));
});
test('T086-CORE05 public article canonical share strips extra query, retains single UUID',()=>{
 assert(articleSource.includes("function shareUrl(){const u=new URL('article.html',location.href);u.search='';u.hash=''"));
 assert(articleSource.includes("u.searchParams.set('id',item.id)"));
 assert(articleSource.includes('if(!item||adminPreview)return'));
 const u=new URL('article.html','https://example.invalid/article.html?preview=admin&tracking=x#fragment');
 u.search='';u.hash='';u.searchParams.set('id',UUID);
 assert.equal(u.href,'https://example.invalid/article.html?id='+UUID);
 assert(publicSource.includes("row.status !== 'published'"));
 assert(publicSource.includes('jb_c1_public_articles'));
});
test('T086-CORE06 real provider must stay DUE; synthetic E1 does NOT prove LIVE',()=>{
 const report=readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T086_RUN15_EVIDENCE_GATE_20261102.md','utf8');
 for(const k of ['T086_LIVE_EXTERNAL_PROVIDER_RUNTIME=DUE','T086_SYNTHETIC_FIXTURE_NOT_PUBLIC=YES','T086_ACTUAL_FACTUAL_CONTENT_CORRECTION=NOT_CLAIMED'])
  assert(report.includes(k),k);
});
