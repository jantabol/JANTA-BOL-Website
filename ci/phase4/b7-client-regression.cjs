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

test('T037: package fetch stays behind Owner authority',async()=>{
 const {window}=client();window.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED');};
 await assert.rejects(()=>window.JBPhase4.adPackages(),/OWNER_AAL2_REQUIRED/);
});
test('T037: package mutation rejects invalid data before backend write',async()=>{
 const {window,calls}=client();window.JBBackend.requireOwner=async()=>true;
 for(const item of [{name:'',placement:'homepage',priceMinor:10,durationDays:1,weight:1},{name:'Good',placement:'homepage',priceMinor:-1,durationDays:1,weight:1},{name:'Good',placement:'other',priceMinor:10,durationDays:1,weight:1},{name:'Good',placement:'homepage',priceMinor:10,durationDays:0,weight:1},{name:'Good',placement:'homepage',priceMinor:10,durationDays:1,weight:0},{name:'Good',placement:'homepage',priceMinor:'',durationDays:1,weight:1}])
 await assert.rejects(()=>window.JBPhase4.adSavePackage(item),/INVALID_PACKAGE/);
 assert.equal(calls.length,0);
});
test('T037: package save delegates to AAL2-protected RPC with precise arguments',async()=>{
 const {window,calls}=client();window.JBBackend.requireOwner=async()=>true;
 await window.JBPhase4.adSavePackage({id:null,name:'  District Banner  ',placement:'article',priceMinor:'159900',durationDays:'30',weight:'2'});
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{name:'jb_ad_save_package_internal',args:{p_id:null,p_name:'District Banner',p_placement:'article',p_price:159900,p_duration:30,p_weight:2}});
});
test('T037 admin UI: package versions and only active bookable options',async()=>{
 const {context,elements,window}=adminClient();
 window.JBPhase4.adPackages=async()=>[
  {id:'11111111-1111-1111-1111-111111111111',name:'New A',placement:'article',price_minor:129900,currency:'INR',duration_days:7,weight:2,active:true,version:3},
  {id:'22222222-2222-2222-2222-222222222222',name:'Old B',placement:'homepage',price_minor:9900,currency:'INR',duration_days:1,weight:1,active:false,version:1}
 ];
 await vm.runInContext('loadPackages()',context);
 assert.match(elements.get('packageRows').innerHTML,/version 3/);
 assert.match(elements.get('packageRows').innerHTML,/Old B/);
 assert.match(elements.get('requestedPackage').innerHTML,/New A/);
 assert.doesNotMatch(elements.get('requestedPackage').innerHTML,/Old B/);
});


// ADS-013: zero, short and long editorial articles; one ad maximum.
// These are deterministic source/DOM behaviors, NOT Android E3 evidence.
function articleFixture(count){
 return Array.from({length:count},(_,i)=>
  'यह खबर का वास्तविक पैराग्राफ '+(i+1)+' है, जिसमें पाठकों के लिए पर्याप्त तथ्य और विवरण हैं।'
 ).join('\n\n');
}
for(const [count,after] of [[0,null],[1,null],[2,null],[3,2],[10,3]]){
 test('ADS-013 semantic placement: '+count+' paragraphs',()=>{
  const text=articleFixture(count),offset=client().window.JBPublicAds.articleParagraphOffset(text);
  const expected=after===null?null:articleFixture(after).length;
  assert.equal(offset,expected);
 });
}
test('ADS-013 ignores blank fragments, photo captions, bullets and tiny headings',()=>{
 const p1=articleFixture(1),p2=articleFixture(1).replace('एक','दो'),p3=articleFixture(1).replace('तथ्य','जानकारी');
 const text=[p1,'फोटो: खबर से संबंधित चित्र','• सूची का छोटा बिंदु','नया अपडेट',p2,p3].join('\n\n');
 assert.equal(client().window.JBPublicAds.articleParagraphOffset(text),text.indexOf('\n\n'+p3));
});
test('ADS-013 preserves exact article text and moves the same one-slot region only once',()=>{
 const {window,context}=client(),text=articleFixture(10),expected=articleFixture(3).length;
 const region={parentNode:{tagName:'MAIN'}};
 let tail=null,insertions=0;
 const first={nodeType:3,textContent:text,splitText(offset){
  assert.equal(offset,expected);
  tail={nodeType:3,textContent:this.textContent.slice(offset)};
  this.textContent=this.textContent.slice(0,offset);
  return tail;
 }};
 const body={firstChild:first,insertBefore(node,before){assert.equal(node,region);assert.equal(before,tail);node.parentNode=this;insertions++;}};
 const root={querySelector(selector){assert.equal(selector,'.article .body');return body;}};
 context.document={querySelector(selector){assert.equal(selector,'.jb-ad-region');return region;}};
 assert.equal(window.JBPublicAds.placeArticleSlot(root),true);
 assert.equal(first.textContent+tail.textContent,text);
 assert.equal(window.JBPublicAds.placeArticleSlot(root),false);
 assert.equal(insertions,1);
});
test('ADS-013 short articles keep existing end-of-article fallback',()=>{
 const {window,context}=client(),text=articleFixture(2);
 const region={parentNode:{tagName:'MAIN'}};
 const body={firstChild:{nodeType:3,textContent:text,splitText(){throw Error('NO_INLINE_ON_SHORT');}},insertBefore(){throw Error('NO_MOVE_ON_SHORT');}};
 context.document={querySelector:()=>region};
 assert.equal(window.JBPublicAds.placeArticleSlot({querySelector:()=>body}),false);
 assert.notEqual(region.parentNode,body);
});
test('ADS-013 main article retains permanent URL/share and a single ad placement',()=>{
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
 assert.match(html,/JBPublicAds\?\.placeArticleSlot\(root\)/);
 assert.match(html,/JBPublicAds\?\.render\('article',JBPublicAds\.scopeForArticle\(item\)\)/);
 assert.equal((html.match(/data-jb-ad-placement="article"/g)||[]).length,1);
 assert.match(html,/shareUrl\(\)/);
 assert.match(html,/Permanent Article ID/);
});
