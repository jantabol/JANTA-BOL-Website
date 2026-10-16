'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm');
const adsHtml=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
const adminHtml=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/admin.html','utf8');
const adsScript=adsHtml.split("<script>'use strict';")[1]?.split('</script>')[0];
const adminScript=adminHtml.match(/<script>\s*(async function jbRecoveryPhysicalReminder\(\)[\s\S]*?)<\/script>/)?.[1];
assert.ok(adsScript&&adminScript,'expected exact old Owner scripts must remain');
function elements(){
 const all=new Map();
 const get=id=>{
  if(!all.has(id))all.set(id,{textContent:'',innerHTML:'',value:'',hidden:false,id});
  return all.get(id);
 };
 return get;
}
function adHarness(records){
 const get=elements();
 const context=vm.createContext({
  window:{addEventListener(){}},addEventListener(){},
  document:{documentElement:{dataset:{jbAuth:'pending'}},getElementById:get},
  JBBackend:{esc:x=>String(x??'')},
  JBPhase4:{adRows:async()=>records},
  JBAdMediaPreview:{dispose(){}},Set,Date,Intl,alert(){}
 });
 vm.runInContext("'use strict';"+adsScript,context);
 return {context,get};
}
function adminHarness(){
 const get=elements();
 let latest={id:'r1',created_at:'2026-10-13T09:25:34Z'},count=2,unavailable=false;
 const api={
  from(table){
   assert.equal(table,'ad_campaigns');
   if(unavailable)throw Error('NO_CONNECTION');
   return {select(cols,opts){
    assert.equal(cols,'id,created_at');
    assert.equal(opts.count,'exact');
    return {eq(column,value){
     assert.equal(column,'status');assert.equal(value,'requested');
     return {order(field,opts){
      assert.equal(field,'created_at');assert.equal(opts.ascending,false);
      return {limit(n){
       assert.equal(n,1);
       return Promise.resolve({data:latest?[latest]:[],count,error:null});
      }};
     }};
    }};
   }};
  }
 };
 const context=vm.createContext({
  document:{documentElement:{dataset:{jbAuth:'ready'}},hidden:false,getElementById:get},
  JBBackend:{client:api,recoveryPhysicalStatus:async()=>({due:false})},
  addEventListener(){},setInterval(){return 1},Date,Intl
 });
 vm.runInContext(adminScript,context);
 return {context,get,
  update(id,n){latest={id,created_at:'2026-10-13T10:26:34Z'};count=n},
  fail(){unavailable=true}
 };
}
test('ADS006 Owner Request Queue ABOVE forms and notification counts never fabricated',()=>{
 assert.ok(adsHtml.indexOf('id="adPendingQueue"')<adsHtml.indexOf('New advertiser request'));
 assert.equal((adsHtml.match(/id="rows"/g)||[]).length,1);
 assert.ok(adminHtml.includes('id="jbAdsPendingCount"'));
 assert.ok(adminHtml.includes('id="jbAdsNewRequestAlert"'));
});
test('ADS006 immutable server UTC timestamp renders IST, never raw UTC; custom REQUEST first',async()=>{
 const rows=[
  {id:'old',created_at:'2026-10-13T08:00:00Z',status:'requested',
   request_kind:'standard',advertisers:{name:'A standard'}},
  {id:'new',created_at:'2026-10-13T09:25:34Z',status:'requested',
   request_kind:'custom',advertisers:{name:'B custom'}},
  {id:'done',created_at:'2026-10-13T10:10:34Z',status:'live',
   request_kind:'standard',advertisers:{name:'C already live'}}
 ];
 const {context,get}=adHarness(rows);
 assert.match(context.adSubmittedIST('2026-10-13T09:25:34Z'),/IST/);
 assert.notEqual(context.adSubmittedIST('2026-10-13T09:25:34Z'),'2026-10-13T09:25:34Z');
 assert.match(context.adSubmittedIST(null),/unavailable/);
 await vm.runInContext('load()',context);
 const html=get('rows').innerHTML;
 assert.equal(get('adPendingCount').textContent,'Pending 2');
 assert.ok(html.indexOf('B custom')<html.indexOf('A standard'));
 assert.ok(html.indexOf('A standard')<html.indexOf('C already live'));
 assert.match(html,/Type: CUSTOM/);
 assert.match(html,/Received: .*?IST/);
 assert.doesNotMatch(html,/Submitted: 2026-10-13T09:25/);
});
test('ADS006 backend failure never claims zero Pending Requests',async()=>{
 const {context,get}=adHarness([]);
 context.JBPhase4.adRows=async()=>{throw Error('BACKEND_NOT_READY')};
 await vm.runInContext('load()',context);
 assert.equal(get('adPendingCount').textContent,'Queue unavailable');
 assert.match(get('rows').textContent,/unavailable/i);
});
test('ADS006 admin AAL2-ready pending count and new arrival alert are read-only',async()=>{
 const {context,get,update,fail}=adminHarness();
 await vm.runInContext('jbAdsDashboardPending()',context);
 assert.equal(get('jbAdsPendingCount').textContent,'📬 2 Pending');
 assert.match(get('jbAdsNewRequestAlert').textContent,/IST/);
 update('r2',3);
 await vm.runInContext('jbAdsDashboardPending()',context);
 assert.equal(get('jbAdsPendingCount').textContent,'📬 3 Pending');
 assert.match(get('jbAdsNewRequestAlert').textContent,/नई विज्ञापन Request/);
 fail();
 await vm.runInContext('jbAdsDashboardPending()',context);
 assert.equal(get('jbAdsPendingCount').textContent,'Status unavailable');
 assert.doesNotMatch(get('jbAdsNewRequestAlert').textContent,/कोई Pending/);
});
test('ADS006 genuine server-side notification gate stays DUE; client does not pretend send/push',()=>{
 assert.doesNotMatch(adminScript,/new Notification\(|navigator\.serviceWorker|sendNotification|deliver[_A-Z]/);
 assert.match(adminScript,/separate/);
});

test('E7: Owner can retrieve reviewed request alongside all canonical campaign statuses',async()=>{
 const rows=[
  {id:'req1',created_at:'2026-10-16T03:00:00Z',status:'requested',advertisers:{name:'New A',verification_state:'pending'}},
  {id:'req2',created_at:'2026-10-16T04:00:00Z',status:'requested',advertisers:{name:'New B',verification_state:'pending'}},
  {id:'req3',created_at:'2026-10-16T05:00:00Z',status:'requested',advertisers:{name:'New C',verification_state:'pending'}},
  {id:'req4',created_at:'2026-10-16T06:00:00Z',status:'requested',advertisers:{name:'New D',verification_state:'pending'}},
  {id:'review1',created_at:'2026-10-13T09:25:34Z',status:'review',advertisers:{name:'E7 reviewed request',verification_state:'pending'}},
  {id:'due1',created_at:'2026-10-10T09:00:00Z',status:'payment_pending',advertisers:{name:'Payment due A',verification_state:'verified'}},
  {id:'due2',created_at:'2026-10-10T09:10:00Z',status:'payment_pending',advertisers:{name:'Payment due B',verification_state:'verified'}}
 ];
 let reads=0;
 const {context,get}=adHarness(rows);
 context.JBPhase4.adRows=async()=>{reads++;return rows};
 await vm.runInContext('load()',context);
 assert.equal(reads,1);
 assert.equal(get('adPendingCount').textContent,'Pending 4');
 assert.match(get('adOwnerQueueSummary').textContent,/All 7 · New 4 · Review 1 · Payment pending 2/);
 const all=get('rows').innerHTML;
 assert.match(all,/E7 reviewed request/);
 assert.match(all,/id="s-review1"/);
 assert.match(all,/Record verification/);
 assert.match(all,/Payment due A/);
 assert.ok(all.indexOf('New D')<all.indexOf('E7 reviewed request'),'requested first');
 get('adOwnerStatusFilter').value='review';
 await vm.runInContext('load()',context);
 assert.equal(reads,2);
 assert.equal(get('adPendingCount').textContent,'Pending 4','filter does not change pending count');
 const onlyReview=get('rows').innerHTML;
 assert.match(onlyReview,/E7 reviewed request/);
 assert.match(onlyReview,/verification pending/);
 assert.match(onlyReview,/id="s-review1"/);
 assert.doesNotMatch(onlyReview,/New D|Payment due A|Payment due B/);
 get('adOwnerStatusFilter').value='requested';
 await vm.runInContext('load()',context);
 assert.doesNotMatch(get('rows').innerHTML,/E7 reviewed request/);
 assert.match(get('rows').innerHTML,/New D/);
 get('adOwnerStatusFilter').value='all';
 await vm.runInContext('load()',context);
 assert.match(get('rows').innerHTML,/E7 reviewed request/);
});

test('E7 Owner status filter never issues mutations; fetch failure is fail-closed',async()=>{
 const {context,get}=adHarness([{id:'review1',status:'review',advertisers:{name:'Reviewed E7'}}]);
 context.JBPhase4.adMove=()=>{throw Error('UNEXPECTED_MUTATION')};
 context.JBPhase4.adVerifyAdvertiser=()=>{throw Error('UNEXPECTED_VERIFICATION')};
 get('adOwnerStatusFilter').value='review';
 await vm.runInContext('load()',context);
 assert.match(get('rows').innerHTML,/Reviewed E7/);
 context.JBPhase4.adRows=async()=>{throw Error('SIMULATED_OWNER_RLS_FAILURE')};
 await vm.runInContext('load()',context);
 assert.equal(get('adPendingCount').textContent,'Queue unavailable');
 assert.match(get('adOwnerQueueSummary').textContent,/Queue unavailable/);
 assert.match(get('rows').textContent,/unavailable/i);
});

test('E7 read remains owner-guarded and never restricts backend to requested only',()=>{
 const source=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8');
 const match=source.match(/async function adRows\(\)\{([^}]+)\}/);
 assert.ok(match,'existing canonical owner read must remain');
 assert.match(match[1],/await owner\(\)/);
 assert.match(match[1],/\.from\('ad_campaigns'\)/);
 assert.doesNotMatch(match[1],/\.eq\(['"]status['"],\s*['"]requested['"]\)/);
 assert.ok(adsHtml.includes('id="adOwnerStatusFilter"'));
});
