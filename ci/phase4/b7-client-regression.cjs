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


test('ADS-025 pinned: a second article render cannot change ad selection',async()=>{
 const {window,context,calls}=client();
 const slot={dataset:{jbAdPlacement:'article'},replaceChildren(){throw Error('NO_REPLACE_FOR_PINNED');}};
 // The first request has no eligible ads: it must still pin this article opening.
 let clears=0;slot.replaceChildren=()=>{clears++};
 context.document={querySelectorAll:()=>[slot]};
 await Promise.all([window.JBPublicAds.render('article','global'),window.JBPublicAds.render('article','global')]);
 assert.equal(calls.length,1);
 assert.equal(clears,1);
 await window.JBPublicAds.render('article','district:guna');
 assert.equal(calls.length,1,'article selection must not change with new scope');
});
test('ADS-025 fail closed: no timer, no repeated ad event on a held article',()=>{
 const js=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
 assert.match(js,/pinnedArticleSlots\.has\(slot\)/);
 assert.doesNotMatch(js,/\bsetInterval\s*\(/);
 assert.doesNotMatch(js,/\.rpc\(['"]jb_ad_(?:event|record_event)['"]/);
});


test('ADS-001 public entrypoints: small home/article CTA and one single paid slot each',()=>{
 const home=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
 const article=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
 assert.match(home,/href="advertise-request\.html\?origin=homepage"/);
 assert.match(article,/id="jb-ad-contact-article"/);
 assert.match(article,/advertise-request\.html\?origin=article&id=/);
 assert.equal((home.match(/data-jb-ad-placement="homepage"/g)||[]).length,1);
 assert.equal((article.match(/data-jb-ad-placement="article"/g)||[]).length,1);
 assert.doesNotMatch(home,/id="jb-ad-scope"/,'homepage cannot ask viewer for ad geography');
 assert.match(home,/JBPublicAds\?\.render\('homepage','global'\)/);
});
test('ADS-001/002 public enquiry: minimal WhatsApp form, explicit contact consent and confirmed receipt only',()=>{
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertise-request.html','utf8');
 assert.match(html,/id="adWhatsApp"[^>]*type="tel"/);
 assert.match(html,/id="adConsent"[^>]*type="checkbox" required/);
 assert.match(html,/\.rpc\('jb_ad_public_enquiry'/);
 assert.match(html,/p_consent:consent/);
 assert.match(html,/REQUEST_RECEIPT_MISSING/);
 assert.match(html,/स्थिति: Pending/);
 assert.doesNotMatch(html,/type="file"|navigator\.geolocation|geolocation\.getCurrentPosition/);
 assert.doesNotMatch(html,/id="adPrice"|id="adPlacement"|id="adLocation"/);
});


test('ADS-007 verification: caller has Owner authority and uses exact backend RPC',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>true;
 await window.JBPhase4.adVerifyAdvertiser('adv-fixture','verified','Verified independent business check','OFFLINE-REF');
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),[{
  name:'jb_ad_verify_advertiser_internal',
  args:{p_advertiser:'adv-fixture',p_state:'verified',
        p_note:'Verified independent business check',p_evidence_ref:'OFFLINE-REF'}
 }]);
});
test('ADS-007 verification: rejects missing Owner or incomplete note before write',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED')};
 await assert.rejects(()=>window.JBPhase4.adVerifyAdvertiser('adv','verified','Verified sample','X'),/OWNER_AAL2_REQUIRED/);
 assert.equal(calls.length,0);
 window.JBBackend.requireOwner=async()=>true;
 await assert.rejects(()=>window.JBPhase4.adVerifyAdvertiser('adv','verified','short','X'),/INVALID_VERIFICATION_DECISION/);
 assert.equal(calls.length,0);
});
test('ADS-006 admin queue: private WhatsApp, source and consent are Owner-only',async()=>{
 const {context,elements,window}=adminClient();
 window.JBPhase4.adRows=async()=>[{
  id:'fixture-campaign',advertiser_id:'fixture-advertiser',
  status:'requested',placement:'homepage',scope:'global',
  advertisers:{name:'Fixture',contact:'+919876543210',verification_state:'pending',risk_level:'normal'},
  created_at:'2026-10-10T10:00:00Z',enquiry_origin:'homepage',whatsapp_consent_at:'2026-10-10T10:00:00Z'
 }];
 await vm.runInContext('load()',context);
 const html=elements.get('rows').innerHTML;
 assert.match(html,/\+919876543210/);
 assert.match(html,/Owner queue/);
 assert.match(html,/Source: homepage/);
 assert.match(html,/WhatsApp consent: recorded/);
 assert.match(html,/vstate-fixture-campaign/);
 assert.match(html,/verifyAdvertiser\('fixture-campaign','fixture-advertiser'\)/);
});


test('ADS-035 agreed quote: requires Owner, exact price and signed reference',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>true;
 await window.JBPhase4.adSetApprovedQuote('campaign-fixture','50000','SIGNED-QUOTE-001');
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{
  name:'jb_ad_set_approved_quote_internal',
  args:{p_campaign:'campaign-fixture',p_price_minor:50000,p_terms_ref:'SIGNED-QUOTE-001'}
 });
});
test('ADS-035 quote: invalid price or missing terms reference never calls backend',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>true;
 for(const [amount,ref] of [['','SIGNED-QUOTE-001'],['-1','SIGNED-QUOTE-001'],['50000',''],['50000','a'],['0','SIGNED-QUOTE-001']]){
  await assert.rejects(
    ()=>window.JBPhase4.adSetApprovedQuote('campaign-fixture',amount,ref),
    /INVALID_QUOTE_TERMS/
  );
 }
 assert.equal(calls.length,0);
});
test('ADS-037 manual payment: explicit Owner evidence and typed CONFIRM are mandatory',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>true;
 const fixture={
  reference:'UTR-00000001',amountMinor:'50000',method:'upi',
  receiptAt:'2026-10-10T10:30',evidenceRef:'BANK-LEDGER-001',
  acceptanceRef:'SIGNED-ACCEPT-001',acceptedAt:'2026-10-10T10:00',
  verificationNote:'Owner matched bank ledger receipt',confirm:'CONFIRM'
 };
 for(const patch of [{confirm:'confirm'},{amountMinor:'0'},{reference:'short'},
                       {evidenceRef:''},{acceptanceRef:''},{verificationNote:'short'},
                       {method:'card'},{receiptAt:'not-a-time'},
                       {acceptedAt:'2026-10-10T11:00'}]){
  await assert.rejects(
    ()=>window.JBPhase4.adConfirmManualPayment('campaign-fixture',{...fixture,...patch}),
    /MANUAL_PAYMENT_EVIDENCE_REQUIRED|INVALID_PAYMENT_TIMESTAMP/
  );
 }
 assert.equal(calls.length,0);
 await window.JBPhase4.adConfirmManualPayment('campaign-fixture',fixture);
 assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{
  name:'jb_ad_confirm_manual_payment_internal',
  args:{
   p_campaign:'campaign-fixture',p_reference:'UTR-00000001',
   p_amount_minor:50000,p_method:'upi',
   p_receipt_at:'2026-10-10T05:00:00.000Z',
   p_evidence_ref:'BANK-LEDGER-001',p_acceptance_ref:'SIGNED-ACCEPT-001',
   p_terms_accepted_at:'2026-10-10T04:30:00.000Z',
   p_verification_note:'Owner matched bank ledger receipt',
   p_confirm:'CONFIRM'
  }
 });
});
test('ADS-038 Owner is checked before payment RPC',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED')};
 await assert.rejects(
  ()=>window.JBPhase4.adConfirmManualPayment('campaign-fixture',{confirm:'CONFIRM'}),
  /OWNER_AAL2_REQUIRED/
 );
 assert.equal(calls.length,0);
});
test('ADS-037 Admin UI: no legacy one-click confirmation path',async()=>{
 const {context,elements,calls,window}=adminClient();
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
 assert.match(html,/Owner manual payment/);
 assert.match(html,/id="pconfirm-/);
 assert.match(html,/id="paccept-/);
 assert.match(html,/id="qterms-/);
 assert.doesNotMatch(html,/onclick="payment\('[^']+'\)">Record confirmed payment/);
 window.JBBackend.requireOwner=async()=>true;
 await vm.runInContext('load()',context);
 for(const [name,val] of Object.entries({
  pr:'UTR-00000001',pa:'50000',pmethod:'upi',
  preceived:'2026-10-10T10:30',pevidence:'BANK-LEDGER-001',
  paccept:'SIGNED-ACCEPT-001',pacceptedat:'2026-10-10T10:00',
  pnote:'Owner matched bank ledger receipt',pconfirm:'CONFIRM'
 })){
  elements.get(name+'-fixture-campaign')?.value===undefined&&elements.set(name+'-fixture-campaign',{value:''});
  elements.get(name+'-fixture-campaign').value=val;
 }
 await vm.runInContext("payment('fixture-campaign')",context);
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'jb_ad_confirm_manual_payment_internal');
});


test('ADS-041 advertiser portal page: private per-tab token, text-only request, no media input',()=>{
 const page=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html','utf8');
 assert.match(page,/jb_ad_portal_login/);
 assert.match(page,/jb_ad_portal_campaign/);
 assert.match(page,/jb_ad_portal_submit_creative/);
 assert.match(page,/p_type:'text',p_media:null,p_text:note/);
 assert.match(page,/sessionStorage\.setItem/);
 assert.doesNotMatch(page,/localStorage\./);
 assert.doesNotMatch(page,/\bsetInterval\s*\(/);
 assert.doesNotMatch(page,/type="file"|geolocation|getCurrentPosition|p_scope:/);
 assert.doesNotMatch(page,/p_type:'image'|p_type:'video'/);
 assert.match(page,/campaignDetails'\)\.textContent/);
 assert.match(page,/creativeDetails'\)\.textContent/);
});
test('ADS-041 Owner portal credentials: require Owner and reject malformed campaign IDs',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED')};
 await assert.rejects(()=>window.JBPhase4.adIssuePortal('aaaaaaaa-0000-0000-0000-000000000001'),/OWNER_AAL2_REQUIRED/);
 assert.equal(calls.length,0);
 window.JBBackend.requireOwner=async()=>true;
 await assert.rejects(()=>window.JBPhase4.adIssuePortal('malformed-id'),/INVALID_CAMPAIGN_ID/);
 // A healthy backend readiness RPC returns JSON [] (NOT boolean true).
 window.JBBackend.client.rpc=async(name,args)=>{
  calls.push({name,args});
  return {data:name==='jb_ad_owner_change_requests_internal'?[]:true,error:null};
 };
 await window.JBPhase4.adIssuePortal('aaaaaaaa-0000-0000-0000-000000000001');
 assert.equal(calls.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),[
  {name:'jb_ad_owner_change_requests_internal',args:{}},
  {name:'jb_ad_issue_portal_internal',
   args:{p_campaign:'aaaaaaaa-0000-0000-0000-000000000001'}}
 ]);
});
test('ADS-041 migration rollout fail closed: cannot issue temporary advertiser password while unsafe old photo RPC exists',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>true;
 window.JBBackend.client.rpc=async(name,args)=>{
  calls.push({name,args});
  if(name==='jb_ad_owner_change_requests_internal')
   return {data:null,error:new Error('PGRST202: new safe portal migration not deployed')};
  return {data:true,error:null};
 };
 await assert.rejects(()=>window.JBPhase4.adIssuePortal('aaaaaaaa-0000-0000-0000-000000000001'),/migration not deployed/);
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'jb_ad_owner_change_requests_internal');
 assert.equal(calls.some(c=>c.name==='jb_ad_issue_portal_internal'),false);
});
test('ADS-041 admin issue button: shows one-time credential only to Owner UI',async()=>{
 const {context,elements,window}=adminClient();
 window.JBPhase4.adIssuePortal=async()=>[{login_id:'JB-OWNER',temporary_secret:'SYNTHETIC-TEMP-SECRET'}];
 await vm.runInContext("issuePortal('fixture-campaign')",context);
 const slot=elements.get('portal-login-fixture-campaign');
 assert.equal(slot.hidden,false);
 assert.match(slot.textContent,/JB-OWNER/);
 assert.match(slot.textContent,/SYNTHETIC-TEMP-SECRET/);
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
 assert.match(html,/advertiser-portal\.html/);
 assert.match(html,/manual/);
});
test('ADS-045/046 Owner change-request decision: rejected without AAL2 or note',async()=>{
 const {window,calls}=client();
 const id='aaaaaaaa-0000-0000-0000-000000000001';
 window.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED')};
 await assert.rejects(()=>window.JBPhase4.adChangeRequests(),/OWNER_AAL2_REQUIRED/);
 await assert.rejects(()=>window.JBPhase4.adDecideChange(id,'accepted_for_work','Reviewed new image'),/OWNER_AAL2_REQUIRED/);
 assert.equal(calls.length,0);
 window.JBBackend.requireOwner=async()=>true;
 await assert.rejects(()=>window.JBPhase4.adDecideChange(id,'live','Must fail'),/INVALID_CHANGE_DECISION/);
 await assert.rejects(()=>window.JBPhase4.adDecideChange(id,'accepted_for_work','short'),/INVALID_CHANGE_DECISION/);
 assert.equal(calls.length,0);
 await window.JBPhase4.adDecideChange(id,'accepted_for_work','Reviewed media studio work request');
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{
  name:'jb_ad_decide_change_request_internal',
  args:{p_request:id,p_decision:'accepted_for_work',p_note:'Reviewed media studio work request'}
 });
});
test('ADS-045 Owner queue escapes advertiser-supplied text and cannot silently approve media',async()=>{
 const {context,elements,window}=adminClient();
 window.JBPhase4.adChangeRequests=async()=>[{
  id:'aaaaaaaa-0000-0000-0000-000000000001',
  campaign_id:'bbbbbbbb-0000-0000-0000-000000000002',
  status:'pending',created_at:'2026-10-10T11:00:00Z',
  note:'<img src=x onerror=alert(1)> please change photo'
 }];
 await vm.runInContext('loadChangeRequests()',context);
 const html=elements.get('changeRequestRows').innerHTML;
 assert.match(html,/&lt;img/);
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/Accept for media review/);
 assert.match(html,/Reject request/);
 assert.match(html,/accepted_for_work/);
});


test('ADS-047 advertiser portal requests renewal pending only, no direct period mutation',()=>{
 const page=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html','utf8');
 assert.match(page,/id="renewalForm"/);
 assert.match(page,/jb_ad_portal_request_renewal/);
 assert.match(page,/p_token:token,p_requested_end:when/);
 assert.match(page,/Renewal Request Pending/);
 assert.match(page,/Owner की स्वीकृति/);
 assert.doesNotMatch(page,/jb_ad_schedule_internal|jb_ad_transition_internal|jb_ad_confirm_manual_payment_internal/);
});
test('ADS-047 Owner-only renewal queue client refuses unauthorised actor',async()=>{
 const {window,calls}=client();
 window.JBBackend.requireOwner=async()=>{throw Error('OWNER_AAL2_REQUIRED')};
 await assert.rejects(()=>window.JBPhase4.adRenewalRequests(),/OWNER_AAL2_REQUIRED/);
 assert.equal(calls.length,0);
 window.JBBackend.requireOwner=async()=>true;
 await window.JBPhase4.adRenewalRequests();
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{
  name:'jb_ad_owner_renewals_internal',args:{}
 });
});
test('ADS-047 Owner renewal queue is read-only and escapes supplied labels',async()=>{
 const {window,context,elements}=adminClient();
 window.JBPhase4.adRenewalRequests=async()=>[{
  id:'aaaaaaaa-0000-0000-0000-000000000001',
  campaign_id:'bbbbbbbb-0000-0000-0000-000000000002',
  status:'pending',request_channel:'portal',
  requested_end_at:'2026-11-01T19:00:00+05:30<script>'
 }];
 await vm.runInContext('loadRenewalRequests()',context);
 const html=elements.get('renewalRows').innerHTML;
 assert.match(html,/Pending renewal|Renewal/);
 assert.match(html,/Source portal/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/No automatic payment or campaign extension/);
 assert.doesNotMatch(html,/Approve renewal|onclick="approveRenewal/);
});


test('ADS-014 staged authoritative Article scope: only verified Article UUID input, no claimed district',()=>{
 const {window}=client(),api=window.JBPublicAds;
 assert.equal(api.scopeForVerifiedArticleId('10000000-0000-0000-0000-000000000001'),
   'article:10000000-0000-0000-0000-000000000001');
 assert.equal(api.scopeForVerifiedArticleId('A0000000-0000-0000-0000-000000000001'),
   'article:a0000000-0000-0000-0000-000000000001');
 for(const invalid of ['','local','district:guna','shivpuri',
  '10000000-0000-0000-0000-000000000001 OR TRUE',
  'article:10000000-0000-0000-0000-000000000001',
  null,'10000000-0000-0000-0000-0000000000xx']){
  assert.equal(api.scopeForVerifiedArticleId(invalid),'');
 }
});
test('ADS-014 staged adapter: one RPC selection per Article opening, no free-text viewer geo',async()=>{
 const {window,context,calls}=client();
 let cleared=0;
 const slot={dataset:{jbAdPlacement:'article'},replaceChildren(){cleared++}};
 context.document={querySelectorAll:()=>[slot]};
 const api=window.JBPublicAds;
 assert.equal(await api.renderVerifiedArticle('local'),false);
 assert.equal(calls.length,0);
 assert.equal(await api.renderVerifiedArticle('10000000-0000-0000-0000-000000000001'),true);
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),[{
  name:'jb_ad_public_feed',
  args:{p_placement:'article',p_scope:'article:10000000-0000-0000-0000-000000000001'}
 }]);
 assert.equal(cleared,1);
 assert.equal(await api.renderVerifiedArticle('10000000-0000-0000-0000-000000000001'),true);
 assert.equal(calls.length,1,'already-open article cannot trigger second ad rotation');
});
test('ADS-014 cutover remains unlinked until signed-off LGD/E3 and backend pairing',()=>{
 const source=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
 const article=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
 assert.match(source,/renderVerifiedArticle/);
 assert.doesNotMatch(article,/renderVerifiedArticle\(/);
 assert.match(article,/Permanent Article ID/);
 assert.match(article,/shareUrl\(\)/);
 assert.doesNotMatch(source,/navigator\.geolocation|getCurrentPosition/);
});
