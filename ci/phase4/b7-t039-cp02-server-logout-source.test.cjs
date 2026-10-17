'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const ui=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html','utf8');
const sql=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261016_b7_t039_portal_server_logout_REVIEW_ONLY.sql','utf8');
test('ADS041: local browser logout cannot falsely claim SERVER session revoked',()=>{
 assert.match(ui,/rpc\('jb_ad_portal_logout',\s*\{\s*p_token\s*:/);
 assert.doesNotMatch(ui,/addEventListener\('click',\(\)=>\{clear\(\);feedback\('आप लॉगआउट हो गए हैं।'\)/);
 assert.match(ui,/sessionStorage\.removeItem\(key\)/);
 assert.match(ui,/jb_ad_portal_logout/);
});
test('ADS041: backend logout revokes only exact 48hex session, never weakens other rights',()=>{
 assert.match(sql,/p_token !~ '\^\[0-9a-f\]\{48\}\$'/);
 assert.match(sql,/s\.token_hash=encode\(extensions\.digest\(p_token,'sha256'\),'hex'\)/);
 assert.match(sql,/and s\.revoked_at is null and s\.expires_at>now\(\)/);
 assert.match(sql,/return false/);
 assert.match(sql,/revoke all on function public\.jb_ad_portal_logout\(text\)/);
 assert.doesNotMatch(sql,/update public\.ad_campaigns/i);
 assert.doesNotMatch(sql,/update public\.ad_creatives/i);
 assert.doesNotMatch(sql,/update public\.ad_payments/i);
});
test('ADS041 final release gate: no hosted Owner or Android E3 PASS inferred from source',()=>{
 const m=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
 const t=m.canonical_tests.find(x=>x.id==='P4-T039');
 assert.equal(t.final_status,'DUE');
 assert.deepEqual(t.required_evidence,['E2','E3','E5']);
 assert.ok(m.ads.filter(x=>x.canonical_test==='P4-T039').every(x=>x.final_status==='DUE'));
});

test('ADS041 browser real handler: successful server logout revokes before a local success message',async()=>{
 await exerciseBrowserLogout(false);
});
test('ADS041 browser real handler: server RPC outage still clears local storage, never claims remote revoke',async()=>{
 await exerciseBrowserLogout(true);
});
async function exerciseBrowserLogout(serverUnavailable){
 const vm=require('node:vm');
 const dom=new Map(), storage=new Map(), calls=[];
 const node=id=>{
  if(!dom.has(id))dom.set(id,{
   value:'',hidden:false,disabled:false,textContent:'',listeners:{},
   addEventListener(event,cb){this.listeners[event]=cb}
  });
  return dom.get(id);
 };
 node('portalLogin').value='JB-TEST';
 node('portalSecret').value='temporary-only-local';
 const token='a'.repeat(48);
 const client={rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='jb_ad_portal_login')return{data:token,error:null};
  if(name==='jb_ad_portal_campaign')return{data:[{
   campaign_id:'aaaaaaaa-0000-0000-0000-000000000001',
   status:'approved',creative:null
  }],error:null};
  if(name==='jb_ad_portal_logout')return serverUnavailable?
   {data:null,error:{code:'PGRST202'}}:{data:true,error:null};
  throw Error('UNEXPECTED_PUBLIC_RPC_'+name);
 }};
 const ctx={
  document:{getElementById:node},sessionStorage:{
   getItem:k=>storage.get(k)||null,
   setItem:(k,v)=>storage.set(k,v),
   removeItem:k=>storage.delete(k)
  },
  window:{JBBackend:{client}},JBBackend:{client},
  Date,JSON,Number,Array,Error,RegExp
 };
 const script=ui.slice(ui.lastIndexOf('<script>')+8,ui.lastIndexOf('</script>'));
 assert.ok(script.startsWith('\n(function(){'),'EMBEDDED_PORTAL_SCRIPT_CHANGED');
 vm.runInNewContext(script,ctx,{timeout:1000});
 await node('loginForm').listeners.submit({
  preventDefault(){},
  target:{reportValidity:()=>true}
 });
 assert.equal(storage.size,1,'login stores the one browser-tab token');
 assert.equal(node('portalSection').hidden,false,'portal login succeeded');
 await node('logoutButton').listeners.click();
 assert.equal(storage.size,0,'logout immediately clears browser storage');
 assert.equal(node('portalSection').hidden,true);
 assert.equal(node('logoutButton').disabled,false);
 assert.equal(calls.filter(x=>x.name==='jb_ad_portal_logout').length,1,
  'logout makes exactly one server revoke request');
 assert.equal(calls.find(x=>x.name==='jb_ad_portal_logout').args.p_token,token);
 assert.equal(node('portalFeedback').hidden,false);
 const message=node('portalFeedback').textContent;
 assert.ok(serverUnavailable?message.includes('पुष्टि नहीं मिली'):
  message.includes('सर्वर दोनों पर'),message);
}
