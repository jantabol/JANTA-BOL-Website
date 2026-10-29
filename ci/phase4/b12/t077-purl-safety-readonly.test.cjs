'use strict';
// P4-T077 START: offline PURL, anonymous projection, auth/redirect and env separation.
// THIS DOES NOT mutate a LIVE article or grant Final T077 PASS.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const ROOT=path.resolve(__dirname,'../../..');
const V3=path.join(ROOT,'JANTA_BOL_PHASE_3C_WORKING');
const article=fs.readFileSync(path.join(V3,'article.html'),'utf8');
const bridge=fs.readFileSync(path.join(V3,'public-c1-projection.js'),'utf8');
const safeNav=fs.readFileSync(path.join(V3,'b12-safe-nav.js'),'utf8');
const login=fs.readFileSync(path.join(V3,'admin-login.html'),'utf8');
const backend=fs.readFileSync(path.join(V3,'backend-client.js'),'utf8');
const hosting=JSON.parse(fs.readFileSync(path.join(ROOT,'vercel.json'),'utf8'));
const ID='f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const DRAFT='690405f8-21af-4e46-9ddc-3c2e45abca9c';

function makeC1(rows){
  const calls=[];
  const window={JBBackend:{client:{rpc:async(name,args)=>{
    calls.push({name,args});
    return {data:{items:rows},error:null};
  }}}};
  vm.runInNewContext(bridge,{window,Array,String,Number,Object,Error},{timeout:1000});
  return {api:window.JBPublicC1,calls};
}
function published(id=ID,title='SpaDeX'){
  return {id,status:'published',slug:'spadex',title,body:'Public text',
    excerpt:'Public summary',category:'Technology',location:'India',
    published_at:'2026-10-28T04:30:02.685Z',
    news_date:'2026-10-23',public_attribution:'ISRO'};
}

test('T077-E1 immutable article UUID is the sole read and share identity',async()=>{
  const {api,calls}=makeC1([published()]);
  const x=await api.get(ID);
  assert.equal(x.id,ID);
  assert.equal(calls.at(-1).args.p_article_id,ID);
  assert.equal(calls.at(-1).args.p_limit,1);
  assert.equal(x.headline,'SpaDeX');
});
test('T077-E1 synthetic corrected headline leaves canonical article UUID untouched',async()=>{
  const before=makeC1([published(ID,'Original')]).api;
  const after=makeC1([published(ID,'Corrected')]).api;
  assert.equal((await before.get(ID)).id,(await after.get(ID)).id);
  assert.notEqual((await before.get(ID)).headline,(await after.get(ID)).headline);
});
test('T077-E4 anonymous draft, unrelated ID and malformed IDs fail closed',async()=>{
  const rows=[published(),{id:DRAFT,status:'draft',title:'PRIVATE',body:'PRIVATE',published_at:null}];
  const {api}=makeC1(rows);
  assert.equal(await api.get(DRAFT),null);
  assert.equal(await api.get('https://evil.invalid'),null);
  assert.equal(await api.get('../article.html'),null);
  assert.equal(await api.get('!'),null);
});
test('T077-E4 unexpected response UUID never substituted for requested story',async()=>{
  const {api}=makeC1([published()]);
  assert.equal(await api.get('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2'),null);
});
test('T077-E1 share strips admin preview, query tracking, and fragment',()=>{
  const m=article.match(/function shareUrl\(\)\{[^\n]+\}/);
  assert.ok(m,'share implementation missing');
  const url=new URL('https://news-preview.example/JANTA_BOL_PHASE_3C_WORKING/article.html?preview=admin&id='+ID+'&utm_source=other#anything');
  const share=new Function('URL','location','item',m[0]+';return shareUrl();')(
    URL,{href:url.href},{id:ID});
  const u=new URL(share);
  assert.equal(u.searchParams.size,1);
  assert.equal(u.searchParams.get('id'),ID);
  assert.equal(u.hash,'');
  assert.equal(u.origin,'https://news-preview.example');
});
test('T077-E1 Article canonical URL only on guest view; same UUID',()=>{
  assert.match(article,/!adminPreview\&\&!document\.querySelector\('link\[rel="canonical"\]'\)/);
  assert.match(article,/c\.href=shareUrl\(\)/);
  assert.match(article,/item\.status!=='published'/);
  assert.match(article,/Permanent Article ID:/);
});
test('T077-E2 Founder preview requires Owner and does not share',()=>{
  assert.match(article,/if\(adminPreview\)await JBBackend\.requireOwner\(\)/);
  assert.match(article,/if\(!item\|\|adminPreview\)return;/);
  assert.match(article,/ADMIN PREVIEW — public sharing disabled until publish/);
  assert.match(login,/mfaChallengeAndVerify/);
  assert.match(login,/currentLevel\s*!==\s*'aal2'/);
});
test('T077-E4 public C1 projection reads RPC only; private fields not exposed',async()=>{
  const row={...published(),internal_token:'NEVER_EXPORT',owner_email:'FOUNDER_PRIVATE',service_role_key:'SECRET'};
  const {api,calls}=makeC1([row]);
  const a=await api.get(ID);
  assert.equal(a.internal_token,undefined);
  assert.equal(a.owner_email,undefined);
  assert.equal(a.service_role_key,undefined);
  assert.deepEqual(calls.map(x=>x.name),['jb_c1_public_articles']);
  assert.doesNotMatch(bridge,/service_role|SERVICE_ROLE_KEY|localStorage|sessionStorage|fetch\(/);
});
test('T077-E4 next-page allowlist blocks external, traversal and encoded slash',()=>{
  const w={};vm.runInNewContext(safeNav,{window:w,URLSearchParams},{timeout:1000});
  for(const t of ['https://evil.com','//evil.com','../admin.html','%2fadmin.html','admin.html?next=https://evil.com']){
    assert.equal(w.JBProdSafeNav.target(t),'admin.html');
  }
  assert.equal(w.JBProdSafeNav.target('admin-security.html'),'admin-security.html');
});
test('T077-E6 domain, preview source and credentials are not embedded in article',()=>{
  assert.doesNotMatch(article,/SUPABASE_SERVICE_ROLE_KEY|JB_B11_SERVICE_ROLE_KEY|VERCEL_TOKEN/);
  assert.doesNotMatch(bridge,/\.from\('articles'\)|\.from\("articles"\)/);
  assert.match(article,/public-c1-projection\.js/);
  assert.match(backend,/requireOwner/);
  const routes=JSON.stringify(hosting);
  assert.match(routes,/JANTA_BOL_PHASE_3C_WORKING/);
  assert.match(routes,/admin-login\.html|index\.html/);
});
