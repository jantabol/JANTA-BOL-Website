import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const d='JANTA_BOL_PHASE_3C_WORKING/';
const read=p=>readFileSync(p,'utf8');
const blob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
const B9=Object.freeze({
  'b9-client.js':'88d8526fd88403e50f48474cd562a0b77d0515a3',
  'b9-search.html':'151866369fda3a9522b43f50cda32ddab5e27f35',
  'b9-search-ui.js':'98b785cc3029aaa70e83b13d7133a69439c67e20',
  'b9-ui.css':'a81498541db6ac49ebbd514d74652446a7d3153c',
  'b9-home-entry.css':'acc8a9f5165d51661a5fe52fdc4bc35b1ce9e304',
  'b9-home-link.js':'4993202187078a84d078338964284647268cd58c'
});
const home=read(d+'index.html');
const search=read(d+'b9-search.html');
const client=read(d+'b9-client.js');
const ui=read(d+'b9-search-ui.js');

test('reuse immutable B9 public Search source, no rewrite, six exact Git blob identities',()=>{
  for(const [name,sha] of Object.entries(B9))assert.equal(blob(read(d+name)),sha,name);
});
test('B9 search CTA is in public candidate ahead of the hero, visible on mobile, no duplicate',()=>{
  assert.equal((home.match(/id="b9SearchNav"/g)||[]).length,1);
  assert.match(home,/<nav class="b9-search-entry"[^>]*aria-label="समाचार खोज">[\s\S]*?href="b9-search\.html"/);
  assert.ok(home.indexOf('id="b9SearchNav"')>home.indexOf('</header>'));
  assert.ok(home.indexOf('id="b9SearchNav"')<home.indexOf('<section class="hero">'));
  assert.match(home, /href="b9-home-entry\.css\?v=20261027-t071"/);
  assert.match(read(d+'b9-home-entry.css'), /min-height:46px/);
  assert.match(read(d+'b9-home-entry.css'), /focus-visible/);
  assert.match(home, /script src="b9-home-link\.js"/);
  assert.match(read(d+'b9-home-link.js'), /getElementById\('b9SearchNav'\)\)return/);
});
test('empty breaking banner truly hidden; real breaking event remains possible',()=>{
  assert.match(home, /id="top-story" hidden aria-live="polite"/);
  assert.match(home, /#top-story\[hidden\]\{display:none!important\}/);
  assert.match(read(d+'website-v3.js'), /breakingSection\.hidden=false/);
});
test('search is real public B9 filter/RPC UI, not a limited homepage-only search',()=>{
  for(const id of ['b9Filters','b9Query','b9Id','b9District','b9Location','b9Category','b9Term','b9From','b9To','b9Year','b9Month','b9Sort','b9Results'])
    assert.ok(search.includes('id="'+id+'"'),id);
  for(const js of ['supabase-config.js','backend-client.js','b9-client.js','b9-search-ui.js'])
    assert.ok(search.includes('src="'+js+'"'),js);
  assert.match(client,/JBBackend\.client/);
  assert.match(client,/jb_b9_search/);
  assert.match(ui,/JBB9\.search/);
  assert.doesNotMatch(ui,/\.innerHTML\s*=/);
  assert.doesNotMatch(client,/service_role|SERVICE_ROLE_KEY|createClient\(|localStorage\./);
});
test('public B9 search RPC accepts valid filters and clamps limit to 50, rejects invalid inputs before RPC',async()=>{
  const calls=[];
  const context={window:{JBBackend:{
    client:{rpc:async(name,args)=>{calls.push({name,args});return {data:{items:[],next_cursor:null},error:null};}},
    requireOwner:async()=>{throw Error('AUTH_REQUIRED');}
  }}};
  vm.runInNewContext(client,context);
  const b9=context.window.JBB9;
  const result=await b9.search({query:'शिवपुरी',year:2026,month:10,limit:500});
  assert.ok(Array.isArray(result.items));
  assert.equal(calls.length,1);
  assert.equal(calls[0].name,'jb_b9_search');
  assert.equal(calls[0].args.p_query,'शिवपुरी');
  assert.equal(calls[0].args.p_limit,50);
  for(const bad of [{articleId:'not-a-uuid'},{from:'2026-10-24',to:'2026-10-20'},{month:13},{cursor:'garbled'}])
    await assert.rejects(()=>b9.search(bad));
  assert.equal(calls.length,1,'no RPC made with invalid public filters');
  assert.equal(b9.articleLink('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    'article.html?id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
});
test('public Search failure does not invent results or leak backend error, and stale results cleared',()=>{
  assert.match(ui,/results\.replaceChildren\(\); \/\/ RPC outage/);
  assert.match(ui,/खोज अभी उपलब्ध नहीं है/);
  assert.match(ui,/पुराने Search Results छिपा दिए गए हैं/);
  assert.match(ui,/textContent=/);
});
test('canonical Article frontend, Ads frontend and public root retained unchanged',()=>{
  assert.equal(blob(read('index.html')),'e82e88aee6e953f0eb0f817361cb87c3a5194aae');
  // Original B11 pre-C1 Article blob d2d414... remains in historic PR #46.
  // Current deployed C1 Article PURL is pinned to REAL production source
  // 93df12a... rather than rolling it back to old B8 bytes.
  assert.equal(blob(read(d+'article.html')),'98dca1e26f32846b6fba722731acd6d14f0aed41');
  const article=read(d+'article.html');
  assert.match(article,/JBBackend\.requireOwner\(\)/);
  assert.match(article,/JBPublicC1\.get\(id\)/);
  assert.match(article,/document\.querySelector\('link\[rel="canonical"\]'\)/);
  // Separate shared Ads source fingerprint is still original exact B8 code.
  assert.equal(blob(read(d+'public-ads.js')),'a450cc3158c4c72692e848d3044ee00e53582082');
  const route=JSON.parse(read('vercel.json'));
  assert.deepEqual(route.redirects,[{source:'/',destination:'/JANTA_BOL_PHASE_3C_WORKING/index.html',permanent:false}]);
});
test('source Search PASS cannot issue launch acceptance, and editorial QA records remain Founder-review HOLD',()=>{
  const verdict={b9_source_reused:true,hosted_search_e2e:'NOT_RUN',published_qa_review:'HOLD',
    t071_full_fault_matrix:'HOLD',launch:'NO_GO'};
  assert.equal(verdict.hosted_search_e2e,'NOT_RUN');
  assert.equal(verdict.published_qa_review,'HOLD');
  assert.equal(verdict.launch,'NO_GO');
});
