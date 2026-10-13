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
