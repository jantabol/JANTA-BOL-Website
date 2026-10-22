import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
const load=(path)=>readFile(new URL(path,root),'utf8');
function clientTestHarness(role='owner'){
 const calls=[];
 let roleAllowed=role==='owner';
 const ctx={window:{JBBackend:{
   client:{rpc:async(name,args)=>{calls.push({name,args});return {data:name==='jb_b9_search'?{items:[],next_cursor:null}:name==='jb_b9_public_metrics'?null:[],error:null};}},
   requireOwner:async()=>{if(!roleAllowed)throw Error('OWNER_AAL2_REQUIRED');}
 }}};
 return load('b9-client.js').then(code=>{vm.runInNewContext(code,ctx);return {api:ctx.window.JBB9,calls,setOwner:b=>roleAllowed=b};});
}
test('B9 one existing backend RPC client, no Supabase keys/parallel Article state',async()=>{
 const code=await load('b9-client.js');
 assert.match(code,/JBBackend\.client/);
 for(const name of ['jb_b9_search','jb_b9_taxonomy_discover','jb_b9_related_news','jb_b9_reporter_discovery','jb_b9_public_metrics','jb_b9_owner_analytics','jb_b9_owner_metric_settings','jb_b9_owner_assign_term'])assert.ok(code.includes(name),name);
 assert.doesNotMatch(code,/service_role|SERVICE_ROLE_KEY|createClient\(|localStorage\.|new WebSocket/);
});
test('B9 Search passes only documented public-safe filters; UTF-8, ID/date and sorting guard',async()=>{
 const {api,calls}=await clientTestHarness();
 await api.search({query:'शिवपुरी',order:'latest',year:2024,month:8,limit:200,term:'education',district:'Shivpuri'});
 assert.equal(calls[0].name,'jb_b9_search');
 assert.equal(calls[0].args.p_query,'शिवपुरी');
 assert.equal(calls[0].args.p_limit,50);
 assert.equal(calls[0].args.p_year,2024);
 assert.equal(calls[0].args.p_month,8);
 for(const q of [{articleId:'not-uuid'},{from:'2026-08-02',to:'2026-08-01'},{year:0},{month:13},{cursor:'unsafe'}]){
   await assert.rejects(api.search(q));}
 assert.equal(calls.length,1,'invalid filters must not reach backend');
 assert.equal(api.articleLink('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'article.html?id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 assert.throws(()=>api.articleLink('javascript:alert(1)'));
});
test('B9 Owner-only controls fail before RPC for Reporter and inactive AAL2',async()=>{
 const {api,calls}=await clientTestHarness('reporter');
 await assert.rejects(api.ownerAnalytics(new Date().toISOString(),new Date(Date.now()+60000).toISOString()));
 await assert.rejects(api.ownerMetricSettings({globalSettings:true,views:true}));
 await assert.rejects(api.ownerAssignTerm('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','tag','school','School'));
 assert.equal(calls.length,0);
});
test('All ten B9 original test IDs have concrete code surfaces (coding only, not PASS)',async()=>{
 const [sql,search,searchUi,article,analytics,anaUi,css]=await Promise.all(
 ['../JANTA_BOL_PHASE_4_WORKING/db/20261022_b9_search_analytics_REVIEW_ONLY.sql','b9-search.html','b9-search-ui.js','b9-article-ui.js','b9-analytics.html','b9-analytics-ui.js','b9-ui.css'].map(p=>p.startsWith('../')?readFile(new URL(p,root),'utf8'):load(p)));
 assert.match(sql,/a\.status='published' and a\.deleted_at is null/);
 assert.match(sql,/using gin/);
 assert.match(sql,/jb_b9_related_news/);
 assert.match(sql,/jb_b9_reporter_discovery/);
 assert.match(sql,/private\.current_owner_aal2\(\)/);
 assert.match(sql,/public\.jb_records_set_public_views_internal/);
 assert.match(sql,/created_at>=p_from and e\.created_at<p_to/);
 assert.match(search,/b9Sort/);assert.match(search,/b9District/);assert.match(search,/b9Year/);
 assert.match(search,/b9Month/);assert.match(search,/b9From/);assert.match(search,/b9To/);
 assert.match(search,/b9Id/);assert.match(search,/b9Term/);
 assert.match(article,/MutationObserver/);assert.match(article,/JBB9\.related/);
 assert.match(analytics,/globalViews/);assert.match(analytics,/viewOverride/);
 assert.match(anaUi,/Asia\/Kolkata/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.doesNotMatch(searchUi,/\.innerHTML\s*=/);
 assert.doesNotMatch(anaUi,/\.innerHTML\s*=/);
});
test('Public Article failure isolation and PURL identity preserved',async()=>{
 const [article,backend,home]=await Promise.all(['article.html','backend-client.js','index.html'].map(load));
 assert.match(article,/new URLSearchParams\(location\.search\)/);
 assert.match(article,/item\.id/);
 assert.match(article,/b9-article-ui\.js/);
 assert.match(article,/jb-ad-placement="article"/);
 assert.match(home,/website-v3\.js/);
 assert.match(home,/b9-home-link\.js/);
 assert.match(backend,/async function listPublishedPublic/);
 assert.match(backend,/async function requireOwner/);
});
