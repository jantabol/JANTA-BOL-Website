import {test} from 'node:test';
import assert from 'node:assert/strict';

const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ARTICLE='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const safe={
 case_id:CASE,public_topic:'PUBLIC_WORKS',public_area:'PICHHORE',
 public_status:'UNDER_REVIEW',public_revision:1,
 approved_at:'2026-10-17T06:00:00Z',
 source_evidence_public:false,official_reply_independently_verified:false,
 articles:[{article_id:ARTICLE}],
 timeline:[{event_id:1,event_code:'CASE_REVIEW_STARTED',event_at:'2026-10-17T06:00:00Z'}]
};
function fakeElement(tag){
 const o={tag,children:[],listeners:{},value:'',textContent:'',href:'',
  classList:{toggle(){},add(){},remove(){}},
  append(...x){this.children.push(...x)},
  replaceChildren(...x){this.children.splice(0,this.children.length,...x)},
  addEventListener(evt,fn){this.listeners[evt]=fn}
 };
 return o;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

test('G4 real browser-controller module: newer HIDE/empty response wins over slow old approved response; resume rechecks server',async()=>{
 const elements=new Map();
 const registry=new Map();
 for(const id of ['caseForm','caseId','latest','cases','status'])elements.set(id,fakeElement(id));
 elements.get('caseId').value=CASE;
 const events={};
 const deferred={};
 deferred.promise=new Promise(resolve=>{deferred.resolve=resolve});
 let calls=0;
 const rpc=async (method,args)=>{
  assert.equal(method,'jb_b8_g4_public_case');
  assert.equal(args.p_case_id,CASE);
  calls++;
  if(calls===1)return deferred.promise;
  return {data:null,error:null}; // Founder HIDE executed before this RPC.
 };
 const oldDoc=globalThis.document,oldWin=globalThis.window,oldHistory=globalThis.history;
 const doc={
  hidden:false,
  getElementById(id){return elements.get(id)},
  createElement:fakeElement,
  addEventListener(type,fn){registry.set(type,fn)}
 };
 const win={
  JBBackend:{client:{rpc}},
  location:{href:'https://preview.example.invalid/accountability-public.html?id='+CASE,
   search:'?id='+CASE},
  addEventListener(type,fn){events[type]=fn}
 };
 try{
  globalThis.document=doc;
  globalThis.window=win;
  globalThis.history={replaceState(){}};
  const url=new URL('../../JANTA_BOL_PHASE_3C_WORKING/b8-public-case-ui.js',
    import.meta.url);
  url.searchParams.set('test','g4cp04_first_and_second');
  await import(url.href);
  assert.equal(calls,1);
  assert.equal(elements.get('cases').children.length,0);
  // Owner HIDE confirmed in the newer request while older GET is still pending.
  elements.get('caseForm').listeners.submit({preventDefault(){}});
  await sleep(15);
  assert.equal(calls,2);
  assert.equal(elements.get('cases').children.length,0);
  assert.match(elements.get('status').textContent,/उपलब्ध नहीं/);
  deferred.resolve({data:safe,error:null}); // old allowed response arrives after HIDE.
  await sleep(15);
  assert.equal(elements.get('cases').children.length,0,
    'stale approved response must not resurrect a HIDDEN case');
  assert.match(elements.get('status').textContent,/उपलब्ध नहीं/);
  // Mobile tab return asks server again, without polling.
  registry.get('visibilitychange')();
  await sleep(15);
  assert.equal(calls,3);
  assert.equal(elements.get('cases').children.length,0);
  assert.equal(typeof events.pageshow,'function');
 }finally{
  globalThis.document=oldDoc;globalThis.window=oldWin;
  globalThis.history=oldHistory;
 }
});
