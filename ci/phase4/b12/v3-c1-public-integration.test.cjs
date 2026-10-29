'use strict';
// Read-only V3 public publishing integration regression; no Supabase credentials or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../../..');
const V3 = path.join(ROOT, 'JANTA_BOL_PHASE_3C_WORKING');
const projection = fs.readFileSync(path.join(V3, 'public-c1-projection.js'), 'utf8');
const website = fs.readFileSync(path.join(V3, 'website-v3.js'), 'utf8');
const homepage = fs.readFileSync(path.join(V3, 'index.html'), 'utf8');
const article = fs.readFileSync(path.join(V3, 'article.html'), 'utf8');

const ID = 'f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const DRAFT_ID = '690405f8-21af-4e46-9ddc-3c2e45abca9c';
const sample=[
  {id:ID,slug:'isro-spadex',status:'published',title:'ISRO SpaDeX',
   excerpt:'प्रकाशित समाचार',body:'ISRO की खबर',category:'Technology',public_attribution:'ISRO',
   published_at:'2026-10-28T04:30:00Z',location:'India',cover_image_url:'',
   breaking:false,top_story:false,verification_evidence:'HIDDEN_INTERNAL',owner_email:'HIDDEN_PRIVATE'},
  {id:DRAFT_ID,status:'draft',title:'PRIVATE DRAFT',published_at:null,category:'Technology'}
];
function makeProjection(reply) {
  const calls=[];
  const window={JBBackend:{client:{rpc:async(name,args)=>{
    calls.push({name,args});
    if(typeof reply==='function')return reply(name,args);
    return reply || {data:{items:sample},error:null};
  }}}};
  vm.runInNewContext(projection,{window,Number,Array,String,Error,Object},
    {filename:'public-c1-projection.js',timeout:2500});
  return {api:window.JBPublicC1,calls};
}
test('V3 uses published-only RPC and maps ISRO into existing V3 article shape',async()=>{
  const {api,calls}=makeProjection();
  const rows=await api.list(30);
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,ID);
  assert.equal(rows[0].headline,'ISRO SpaDeX');
  assert.equal(rows[0].summary,'प्रकाशित समाचार');
  assert.equal(rows[0].content,'ISRO की खबर');
  assert.equal(rows[0].category,'Technology');
  assert.equal(rows[0].internalSource.publicAttribution,'ISRO');
  assert.equal(rows[0].status,'published');
  assert.equal(rows[0].verification_evidence,undefined);
  assert.equal(rows[0].owner_email,undefined);
  assert.equal(calls[0].name,'jb_c1_public_articles');
  assert.equal(calls[0].args.p_article_id,null);
  assert.equal(calls[0].args.p_limit,30);
});
test('V3 published detail id is strict and does not return other articles',async()=>{
  const {api,calls}=makeProjection();
  assert.equal((await api.get(ID)).id,ID);
  assert.equal(calls.at(-1).args.p_article_id,ID);
  assert.equal(calls.at(-1).args.p_limit,1);
  assert.equal(await api.get(DRAFT_ID),null);
  assert.equal(await api.get('bad-id'),null);
  assert.equal(await api.get('../admin.html'),null);
});
test('V3 guest list bounds to 1..30',async()=>{
  const {api,calls}=makeProjection();
  await api.list(1000);
  assert.equal(calls.at(-1).args.p_limit,30);
  await api.list(-1);
  assert.equal(calls.at(-1).args.p_limit,1);
});
test('V3 rejects unavailable RPC, failed C1 and malformed projection',async()=>{
  const unavailable=makeProjection(()=>({data:null,error:{message:'AUTH_FORBIDDEN'}}));
  await assert.rejects(unavailable.api.list(),/PUBLIC_C1_RPC_UNAVAILABLE/);
  const broken=makeProjection(()=>({data:{unexpected:true},error:null}));
  await assert.rejects(broken.api.list(),/PUBLIC_C1_INVALID_PROJECTION/);
  const noClient={};
  vm.runInNewContext(projection,{window:noClient,Number,Array,String,Error,Object},{timeout:2500});
  await assert.rejects(noClient.JBPublicC1.list(),/PUBLIC_C1_CLIENT_UNAVAILABLE/);
});
test('V3 public pages use C1 on existing homepage/article routes; admin preview unchanged',()=>{
  assert.match(homepage,/src="backend-client\.js"><\/script><script src="public-c1-projection\.js"><\/script><script src="website-v3\.js"/);
  assert.match(article,/src="backend-client\.js"><\/script><script src="public-c1-projection\.js"><\/script><script src="phase2-client\.js"/);
  assert.match(website,/JBPublicC1\.list\(30\)/);
  assert.doesNotMatch(website,/JBBackend\.listPublishedPublic\(30\)/);
  assert.match(article,/adminPreview\?await JBBackend\.getArticle\(id,\{privateData:false\}\):await JBPublicC1\.get\(id\)/);
  assert.match(article,/if\(adminPreview\)await JBBackend\.requireOwner\(\)/);
  assert.match(article,/JBBackend\.esc\(item\.content/);
  assert.match(article,/b9-article-ui\.js/);
  assert.match(article,/public-ads\.js/);
  assert.match(article,/Permanent Article ID/);
  assert.match(homepage,/b9-home-link\.js/);
  assert.match(homepage,/public-ads\.js/);
  assert.doesNotMatch(homepage,/category-section category-open/);
  assert.match(website,/holder\.replaceChildren\(\)/);
  assert.match(website,/इस श्रेणी में अभी कोई प्रकाशित खबर नहीं है।/);
});
test('Fake ticker and demo submission forms cannot mislead public',()=>{
  assert.doesNotMatch(homepage,/शिवपुरी में भारी बारिश • करैरा में सड़क हादसा/);
  assert.doesNotMatch(homepage,/🔴 LIVE\s*<\/div>/);
  assert.match(homepage,/#citizen-news-form,#official-reporter-form\{display:none!important\}/);
  assert.match(homepage,/जमा नहीं होगी/);
  assert.match(homepage,/अभी स्वीकार नहीं किया जा रहा/);
});
test('V3 article distinguishes actual publish timestamp from news date; IST is unambiguous',()=>{
  const begin=article.indexOf('function articleDateLabels(item)');
  const end=article.indexOf('(async()=>{try{if(adminPreview)',begin);
  assert.ok(begin>0&&end>begin,'article date formatter missing');
  const context={};
  vm.runInNewContext(article.slice(begin,end)+';globalThis.formatDate=articleDateLabels',context,{timeout:1000});
  const label=context.formatDate({
    publishedAt:'2026-10-28T04:30:02.685Z',
    newsDate:'2026-10-23',
    location:'India'
  });
  assert.match(label,/28 अक्टूबर 2026/);
  assert.match(label,/10:00 IST/);
  assert.match(label,/समाचार की तिथि: 23 अक्टूबर 2026/);
  assert.doesNotMatch(label,/am बजे/);
  assert.match(article,/JBBackend\.esc\(articleDateLabels\(item\)\)/);
});
test('Dashboard does not falsely state Founder binding is pending',()=>{
  const admin=fs.readFileSync(path.join(V3,'admin.html'),'utf8');
  assert.doesNotMatch(admin,/Founder Auth account binding pending/);
  assert.match(admin,/MFA\/AAL2 Verification/);
  assert.match(admin,/src="admin-auth\.js"/);
});
const locks={
  'admin-auth.js':'e0c751cbaa6582aa00ffd82d23f03c01956142f7',
  'admin-login.html':'2254f94ce40d49cda0ed0076311d511685036fc3',
  'b12-safe-nav.js':'ede5edac22f85759facb72b189c0b90a245f0d6c',
  'admin-security.html':'b4dcaf30fb4a64a4848e772928a3bb8d15415534',
  'backend-client.js':'0789934809c91a39d73a6d2570d0938fb6fbb47a'
};
test('Protected Founder/Auth source files remain byte-identical to reviewed baseline blobs',()=>{
  for(const [file,sha] of Object.entries(locks)){
    const bytes=fs.readFileSync(path.join(V3,file));
    const blob=Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]);
    assert.equal(crypto.createHash('sha1').update(blob).digest('hex'),sha,file);
  }
  const vercel=fs.readFileSync(path.join(ROOT,'vercel.json'));
  const blob=Buffer.concat([Buffer.from('blob '+vercel.length+'\0'),vercel]);
  assert.equal(crypto.createHash('sha1').update(blob).digest('hex'),
    'c4b515325b5766489e4af90a143887d98f8aaa8a','vercel route baseline');
});
