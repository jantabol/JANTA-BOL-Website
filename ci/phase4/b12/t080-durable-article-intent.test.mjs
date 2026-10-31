import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js','utf8');
const userId='77777777-7777-4777-8777-777777777777';
const articleId='22222222-2222-4222-8222-222222222222';
const sourceItem=()=>({
  id:'',version:0,slug:'',headline:'T080 synthetic verified article',
  summary:'Synthetic news',content:'Synthetic news detail',
  category:'Technology',geoLevel:'India',location:'India',
  internalSource:{type:'Official',name:'Synthetic Source',verificationStatus:'Verified'},
  media:{coverImageUrl:'',additionalMediaUrls:[],youtubeUrl:''}
});
function createHarness(){
  const db={articles:new Map(),sources:new Map(),history:[],attempts:0,net:'normal'};
  const data=new Map();
  let generated=0;
  const ls={
    getItem:k=>data.has(k)?data.get(k):null,
    setItem:(k,v)=>data.set(k,String(v)),
    removeItem:k=>data.delete(k)
  };
  function client(){
    function from(table){
      let op='read',row=null,filters=[];
      const builder={
        eq:(k,v)=>{filters.push([k,v]);return builder;},
        select:()=>builder,
        upsert:(x)=>{op='upsert';row=x;return builder;},
        insert:(x)=>{op='insert';row=x;return builder;},
        update:(x)=>{op='update';row=x;return builder;},
        maybeSingle:async()=>{
          if(table==='user_roles')return {data:{role:'owner'},error:null};
          if(table==='article_sources')return {data:db.sources.get(filters.find(([x])=>x==='article_id')?.[1])||null,error:null};
          if(table==='articles'){
            const match=[...db.articles.values()].find(r=>filters.every(([k,v])=>r[k]===v));
            return {data:match||null,error:null};
          }
          return {data:null,error:null};
        },
        single:async()=>{
          if(op==='insert'&&table==='articles'){
            db.attempts++;
            if(db.articles.has(row.id))return {data:null,error:{code:'23505'}};
            const saved={...row,version:1,created_at:new Date().toISOString()};
            db.articles.set(row.id,saved);
            if(db.net==='lose_insert_ack'){db.net='normal';throw Error('HTTP_ACK_LOST');}
            return {data:saved,error:null};
          }
          return {data:null,error:{code:'NOT_MOCKED'}};
        },
        then(resolve,reject){
          (async()=>{
            if(op==='upsert'&&table==='article_sources'){
              db.sources.set(row.article_id,{...row});return {data:row,error:null};
            }
            if(op==='insert'&&table==='verification_history'){
              db.history.push(row);return {data:row,error:null};
            }
            if(op==='update'&&table==='articles'){
              const prev=[...db.articles.values()].find(r=>filters.every(([k,v])=>r[k]===v));
              if(!prev)return {data:[],error:null};
              const saved={...prev,...row,version:prev.version+1};
              db.articles.set(saved.id,saved);
              if(db.net==='lose_publish_ack'){db.net='normal';throw Error('HTTP_ACK_LOST');}
              return {data:[saved],error:null};
            }
            return {data:null,error:null};
          })().then(resolve,reject);
        }
      };
      return builder;
    }
    return {
      auth:{
        getSession:async()=>({data:{session:{user:{id:userId}}},error:null}),
        mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal2'},error:null})}
      },from
    };
  }
  function tab(){
    const win={
      supabase:{createClient:client},
      JB_SUPABASE_CONFIG:{url:'https://example.invalid',publishableKey:'test-publishable-key'},
      location:{href:'https://example.invalid/add-news.html'}
    };
    const context={
      window:win,localStorage:ls,navigator:{onLine:true},
      crypto:{randomUUID:()=>generated++===0?articleId:'33333333-3333-4333-8333-333333333333'},
      URL,Date,JSON,console,
      document:{createElement:()=>({textContent:'',innerHTML:''})}
    };
    runInNewContext(source,context,{filename:'backend-client.js',timeout:4000});
    return win.JBBackend;
  }
  return {tab,db,ls};
}
test('T080 original backend: new draft uses a persistent UUID primary-key intent',async()=>{
  const h=createHarness(),b=h.tab();
  const id=b.reserveCreateIntent();
  assert.equal(id,articleId);
  assert.equal(b.getCreateIntent().attempted,false);
  const saved=await b.saveDraft(sourceItem());
  assert.equal(saved.id,id);
  assert.equal(h.db.articles.size,1);
  assert.equal(h.db.attempts,1);
  assert.equal(b.getCreateIntent(),null);
});
test('T080 lost insert acknowledgment + Android reload preserves one row, no duplicate',async()=>{
  const h=createHarness(),a=h.tab();
  h.db.net='lose_insert_ack';
  await assert.rejects(a.saveDraft(sourceItem()),/HTTP_ACK_LOST/);
  assert.equal(h.db.articles.size,1);
  assert.equal(a.getCreateIntent().attempted,true);
  const b=h.tab();
  assert.equal(b.reserveCreateIntent(),articleId);
  await assert.rejects(b.saveDraft(sourceItem()),/CREATE_INTENT_ALREADY_EXISTS/);
  assert.equal(h.db.articles.size,1);
  assert.equal(h.db.attempts,2);
  const remote=await b.getArticle(articleId,{privateData:true});
  assert.equal(remote.id,articleId);
});
test('T080 second tab shares original create UUID and cannot insert a duplicate',async()=>{
  const h=createHarness(),a=h.tab(),b=h.tab();
  assert.equal(a.reserveCreateIntent(),b.reserveCreateIntent());
  const out=await Promise.allSettled([a.saveDraft(sourceItem()),b.saveDraft(sourceItem())]);
  assert.equal(out.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(h.db.articles.size,1);
  assert.equal(h.db.attempts,2);
});
test('T080 lost publish response after database commit does not generate a second article',async()=>{
  const h=createHarness(),a=h.tab();
  h.db.net='lose_publish_ack';
  await assert.rejects(a.publish(sourceItem()),/HTTP_ACK_LOST/);
  assert.equal(h.db.articles.size,1);
  assert.equal(h.db.articles.get(articleId).status,'published');
  assert.equal(a.getCreateIntent().attempted,true);
  const b=h.tab();
  assert.equal((await b.getArticle(articleId,{privateData:true})).status,'published');
  await assert.rejects(b.publish(sourceItem()),/CREATE_INTENT_ALREADY_EXISTS/);
  assert.equal(h.db.articles.size,1);
});
test('T080 existing article retains version compare-and-swap behavior',async()=>{
  const h=createHarness(),a=h.tab();
  const draft=await a.saveDraft(sourceItem());
  const edit={...draft,headline:'Updated same ID'};
  const saved=await a.saveDraft(edit,{expectedVersion:draft.version});
  assert.equal(saved.id,draft.id);
  assert.equal(h.db.articles.size,1);
  await assert.rejects(a.saveDraft(edit,{expectedVersion:draft.version}),/VERSION_CONFLICT/);
  assert.equal(h.db.articles.size,1);
});
test('T080 source still denies non-owner writes and does not turn into public bypass',async()=>{
  assert.match(source,/await requireOwner\(\);/);
  assert.match(source,/CREATE_INTENT_ALREADY_EXISTS/);
  assert.match(source,/id:newCreateId/);
  assert.doesNotMatch(source,/service_role/);
});