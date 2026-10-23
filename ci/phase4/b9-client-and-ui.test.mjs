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


test('T101 invalid date after successful Search clears stale list, blocks RPC and speaks Hindi',async()=>{
 const code=await load('b9-search-ui.js');
 const elements=new Map();
 const createNode=()=>({children:[],hidden:false,disabled:false,textContent:'',className:'',
    replaceChildren(){this.children=[];},
    appendChild(x){this.children.push(x);},
    get childElementCount(){return this.children.length;}});
 for(const id of ['b9Filters','b9Status','b9Results','b9More','b9Submit','b9Terms','b9Reporters'])elements.set(id,createNode());
 const form=elements.get('b9Filters');
 form.events={};
 form.addEventListener=(name,fn)=>{form.events[name]=fn;};
 form.querySelectorAll=()=>[];
 const buttons=elements.get('b9More');
 buttons.addEventListener=()=>{};
 let input={query:'test',from:'',to:''},queries=0;
 const ctx={
  document:{getElementById:id=>elements.get(id),createElement:()=>createNode()},
  location:{pathname:'/b9-search.html',search:''},
  history:{replaceState(){}},
  URLSearchParams,
  FormData:class{entries(){return Object.entries(input);}},
  setTimeout,
  JBB9:{
    cleanSearch(f){if(f.from&&f.to&&f.from>f.to)throw Error('B9_INVALID_DATE_RANGE');return f;},
    search:async()=>{queries++;return {items:[],next_cursor:null};},
    taxonomy:async()=>[],
    reporterDiscovery:async()=>[]
  }
 };
 vm.runInNewContext(code,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 const results=elements.get('b9Results');
 results.appendChild(createNode()); // previous successful results should not persist.
 input={query:'',from:'2026-10-20',to:'2026-10-10'};
 const before=queries;
 form.events.submit({preventDefault(){}});
 assert.equal(queries,before,'bad date must not call backend');
 assert.equal(results.childElementCount,0,'old items must be removed on invalid date');
 assert.equal(buttons.hidden,true,'paging must be hidden after invalid date');
 assert.match(elements.get('b9Status').textContent,/गलत तारीख सीमा/);
 assert.doesNotMatch(elements.get('b9Status').textContent,/B9_INVALID_DATE_RANGE/);
});

test('T109 injected search RPC failure clears stale results; next successful search recovers',async()=>{
 const code=await load('b9-search-ui.js');
 const elements=new Map();
 const node=()=>({children:[],textContent:'',hidden:false,disabled:false,className:'',style:{},
   appendChild(x){this.children.push(x);},
   replaceChildren(){this.children=[];},
   get childElementCount(){return this.children.length;}});
 for(const id of ['b9Filters','b9Status','b9Results','b9More','b9Submit','b9Terms','b9Reporters'])elements.set(id,node());
 const form=elements.get('b9Filters');form.events={};form.addEventListener=(n,fn)=>{form.events[n]=fn;};form.querySelectorAll=()=>[];
 elements.get('b9More').addEventListener=()=>{};
 let current={query:'initial'};
 let mode='success',queryCount=0;
 const ctx={document:{getElementById:id=>elements.get(id),createElement:()=>node()},
  location:{pathname:'/b9-search.html',search:''},history:{replaceState(){}},
  URLSearchParams,setTimeout,FormData:class{entries(){return Object.entries(current);}},
  JBB9:{
    cleanSearch:()=>true,
    articleLink:id=>'article.html?id='+id,
    search:async()=>{queryCount++;if(mode==='failure')throw Error('INJECTED_REMOTE_503');
      return {items:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',title:'Old approved story'}],next_cursor:null};},
    taxonomy:async()=>[],reporterDiscovery:async()=>[]
  }};
 vm.runInNewContext(code,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(elements.get('b9Results').childElementCount,1,'initial public result present');
 mode='failure';current={query:'different'};
 form.events.submit({preventDefault(){}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(elements.get('b9Results').childElementCount,0,'backend failure MUST NOT retain stale results');
 assert.equal(elements.get('b9More').hidden,true,'pagination disabled on backend outage');
 assert.match(elements.get('b9Status').textContent,/खोज अभी उपलब्ध नहीं/);
 assert.doesNotMatch(elements.get('b9Status').textContent,/INJECTED_REMOTE_503/,'hide internal error detail');
 mode='success';current={query:'recovered'};
 form.events.submit({preventDefault(){}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(elements.get('b9Results').childElementCount,1,'healthy search recovers without reload');
 assert.equal(queryCount,3);
});

test('T109 injected Analytics RPC failure clears previous Founder report and does not touch publishing',async()=>{
 const code=await load('b9-analytics-ui.js');
 const m=new Map();
 const node=()=>({children:[],textContent:'',className:'',value:'',checked:false,events:{},
  appendChild(x){this.children.push(x);},
  replaceChildren(){this.children=[];},
  addEventListener(n,fn){this.events[n]=fn;},
  get childElementCount(){return this.children.length;}});
 for(const id of ['period','from','to','order','status','summary','articleRows','globalDisplay','articleDisplay','taxonomyAssign','b9AnalyticsFilter'])m.set(id,node());
 m.get('period').value='today';m.get('order').value='views';
 m.get('summary').appendChild(node());m.get('articleRows').appendChild(node());
 let publishCalls=0;
 const ctx={document:{getElementById:id=>m.get(id),createElement:()=>node(),documentElement:{dataset:{jbAuth:'ready'}}},
  JBBackend:{requireOwner:async()=>{},publishNews:()=>{publishCalls++;}},
  JBB9:{ownerAnalytics:async()=>{throw Error('INJECTED_ANALYTICS_DB_DOWN');}},
  addEventListener:()=>{},Intl,Date};
 vm.runInNewContext(code,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(m.get('summary').childElementCount,0,'old summary must be cleared on failed report');
 assert.equal(m.get('articleRows').childElementCount,0,'old Article counts must be cleared on failed report');
 assert.match(m.get('status').textContent,/News\/Article publishing स्वतंत्र है/);
 assert.equal(publishCalls,0);
});

test('T109 optional Reporter/Analytics/Related RPC failures do not erase direct Article',async()=>{
 const code=await load('b9-article-ui.js');
 const makeNode=()=>({children:[],textContent:'',className:'',
  appendChild(x){this.children.push(x);},disconnect(){},querySelector:()=>null});
 const article=makeNode();
 const root={querySelector:selector=>selector==='article.article'?article:null};
 let attempts=0;
 const ctx={URLSearchParams,location:{search:'?id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},
   document:{getElementById:()=>root,createElement:()=>makeNode()},
   MutationObserver:class{observe(){}disconnect(){}},
   JBB9:{publicAuthor:async()=>{attempts++;throw Error('reporter down');},
     publicMetrics:async()=>{attempts++;throw Error('analytics down');},
     related:async()=>{attempts++;throw Error('related down');}}};
 vm.runInNewContext(code,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(root.querySelector('article.article'),article,'canonical article remains mounted');
 assert.equal(attempts,3,'all optional calls tried, each failure isolated');
});
