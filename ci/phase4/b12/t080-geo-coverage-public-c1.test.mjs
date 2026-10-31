// T080 — isolated, read-only UI contract; never touches real credentials or DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const file = readFileSync('JANTA_BOL_PHASE_3C_WORKING/script.js','utf8');
const begin = '// ===== T080: published-only geographic coverage, reuse existing C1 public RPC =====';
const end = '// ===== V2.4 CATEGORY + TRENDING FOUNDATION =====';
assert.equal(file.split(begin).length,2,'only one scoped T080 module');
const chunk=file.split(begin)[1].split(end)[0];
assert.ok(chunk.includes('JBPublicC1.list(30)'));
assert.ok(!chunk.includes(".from('articles')"));
assert.ok(!chunk.includes('service_role'));

function node(tag) {
  const element = {
    tag, style:{}, children:[], attrs:{}, _text:'',
    appendChild(child){this.children.push(child); return child},
    replaceChildren(){this.children=[];this._text=''},
    setAttribute(k,v){this.attrs[k]=v}
  };
  Object.defineProperty(element,'textContent',{
    get(){return this._text},
    set(s){this._text=String(s);this.children=[]}
  });
  return element;
}
function harness(list) {
  const modal=node('div'),title=node('h2'),text=node('p'),kicker=node('div'),dialog=node('div');
  const open=new Set();
  modal.classList={add(x){open.add(x)},contains(x){return open.has(x)},remove(x){open.delete(x)}};
  modal.querySelector=()=>dialog;
  const controls=['world','india','mp'].map(coverage=>({
    dataset:{coverage},handlers:{},
    addEventListener(event,fn){this.handlers[event]=fn}
  }));
  const els={'preview-modal':modal,'preview-modal-title':title,'preview-modal-text':text,'preview-modal-kicker':kicker};
  const document={
    getElementById:id=>els[id],
    querySelectorAll:()=>controls,
    createElement:node,
    body:{style:{}}
  };
  const window={JBPublicC1:{list}};
  runInNewContext(begin+chunk,{document,window,console});
  return {modal,title,text,kicker,controls,window,dialog};
}
const uuid1='c49f00b6-0359-400c-a957-2082142ff8dd';
const uuid2='f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const uuid3='9b3858a8-c136-4b6c-a1c2-0d9fb984e204';
function rows(){
  return [
    {id:uuid1,headline:'ISRO NVS-03',status:'published',publishedAt:'2026-10-30',geoLevel:'India',category:'Technology',location:'Sriharikota'},
    {id:uuid2,headline:'ISRO SpaDeX',status:'published',publishedAt:'2026-10-28',geoLevel:' India ',category:'Technology',location:'India'},
    {id:uuid3,headline:'MP politics',status:'published',publishedAt:'2026-10-31',geoLevel:'MP',category:'Politics'},
    {id:uuid3,headline:'Draft leak',status:'draft',publishedAt:null,geoLevel:'India'},
    {id:'not-a-uuid',headline:'Invalid row',status:'published',publishedAt:'2026-10-31',geoLevel:'India'},
  ];
}
test('India shows exactly two published India news with existing UUID routes (no draft leak)',async()=>{
  const h=harness(async limit=>{assert.equal(limit,30);return rows()});
  await h.controls[1].handlers.click();
  assert.equal(h.title.textContent,'🇮🇳 भारत न्यूज़');
  assert.equal(h.text.children.length,3);
  assert.equal(h.text.children[0].textContent,'2 प्रकाशित खबरें');
  assert.equal(h.text.children[1].children[0].textContent,'ISRO NVS-03');
  assert.equal(h.text.children[2].children.at(-1).href,'article.html?id='+uuid2);
  assert.equal(h.modal.attrs['aria-hidden'],'false');
});
test('MP and World are geographically isolated; no false upcoming-news placeholder',async()=>{
  const h=harness(async()=>rows());
  await h.controls[2].handlers.click();
  assert.equal(h.text.children[0].textContent,'1 प्रकाशित खबरें');
  assert.equal(h.text.children[1].children[0].textContent,'MP politics');
  await h.controls[0].handlers.click();
  assert.equal(h.text.textContent,'इस क्षेत्र में अभी कोई प्रकाशित खबर उपलब्ध नहीं है।');
});
test('provider unavailable is truthful; never implies empty published news',async()=>{
  const h=harness(async()=>{throw Error('RPC unavailable')});
  await h.controls[1].handlers.click();
  assert.match(h.text.textContent,/समाचार सेवा अभी उपलब्ध नहीं है/);
  assert.equal(h.text.children.length,0);
});
test('unsafe markup is text, not inserted as HTML',async()=>{
  const malicious='<img src=x onerror=alert(1)>';
  const h=harness(async()=>[{id:uuid1,headline:malicious,status:'published',publishedAt:'now',geoLevel:'India'}]);
  await h.controls[1].handlers.click();
  assert.equal(h.text.children[1].children[0].textContent,malicious);
  assert.equal(h.text.children[1].children.at(-1).href,'article.html?id='+uuid1);
});
test('keyboard navigation opens same real feed and scroll limits mobile dialog',async()=>{
  const h=harness(async()=>rows());
  let prevented=false;
  await h.controls[1].handlers.keydown({key:'Enter',preventDefault(){prevented=true}});
  assert.ok(prevented);
  assert.equal(h.text.children.length,3);
  assert.equal(h.dialog.style.overflowY,'auto');
});
test('stale slow response cannot overwrite newer coverage selection',async()=>{
  let resolveSlow;
  const slow=new Promise(resolve=>{resolveSlow=resolve});
  let calls=0;
  const h=harness(()=>++calls===1?slow:Promise.resolve(rows()));
  const first=h.controls[1].handlers.click();
  await h.controls[2].handlers.click();
  resolveSlow(rows());
  await first;
  assert.equal(h.title.textContent,'❤️ मध्य प्रदेश');
  assert.equal(h.text.children[1].children[0].textContent,'MP politics');
});
