import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {createB8Workflow} from '../../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
import {submitOwnerCaseIdempotentCandidate, startNewOwnerCaseIntentCandidate}
  from '../../../JANTA_BOL_PHASE_3C_WORKING/b8-owner-idempotency-client.js';

const OWNER='11111111-1111-1111-1111-111111111111';
const PG_FILE='ci/phase4/b11/t072-client-to-real-pg17-disposable-rpc.sql';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const env=process.env;
const confirmedDb=()=>assert.equal(env.PGDATABASE,'jb_t072_idempotent',
  'ABSOLUTE_NO_LIVE_DATABASE: disposable target required');
function psql(args=[]){
 confirmedDb();
 return execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1',...args],{
  encoding:'utf8',timeout:10000,env:{...env,PGDATABASE:'jb_t072_idempotent'},
  stdio:['ignore','pipe','pipe']
 }).trim();
}
function count(table){
 const allowed=['public.b8_cases','public.b8_owner_case_idempotency','public.articles','public.ad_campaigns'];
 assert(allowed.includes(table));
 return Number(psql(['-c','select count(*) from '+table+';']));
}
const makeStore=()=>{
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),
  value:()=>[...map.values()][0]??null};
};
const makeLocks=()=>({request:(name,{mode},fn)=>{assert.equal(mode,'exclusive');return fn()}});
function harness({actor=OWNER,aal='aal2',active='on'}={}){
 const store=makeStore(),locks=makeLocks(), calls=[];
 let override=null;
 const client={
  auth:{getUser:async()=>({data:{user:{id:actor}},error:null})},
  rpc:async(name,args)=>{
   assert.equal(name,'jb_b8_g1_owner_create_case_idempotent',
    'no downgrade to unsafe legacy RPC');
   calls.push({name,args});
   try{
    const out=psql(['-v','actor='+actor,'-v','active='+active,'-v','aal='+aal,
     '-v','request_id='+args.p_request_key,
     '-v','title='+args.p_title,'-v','area='+args.p_area_label,
     '-v','lane='+args.p_risk_lane,'-f',PG_FILE]);
    const id=out.split('\n').at(-1).trim();
    assert.match(id,UUID,'postgres must provide canonical case UUID');
    if(override==='throwAfterCommit'){override=null;throw Error('T072_TEST_ONLY_LOST_ACK_AFTER_DB_COMMIT');}
    if(override==='badGatewayAfterCommit'){override=null;return {data:null,error:{code:'502'}};}
    return {data:id,error:null};
   }catch(e){
    if(e?.message==='T072_TEST_ONLY_LOST_ACK_AFTER_DB_COMMIT')throw e;
    return {data:null,error:{message:'PG17_RPC_REJECTED'}}; // don't leak SQL details
   }
  }
 };
 const ownerCaseIdempotency={
  submit:({client,payload})=>submitOwnerCaseIdempotentCandidate({
    client,ownerId:OWNER,payload,storage:store,locks,crypto:webcrypto
  })
 };
 const workflow=createB8Workflow({client,role:'owner',ownerCaseIdempotency});
 const submit=()=>workflow.ownerCreateCase(
  'T072 real browser to PG17 Owner case retry', 'Pichhore', 'R1');
 return {client,store,locks,calls,submit,failNext:x=>override=x};
}
test('T072 actual original B8 client RPC writes exactly one case and one ledger in genuine PG17',async()=>{
 const before=count('public.b8_cases'),ledgers=count('public.b8_owner_case_idempotency');
 const x=harness(),id=await x.submit();
 assert.match(id,UUID);
 assert.equal(count('public.b8_cases'),before+1);
 assert.equal(count('public.b8_owner_case_idempotency'),ledgers+1);
 assert.equal(JSON.parse(x.store.value()).status,'CONFIRMED');
 assert.equal(x.calls.length,1);
 console.log('T072_ORIGINAL_B8_JS_TO_ACTUAL_PG17_ONE_REAL_CASE_LEDGER=PASS_SCOPED');
});
test('T072 real PG17 COMMIT followed by synthetic lost client ACK then retry same durable key NEVER duplicates',async()=>{
 const before=count('public.b8_cases'),ledgers=count('public.b8_owner_case_idempotency');
 const x=harness();x.failNext('throwAfterCommit');
 await assert.rejects(x.submit(),/SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY/);
 assert.equal(JSON.parse(x.store.value()).status,'PENDING');
 assert.equal(count('public.b8_cases'),before+1,'DB committed despite lost ACK');
 const recovered=await x.submit();
 assert.match(recovered,UUID);
 assert.equal(x.calls.length,2);
 assert.equal(x.calls[0].args.p_request_key,x.calls[1].args.p_request_key);
 assert.equal(count('public.b8_cases'),before+1,'ACK replay must not insert second real case');
 assert.equal(count('public.b8_owner_case_idempotency'),ledgers+1);
 console.log('T072_REAL_PG17_COMMIT_ACK_LOST_RETRY_ONE_CASE_SAME_KEY=PASS_SCOPED');
});
test('T072 502 UNKNOWN after genuine PostgreSQL commit retries safely without fake success',async()=>{
 const before=count('public.b8_cases');
 const x=harness();x.failNext('badGatewayAfterCommit');
 await assert.rejects(x.submit(),/SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY/);
 assert.equal(count('public.b8_cases'),before+1);
 assert.match(await x.submit(),UUID);
 assert.equal(count('public.b8_cases'),before+1);
 assert.equal(x.calls[0].args.p_request_key,x.calls[1].args.p_request_key);
 console.log('T072_REAL_PG17_502_UNKNOWN_RETRY_ONE_CASE=PASS_SCOPED');
});
test('T072 real Owner AAL1 and expired server session both deny private write + ledger',async()=>{
 for(const patch of [{aal:'aal1'},{active:'off'}]){
  const before=count('public.b8_cases'),ledgers=count('public.b8_owner_case_idempotency');
  const x=harness(patch);
  await assert.rejects(x.submit(),/SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY/);
  assert.equal(count('public.b8_cases'),before);
  assert.equal(count('public.b8_owner_case_idempotency'),ledgers);
 }
 console.log('T072_REAL_PG17_AAL1_AND_INACTIVE_SESSION_NO_WRITES=PASS_SCOPED');
});
test('T072 real PostgreSQL case cannot turn into different payload on same durable key',async()=>{
 const before=count('public.b8_cases');
 const x=harness();await x.submit();
 const client=createB8Workflow({client:x.client,role:'owner',ownerCaseIdempotency:{
  submit:({client,payload})=>submitOwnerCaseIdempotentCandidate({
   client,ownerId:OWNER,storage:x.store,locks:x.locks,crypto:webcrypto,payload
  })
 }});
 await assert.rejects(client.ownerCreateCase(
  'T072 CHANGED malicious different case title','Pichhore','R2'),
  /UNRESOLVED_PREVIOUS_INTENT_DIFFERENT_PAYLOAD/);
 assert.equal(count('public.b8_cases'),before+1);
 assert.equal(x.calls.length,1);
 console.log('T072_DURABLE_KEY_PAYLOAD_TAMPER_NO_REAL_POSTGRES_SECOND_WRITE=PASS_SCOPED');
});
test('T072 only explicit CONFIRMED new Owner intent may create a genuine distinct case',async()=>{
 const before=count('public.b8_cases');
 const x=harness();await x.submit();
 await startNewOwnerCaseIntentCandidate({
  client:x.client,ownerId:OWNER,storage:x.store,locks:x.locks,crypto:webcrypto
 });
 await x.submit();
 assert.notEqual(x.calls[0].args.p_request_key,x.calls[1].args.p_request_key);
 assert.equal(count('public.b8_cases'),before+2);
 console.log('T072_POSTGRES_TWO_REAL_INTENTIONAL_DISTINCT_OWNER_CASES=PASS_SCOPED');
});
test('T072 actual old synthetic News and Ads survive all real PG17 client replay tests',()=>{
 confirmedDb();
 assert.equal(count('public.articles'),1,'fixture original news must remain');
 assert.equal(count('public.ad_campaigns'),1,'fixture original ads must remain');
 assert.match(psql(['-c',"select headline from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;"]),/Existing News Article/);
 console.log('T072_REAL_PG17_SOURCE_NEWS_AD_IDENTITIES_UNCHANGED=PASS_SCOPED');
});
