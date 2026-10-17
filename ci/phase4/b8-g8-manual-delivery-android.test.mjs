import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createB8Workflow} from '../../JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.mjs';
const H='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECEIPT='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function fixture(role='owner',rejected=false,value=41){
 const calls=[];
 const client={rpc:async(name,args)=>{calls.push({name,args});return rejected?
  {data:null,error:{message:'Server denies'}}:{data:value,error:null}}};
 return {api:createB8Workflow({client,role}),calls};
}
test('Founder G8 offline attestation is server-returned audit id and never fake E9',async()=>{
 const {api,calls}=fixture();
 const a=await api.ownerAttestManualDelivery(H,RECEIPT,
  'Actual portal acknowledgement manually reviewed by authorized Founder');
 assert.equal(a.attestationEventId,'41');
 assert.equal(a.independentProviderAuthenticityVerified,false);
 assert.equal(a.externalMessageSentByApp,false);
 assert.equal(a.proofClass,'FOUNDER_REVIEWED_EXTERNAL_RECEIPT_OFFLINE');
 assert.deepEqual(calls[0],{name:'jb_b8_g8_owner_attest_manual_delivery',
  args:{p_handoff_id:H,p_receipt_id:RECEIPT,
   p_verification_basis:'Actual portal acknowledgement manually reviewed by authorized Founder'}});
});
test('G8 reporter/editor cannot attest; wrong uuid or short reason denied before RPC',async()=>{
 for(const role of ['editor','reporter']){
  const {api,calls}=fixture(role);
  await assert.rejects(api.ownerAttestManualDelivery(H,RECEIPT,
   'Reporter cannot independently confirm recipient delivery'),/B8_ROLE_OWNER_REQUIRED/);
  assert.equal(calls.length,0);
 }
 const {api,calls}=fixture();
 await assert.rejects(api.ownerAttestManualDelivery('invalid',RECEIPT,
  'Owner cannot attest missing handoff identifiers'),/B8_UUID_REQUIRED/);
 await assert.rejects(api.ownerAttestManualDelivery(H,RECEIPT,
  'short'),/B8_G8_FOUNDER_VERIFICATION_BASIS_REQUIRED/);
 assert.equal(calls.length,0);
});
test('G8 backend error/not an event id rejects, never prints success',async()=>{
 const down=fixture('owner',true);
 await assert.rejects(down.api.ownerAttestManualDelivery(H,RECEIPT,
  'Actual provider evidence verification attempted with backend down'),
  /B8_SERVER_REJECTED_jb_b8_g8_owner_attest_manual_delivery/);
 const falseSuccess=fixture('owner',false,null);
 await assert.rejects(falseSuccess.api.ownerAttestManualDelivery(H,RECEIPT,
  'Unverified or empty backend must not imply successful review'),/B8_EMPTY_SERVER_RESULT/);
});
test('G8 Founder form is role scoped with positive check and no automatic dispatch',async()=>{
 const base=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
 const [h,ui]=await Promise.all([
  readFile(new URL('b8-accountability.html',base),'utf8'),
  readFile(new URL('b8-accountability-ui.mjs',base),'utf8')]);
 assert(h.indexOf('id="g8Delivery"')<h.indexOf('<section id="reporter"'));
 assert(h.includes('id="g8Ack" type="checkbox" required'));
 assert(ui.includes('workflow.ownerAttestManualDelivery'));
 assert(ui.includes('if(!$(\'g8Ack\').checked)'));
 assert(ui.includes('App has not sent any message to the officer.'));
 assert(!ui.includes('.innerHTML='));
});
