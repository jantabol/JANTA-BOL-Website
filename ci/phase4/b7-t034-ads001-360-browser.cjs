'use strict';
// ADS-001: real Chromium CSS pixel layout proof using EXACT checked-out frontend.
// Article fixture is synthetic, not a real Supabase request; E3 physical Founder Android remains independent.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve('JANTA_BOL_PHASE_3C_WORKING');
const dest=path.resolve('ads001-360-evidence');
fs.mkdirSync(dest,{recursive:true});
const fixtureID='14539159-7091-4697-9e19-2927048a06a5';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
 const clean=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 if(clean.includes('..')){res.writeHead(403);return res.end('Forbidden');}
 const target=path.resolve(root,'.'+clean);
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 fs.readFile(target,(error,buffer)=>{if(error){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});res.end(buffer);});
});
function fake(response){
 return response.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:'/* ADS001 synthetic isolated fixture */'});
}
const metrics=async(page,selector)=>{
 await page.locator(selector).waitFor({state:'visible'});
 const r=await page.locator(selector).evaluate(el=>{
  const b=el.getBoundingClientRect(),cs=getComputedStyle(el),html=document.documentElement;
  return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,
   innerWidth:window.innerWidth,scrollWidth:html.scrollWidth,fontSize:cs.fontSize,
   hidden:el.closest('[hidden]')!==null,link:el.getAttribute('href'),text:el.textContent?.trim()};
 });
 assert.ok(r.width>=44 && r.height>=44,'CTA hit area must be at least 44 CSS px each');
 assert.ok(r.x>=0 && r.right<=r.innerWidth+1,'CTA must remain fully inside 360px viewport');
 assert.ok(parseFloat(r.fontSize)>=17,'CTA readable at 360px, font >=17 CSSpx');
 assert.equal(r.hidden,false,'CTA not hidden');
 assert.match(r.text,/विज्ञापन के लिए संपर्क करें/);
 return r;
};
(async()=>{
 await new Promise(res=>server.listen(0,'127.0.0.1',res));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:360,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'hi-IN',timezoneId:'Asia/Kolkata'});
  // Block external networks and deterministic fake data. No Supabase writes or real credentials.
  await context.route(/^https?:\/\/(?!127\.0\.0\.1).*/,route=>route.abort('blockedbyclient'));
  await context.route('**/supabase-config.js',fake);
  await context.route('**/backend-client.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:`
   window.JBBackend={
     client:{},esc:(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
     safeUrl:()=>null,
     getArticle:async()=>({id:'${fixtureID}',status:'published',headline:'Synthetic 360px article only',category:'Test',geoLevel:'Local',summary:'Synthetic test summary',content:'Synthetic UI-only, no backend'}),
     requireOwner:async()=>{}
   };
  `}));
  await context.route('**/phase2-client.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:'window.JBPhase2={track:()=>{}};'}));
  await context.route('**/public-ads.js*',route=>route.fulfill({status:200,contentType:'text/javascript',body:'window.JBPublicAds={placeArticleSlot:()=>{},render:()=>{},scopeForArticle:()=> "global"};'}));
  const page=await context.newPage();
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  const homepage=await metrics(page,'.jb-ad-contact a[href="advertise-request.html?origin=homepage"]');
  assert.ok(homepage.height>=48,'Homepage CTA must have >=48px height');
  assert.equal(await page.locator('[data-jb-ad-placement="homepage"]').count(),1,'only one homepage ad slot');
  await page.screenshot({path:dest+'/homepage-360.png',fullPage:false});
  await page.locator('.jb-ad-contact a').click();
  await page.waitForURL('**/advertise-request.html?origin=homepage');
  assert.equal(await page.locator('#adName').count(),1);
  assert.equal(await page.locator('#adWhatsApp').count(),1);
  assert.equal(await page.locator('#adConsent[required]').count(),1);
  assert.equal(await page.locator('select[name*="placement"], input[type="file"]').count(),0,'public form does not request placement or media');
  await page.screenshot({path:dest+'/homepage-enquiry-360.png',fullPage:false});

  await page.goto(origin+'/article.html?id='+fixtureID,{waitUntil:'domcontentloaded'});
  await page.locator('#jb-ad-contact-article').waitFor({state:'visible',timeout:15000});
  const article=await metrics(page,'#jb-ad-contact-article a');
  assert.equal(article.link,'advertise-request.html?origin=article&id='+fixtureID);
  assert.equal(await page.locator('[data-jb-ad-placement="article"]').count(),1);
  await page.screenshot({path:dest+'/article-360-synthetic.png',fullPage:false});
  await page.locator('#jb-ad-contact-article a').click();
  await page.waitForURL('**/advertise-request.html?origin=article&id='+fixtureID);
  assert.equal(await page.locator('#adSubmit').count(),1);
  assert.equal(await page.locator('#adConsent[required]').count(),1);
  await page.screenshot({path:dest+'/article-enquiry-360-synthetic.png',fullPage:false});
  const result={test:'ADS001',status:'BROWSER_360_PASS_NOT_REAL_ANDROID',source:'exact checked-out homepage/article CSS, synthetic article backend only',homepage,article,articleId:fixtureID,clickRoutes:['homepage','article'],viewportCSS:360};
  fs.writeFileSync(dest+'/metrics.json',JSON.stringify(result,null,2)+'\n');
  process.stdout.write('PASS [ADS-001 Chromium 360px E1] '+JSON.stringify(result)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error('FAIL [ADS-001 Chromium 360px]',e);process.exitCode=1;});
