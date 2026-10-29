'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const domain=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js','utf8');
const pub=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
const uuid='11111111-1111-4111-8111-111111111111';
const pkg={id:uuid,name:'Approved District News',placement:'article',
 price_minor:50000,currency:'INR',duration_days:15,weight:2,
 active:true,version:3};
function owner(data,error=null,allowed=true){
 const calls=[],window={JBBackend:{
  requireOwner:async()=>{if(!allowed)throw Error('OWNER_AAL2_REQUIRED');},
  client:{from(table){calls.push(table);return {select(){return {order:async()=>({data,error})}}}}
  }}};
 vm.runInNewContext(domain,{window,Error,Array,Object,Date,Number,URL,String});
 return {api:window.JBPhase4,calls};
}
test('CP03 BE14: true [] from authenticated backend means zero packages, not a backend outage',async()=>{
 const h=owner([]);
 assert.deepEqual(Array.from(await h.api.adPackages()),[]);
 assert.deepEqual(h.calls,['ad_packages']);
});
test('CP03 BE14: null, undefined, scalar, partial/corrupt table results are NOT empty inventory',async()=>{
 for(const x of [null,undefined,false,'',{},[{...pkg,id:'bad'}],
  [{...pkg,price_minor:'50000'}],[{...pkg,version:null}],
  [{...pkg,currency:'USD'}],[{...pkg,active:null}],
  [{...pkg,weight:101}],[{...pkg,placement:'all'}],
  [{...pkg,duration_days:0}], [{...pkg,name:''}]]){
  const h=owner(x);await assert.rejects(()=>h.api.adPackages(),/B7_OWNER_PACKAGE_RESPONSE_INVALID/);
 }
 const errored=owner([],{code:'42501'});
 await assert.rejects(()=>errored.api.adPackages(),e=>e.code==='42501');
});
test('CP03 BE14: verified older package versions remain visible to Owner, UI retains active-only selector',async()=>{
 const h=owner([{...pkg,active:false,version:2},pkg]);
 assert.equal((await h.api.adPackages()).length,2);
 const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
 assert.match(html,/No packages configured\./);
 assert.match(html,/packageList\.filter\(p=>p\.active\)/);
 assert.match(html,/Package list unavailable/);
});
test('CP03 BE14: AAL1/unauthorized cannot ask for private package prices',async()=>{
 const h=owner([pkg],null,false);
 await assert.rejects(()=>h.api.adPackages(),/OWNER_AAL2_REQUIRED/);
 assert.equal(h.calls.length,0);
});
test('CP03 BE13: malformed or multi-row canonical public feed cannot render a second paid ad',async()=>{
 assert.match(pub,/data\.length!==1/);
 assert.match(pub,/pinnedArticleSlots\.has\(slot\)/);
 assert.doesNotMatch(pub,/\bsetInterval\s*\(/);
 assert.match(pub,/jb_ad_public_feed/);
});
test('CP03 BE11: canonical public enquiry remains pending-only, contact normalization and concurrency guard intact',()=>{
 const s=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261010_b7_public_enquiry_review.sql','utf8');
 for(const part of ['p_consent is distinct from true','ENQUIRY_COOLDOWN',
   'pg_advisory_xact_lock','v_phone',"'pending'","'requested'","'homepage','global'"])
   assert.ok(s.includes(part),'missing BE11 constraint '+part);
 assert.doesNotMatch(s,/insert into public\.ad_campaigns\s*\([^;]+status[^;]+\)\s*values\s*\([^;]+['"]live['"]/i);
});
test('CP03 BE12: official LGD source must stay fail-closed until verified dataset exists',()=>{
 const s=fs.readFileSync('ci/phase4/b7-lgd-source-preflight.cjs','utf8');
 for(const part of ['MP_DISTRICT_COUNT_','SHA256_MISMATCH_','MISSING_PARENT_COVERAGE','UNTRUSTED_SOURCE_URL_'])
  assert.ok(s.includes(part),'missing BE12 LGD provenance gate '+part);
 const ui=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.js','utf8');
 assert.match(ui,/NOT YET WIRED/);
 assert.match(ui,/scopeForVerifiedArticleId/);
});
test('CP03 BE10: Owner verification remains an independent review; reverify does not resurrect portal secrets',()=>{
 const sql=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_verification_portal_revocation_REVIEW_ONLY.sql','utf8');
 assert.ok(sql.includes('B7_PORTAL_REISSUE_FRESH_SECRET_REQUIRED'));
 assert.ok(sql.includes('b7_verified_advertiser_downgrade_guard'));
 assert.ok(sql.includes('OWNER_AAL2_REQUIRED'));
});


function publicDom(rows,placement='article'){
 let calls=0,shown=0,clears=0,opened=null;
 const slot={dataset:{jbAdPlacement:placement},
  replaceChildren(){clears++;opened=null},
  append(box){shown++;opened=box;}};
 const document={
  querySelectorAll:()=>[slot],
  createElement(tag){
   const el={tagName:tag.toUpperCase(),children:[],textContent:'',
    append(...children){this.children.push(...children)},
    setAttribute(){},addEventListener(){}};
   return el;
  }
 };
 const window={JBBackend:{client:{rpc:async()=>{calls++;return {data:rows,error:null}}}}};
 vm.runInNewContext(pub,{window,document,URL,Set,WeakMap,WeakSet,Array});
 return {api:window.JBPublicAds,slot,get calls(){return calls},
  get shown(){return shown},get clears(){return clears},
  get box(){return opened}};
}
test('CP03 BE13: executable DOM fails closed on two ad rows; article stays pinned',async()=>{
 const rows=[{creative_type:'text',text_body:'One ad'},
             {creative_type:'text',text_body:'Injected second ad'}];
 const x=publicDom(rows,'article');
 await x.api.render('article','article:'+uuid);
 assert.equal(x.shown,0);
 assert.equal(x.calls,1);
 await x.api.render('article','article:'+uuid);
 assert.equal(x.calls,1,'no second selection during same article view');
 assert.equal(x.shown,0);
});
test('CP03 BE13: legitimate single ad still renders once in existing article slot',async()=>{
 const x=publicDom([{creative_type:'text',text_body:'Verified paid text creative'}]);
 await x.api.render('article','global');
 assert.equal(x.shown,1);
 assert.equal(x.box.tagName,'ASIDE');
 assert.equal(x.box.children.some(e=>e.textContent==='Verified paid text creative'),true);
 await x.api.render('article','global');
 assert.equal(x.shown,1);
 assert.equal(x.calls,1);
});
test('CP03 BE13: homepage multirow backend anomaly renders nothing, never selects first silently',async()=>{
 const x=publicDom([{creative_type:'text',text_body:'one'},
  {creative_type:'text',text_body:'two'}],'homepage');
 await x.api.render('homepage','global');
 assert.equal(x.shown,0);
 assert.equal(x.calls,1);
});

function enquiryHarness(receipt){
 const page=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/advertise-request.html','utf8');
 const script=page.split('<script>')[1]?.split('</script>')[0];
 assert.ok(script,'public enquiry inline code must be present');
 const fields={
  adName:{value:'Local Reporter Office'},
  adWhatsApp:{value:'+919876543210'},
  adNote:{value:'District newspaper advertising'},
  adConsent:{checked:true},
  adSubmit:{disabled:false},
  adFeedback:{hidden:true,textContent:'',className:''}
 };
 let send,reset=0,requests=0;
 fields.enquiry={
  addEventListener(event,fn){if(event==='submit')send=fn;},
  reportValidity(){return true;},
  reset(){reset++}
 };
 const document={getElementById:id=>fields[id]};
 const backend={client:{rpc:async(name,args)=>{
  requests++;
  assert.equal(name,'jb_ad_public_enquiry');
  assert.equal(args.p_consent,true);
  return {data:receipt,error:null};
 }}};
 const ctx=vm.createContext({window:{JBBackend:backend},JBBackend:backend,
   document,location:{search:''},URLSearchParams,Error});
 vm.runInContext(script,ctx);
 assert.equal(typeof send,'function');
 return {fields,submit:()=>send({preventDefault(){}}),
  get reset(){return reset},get requests(){return requests}};
}
test('CP03 BE11: fake 36-char hyphen receipt is not claimed successfully submitted',async()=>{
 for(const receipt of ['-'.repeat(36),'g'.repeat(36),
  '11111111-----4111-8111-111111111111','11111111111141118111111111111111']){
  const h=enquiryHarness(receipt);
  await h.submit();
  assert.equal(h.requests,1);
  assert.equal(h.reset,0);
  assert.equal(h.fields.adFeedback.className,'feedback error');
  assert.match(h.fields.adFeedback.textContent,/अभी अनुरोध दर्ज नहीं हो पाया/);
 }
});
test('CP03 BE11: genuine canonical UUID receipt gives pending result without LIVE promise',async()=>{
 const h=enquiryHarness(uuid);
 await h.submit();
 assert.equal(h.reset,1);
 assert.equal(h.fields.adFeedback.className,'feedback success');
 assert.match(h.fields.adFeedback.textContent,/स्थिति: Pending/);
 assert.doesNotMatch(h.fields.adFeedback.textContent,/स्थिति: LIVE/);
});
