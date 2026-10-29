'use strict';
// T035 CP03: real Chromium DOM on exact checked-out Article code, isolated
// synthetic News Backend. E1 source fixture only, NEVER Android/official LGD E2.
const assert=require('node:assert/strict'),fs=require('node:fs');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve('JANTA_BOL_PHASE_3C_WORKING');
const dest=path.resolve('t035-cp03-article-browser-evidence');
fs.mkdirSync(dest,{recursive:true});
const ID='14539159-7091-4697-9e19-2927048a06a5';
const text=n=>Array.from({length:n},(_,i)=>
 'यह परीक्षण की काल्पनिक खबर का वास्तविक अनुच्छेद '+(i+1)+
 ' है जिसमें पर्याप्त शब्द और महत्वपूर्ण विवरण शामिल हैं।').join('\n\n');
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 if(pathname.includes('..')){res.writeHead(403);return res.end('Forbidden')}
 const p=path.resolve(root,'.'+pathname);
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 fs.readFile(p,(e,b)=>{
  if(e){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'content-type':({'.html':'text/html','.css':'text/css','.js':'application/javascript'}[path.extname(p)]||'application/octet-stream'),'cache-control':'no-store'});res.end(b)
 });
});
const fake=body=>route=>route.fulfill({status:200,contentType:'application/javascript',body});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true,locale:'hi-IN'});
  await context.addInitScript(()=>{
   window.__geoReads=0;window.__rpcCalls=[];
   try{Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
    getCurrentPosition(){window.__geoReads++;throw Error('GPS_NOT_ALLOWED')},
    watchPosition(){window.__geoReads++;throw Error('GPS_NOT_ALLOWED')}
   }})}catch(_){}
  });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1).*/,r=>r.abort('blockedbyclient'));
  await context.route('**/supabase-config.js',fake('/* local no key */'));
  const backend=[
   'window.JBBackend={',
   'client:{rpc:async(name,args)=>{window.__rpcCalls.push({name,args});return{data:[],error:null}}},',
   'esc:x=>String(x??"").replace(/[&<>"\\u0027]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","\\u0027":"&#39;"}[c])),',
   'safeUrl:()=>null,',
   'getArticle:async(id)=>{if(id!=="'+ID+'")throw Error("WRONG_FIXTURE");return {',
   'id,status:"published",headline:"SYNTHETIC T035 CP03 ARTICLE",',
   'content:window.__fixtureText,geoLevel:"MP",district:"Gwalior",location:"Gwalior",',
   'summary:"SYNTHETIC ARTICLE - NOT PUBLIC NEWS"}},',
   'requireOwner:async()=>{throw Error("ADMIN_NOT_USED")}};'
  ].join('\n');
  await context.route('**/backend-client.js',fake(backend));
  await context.route('**/phase2-client.js',fake('window.JBPhase2={track:()=>{}};'));
  const page=await context.newPage();
  const observations=[];
  for(const n of [0,1,2,3,10]){
   const content=text(n);
   await page.addInitScript(t=>{window.__fixtureText=t},content);
   await page.goto('http://127.0.0.1:'+server.address().port+
     '/article.html?id='+ID+'&district=Pichhore',{waitUntil:'domcontentloaded'});
   await page.locator('.article .body').waitFor({state:'attached'});
   await page.waitForFunction(()=>window.__rpcCalls?.length===1);
   const x=await page.evaluate(()=>{
     const body=document.querySelector('.article .body');
     const slot=document.querySelector('.jb-ad-region');
     return {
      text:body.textContent,inline:slot.parentNode===body,
      before:slot.parentNode===body?body.firstChild?.textContent:'',
      paidSlots:document.querySelectorAll('[data-jb-ad-placement="article"]').length,
      paidVisible:document.querySelectorAll('.jb-public-ad').length,
      articleId:document.querySelector('.article .notice strong')?.textContent,
      contact:document.querySelector('#jb-ad-contact-article a')?.getAttribute('href'),
      gpsReads:window.__geoReads,requests:window.__rpcCalls,
      href:location.href
     }
   });
   assert.equal(x.text,content,'EDITORIAL_NEWS_BODY_CHANGED');
   assert.equal(x.inline,n>=3,'SEMANTIC_PARAGRAPH_INSERTION_INCORRECT');
   if(n>=3)assert.equal(x.before,text(n===3?2:3),'AD_SPLIT_A_REAL_PARAGRAPH');
   assert.equal(x.paidSlots,1,'MULTIPLE_PAID_ARTICLE_SLOTS');
   assert.equal(x.paidVisible,0,'SYNTHETIC_NO_LIVE_AD_MUST_NOT_SHOW');
   assert.equal(x.articleId,ID,'CANONICAL_MASTER_ARTICLE_ID_CHANGED');
   assert.equal(x.contact,'advertise-request.html?origin=article&id='+ID);
   assert.equal(x.gpsReads,0,'VIEWER_GPS_COLLECTED');
   assert.equal(x.requests.length,1,'ARTICLE_BACKEND_QUERY_MULTIPLE');
   assert.equal(x.requests[0].name,'jb_ad_public_feed');
   assert.equal(x.requests[0].args.p_placement,'article');
   // This legacy client argument MUST be recorded as DUE, not labelled safe.
   assert.equal(x.requests[0].args.p_scope,'global',
     'LEGACY_GWALIOR_CLASSIFICATION_CHANGED_REQUIRE_REAUDIT');
   assert.ok(x.href.includes('district=Pichhore'),'FORGED_QUERY_NOT_PRESERVED');
   if([3,10].includes(n))await page.screenshot({path:dest+'/paragraphs-'+n+'-360.png'});
   observations.push({paragraphs:n,insideBody:x.inline,
      beforeParagraphs:n<3?0:n===3?2:3,slots:1,paidAds:0,
      newsUnchanged:true,urlUnchanged:true,gps:0,scope:'global'});
  }
  fs.writeFileSync(dest+'/metrics.json',JSON.stringify({
   source:'exact checked-out frontend; synthetic Gwalior article',
   verdict:'CHROMIUM_E1_PASS; E2_LGD_AND_E3_ANDROID_HOLD',observations},null,2));
  console.log('CP03_ADS013_CHROMIUM_360=PASS paragraphs=0,1,2,3,10');
  console.log('CP03_EDITORIAL_PERMANENT_ID_SINGLE_SLOT=PASS; GEOLOCATION_REQUESTS=0');
  console.log('CP03_ADS014_GWALIOR_LEGACY_SCOPE_GLOBAL=CONFIRMED_DIVERGENCE');
  console.log('CP03_ADS014_OFFICIAL_LGD_DEPLOYED_E2=HOLD; ANDROID_E3=HOLD; PROD_WRITES=0');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error('CP03_BROWSER_FAIL '+e.stack);process.exitCode=1});
