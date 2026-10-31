// JANTA BOL T082 — ORIGINAL production backend lifecycle function testing.
// All calls use an in-memory fake Supabase client; no real URL, keys or writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js','utf8');
const publicHtml=readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
const publishedHtml=readFileSync('JANTA_BOL_PHASE_3C_WORKING/published.html','utf8');
const draftHtml=readFileSync('JANTA_BOL_PHASE_3C_WORKING/drafts.html','utf8');
const uuid='11111111-1111-4111-8111-111111111111';

function functionBlock(name,next){
 const m=new RegExp('\\basync function '+name+'\\s*\\(').exec(source);
 assert(m,'missing real source '+name);
 const at=source.slice(m.index).search(new RegExp('\\basync function '+next+'\\s*\\('));
 assert(at>50,'cannot find close delimiter '+next);
 return source.slice(m.index,m.index+at);
}
const publishSource=functionBlock('publish','unpublish');
const unpublishSource=functionBlock('unpublish','softDelete');

function harness({owner=true,ackLostOn=null}={}){
 let db={id:uuid,version:5,status:'draft',slug:'jb-immutable',title:'T082 ISOLATED TEST',
   excerpt:'Stable excerpt',body:'No real article',published_at:null};
 let changes=0,ownerChecks=0;
 const history=[],audits=[],sourceWrites=[],writtenFields=[];
 const client={
  from(table){
   assert.equal(table,'articles','unexpected private table operation');
   return {
    update(patch){
     const predicates={};
     return {
      eq(k,v){predicates[k]=v;return this;},
      async select(cols){
       assert.equal(cols,'*');
       assert.equal(predicates.id,uuid,'must identify original Article ID');
       if(Object.hasOwn(predicates,'version')&&predicates.version!==db.version)
         return {data:[],error:null};
       const previous={...db};
       writtenFields.push({...patch});
       db={...db,...patch,version:db.version+1};
       changes++; history.push({id:uuid,oldVersion:previous.version,status:previous.status});
       audits.push({action:'article_update',oldStatus:previous.status,newStatus:db.status,
         fromVersion:previous.version,toVersion:db.version});
       if(ackLostOn===changes)throw Error('NETWORK_ACK_LOST');
       return {data:[{...db}],error:null};
      }
     };
    }
   };
  }
 };
 const normalize=(r)=>({id:r.id,version:r.version,status:r.status,slug:r.slug,
   headline:r.title,summary:r.excerpt,content:r.body,publishedAt:r.published_at,
   internalSource:{verificationStatus:'Verified'}});
 const dependencies={
  client,now:()=> '2026-10-31T12:30:00.000Z',
  requireOwner:async()=>{ownerChecks++;if(!owner)throw Error('OWNER_REQUIRED');},
  toRow:(i)=>({slug:i.slug,title:i.headline,excerpt:i.summary,body:i.content}),
  normalize, getSource:async()=>({}),saveSource:async(i)=>sourceWrites.push(i.id),
  getArticle:async()=>normalize(db),
  saveDraft:async()=>{throw Error('Unexpected new article insert denied in this test');},
  localStorage:{removeItem:()=>{}},SHADOW:'fake_local_shadow',
  console:{log(){},warn(){}}
 };
 const {publish,unpublish}=runInNewContext(publishSource+'\n'+unpublishSource+'\n({publish,unpublish})',dependencies,{timeout:3000});
 return {publish,unpublish, current:()=>({...db}),currentItem:()=>normalize(db),history,audits,
  sourceWrites,writtenFields,counts:()=>({changes,ownerChecks})};
}
const isConflict=e=>e?.message==='VERSION_CONFLICT';

test('T082 source has Owner before both backend write paths',()=>{
 assert.match(publishSource,/await requireOwner\(\)/);
 assert.match(unpublishSource,/await requireOwner\(\)/);
});
test('T082 correction and Unpublish → Republish preserve the same original UUID with monotonic version',async()=>{
 const h=harness();const original=h.currentItem();
 let p=await h.publish({...original,headline:'Corrected safely'}, {expectedVersion:5});
 assert.equal(p.id,uuid);assert.equal(p.status,'published');assert.equal(p.version,6);
 assert.equal(p.headline,'Corrected safely');
 let u=await h.unpublish(uuid,6);
 assert.equal(u.id,uuid);assert.equal(u.status,'draft');assert.equal(u.version,7);
 assert.equal(h.current().published_at,null);
 let again=await h.publish(h.currentItem(),{expectedVersion:7});
 assert.equal(again.id,uuid);assert.equal(again.status,'published');assert.equal(again.version,8);
 assert.equal(h.counts().changes,3);assert.equal(h.audits.length,3);
 assert.deepEqual(h.history.map(x=>x.oldVersion),[5,6,7]);
 // These are SYNTHETIC audit/history effects, not real production trigger PASS.
});
test('T082 stale Correction version loses CAS and leaves original article unchanged',async()=>{
 const h=harness();await h.publish(h.currentItem(),{expectedVersion:5});
 const before=h.current();
 await assert.rejects(h.publish({...h.currentItem(),headline:'Stale overwrite'}, {expectedVersion:5}),isConflict);
 assert.deepEqual(h.current(),before);
 assert.equal(h.counts().changes,1);
});
test('T082 stale Unpublish cannot override newer published correction',async()=>{
 const h=harness();await h.publish(h.currentItem(),{expectedVersion:5});
 const before=h.current();
 await assert.rejects(h.unpublish(uuid,5),isConflict);
 assert.deepEqual(h.current(),before);
});
test('T082 unauthenticated caller cannot Publish or Unpublish via original functions',async()=>{
 const h=harness({owner:false});
 await assert.rejects(h.publish(h.currentItem(),{expectedVersion:5}),/OWNER_REQUIRED/);
 await assert.rejects(h.unpublish(uuid,5),/OWNER_REQUIRED/);
 assert.equal(h.counts().changes,0);
});
test('T082 lost server publish acknowledgement is not safe to blind-repeat with stale version',async()=>{
 const h=harness({ackLostOn:1});
 await assert.rejects(h.publish(h.currentItem(),{expectedVersion:5}),/NETWORK_ACK_LOST/);
 assert.equal(h.current().status,'published');
 assert.equal(h.current().version,6);
 await assert.rejects(h.publish(h.currentItem(),{expectedVersion:5}),isConflict);
 assert.equal(h.counts().changes,1);
});
test('T082 original admin passes expected version for status transitions',()=>{
 assert.match(publishedHtml,/JBBackend\.unpublish\(id,v\)/);
 assert.match(publishedHtml,/onclick="unpublishItem\('\$\{n\.id\}'/);
 assert.match(draftHtml,/add-news\.html\?edit=/);
 assert.match(source,/\.eq\('version',expectedVersion\)/);
});
test('T082 original public view denies non-published and keeps preview Founder-only',()=>{
 assert.match(publicHtml,/await JBBackend\.requireOwner\(\)/);
 assert.match(publicHtml,/item\.status!=='published'/);
 assert.match(publicHtml,/ADMIN PREVIEW — public sharing disabled until publish/);
 assert.match(publicHtml,/Article available nahi hai ya currently unpublished hai/);
});
test('T082 original permanent-link renderer builds id from unchanged item UUID',()=>{
 assert.match(publicHtml,/new URL\('article\.html',location\.href\)/);
 assert.match(publicHtml,/u\.searchParams\.set\('id',item\.id\)/);
 assert.match(publishSource,/\.eq\('id',working\.id\)/);
 assert.match(unpublishSource,/\.eq\('id',id\)/);
});
