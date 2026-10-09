'use strict';
// Behavioral client regression. No database connection and no production writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
process.env.TZ='Asia/Kolkata';

function client(){
  const calls=[];
  const window={JBBackend:{client:{rpc:async(name,args)=>{calls.push({name,args});return{data:true,error:null};}}}};
  const context=vm.createContext({window,URL,Date});
  for(const file of ['public-ads.js','phase4-domain-client.js']){
    vm.runInContext(fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/'+file,'utf8'),context,{filename:file});
  }
  return {window,calls,context};
}

for(const [name,item,expected] of [
  ['Guna article',{geoLevel:'MP',district:'Guna'},'district:guna'],
  ['Ashoknagar article',{geoLevel:'MP',district:'Ashoknagar'},'district:ashoknagar'],
  ['Shivpuri district field',{geoLevel:'MP',district:'Shivpuri'},'district:shivpuri'],
  ['normalized district',{geoLevel:'MP',district:'  GUNA  '},'district:guna'],
  ['legacy Shivpuri classification',{geoLevel:'Shivpuri'},'district:shivpuri'],
  ['local classification has priority',{geoLevel:'Local-Pichhore',district:'Shivpuri'},'local'],
  ['unknown district',{geoLevel:'MP',district:'Unknown'},'global'],
  ['no district inference from free text',{geoLevel:'MP',location:'Guna'},'global'],
  ['missing article',null,'global']
]) test('T035 scope: '+name,()=>{
  assert.equal(client().window.JBPublicAds.scopeForArticle(item),expected);
});

test('T036 schedule: India device time is sent as an explicit UTC instant',async()=>{
  const {window,calls}=client();
  await window.JBPhase4.adSchedule('fixture-campaign','2026-10-10T09:00','2026-10-10T10:00');
  assert.equal(calls.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{
    name:'jb_ad_schedule_internal',args:{p_campaign:'fixture-campaign',p_starts_at:'2026-10-10T03:30:00.000Z',p_ends_at:'2026-10-10T04:30:00.000Z'}
  });
});
test('T036 schedule: explicit offsets keep the same instant',async()=>{
  const {window,calls}=client();
  await window.JBPhase4.adSchedule('fixture-campaign','2026-10-10T09:00:00+05:30','2026-10-10T04:30:00Z');
  assert.equal(calls[0].args.p_starts_at,'2026-10-10T03:30:00.000Z');
  assert.equal(calls[0].args.p_ends_at,'2026-10-10T04:30:00.000Z');
});
for(const [start,end] of [
  ['', '2026-10-10T10:00'],[null,'2026-10-10T10:00'],
  ['not-a-date','2026-10-10T10:00'],['2026-02-30T09:00','2026-03-01T10:00'],
  ['2026-10-10T24:00','2026-10-11T10:00'],['2026-10-10T10:00','2026-10-10T09:00'],
  ['2026-10-10T10:00','2026-10-10T10:00'],['2026-10-10T09:00','']
]) test('T036 invalid schedule rejected before RPC: '+JSON.stringify([start,end]),async()=>{
  const {window,calls}=client();
  await assert.rejects(async()=>window.JBPhase4.adSchedule('fixture-campaign',start,end),/INVALID_SCHEDULE/);
  assert.equal(calls.length,0);
});
test('T036 schedule: backend authority rejection is not swallowed',async()=>{
  const {window}=client();
  window.JBBackend.client.rpc=async()=>({data:null,error:new Error('OWNER_AAL2_REQUIRED')});
  await assert.rejects(()=>window.JBPhase4.adSchedule('fixture-campaign','2026-10-10T09:00','2026-10-10T10:00'),/OWNER_AAL2_REQUIRED/);
});

function adminClient(){
  const c=client(),elements=new Map();
  c.context.document={documentElement:{dataset:{}},getElementById(id){if(!elements.has(id))elements.set(id,{value:'',innerHTML:''});return elements.get(id);}};
  c.context.addEventListener=()=>{};
  c.context.alert=message=>{throw Error(message);};
  c.context.JBBackend=c.window.JBBackend;
  c.context.JBBackend.esc=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  c.context.JBPhase4=c.window.JBPhase4;
  c.window.JBPhase4.adRows=async()=>[{id:'fixture-campaign',status:'approved',placement:'article',scope:'district:guna',advertisers:{name:'Fixture'},starts_at:'2026-10-10T03:30:00Z',ends_at:'2026-10-10T04:30:00Z'}];
  const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
  for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(script[1],c.context,{filename:'ads.html inline'});
  return {...c,elements};
}
test('T036 admin UI: saved UTC schedule displays as device local time with a timezone label',async()=>{
  const {context,elements}=adminClient();
  await vm.runInContext('load()',context);
  const html=elements.get('rows').innerHTML;
  assert.match(html,/id="st-fixture-campaign"[^>]*value="2026-10-10T09:00"/);
  assert.match(html,/id="en-fixture-campaign"[^>]*value="2026-10-10T10:00"/);
  assert.match(html,/टाइमज़ोन/);
});
test('T036 admin UI: schedule button uses converted UTC arguments and preserves campaign ID',async()=>{
  const {context,calls}=adminClient();
  context.document.getElementById('st-fixture-campaign').value='2026-10-10T09:00';
  context.document.getElementById('en-fixture-campaign').value='2026-10-10T10:00';
  await vm.runInContext("scheduleAd('fixture-campaign')",context);
  assert.equal(calls.length,1);
  assert.equal(calls[0].args.p_campaign,'fixture-campaign');
  assert.equal(calls[0].args.p_starts_at,'2026-10-10T03:30:00.000Z');
  assert.equal(calls[0].args.p_ends_at,'2026-10-10T04:30:00.000Z');
});
