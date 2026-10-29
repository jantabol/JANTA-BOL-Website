'use strict';
// REVIEW-ONLY; never reaches live Supabase Auth, sends credentials, or changes sessions.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../..');
const V3 = path.join(ROOT, 'JANTA_BOL_PHASE_3C_WORKING');
const guard = fs.readFileSync(path.join(V3, 'admin-auth.js'), 'utf8');
const safeNav = fs.readFileSync(path.join(V3, 'b12-safe-nav.js'), 'utf8');
const loginHtml = fs.readFileSync(path.join(V3, 'admin-login.html'), 'utf8');
const protectedHtml = fs.readFileSync(path.join(V3, 'admin.html'), 'utf8');

function fakeAuthContext({hasSession=true,role='owner',aal='aal2',serverValid=true,lastActivity=Date.now(),outage=null}={}) {
  const state={redirects:[],ready:false,guardUnavailable:false,denied:false,events:[]};
  const data=new Map([['jbAdminLastActivity',String(lastActivity)]]);
  const document={
    body:{innerHTML:''},
    documentElement:{dataset:{}},
    getElementById:()=>null,
  };
  const location={
    pathname:'/JANTA_BOL_PHASE_3C_WORKING/admin.html',
    search:'',
    replace(path){state.redirects.push(path)},
    reload(){state.events.push('reload')}
  };
  const backend={
    async session(){if(outage==='session')throw new Error('AUTH_PROVIDER_UNAVAILABLE');return hasSession?{access_token:'SYNTHETIC-NOT-REAL'}:null;},
    async role(){if(outage==='role')throw new Error('AUTH_PROVIDER_UNAVAILABLE');return role;},
    async mfaAAL(){if(outage==='aal')throw new Error('AUTH_PROVIDER_UNAVAILABLE');return {currentLevel:aal};},
    async serverSessionValid(){if(outage==='server')throw new Error('AUTH_PROVIDER_UNAVAILABLE');return serverValid;}
  };
  const context={
    JBBackend:backend,
    location,
    localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))},
    document,
    addEventListener:(event)=>state.events.push(event),
    dispatchEvent:()=>{},
    setInterval:()=>{},
    setTimeout:(cb)=>{cb();return 1;},
    Event:class{},
    console:{error:()=>{}}
  };
  vm.runInNewContext(guard,context,{filename:'admin-auth.js',timeout:2000});
  return {state,document};
}
async function outcome(options) {
  const {state,document}=fakeAuthContext(options);
  // Security gate is async and retries up to three times.
  await new Promise(resolve=>setImmediate(resolve));
  if(state.redirects.some(x=>x.includes('locked=1')))return 'LOCAL_LOCK';
  if(state.redirects.some(x=>x.includes('reason=aal2')))return 'MFA_REQUIRED';
  if(state.redirects.some(x=>x.includes('reason=session')))return 'LOGIN_REQUIRED';
  if(document.body.innerHTML.includes('Access denied'))return 'ROLE_DENIED';
  if(document.body.innerHTML.includes('Security check temporarily unavailable'))return 'FAIL_CLOSED';
  if(document.documentElement.dataset.jbAuth==='ready')return 'READY';
  return 'UNRESOLVED';
}
const scenarios=[
  ['anonymous requires login', {hasSession:false},'LOGIN_REQUIRED'],
  ['non-owner denied', {role:'reporter'},'ROLE_DENIED'],
  ['AAL1 denied', {aal:'aal1'},'MFA_REQUIRED'],
  ['revoked server session denied', {serverValid:false},'LOGIN_REQUIRED'],
  ['15-minute idle lock enforced', {lastActivity:Date.now()-16*60*1000},'LOCAL_LOCK'],
  ['valid Founder/AAL2 session admitted', {},'READY'],
  ['session provider unavailable fails closed', {outage:'session'},'FAIL_CLOSED'],
  ['server validation unavailable fails closed', {outage:'server'},'FAIL_CLOSED'],
  ['role provider unavailable fails closed', {outage:'role'},'FAIL_CLOSED'],
  ['MFA provider unavailable fails closed', {outage:'aal'},'FAIL_CLOSED'],
];
for (const [label,scenario,expected] of scenarios) {
  test('Founder guard: '+label,async()=>{
    assert.equal(await outcome(scenario),expected);
  });
}
test('protected admin HTML wires original guard; Founder Login keeps role/AAL2 checks',()=>{
  assert.match(protectedHtml,/src="admin-auth\.js"/);
  assert.match(loginHtml,/b12-safe-nav\.js/);
  assert.match(loginHtml,/mfaChallengeAndVerify/);
  assert.match(loginHtml,/currentLevel\s*!==\s*'aal2'/);
  assert.match(loginHtml,/r\s*!==\s*'owner'/);
  assert.match(guard,/LOCK_MINUTES\s*=\s*15/);
  assert.match(guard,/serverSessionValid\(\)/);
  assert.match(guard,/jbAuth\s*=\s*'ready'/);
});
test('B12 safe post-login next page allowlist rejects cross-origin and bad deep links',()=>{
  const win={};
  vm.runInNewContext(safeNav,{window:win,URLSearchParams},{filename:'b12-safe-nav.js',timeout:1000});
  const cases=[
    ['admin.html','admin.html'],
    ['admin-security.html','admin-security.html'],
    ['add-news.html?id=f17f6507-02a3-4881-ad37-0b02cadf3d3f','add-news.html?id=f17f6507-02a3-4881-ad37-0b02cadf3d3f'],
    ['grievances.html?tab=open','grievances.html?tab=open'],
    ['b9-analytics.html?range=30','b9-analytics.html?range=30'],
    ['https://evil.com','admin.html'],
    ['//evil.com','admin.html'],
    ['../admin-security.html','admin.html'],
    ['%2fadmin.html','admin.html'],
    ['admin-login.html','admin.html'],
    ['admin.html?next=https://evil.com','admin.html'],
    ['add-news.html?id=bad','admin.html'],
    ['grievances.html?tab=all','admin.html'],
    ['javascript:alert(1)','admin.html']
  ];
  for(const [input,expected] of cases){
    assert.equal(win.JBProdSafeNav.target(input),expected,input);
  }
});
