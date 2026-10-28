import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const path='JANTA_BOL_PHASE_3C_WORKING/published.html';
const html=readFileSync(path,'utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(inline.length,2,'Only two reviewed inline blocks expected');
const firstIndex=html.indexOf('<script>');
const cdnIndex=html.indexOf('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
assert(firstIndex>=0&&firstIndex<cdnIndex,'Watchdog MUST execute before CDN');
function simulate({secure='',loading=true,connected=true}={}){
  const jobs=[];
  const root={
    isConnected:connected,loading,children:[],
    querySelector(q){return q==='[data-jb-loading]'&&this.loading?{}:null;},
    appendChild(c){this.children.push(c);}
  };
  Object.defineProperty(root,'textContent',{set(v){assert.equal(v,'');this.loading=false;}});
  const doc={
    getElementById(id){assert.equal(id,'publishedList');return root;},
    documentElement:{dataset:{jbAuth:secure}},
    createElement(tag){return {
      tag,children:[],href:null,textContent:'',
      append(...els){this.children.push(...els);},appendChild(x){this.children.push(x);}
    }}
  };
  vm.runInNewContext(inline[0],{document:doc,setTimeout:(fn,ms)=>jobs.push({fn,ms})},{timeout:500});
  assert.equal(jobs.length,1);
  assert.equal(jobs[0].ms,12000);
  jobs[0].fn();
  return root;
}
test('Android CDN missing: watchdog visibly offers LOGIN without reading protected rows',()=>{
 const root=simulate();
 assert.equal(root.children.length,1);
 assert.match(root.children[0].children[0].textContent,/security\/session/);
 assert.equal(root.children[0].children[2].href,'admin-login.html?next=published.html');
 assert.equal(root.children[0].children[2].textContent,'Founder Login');
});
test('Authenticated AAL2 validated state: stalled news load offers Retry not Unpublish',()=>{
 const root=simulate({secure:'ready'});
 assert.equal(root.children.length,1);
 assert.match(root.children[0].children[0].textContent,/load nahi/);
 assert.equal(root.children[0].children[2].href,'published.html');
 assert(!root.children[0].children[2].textContent.includes('Delete'));
});
test('Successful content loading: watchdog leaves rendered rows unchanged',()=>{
 const root=simulate({loading:false});
 assert.equal(root.children.length,0);
});
test('Security guard replaced document: watchdog does not reopen private content',()=>{
 const root=simulate({connected:false});
 assert.equal(root.children.length,0);
});
test('Original protected list is rendered ONLY after admin-auth Owner/AAL2 event or ready state',()=>{
 assert.match(html,/src="admin-auth\.js"/);
 assert.match(html,/if\(document\.documentElement\.dataset\.jbAuth==='ready'\)/);
 assert.match(html,/addEventListener\('jb-auth-ready',render,\{once:true\}\)/);
 assert.match(html,/async function render\(\)/);
 assert.match(html,/await JBBackend\.listPublished\(\)/);
 assert(!inline[0].includes('JBBackend.'),'No backend access in early watchdog');
 assert(!inline[0].includes('.from('),'No direct private database reads in watchdog');
});
