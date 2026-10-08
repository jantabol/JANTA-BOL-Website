'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../JANTA_BOL_PHASE_3C_WORKING/backend-client.js'),'utf8');
async function run(){
  const state={article:{id:'synthetic-t019',slug:'jb-t019',title:'Synthetic',body:'Test',status:'draft',version:3},source:{article_id:'synthetic-t019'},complianceDown:true,role:'owner',aal:'aal2',writes:[],calls:[]};
  const storage=new Map();
  const clone=()=>JSON.parse(JSON.stringify({article:state.article,source:state.source}));
  function query(table){
    const op={table,kind:'select',patch:null,filters:[]};
    const api={
      select(){if(op.kind==='none')op.kind='select';return api},
      update(p){op.kind='update';op.patch=p;return api},
      upsert(p){op.kind='upsert';op.patch=p;return api},
      insert(p){op.kind='insert';op.patch=p;return api},
      eq(k,v){op.filters.push([k,v]);return api},
      maybeSingle(){op.single=true;return api},
      then(resolve,reject){
        const work=()=>{
          state.calls.push({table,kind:op.kind});
          if(table.startsWith('compliance'))return state.complianceDown ? {data:null,error:new Error('SIMULATED_COMPLIANCE_OUTAGE')} : {data:[],error:null};
          if(table==='user_roles')return {data:{role:state.role},error:null};
          if(table==='articles'){
            if(op.kind==='update'){
              if(op.filters.some(([k,v])=>k==='version'&&v!==state.article.version))return {data:[],error:null};
              state.article={...state.article,...op.patch};state.writes.push({table,kind:op.kind});return {data:[{...state.article}],error:null};
            }
            return {data:op.single?{...state.article}:[{...state.article}],error:null};
          }
          if(table==='article_sources'){
            if(op.kind==='upsert'){state.source={...op.patch};state.writes.push({table,kind:op.kind});return {data:null,error:null}}
            return {data:op.single?{...state.source}:[{...state.source}],error:null};
          }
          if(table==='verification_history'){state.writes.push({table,kind:op.kind});return {data:null,error:null}}
          throw new Error('Unexpected table '+table);
        };
        return Promise.resolve().then(work).then(resolve,reject);
      }
    };
    return api;
  }
  const client={from:query,auth:{getSession:async()=>({data:{session:{user:{id:'synthetic-owner'}}},error:null}),mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:state.aal},error:null})}}};
  const global={supabase:{createClient:()=>client},JB_SUPABASE_CONFIG:{url:'https://invalid.example',publishableKey:'synthetic'},location:{href:'https://invalid.example'},crypto:{randomUUID:()=> 'synthetic-id'}};
  const context={window:global,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{onLine:true},document:{createElement:()=>({innerHTML:'',set textContent(x){this.innerHTML=x}})},URL,Date,JSON,console,crypto:global.crypto};
  vm.runInNewContext(source,context,{filename:'backend-client.js',timeout:3000});
  const backend=global.JBBackend;
  assert(backend?.publish,'Real backend publish function must load');
  const article={id:'synthetic-t019',slug:'jb-t019',headline:'Synthetic',content:'Test',internalSource:{verificationStatus:'Pending Verification'}};
  const original=clone();
  state.role='reporter';
  await assert.rejects(()=>backend.publish(article,{expectedVersion:3}),/OWNER_REQUIRED/);
  assert.deepEqual(clone(),original,'Reporter must not modify article');
  state.role='owner';state.aal='aal1';
  await assert.rejects(()=>backend.publish(article,{expectedVersion:3}),/AAL2_REQUIRED/);
  assert.deepEqual(clone(),original,'AAL1 must not modify article');
  state.aal='aal2';
  const compliance=await client.from('compliance_tasks').select('*');
  assert.match(compliance.error.message,/SIMULATED_COMPLIANCE_OUTAGE/);
  const result=await backend.publish(article,{expectedVersion:3});
  assert.equal(result.status,'published','Publishing must succeed during simulated compliance outage');
  assert.equal(state.article.status,'published');
  assert(!state.calls.some(x=>x.table.startsWith('compliance')&&x.kind!=='select'),'No compliance mutation');
  const saved=clone();
  await assert.rejects(()=>backend.publish(article,{expectedVersion:999}),/VERSION_CONFLICT/);
  assert.deepEqual(clone(),saved,'Version conflict must not corrupt stored data');
  state.complianceDown=false;
  const recoveredCompliance=await client.from('compliance_tasks').select('*');
  assert.equal(recoveredCompliance.error,null,'Compliance API mock must recover');
  const recovered=await backend.getArticle('synthetic-t019',{privateData:true});
  assert.equal(recovered.status,'published','Published article readable after simulated recovery');
  console.log('PASS [P4-T019-MOCK] compliance outage + owner/AAL2 denial + publish + conflict integrity + recovery');
  console.log('LIMITATION: isolated mocked Supabase API, NOT live backend fault-injection evidence.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
