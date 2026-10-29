import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createB8Workflow} from '../../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
import {submitOwnerCaseIdempotentCandidate}
  from '../../../JANTA_BOL_PHASE_3C_WORKING/b8-owner-idempotency-client.js';

const ROOT='JANTA_BOL_PHASE_3C_WORKING/';
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER='11111111-1111-4111-8111-111111111111';
const title='Verified district water works public case';
const area='Pichhore';
const lane='R1';
const makeStorage=()=>{
 const m=new Map();
 return {
  getItem:k=>m.has(k)?m.get(k):null,
  setItem:(k,v)=>m.set(k,v),
  removeItem:k=>m.delete(k),
  entries:()=>[...m]
 };
};
const makeLocks=()=>({
 request:async(name,opt,action)=>{assert.equal(opt.mode,'exclusive');return action()}
});
const fakeClient=(reply=ID)=>({
 calls:[],
 auth:{getUser:async()=>({data:{user:{id:OWNER}},error:null})},
 async rpc(name,args){
   this.calls.push({name,args});
   return typeof reply==='function'?reply(name,args):{data:reply,error:null};
 }
});
test('T072 original B8 app opt-in uses only proposed 4-arg backend and preserves complete validation',async()=>{
 const client=fakeClient(), storage=makeStorage(),locks=makeLocks();
 const adapter={submit:({client,payload})=>submitOwnerCaseIdempotentCandidate({
  client,ownerId:OWNER,payload,storage,locks,crypto:webcrypto
 })};
 const app=createB8Workflow({client,role:'owner',ownerCaseIdempotency:adapter});
 assert.equal(await app.ownerCreateCase(title,area,lane),ID);
 assert.equal(client.calls.length,1);
 assert.equal(client.calls[0].name,'jb_b8_g1_owner_create_case_idempotent');
 assert.equal(client.calls[0].args.p_title,title);
 assert.equal(client.calls[0].args.p_area_label,area);
 assert.equal(client.calls[0].args.p_risk_lane,lane);
 assert.equal(storage.entries().length,1);
 assert.equal(JSON.parse(storage.entries()[0][1]).status,'CONFIRMED');
 assert(!JSON.stringify(storage.entries()).includes(title));
});
test('T072 missing protected backend RPC never falls back to duplicate-prone old RPC',async()=>{
 const client=fakeClient(()=>({data:null,error:{code:'PGRST202',message:'rpc missing'}}));
 const storage=makeStorage(),locks=makeLocks();
 const adapter={submit:({client,payload})=>submitOwnerCaseIdempotentCandidate({
  client,ownerId:OWNER,payload,storage,locks,crypto:webcrypto
 })};
 const app=createB8Workflow({client,role:'owner',ownerCaseIdempotency:adapter});
 await assert.rejects(app.ownerCreateCase(title,area,lane),
  /B8_T072_SERVER_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST_KEY/);
 assert.equal(client.calls.length,1);
 assert.deepEqual(client.calls.map(x=>x.name),['jb_b8_g1_owner_create_case_idempotent']);
 assert.equal(JSON.parse(storage.entries()[0][1]).status,'PENDING');
});
test('T072 no optional adapter method is fail closed before any old RPC',async()=>{
 const client=fakeClient();
 const app=createB8Workflow({client,role:'owner',ownerCaseIdempotency:{}});
 await assert.rejects(app.ownerCreateCase(title,area,lane),/B8_IDEMPOTENCY_ADAPTER_REQUIRED/);
 assert.equal(client.calls.length,0);
});
test('T072 legacy callers keep their old API unchanged only when not using new UI opt-in',async()=>{
 const client=fakeClient();
 const app=createB8Workflow({client,role:'owner'});
 assert.equal(await app.ownerCreateCase(title,area,lane),ID);
 assert.equal(client.calls[0].name,'jb_b8_g1_owner_create_case');
 assert.deepEqual(client.calls[0].args,{p_title:title,p_area_label:area,p_risk_lane:lane});
});
test('T072 injected adapter cannot give Editor or Reporter Owner create authority',async()=>{
 for(const role of ['editor','reporter']){
   const client=fakeClient(),adapter={submit:()=>{throw Error('INVOKED');}};
   const app=createB8Workflow({client,role,ownerCaseIdempotency:adapter});
   await assert.rejects(app.ownerCreateCase(title,area,lane),/B8_ROLE_OWNER_REQUIRED/);
   assert.equal(client.calls.length,0);
 }
});
test('T072 B8 UI explicitly opts Owner only into safe mode and wires immutable helper',()=>{
 const ui=readFileSync(ROOT+'b8-accountability-ui.js','utf8');
 const html=readFileSync(ROOT+'b8-accountability.html','utf8');
 const code=readFileSync(ROOT+'b8-accountability-client.js','utf8');
 assert.match(ui,/from '\.\/b8-owner-idempotency-client\.js'/);
 assert.match(ui,/ownerCaseIdempotency:role==='owner'\?t072CaseCreate:null/);
 assert.match(ui,/startNewOwnerCaseIntentCandidate\(opts\)/);
 assert.match(ui,/B8_T072_SCREEN_LOCKED_AFTER_SERVER_RESPONSE/);
 assert.match(ui,/await client\.auth\.getUser\(\)/);
 assert.match(ui,/locks:navigator\.locks,crypto:window\.crypto/);
 assert.match(html,/id="t072NewCaseIntent" type="button"/);
 assert.match(html,/Retry/);
 assert.match(code,/if\(ownerCaseIdempotency!==null\)/);
 assert.match(code,/jb_b8_g1_owner_create_case/); // old ABI preserved only for legacy callers
 assert(!ui.includes('localStorage.'));
 assert(!ui.includes('.innerHTML='));
 assert(!html.includes('onclick='));
});
test('T072 original private Owner 15-min lock, Role revalidation and full forms remain',()=>{
 const ui=readFileSync(ROOT+'b8-accountability-ui.js','utf8');
 const html=readFileSync(ROOT+'b8-accountability.html','utf8');
 assert.match(ui,/LOCK_MS=15\*60\*1000/);
 assert.match(ui,/window\.JBBackend\.requireOwner\(\)/);
 assert.match(ui,/window\.JBBackend\.role\(\)/);
 assert.match(ui,/function lock\(reason\)/);
 assert.match(ui,/ownerKnownCases=\[\]/);
 assert.match(ui,/form\('createCase'/);
 assert.match(html,/id="owner"/);
 assert.match(html,/id="reporter"/);
 assert.match(html,/id="editor"/);
 assert.match(html,/id="uploadBtn" type="submit" disabled/);
 assert.match(ui,/B8_DATABASE_NOT_DEPLOYED_OR_PARTIAL_G0_G9/);
});
