// P4-T071 E1+E2-in-isolated-VM: execute REAL B8 integrated newsroom frontend
// source at an exact separately checked-out SHA. NO production network/DB,
// not 13-domain acceptance, no actual RPO/RTO or independent E8.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {join} from 'node:path';

const root=process.env.T071_PINNED_INTEGRATED_ROOT;
assert(root && !root.includes('..') && root.endsWith('t071-integrated-fixture'),
 'Exact pinned integrated source checkout required; no fallback to main/demo');
const source=readFileSync(join(root,'JANTA_BOL_PHASE_3C_WORKING/website-v3.js'),'utf8');
const html=readFileSync(join(root,'JANTA_BOL_PHASE_3C_WORKING/index.html'),'utf8');
const B8_SOURCE_SHA='658f474d6ee0f24efac60f069979e8adee1e9221';

class Element {
 constructor(tag='div') {this.tag=tag;this.children=[];this.adjacent=[];this.id='';
  this.style={};this.className='';this.href='';this.textContent='';this.innerHTML='';this.hidden=false;}
 appendChild(e) {this.children.push(e);return e;}
 insertAdjacentElement(position,e){this.adjacent.push({position,element:e});return e;}
 querySelector(selector){return selector==='.breaking-content'?this.breakingContent??null:null;}
}
function setup({news=[],newsFails=false,live=[],liveFails=false}={}){
 const latest=new Element('section'),featured=new Element('section'),breaking=new Element('section'),
 content=new Element('div');
 breaking.hidden=true;breaking.breakingContent=content;
 const nodes={'.latest-news-section':latest,'.featured-news':featured,'.breaking-news':breaking};
 let calls={articles:0,live:0};const errors=[];
 const JBBackend={
  esc:x=>String(x??'').replace(/[<&"]/g,c=>({'<':'&lt;','&':'&amp;','"':'&quot;'}[c])),
  listPublishedPublic:async limit=>{
   assert.equal(limit,30);calls.articles++;
   if(newsFails)throw Error('FIXTURE_NEWS_SOURCE_UNAVAILABLE');
   return news;
  },
  client:{from:table=>{
   assert.equal(table,'public_live_feed');calls.live++;
   const chain={select(){return chain},in(){return chain},order(){return chain},
    async limit(n){assert.equal(n,50);if(liveFails)throw Error('FIXTURE_LIVE_UPSTREAM_DOWN');
     return {data:live,error:null};}};
   return chain;
  }}
 };
 const document={createElement:tag=>new Element(tag),
  querySelector:selector=>nodes[selector]??null,
  getElementById:()=>null,body:new Element('body')};
 const context=vm.createContext({window:{JBBackend},JBBackend,document,
  console:{error:(...args)=>errors.push(args.map(String).join(' '))},encodeURIComponent});
 return {context,latest,featured,breaking,content,errors,calls,
  async run(){await vm.runInContext(source,context,{timeout:900});}};
}
const article={id:'a1000000-0000-4000-8000-000000000001',category:'Education',
 headline:'एक प्रमाणित उदाहरण समाचार',location:'पिछोर',summary:'जाँच के लिए बनी खबर',
 topStory:true,breaking:true};
test('T071 authentic B8 integrated code news and LIVE failure both show honest unavailability, never fake headline',async()=>{
 const s=setup({newsFails:true,liveFails:true});await s.run();
 assert.equal(s.calls.articles,1);assert.equal(s.calls.live,1);
 assert.equal(s.breaking.hidden,true);assert.equal(s.content.children.length,0);
 assert.equal(s.latest.adjacent.length,1);
 const box=s.latest.adjacent[0].element;
 assert.equal(box.id,'v3-published-feed');assert.equal(box.children.length,2);
 assert.match(box.children[1].textContent,/सर्वर अभी उपलब्ध नहीं/);
 assert.ok(!box.children.some(c=>/भारी बारिश|भ्रष्टाचार/.test(c.innerHTML||c.textContent)));
 assert.equal(s.errors.length,2);
});
test('T071 real B8 source social/provider LIVE outage does not take down independently published news',async()=>{
 const s=setup({news:[article],liveFails:true});await s.run();
 assert.equal(s.breaking.hidden,false);
 assert.equal(s.content.children.length,1);assert.match(s.content.children[0].href,/article\.html\?id=/);
 const box=s.latest.adjacent.find(x=>x.element.id==='v3-published-feed')?.element;
 assert(box,'real B8 published news container still created');
 assert.equal(box.children.length,2);
 assert.match(box.children[1].innerHTML,/प्रमाणित उदाहरण समाचार/);
 assert(!s.latest.adjacent.some(x=>x.element.id==='v3-public-live-feed'));
 assert.equal(s.errors.length,1);
});
test('T071 authentic feed error must not invent breaking or published article, even when LIVE exists',async()=>{
 const live=[{article_id:article.id,headline:'केवल सिंथेटिक Live टेस्ट',
   public_status:'INTERRUPTED',feed_transition_state:'TEMPORARILY_INTERRUPTED'}];
 const s=setup({newsFails:true,live});await s.run();
 assert.equal(s.breaking.hidden,true);assert.equal(s.content.children.length,0);
 assert(s.latest.adjacent.some(x=>x.element.id==='v3-public-live-feed'));
 const feed=s.latest.adjacent.find(x=>x.element.id==='v3-published-feed')?.element;
 assert.match(feed.children[1].textContent,/सर्वर अभी उपलब्ध नहीं/);
});
test('T071 no published records is different from backend failure, with no false breaking success',async()=>{
 const s=setup({news:[],live:[]});await s.run();
 assert.equal(s.breaking.hidden,true);
 assert.equal(s.content.children.length,0);
 const feed=s.latest.adjacent.find(x=>x.element.id==='v3-published-feed')?.element;
 assert.match(feed.children[1].textContent,/कोई प्रकाशित खबर उपलब्ध नहीं/);
 assert.equal(s.errors.length,0);
});
test('T071 B8 candidate removes all old fabricated corruption/rain headlines from rendered source',()=>{
 for(const banned of ['शिवपुरी अस्पताल में भ्रष्टाचार का आरोप',
 'पिछोर में भारी बारिश से कई रास्ते बंद','शिवपुरी में भारी बारिश, कई रास्ते बंद']){
  assert.ok(!html.includes(banned),banned);
  assert.ok(!source.includes(banned),banned);
 }
 assert.match(html,/id="top-story" hidden/);
 assert.match(html,/website-v3\.js/);
 assert.match(source,/JBBackend\.listPublishedPublic\(30\)/);
 assert.match(source,/newsError/);
});
test('T071 actual isolated fault inputs never qualify whole matrix or T070 full final lock',()=>{
 assert.equal(B8_SOURCE_SHA.length,40);
 assert.equal(process.env.T071_REAL_PRODUCTION_ENDPOINT_TOUCHED,undefined);
 assert.equal(process.env.T071_PRODUCTION_SECRETS_LOADED,undefined);
});
