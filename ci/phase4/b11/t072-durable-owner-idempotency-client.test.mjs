import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {submitOwnerCaseIdempotentCandidate as submit,
 startNewOwnerCaseIntentCandidate as fresh
} from './t072-durable-owner-idempotency-CLIENT_PROPOSAL_ONLY.mjs';

const OWNER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const payload={title:'Verified district rural water works inquiry',area:'Pichhore',lane:'R1'};
function storage(){
 const values=new Map();
 return {getItem:k=>values.has(k)?values.get(k):null,
  setItem:(k,v)=>{values.set(k,v);},
  removeItem:k=>{values.delete(k);},
  snapshot:()=>Array.from(values.entries())};
}
function locks(){
 const queues=new Map();
 return {request:(name,options,action)=>{
  assert.equal(options.mode,'exclusive');
  const queue=(queues.get(name)||Promise.resolve()).then(action);
  queues.set(name,queue.catch(()=>{}));
  return queue;
 }};
}
function backend(){
 const keys=new Map(),calls=[],newCases=[];
 let failOnce=null,deny=false,active=OWNER;
 return {
  calls,newCases,keys,
  setActive:x=>active=x,setDeny:x=>deny=x,setFailOnce:x=>failOnce=x,
  client:{
   auth:{getUser:async()=>({data:{user:{id:active}},error:null})},
   rpc:async(name,args)=>{
    calls.push({name,args});
    assert.equal(name,'jb_b8_g1_owner_create_case_idempotent');
    if(deny)return {data:null,error:{code:'AAL2_DENIED'}};
    const k=active+':'+args.p_request_key;
    if(keys.has(k)){
     if(JSON.stringify(keys.get(k).inputs)!==
        JSON.stringify([args.p_title,args.p_area_label,args.p_risk_lane]))
      return {data:null,error:{code:'PAYLOAD_CONFLICT'}};
    }else{
     keys.set(k,{id:CASE,inputs:[args.p_title,args.p_area_label,args.p_risk_lane]});
     newCases.push(CASE);
    }
    if(failOnce==='network'){failOnce=null;throw Error('connection lost after commit');}
    if(failOnce==='unknown'){failOnce=null;return {data:null,error:{code:'502'}};}
    return {data:keys.get(k).id,error:null};
   }
  }
 };
}
function env(opts={}){
 const b=backend(),s=storage(),l=locks();
 return {b,s,l,options:{client:b.client,ownerId:OWNER,payload,storage:s,locks:l,crypto:webcrypto,...opts}};
}
test('T072 E2 one real candidate request uses ONLY protected proposed RPC and stores durable UUID before network',async()=>{
 const {b,s,options}=env();
 assert.equal(await submit(options),CASE);
 assert.equal(b.calls.length,1);
 assert.equal(b.calls[0].name,'jb_b8_g1_owner_create_case_idempotent');
 assert.match(b.calls[0].args.p_request_key,/^[a-f0-9-]{36}$/);
 assert.equal(JSON.parse(s.snapshot()[0][1]).status,'CONFIRMED');
 assert(!JSON.stringify(s.snapshot()).includes(payload.title),'private case title must not leak to durable storage');
 assert(!JSON.stringify(s.snapshot()).includes(payload.area),'private area must not leak to durable storage');
});
test('T072 repeated same confirmed UI intent never creates two cases or a fresh UUID',async()=>{
 const {b,options}=env();
 await submit(options);
 await submit(options);
 assert.equal(b.newCases.length,1);
 assert.equal(b.calls[0].args.p_request_key,b.calls[1].args.p_request_key);
});
test('T072 committed-server network-lost acknowledgment stays PENDING, real retry repeats original key',async()=>{
 const {b,s,options}=env();b.setFailOnce('network');
 await assert.rejects(submit(options),/SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY/);
 assert.equal(JSON.parse(s.snapshot()[0][1]).status,'PENDING');
 const first=b.calls[0].args.p_request_key;
 const id=await submit({...options,client:b.client});
 assert.equal(id,CASE);
 assert.equal(b.calls[1].args.p_request_key,first);
 assert.equal(b.newCases.length,1);
});
test('T072 ambiguous 502 preserves same key and never returns fake success',async()=>{
 const {b,s,options}=env();b.setFailOnce('unknown');
 await assert.rejects(submit(options),/SERVER_OUTCOME_UNKNOWN/);
 assert.equal(JSON.parse(s.snapshot()[0][1]).status,'PENDING');
 await submit(options);
 assert.equal(b.newCases.length,1);
 assert.equal(b.calls[0].args.p_request_key,b.calls[1].args.p_request_key);
});
test('T072 backend not migrated or AAL2 denial never falls back to old non-idempotent RPC',async()=>{
 const {b,s,options}=env();b.setDeny(true);
 await assert.rejects(submit(options),/SERVER_OUTCOME_UNKNOWN/);
 assert.equal(b.calls[0].name,'jb_b8_g1_owner_create_case_idempotent');
 assert.equal(JSON.parse(s.snapshot()[0][1]).status,'PENDING');
 assert.equal(b.newCases.length,0);
});
test('T072 changed title or lane under pending key does not issue another RPC or discard original',async()=>{
 const {b,s,options}=env();b.setFailOnce('network');
 await assert.rejects(submit(options));
 const prior=s.snapshot()[0][1];
 await assert.rejects(submit({...options,payload:{...payload,title:payload.title+' changed'}}),
  /UNRESOLVED_PREVIOUS_INTENT_DIFFERENT_PAYLOAD/);
 assert.equal(b.calls.length,1);
 assert.equal(s.snapshot()[0][1],prior);
});
test('T072 changed payload after a confirmed case also requires deliberate new-intent action',async()=>{
 const {b,options}=env();await submit(options);
 await assert.rejects(submit({...options,payload:{...payload,lane:'R2'}}),
  /UNRESOLVED_PREVIOUS_INTENT_DIFFERENT_PAYLOAD/);
 assert.equal(b.newCases.length,1);
});
test('T072 after confirmed, explicit new intent allows a distinct key; automatic double tap cannot',async()=>{
 const {b,s,options}=env();
 await submit(options);
 const first=b.calls[0].args.p_request_key;
 assert.deepEqual(await fresh(options),{readyForExplicitNewCase:true,previousConfirmed:true});
 assert.equal(s.snapshot().length,0);
 await submit({...options,payload:{...payload,lane:'R2'}});
 assert.notEqual(b.calls[1].args.p_request_key,first);
 assert.equal(b.newCases.length,2); // two intentional distinct valid cases
});
test('T072 missing pending result cannot be cleared, even by explicit New intent',async()=>{
 const {b,options}=env();b.setFailOnce('network');
 await assert.rejects(submit(options));
 await assert.rejects(fresh(options),/PENDING_OR_UNKNOWN_CANNOT_BE_DISCARDED/);
 assert.equal(b.calls.length,1);
});
test('T072 cross-tab race for same Owner/payload serialized by exclusive Web Locks',async()=>{
 const {b,s,l,options}=env();
 const f1=submit(options),f2=submit({...options,storage:s,locks:l,client:b.client});
 assert.deepEqual(await Promise.all([f1,f2]),[CASE,CASE]);
 assert.equal(b.newCases.length,1);
 assert.equal(b.calls[0].args.p_request_key,b.calls[1].args.p_request_key);
});
test('T072 no Web Locks or secure RNG => zero potentially duplicating network writes',async()=>{
 const {b,options}=env();
 for(const patch of [{locks:null},{locks:{}},{crypto:null},{crypto:{randomUUID(){return 'fake'}}}]){
  await assert.rejects(submit({...options,...patch}),/B8_T072_/);
 }
 assert.equal(b.calls.length,0);
});
test('T072 untrusted owner ID or changed auth actor fails CLOSED before RPC',async()=>{
 const {b,options}=env();b.setActive(OTHER);
 await assert.rejects(submit(options),/CURRENT_ACTOR_MISMATCH_OR_EXPIRED/);
 await assert.rejects(submit({...options,ownerId:'notuuid'}),/OWNER_UUID_REQUIRED/);
 assert.equal(b.calls.length,0);
});
test('T072 no authenticated getUser or expired session: no legacy or proposed RPC call',async()=>{
 const {b,options}=env();
 await assert.rejects(submit({...options,client:{rpc:b.client.rpc}}),/AUTHENTICATED_CLIENT_REQUIRED/);
 assert.equal(b.calls.length,0);
});
test('T072 Storage unavailable, unverified durable write or invalid state must stop BEFORE rpc',async()=>{
 const {b,options,s}=env();
 await assert.rejects(submit({...options,storage:{
  getItem(){return null},setItem(){throw Error('quota')},removeItem(){}
 }}),/DURABLE_STORAGE_WRITE_FAILED/);
 await assert.rejects(submit({...options,storage:{
  getItem(){return null},setItem(){},removeItem(){}
 }}),/DURABLE_WRITE_NOT_VERIFIED/);
 s.setItem('JB:B8:T072:OWNER_CASE_REQUEST_V1:'+OWNER,'bad-json');
 await assert.rejects(submit(options),/DURABLE_STATE_CORRUPT/);
 assert.equal(b.calls.length,0);
});
test('T072 short title, malformed role lane and missing area rejected before RPC',async()=>{
 const {b,options}=env();
 for(const v of [{...payload,title:'short'},{...payload,lane:'R9'},
  {...payload,area:''},null]){
  await assert.rejects(submit({...options,payload:v}),/INVALID_CASE_INPUT/);
 }
 assert.equal(b.calls.length,0);
});
test('T072 new intent deletes state only after verified storage removal; no data leaks',async()=>{
 const {b,options,s}=env();
 await submit(options);
 const bad={getItem:k=>s.getItem(k),setItem:(k,v)=>s.setItem(k,v),removeItem:k=>{}};
 await assert.rejects(fresh({...options,storage:bad}),/DURABLE_CLEAR_NOT_VERIFIED/);
 assert.equal(b.calls.length,1);
 assert.equal(s.snapshot().length,1);
});
