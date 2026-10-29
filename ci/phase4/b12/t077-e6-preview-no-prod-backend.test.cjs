'use strict';
/* T077 E6 controlled local execution of the EXACT checked-in static config/client.
 * No production connection, no credentials, no network, no Supabase mutations.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const V3 = path.resolve(__dirname, '../../../JANTA_BOL_PHASE_3C_WORKING');
const config = fs.readFileSync(path.join(V3, 'supabase-config.js'), 'utf8');
const backend = fs.readFileSync(path.join(V3, 'backend-client.js'), 'utf8');

function simulate(href, readyState='complete') {
  const u = new URL(href);
  let creates = 0, queued;
  const document = {
    readyState,
    body: {innerHTML:''},
    documentElement: {style:{}},
    addEventListener: (name, fn) => { assert.equal(name,'DOMContentLoaded'); queued=fn; }
  };
  const window = {
    location: {protocol:u.protocol,hostname:u.hostname,href:u.href},
    supabase: {createClient: () => {creates++; return {auth:{}};}}
  };
  const ctx = vm.createContext({window,document});
  vm.runInContext(config,ctx,{timeout:1000,filename:'supabase-config.js'});
  return {window,document,boot:()=>queued?.(),get creates(){return creates;},context:ctx};
}

for (const url of [
  'https://shubham-pichhore-2028.vercel.app/JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
  'https://shubham-pichhore-2028-hplg10m3k-shubhamshrivastava295-9848.vercel.app/JANTA_BOL_PHASE_3C_WORKING/add-news.html',
  'https://shubham-pichhore-2028-8q3i9oxq9-shubhamshrivastava295-9848.vercel.app/JANTA_BOL_PHASE_3C_WORKING/index.html',
  'https://jantabol.in.evil.invalid/JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
  'https://eviljantabol.in/JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
  'http://jantabol.in/JANTA_BOL_PHASE_3C_WORKING/admin-login.html',
  'http://localhost:3000/JANTA_BOL_PHASE_3C_WORKING/admin-login.html'
]) {
  test('T077 E6 Preview denied production backend: '+new URL(url).hostname+' '+new URL(url).protocol,()=>{
    const x=simulate(url);
    assert.equal(x.window.JB_PREVIEW_NO_PRODUCTION_BACKEND,true);
    assert.equal(x.window.JB_SUPABASE_CONFIG,null);
    assert.match(x.document.body.innerHTML,/Isolated Preview/);
    assert.match(x.document.body.innerHTML,/no|koi publish, edit, delete/i);
    assert.throws(()=>vm.runInContext(backend,x.context,{timeout:1000}),/Supabase client\/config missing/);
    assert.equal(x.creates,0,'no Supabase client should ever be initialized');
    assert.equal(x.window.JBBackend,undefined,'no Founder auth API on Preview');
  });
}

test('T077 E6 Preview loading page fails shut and swaps out the sign-in form',()=>{
  const x=simulate('https://preview.vercel.app/JANTA_BOL_PHASE_3C_WORKING/admin-login.html','loading');
  assert.equal(x.document.documentElement.style.visibility,'hidden');
  assert.equal(x.window.JB_SUPABASE_CONFIG,null);
  x.boot();
  assert.match(x.document.body.innerHTML,/Isolated Preview/);
  assert.equal(x.document.documentElement.style.visibility,'visible');
});
for (const host of ['jantabol.in','www.jantabol.in']) {
  test('T077 E6 only canonical HTTPS production can initialize public client: '+host,()=>{
    const x=simulate('https://'+host+'/JANTA_BOL_PHASE_3C_WORKING/admin-login.html');
    assert.equal(x.window.JB_PREVIEW_NO_PRODUCTION_BACKEND,false);
    assert.equal(x.window.JB_SUPABASE_CONFIG.url,'https://vrffsnkycvjithwtiylt.supabase.co');
    assert.match(x.window.JB_SUPABASE_CONFIG.publishableKey,/^sb_publishable_/);
    vm.runInContext(backend,x.context,{timeout:1000});
    assert.equal(x.creates,1);
    assert.equal(typeof x.window.JBBackend.requireOwner,'function');
  });
}
test('T077 E6 source guard detects dangerous future config rewrites',()=>{
  assert.match(config,/hostname === 'jantabol\.in'/);
  assert.match(config,/hostname === 'www\.jantabol\.in'/);
  assert.match(config,/JB_SUPABASE_CONFIG = null/);
  assert.match(config,/location\.protocol === 'https:'/);
  assert.doesNotMatch(config,/service_role|SERVICE_ROLE_KEY|VERCEL_TOKEN/);
});
