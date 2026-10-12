'use strict';
const t=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8');
function stub(owner=true){
 const calls=[],window={};
 window.JBBackend={client:{rpc:async(name,args)=>{calls.push({name,args});return {data:true,error:null}}},
 requireOwner:async()=>{if(!owner)throw Error('OWNER_AAL2_REQUIRED')}};
 vm.runInNewContext(src,{window,Error,Number,Date,String,Array,Object});
 return {phase:window.JBPhase4,calls};
}
t('BE09 old 3-input payment helper denied even when Owner AAL2 true',async()=>{
 const x=stub(true);
 await assert.rejects(()=>x.phase.adConfirmPayment('id','FAKE-UTR',50000),
 /B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE/);
 assert.equal(x.calls.length,0,'never call weak live 3-field confirmed RPC');
 assert.equal(typeof x.phase.adConfirmPayment,'function','API name preserved, fail closed');
});
t('BE09 Ownerless old payment helper denies before any backend write',async()=>{
 const x=stub(false);
 await assert.rejects(()=>x.phase.adConfirmPayment('id','SPOOF',50000),
 /OWNER_AAL2_REQUIRED/);
 assert.equal(x.calls.length,0);
});
t('BE09 explicit manual receipt/consent command remains as the one UI Owner path',()=>{
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
 assert.ok(html.includes('JBPhase4.adConfirmManualPayment(id,'));
 assert.ok(!html.includes('JBPhase4.adConfirmPayment('));
 assert.ok(src.includes("rpc('jb_ad_confirm_manual_payment_internal'"));
 assert.ok(!src.includes("rpc('jb_ad_confirm_payment_internal'"));
 assert.ok(src.includes("function adConfirmManualPayment("));
});
