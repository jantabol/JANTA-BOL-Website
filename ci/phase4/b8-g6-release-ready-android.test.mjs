import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js';
const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECEIPT='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
function fixture(role,reply={},fail=false,allowPrivateUpload=false){
 const calls=[];
 const client={
   rpc:async(name,args)=>{
     calls.push({name,args});
     if(fail)return {data:null,error:{message:'fake backend denied'}};
     const responses={
       jb_b8_g6_owner_set_private_upload:args.p_enable,
       jb_b8_g6_reporter_private_upload_readiness:{
         case_id:CASE,allowed:false,max_bytes:8388608,
         truth:'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_AUTHENTICITY'
       }
     };
     return {data:Object.hasOwn(reply,name)?reply[name]:responses[name],error:null};
   },
   auth:{getSession:async()=>({data:{session:{access_token:'synthetic_test'}}})},
   functions:{invoke:async()=>({data:{ok:true,receiptId:RECEIPT,byteCount:20,
     proof:'PRIVATE_READBACK_SHA256_ONLY',documentaryAuthenticityVerified:false},
     error:null})}
 };
 return {api:createB8Workflow({client,role,allowPrivateUpload}),calls};
}
test('Owner AAL2 release RPC exact and 12-character decision reason needed',async()=>{
 const {api,calls}=fixture('owner');
 assert.equal((await api.ownerSetPrivateUploadRelease(true,
  'Founder reviewed actual backend and bounded storage')).enabled,true);
 assert.equal((await api.ownerSetPrivateUploadRelease(false,
  'Emergency disable prevents late upload finalize')).enabled,false);
 assert.deepEqual(calls.map(x=>x.name),[
  'jb_b8_g6_owner_set_private_upload','jb_b8_g6_owner_set_private_upload']);
 await assert.rejects(api.ownerSetPrivateUploadRelease(true,'short'),/B8_G6_RELEASE_REASON_REQUIRED/);
});
test('Reporter or Editor cannot toggle release nor Owner read assigned Reporter upload readiness',async()=>{
 for(const role of ['reporter','editor']){
  const {api,calls}=fixture(role);
  await assert.rejects(api.ownerSetPrivateUploadRelease(true,
   'Wrong actor does not own a release decision'),/B8_ROLE_OWNER_REQUIRED/);
  if(role==='editor'){
   await assert.rejects(api.reporterPrivateUploadReadiness(CASE),/B8_ROLE_REPORTER_REQUIRED/);
  }
  assert.equal(calls.length,0);
 }
 const {api:owner,calls:oc}=fixture('owner');
 await assert.rejects(owner.reporterPrivateUploadReadiness(CASE),/B8_ROLE_REPORTER_REQUIRED/);
 assert.equal(oc.length,0);
});
test('Reporter trusted denied readiness does not claim release',async()=>{
 const {api,calls}=fixture('reporter');
 const r=await api.reporterPrivateUploadReadiness(CASE);
 assert.equal(r.allowed,false);
 assert.equal(r.maxBytes,8388608);
 assert.equal(calls[0].args.p_case_id,CASE);
});
test('Forged/cross-case readiness and false authenticity refused',async()=>{
 const fake=(caseId,auth,allowed)=>({
  jb_b8_g6_reporter_private_upload_readiness:{
    case_id:caseId,allowed,max_bytes:8388608,truth:auth
  }
 });
 const wrong=fixture('reporter',fake(RECEIPT,
  'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_AUTHENTICITY',true));
 await assert.rejects(wrong.api.reporterPrivateUploadReadiness(CASE),
  /B8_G6_UNTRUSTED_RELEASE_READINESS/);
 const falseOfficial=fixture('reporter',fake(CASE,'OFFICIAL_AUTHENTICITY_VERIFIED',true));
 await assert.rejects(falseOfficial.api.reporterPrivateUploadReadiness(CASE),
  /B8_G6_UNTRUSTED_RELEASE_READINESS/);
});
test('Release-readiness RPC outage fails closed; no file upload on default client',async()=>{
 const {api}=fixture('reporter',{},true);
 await assert.rejects(api.reporterPrivateUploadReadiness(CASE),
  /B8_SERVER_REJECTED_jb_b8_g6_reporter_private_upload_readiness/);
 const {api:defaultClient}=fixture('reporter');
 await assert.rejects(defaultClient.reporterUploadCaseEvidence(CASE,{
  type:'image/png',size:20,name:'test photo.png',
  arrayBuffer:async()=>new ArrayBuffer(20)}),/B8_UPLOAD_HOSTED_GATE_NOT_APPROVED/);
});
test('Review-only Android UI has Founder release switch, reporter case readiness, no auto uploads',async()=>{
 const dir=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [html,ui]=await Promise.all([
  readFile(new URL('b8-accountability.html',dir),'utf8'),
  readFile(new URL('b8-accountability-ui.js',dir),'utf8')]);
 assert(html.includes('id="g6Release"'));
 assert(html.includes('id="g6ReleaseAck"'));
 assert(html.indexOf('id="g6Release"')<html.indexOf('<section id="reporter"'));
 assert(html.includes('id="uploadBtn" type="submit" disabled'));
 assert(ui.includes('workflow.reporterPrivateUploadReadiness(c.id)'));
 assert(ui.includes('workflow.reporterUploadCaseEvidence(c,file)'));
 assert(ui.includes('if(!gate.allowed)'));
 assert(ui.includes("if(!uploadReadyCase||uploadReadyCase!==c)"));
 assert(ui.includes("uploadReadyCase=null"));
 assert(ui.includes("uploadFile').value=''"));
 assert(ui.includes('15*60*1000'));
 assert(!ui.includes('localStorage.'));
 assert(!ui.includes('.innerHTML='));
});
