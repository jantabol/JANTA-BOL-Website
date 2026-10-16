'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='JANTA_BOL_PHASE_3C_WORKING/';
const manifest=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json','utf8'));
const parent=manifest.canonical_tests.find(x=>x.id==='P4-T037');
test('T037 canonical lock: 11 ADS024-034 and E2/E3/E5 genuinely DUE',()=>{
 assert.deepEqual(parent.range,[24,34]);
 assert.deepEqual(parent.required_evidence,['E2','E3','E5']);
 assert.equal(parent.final_status,'DUE');
 const ids=manifest.ads.filter(x=>x.canonical_test==='P4-T037');
 assert.equal(ids.length,11);
 assert.deepEqual(ids.map(x=>x.id),Array.from({length:11},(_,i)=>'ADS-'+String(i+24).padStart(3,'0')));
 assert.ok(ids.every(x=>x.final_status==='DUE'));
});
function client(allowed=true){
 const events=[],window={JBBackend:{
  requireOwner:async()=>{if(!allowed)throw Error('OWNER_AAL2_REQUIRED');},
  client:{rpc:async (n,args)=>{events.push({name:n,args});return{data:true,error:null}}}
 }};
 vm.runInNewContext(fs.readFileSync(dir+'phase4-domain-client.js','utf8'),{window,Error,Date,URL});
 return {api:window.JBPhase4,events};
}
const good={name:'News Article package',placement:'article',priceMinor:'50000',durationDays:'15',weight:'2'};
test('ADS024 zero/negative/float/malformed prices fail BEFORE Owner package RPC',async()=>{
 const h=client();
 for(const val of ['0',0,'-1','1.5','NaN','','Infinity',null,undefined]){
  await assert.rejects(()=>h.api.adSavePackage({...good,priceMinor:val}),/INVALID_PACKAGE/,'invalid price: '+String(val));
 }
 assert.equal(h.events.length,0,'no Owner RPC attempted for invalid price');
});
test('ADS024 valid integer paise/days/weight retains exact backend payload and Owner authority',async()=>{
 const h=client();
 await h.api.adSavePackage(good);
 assert.equal(h.events.length,1);
 assert.equal(h.events[0].name,'jb_ad_save_package_internal');
 assert.equal(h.events[0].args.p_price,50000);
 assert.equal(h.events[0].args.p_duration,15);
 assert.equal(h.events[0].args.p_weight,2);
 const unauthorized=client(false);
 await assert.rejects(()=>unauthorized.api.adSavePackage(good),/OWNER_AAL2_REQUIRED/);
 assert.equal(unauthorized.events.length,0);
});
test('ADS025 contact-only request requires consent but never package or payment',()=>{
 const publicHTML=fs.readFileSync(dir+'advertise-request.html','utf8');
 const publicHome=fs.readFileSync(dir+'index.html','utf8');
 assert.match(publicHTML,/id="adConsent"[^>]*required/);
 assert.doesNotMatch(publicHTML,/type="file"|id="adPrice"|id="adPlacement"|id="adLocation"/);
 assert.match(publicHome,/advertise-request\.html\?origin=homepage/);
 const admin=fs.readFileSync(dir+'ads.html','utf8');
 assert.match(admin,/Package \(optional\)/);
 assert.match(admin,/Custom \/ no package selected/);
});
test('ADS029/031 one pinned Article selection per view and no second paid slot',()=>{
 const source=fs.readFileSync(dir+'public-ads.js','utf8');
 assert.match(source,/pinnedArticleSlots\.has\(slot\)/);
 assert.match(source,/pinnedArticleSlots\.add\(slot\)/);
 assert.match(source,/data\.length!==1/);
 assert.doesNotMatch(source,/setInterval\s*\(/);
});
test('ADS028/030/032/033/034 source candidates remain unpaired to LIVE',()=>{
 const w=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261010_b7_weighted_private_REVIEW_ONLY.sql','utf8');
 const inv=fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/db/20261010_b7_inventory_guard_REVIEW_ONLY.sql','utf8');
 assert.match(w,/b7_weighted_article_candidate/);
 assert.match(w,/b7_eligible_article_creatives/);
 assert.match(inv,/pg_advisory_xact_lock/);
 assert.match(inv,/CAPACITY_EXCEEDED/);
 const geo=fs.readFileSync(dir+'public-ads.js','utf8');
 assert.match(geo,/NOT YET WIRED/);
 console.log('ADS028_030_032_033_034=ISOLATED_CANDIDATE_ONLY; OFFICIAL_LGD=HOLD');
});
