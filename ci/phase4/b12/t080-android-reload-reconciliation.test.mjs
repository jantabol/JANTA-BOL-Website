import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync('JANTA_BOL_PHASE_3C_WORKING/add-news.html','utf8');
const start=html.indexOf('<script>\n(function(){');
const end=html.indexOf('</script>',start);
assert.ok(start>=0&&end>start,'real Android admin inline source found');
const script=html.slice(start+'<script>\n'.length,end);
const id='22222222-2222-4222-8222-222222222222';
const news={
  id,version:3,headline:'Synthetic T080 article',summary:'Summary',
  content:'Synthetic body',category:'Technology',geoLevel:'India',
  location:'India',status:'published',slug:'t080',media:{},
  internalSource:{name:'Synthetic Source',type:'Official',verificationStatus:'Verified'}
};
function harness({remote=news,lookupFails=false,storedIntent=true}={}){
  const elements=new Map(),events=new Map(),alerts=[],stats={drafts:0,publishes:0,clears:0};
  const el=()=>{
    const listeners=new Map(),classes=new Set();
    return {value:'',checked:false,disabled:false,files:[],
      textContent:'',innerHTML:'',style:{},
      addEventListener:(type,handler)=>listeners.set(type,handler),listeners,
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),
        contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)}
    };
  };
  const byId=k=>{if(!elements.has(k))elements.set(k,el());return elements.get(k)};
  const draftBtn=el(),publishBtn=el();
  const shadow={item:{headline:news.headline,content:news.content,internalSource:{name:news.internalSource.name}},createIntentId:id};
  const backend={
    getCreateIntent:()=>storedIntent?{id,attempted:true}:null,
    getShadow:()=>shadow,
    getArticle:async()=>{if(lookupFails)throw Error('FAKE_DATABASE_INTERNAL_SECRET');return remote;},
    clearCreateIntent:()=>{stats.clears++},
    clearShadow:()=>{},
    reserveCreateIntent:()=>id,
    saveDraft:async()=>{stats.drafts++;throw Error('MUST_NOT_RETRY')},
    publish:async()=>{stats.publishes++;throw Error('MUST_NOT_RETRY')},
    esc:String
  };
  const document={
    documentElement:{dataset:{jbAuth:'waiting'}},
    getElementById:byId,
    querySelector:q=>q==='.btn-draft'?draftBtn:publishBtn,
    querySelectorAll:()=>[]
  };
  const context={
    document,window:{JBPhase2:{}},JBBackend:backend,JBPhase2:{},
    navigator:{onLine:true},location:{search:'',href:''},
    URLSearchParams,alert:s=>alerts.push(String(s)),
    addEventListener:(k,f)=>events.set(k,f),
    setTimeout:()=>1,clearTimeout:()=>{},
    console:{log(){},error(){}}
  };
  runInNewContext(script,context,{filename:'add-news.html',timeout:3500});
  return {byId,events,alerts,stats,draftBtn,publishBtn};
}
test('T080 Reload: existing identical committed Article reconciles the SAME ID',async()=>{
  const h=harness();
  await h.events.get('jb-auth-ready')();
  assert.match(h.byId('syncState').textContent,/RECONCILED/);
  assert.equal(h.byId('newsId').value,id);
  assert.equal(h.stats.clears,1);
  assert.equal(h.stats.drafts,0);
  assert.equal(h.stats.publishes,0);
});
test('T080 Reload: HTTP verification outage blocks new inserts and safe-messages only',async()=>{
  const h=harness({lookupFails:true});
  await h.events.get('jb-auth-ready')();
  assert.match(h.byId('syncState').textContent,/CANNOT VERIFY PREVIOUS WRITE/);
  await h.draftBtn.listeners.get('click')();
  assert.equal(h.stats.drafts,0);
  assert.equal(h.stats.publishes,0);
  assert.ok(h.alerts.length>=1);
  assert.ok(!JSON.stringify(h.alerts).includes('FAKE_DATABASE_INTERNAL_SECRET'));
});
test('T080 Other-tab cleared reservation: shadow identity still reconciles original article',async()=>{
  const h=harness({storedIntent:false});
  await h.events.get('jb-auth-ready')();
  assert.equal(h.byId('newsId').value,id);
  assert.match(h.byId('syncState').textContent,/RECONCILED/);
  assert.equal(h.stats.drafts,0);
});
