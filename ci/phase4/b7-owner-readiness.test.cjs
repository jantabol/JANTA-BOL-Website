'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
const script=html.split("<script>'use strict';")[1]?.split('</script>')[0];
if(!script)throw Error('OWNER_SCRIPT_MISSING');
const scope=vm.createContext({document:{documentElement:{dataset:{jbAuth:'pending'}},getElementById(){return {}}},
 window:{addEventListener(){}},addEventListener(){},JBBackend:{esc:x=>x},JBPhase4:{},
 JBAdMediaPreview:{dispose(){}},Intl,Date,Set});
vm.runInContext("'use strict';"+script,scope);
test('BE16 missing RPC code is classified without inventing availability',()=>{
 const t=scope.b7OwnerReadFailure({code:'PGRST202'},'Analytics');
 assert.match(t,/not deployed/);assert.match(t,/DUE/);
});
test('BE16 unauthorized Owner/AAL2 failure cannot be called empty data',()=>{
 const t=scope.b7OwnerReadFailure({code:'42501'},'Notifications');
 assert.match(t,/Owner\/AAL2 access denied/);assert.match(t,/DUE/);
});
test('BE16 arbitrary server errors do not expose raw SQL, stack or secret',()=>{
 const t=scope.b7OwnerReadFailure({code:'UNKNOWN',message:'topsecret DATABASE password'},'Renewal');
 assert.doesNotMatch(t,/topsecret|password|DATABASE/);
 assert.match(t,/NOT PASS/);
});
test('BE01..04 function failures remain fail-closed instead of fabricating counts',()=>{
 assert.match(html,/b7OwnerReadFailure\(e,'Qualified analytics'\)/);
 assert.match(html,/b7OwnerReadFailure\(e,'Renewal queue'\)/);
 assert.match(html,/b7OwnerReadFailure\(e,'Change-request queue'\)/);
 assert.match(html,/b7OwnerReadFailure\(e,'Notification issues queue'\)/);
 assert.doesNotMatch(html,/Qualified analytics unavailable until secure backend/);
});
test('ENV02 advertiser portal uses relative same-tab link to avoid localhost new-tab handoff',()=>{
 assert.match(html,/href="advertiser-portal\.html">Advertiser portal page/);
 assert.doesNotMatch(html,/href="advertiser-portal\.html" target="_blank"/);
});
