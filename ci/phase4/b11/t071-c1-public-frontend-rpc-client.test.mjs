import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('JANTA_BOL_PHASE_3C_WORKING/backend-client.js','utf8');
const publicId='00000000-0000-4000-8000-000000000001';
const article=Object.freeze({
 id:publicId,slug:'test-public',title:'Verified synthetic news',body:'FULL SYNTHETIC PUBLIC BODY',
 excerpt:'short note',status:'published',published_at:'2026-10-27T12:00:00Z',
 created_at:'2026-10-27T11:00:00Z',updated_at:'2026-10-27T12:00:00Z',
 version:1,additional_media_urls:[],public_attribution:'',cover_image_url:'',
 video_url:'',category:'News',geography_level:'Local',district:'Shivpuri',
 location:'Pichhore',reporter_name:'JANTA BOL',news_date:'2026-10-27',
 news_time:'12:00:00',breaking:false,top_story:false
});
function mk(outputs=[]) {
 const calls=[];
 const result=outputs.slice();
 const client={
  rpc:async(...args)=>{calls.push({op:'rpc',args});return result.shift()??{data:{items:[]},error:null}},
  from:(tbl)=>{
    calls.push({op:'from',table:tbl});
    return {
      select(cols){
        calls.push({op:'select',cols});
        return {eq:(name,value)=>({
          maybeSingle:async()=>({data:null,error:null})
        })};
      }
    };
  }
 };
 const win={
  supabase:{createClient:()=>client},
  JB_SUPABASE_CONFIG:{url:'https://dummy.invalid',publishableKey:'PUBLIC_DUMMY'},
  location:{href:'https://example.invalid/article.html'},localStorage:{
   getItem:()=>null,setItem:()=>{},removeItem:()=>{}
  }
 };
 vm.runInNewContext(source,{
  window:win,document:{createElement:()=>({})},crypto:{randomUUID:()=>publicId},
  URL,Date,Uint8Array,TextDecoder,atob:()=>'',setTimeout,console
 },{filename:'backend-client.js'});
 return {b:win.JBBackend,calls};
}
test('anonymous full-body GET uses exact secure RPC; no broad article table read',async()=>{
 const {b,calls}=mk([{data:{items:[article]},error:null}]);
 const r=await b.getArticle(publicId,{privateData:false});
 assert.equal(r.id,publicId);
 assert.equal(r.headline,'Verified synthetic news');
 assert.equal(r.content,'FULL SYNTHETIC PUBLIC BODY');
 assert.equal(r.status,'published');
 assert.equal(calls.filter(x=>x.op==='from').length,0);
 assert.equal(calls[0].args[0],'jb_c1_public_articles');
 assert.equal(calls[0].args[1].p_article_id,publicId);
 assert.equal(calls[0].args[1].p_limit,1);
});
test('anonymous public list reuses the same bounded RPC, no table access',async()=>{
 const {b,calls}=mk([{data:{items:[article]},error:null}]);
 const rows=await b.listPublishedPublic(50000);
 assert.equal(rows.length,1); assert.equal(rows[0].content,article.body);
 assert.equal(calls[0].args[0],'jb_c1_public_articles');
 assert.equal(calls[0].args[1].p_article_id,null);
 assert.equal(calls[0].args[1].p_limit,30);
 assert.equal(calls.some(x=>x.op==='from'),false);
});
test('malformed ID returns null and does not touch source/database',async()=>{
 const {b,calls}=mk();
 assert.equal(await b.getArticle('..%2fsecret',{privateData:false}),null);
 assert.equal(calls.length,0);
});
test('RPC 403 or missing deployment denies and never falls back to unsafe direct read',async()=>{
 const {b,calls}=mk([{data:null,error:{code:'42501',message:'permission denied'}}]);
 await assert.rejects(()=>b.getArticle(publicId,{privateData:false}),/./);
 assert.equal(calls.length,1);
 assert.equal(calls[0].op,'rpc');
});
test('malformed/undocumented RPC response is fail-closed',async()=>{
 const {b}=mk([{data:{unexpected:true},error:null}]);
 await assert.rejects(()=>b.getArticle(publicId,{privateData:false}),/PUBLIC_ARTICLE_RESPONSE_INVALID/);
});
test('server malfunction returning a draft is not shown to the public',async()=>{
 const {b}=mk([{data:{items:[{...article,status:'draft'}]},error:null}]);
 await assert.rejects(()=>b.getArticle(publicId,{privateData:false}),/PUBLIC_ARTICLE_PRIVACY_INVARIANT/);
});
test('mismatched identity returned by server is denied',async()=>{
 const {b}=mk([{data:{items:[{...article,id:'00000000-0000-4000-8000-000000000002'}]},error:null}]);
 await assert.rejects(()=>b.getArticle(publicId,{privateData:false}),/PUBLIC_ARTICLE_PRIVACY_INVARIANT/);
});
test('list refuses unpublished row, even if RPC responds incorrectly',async()=>{
 const {b}=mk([{data:{items:[{...article,status:'draft'}]},error:null}]);
 await assert.rejects(()=>b.listPublishedPublic(1),/PUBLIC_ARTICLE_FEED_PRIVACY_INVARIANT/);
});
test('list refuses server sending more rows than requested',async()=>{
 const {b}=mk([{data:{items:[article,article]},error:null}]);
 await assert.rejects(()=>b.listPublishedPublic(1),/PUBLIC_ARTICLE_FEED_PRIVACY_INVARIANT/);
});
test('Owner privateData path retains original authenticated table read, does not call guest RPC',async()=>{
 const {b,calls}=mk();
 assert.equal(await b.getArticle(publicId,{privateData:true}),null);
 assert.equal(calls.some(x=>x.op==='rpc'),false);
 assert.equal(calls.some(x=>x.op==='from'&&x.table==='articles'),true);
});
