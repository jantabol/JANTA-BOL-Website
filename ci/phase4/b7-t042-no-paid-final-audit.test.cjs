'use strict';
/* P4-T042 ADS057..060: strict E1/E7 source preflight only.
 * Real physical Android Owner E3, verified B6 ZIP hash, live deployed E7
 * and paid E2/E5 are separate gates, NEVER synthetic PASS/LOCK.
 */
const fs=require('node:fs'),test=require('node:test'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const root='JANTA_BOL_PHASE_3C_WORKING/';
const owner=read(root+'ads.html'),article=read(root+'article.html'),
      home=read(root+'index.html'),request=read(root+'advertise-request.html'),
      ads=read(root+'public-ads.js'),css=read(root+'public-ads.css'),
      manifest=JSON.parse(read('JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json')),
      phases=read('JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md');
test('ADS057 Owner mobile form/queue exists with no forced real payment for contact-only',()=>{
 assert.match(owner,/adPendingQueue/);
 assert.match(owner,/adPendingCount/);
 assert.match(owner,/adOwnerStatusFilter/);
 assert.match(owner,/loadAdNotificationIssues/);
 assert.match(owner,/LOCAL_MEDIA_NOT_UPLOADED/);
 assert.match(owner,/@media\(max-width:720px\)/);
 assert.match(owner,/min-height:44px/);
 assert.match(owner,/font-size:16px/);
 // This is SOURCE readiness, not the fully approved owner verify/pay/schedule E3.
});
test('ADS058 same original ad public renderer and one Article master UUID; no second selection engine',()=>{
 assert.equal((article.match(/data-jb-ad-placement="article"/g)||[]).length,1);
 assert.equal((home.match(/data-jb-ad-placement="homepage"/g)||[]).length,1);
 assert.match(article,/public-ads\.js/);
 assert.match(home,/public-ads\.js/);
 assert.match(ads,/JBPublicAds=\{render,scopeForArticle/);
 assert.match(ads,/jb_ad_public_feed/);
 assert.match(article,/const u=new URL\('article\.html',location.href\)/);
 assert.match(article,/u\.searchParams\.set\('id',item\.id\)/);
 assert.match(request,/params\.get\('origin'\)/);
 assert.match(request,/p_article:article\|\|null/);
 assert.doesNotMatch(article,/ad-analytics-client\.js|ad-viewability\.js/);
});
test('ADS059 independent news and no commercial ad is required to read a published article',()=>{
 assert.match(article,/getArticle\(id,\{privateData:false\}\)/);
 assert.match(article,/item\.status!=='published'/);
 assert.match(article,/Article available nahi hai ya currently unpublished hai/);
 assert.match(article,/Article load error:/);
 assert.match(ads,/try\{/);
 assert.match(ads,/catch\(_\)\{if\(current\(\)\)slot\.replaceChildren\(\)\}/);
 assert.match(ads,/pinnedArticleSlots\.add\(slot\)/);
 assert.match(css,/jb-ad-contact/);
});
test('ADS059 route discrepancy must remain explicitly DUE before claiming production canonical URL',()=>{
 assert.ok(fs.existsSync(root+'article.html'),'NESTED_ARTICLE_MISSING');
 assert.equal(fs.existsSync('article.html'),false,'ROOT_ARTICLE_EXISTS_REEVALUATE_ROUTE');
 assert.ok(fs.existsSync('index.html'),'ROOT_LANDING_PRESENT');
 assert.ok(fs.existsSync(root+'index.html'),'NESTED_NEWS_HOME_PRESENT');
 // This check is deliberately NOT a PASS for canonical routing:
 // preview root /article.html previously got 404; deployed URL mapping E7 DUE.
});
test('ADS060 preserve ALL 9 original canonical tests and 60 ADS with no fake commercial signoff',()=>{
 assert.equal(manifest.schema,'janta-bol-b7-canonical-closure-v1');
 assert.equal(manifest.final_zip_status,'BLOCKED');
 assert.equal(manifest.canonical_tests.length,9);
 assert.equal(manifest.ads.length,60);
 for(let i=0;i<9;i++){
  const t=manifest.canonical_tests[i];
  assert.equal(t.id,'P4-T'+String(i+34).padStart(3,'0'));
  assert.equal(t.final_status,'DUE');
  assert.equal(t.owner_signoff,null);
 }
 assert.deepEqual(manifest.canonical_tests[8].range,[57,60]);
 assert.deepEqual(manifest.canonical_tests[8].required_evidence,['E1','E3','E7']);
 assert.equal(manifest.ads.filter(x=>x.final_status==='PASS+LOCK').length,0);
 assert.match(phases,/P4-T042/);
});
test('ADS057/060 no unverified Owner/device proof passed by any CI mock/preview',()=>{
 const cp=read('JANTA_BOL_PHASE_4_WORKING/review/B7_CP06_ANDROID_E3_SAFE_HANDOFF_20261013.md');
 assert.match(cp,/NOT an Android PASS/);
 assert.match(cp,/Exact source and evidence/i);
 assert.match(cp,/LOCAL|SPCK/i);
 assert.match(cp,/BLOCKED_E3/);
 assert.match(cp,/no production/i);
});
