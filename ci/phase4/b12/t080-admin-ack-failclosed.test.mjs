// T080: Android admin UI synthetic failure matrix, no live writes, no credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync('JANTA_BOL_PHASE_3C_WORKING/add-news.html','utf8');
const start=html.indexOf('<script>\n(function(){');
const end=html.indexOf('</script>',start);
assert.ok(start>=0 && end>start,'real admin form source found');
const script=html.slice(start+'<script>\n'.length,end);
assert.ok(script.includes('writeOutcomeUnknown'),'candidate has ambiguous-write guard');

function ui({publishMode='confirmed',draftMode='confirmed',socialMode='confirmed'}={}) {
  const elById=new Map(), alerts=[], globalEvents={}, pendingTimers=[];
  let navigate='',publishCalls=0,draftCalls=0,socialCalls=0,shadows=0;
  function node(){
    const types=new Map(),classes=new Set();
    return {value:'',checked:false,disabled:false,files:[],style:{},textContent:'',innerHTML:'',
      addEventListener:(kind,fn)=>types.set(kind,fn), listeners:types,
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),
        toggle:(k,v)=>v?classes.add(k):classes.delete(k),contains:k=>classes.has(k)}
    };
  }
  const get=id=>{if(!elById.has(id))elById.set(id,node());return elById.get(id)};
  const draftButton=node(),publishButton=node();
  const document={
    getElementById:get,documentElement:{dataset:{jbAuth:'waiting'}},
    querySelector:q=>q==='.btn-draft'?draftButton:publishButton,
    querySelectorAll:()=>[]
  };
  const form={
    headline:'Synthetic T080 news',summary:'Synthetic summary',content:'Synthetic article body',
    category:'Technology',geoLevel:'India',location:'India',
    sourceType:'Official',sourceName:'Synthetic Source'
  };
  for(const [k,v] of Object.entries(form))get(k).value=v;
  const location={search:'',get href(){return navigate},set href(v){navigate=v}};
  const result={id:'11111111-1111-4111-8111-111111111111',version:7,
    internalSource:{verificationStatus:'Verified'},headline:form.headline,status:'published'};
  const backend={
    esc:String,saveShadow:()=>{shadows++},
    publish:async()=>{
      publishCalls++;
      if(publishMode==='unknown')throw Error('POSTGRES_INTERNAL_DSN_SECRET_MARKER');
      if(publishMode==='conflict')throw Error('VERSION_CONFLICT');
      if(typeof publishMode==='function')return publishMode();
      return result;
    },
    saveDraft:async()=>{
      draftCalls++;
      if(draftMode==='unknown')throw Error('RAW_PG_SECRET_RESPONSE_MARKER');
      if(draftMode==='conflict')throw Error('VERSION_CONFLICT');
      return {...result,status:'draft'};
    }
  };
  const social={
    saveSocial:async()=>{
      socialCalls++;
      if(socialMode==='failed')throw Error('RAW_SOCIAL_OAUTH_SECRET_MARKER');
    }
  };
  const win={JBPhase2:social};
  runInNewContext(script,{
    document,window:win,JBBackend:backend,JBPhase2:social,location,
    URLSearchParams,navigator:{onLine:true},
    addEventListener:(kind,fn)=>{globalEvents[kind]=fn;},
    alert:m=>alerts.push(String(m)),
    setTimeout:fn=>{pendingTimers.push(fn);return pendingTimers.length;},
    clearTimeout:()=>{},console:{log(){},error(){}}
  },{filename:'add-news-admin-inline.js',timeout:3000});
  return {
    get,draftButton,publishButton,alerts,globalEvents,pendingTimers,
    stats:()=>({publishCalls,draftCalls,socialCalls,shadows,navigate,
      status:get('syncState').textContent,alerts})
  };
}
function review(h) {
  h.publishButton.listeners.get('click')();
  assert.equal(typeof h.get('confirmPublish').onclick,'function');
}
test('T080 verified publish retains Article ID, navigates, only one publish request',async()=>{
  const h=ui();review(h);
  await h.get('confirmPublish').onclick();
  assert.equal(h.stats().publishCalls,1);
  assert.equal(h.stats().navigate,'published.html');
  assert.match(h.stats().status,/PUBLISHED • Backend confirmed/);
});
test('T080 optional Social outage MUST NOT turn confirmed news publish into false failure or retry',async()=>{
  const h=ui({socialMode:'failed'});review(h);
  await h.get('confirmPublish').onclick();
  assert.equal(h.stats().publishCalls,1);
  assert.equal(h.stats().socialCalls,1);
  assert.equal(h.stats().navigate,'published.html');
  assert.match(h.stats().status,/PUBLISHED • Social preferences not synced/);
  assert.ok(!JSON.stringify(h.alerts).includes('RAW_SOCIAL_OAUTH_SECRET_MARKER'));
});
test('T080 unknown publish acknowledgement prohibits second publish in same form, preserves unsynced shadow',async()=>{
  const h=ui({publishMode:'unknown'});review(h);
  await h.get('confirmPublish').onclick();
  await h.get('confirmPublish').onclick();
  assert.equal(h.stats().publishCalls,1);
  assert.ok(h.stats().shadows>=1);
  assert.match(h.stats().status,/OUTCOME UNKNOWN/);
  assert.ok(!JSON.stringify(h.alerts).includes('POSTGRES_INTERNAL_DSN_SECRET_MARKER'));
});
test('T080 version CAS conflict produces explicit safe conflict, never falsely reports published',async()=>{
  const h=ui({publishMode:'conflict'});review(h);
  await h.get('confirmPublish').onclick();
  assert.equal(h.stats().publishCalls,1);
  assert.match(h.stats().status,/CONFLICT/);
  assert.equal(h.stats().navigate,'');
});
test('T080 confirmed draft with social failure says DRAFT SAVED, not PUBLISHED or FAILED',async()=>{
  const h=ui({socialMode:'failed'});
  await h.draftButton.listeners.get('click')();
  assert.equal(h.stats().draftCalls,1);
  assert.equal(h.stats().navigate,'drafts.html');
  assert.match(h.stats().status,/DRAFT SAVED/);
  assert.doesNotMatch(h.stats().status,/PUBLISHED|FAILED/);
  assert.ok(!JSON.stringify(h.alerts).includes('RAW_SOCIAL_OAUTH_SECRET_MARKER'));
});
test('T080 ambiguous new draft save does not generate another backend insert on repeated click',async()=>{
  const h=ui({draftMode:'unknown'});
  await h.draftButton.listeners.get('click')();
  await h.draftButton.listeners.get('click')();
  assert.equal(h.stats().draftCalls,1);
  assert.match(h.stats().status,/OUTCOME UNKNOWN/);
  assert.ok(!JSON.stringify(h.alerts).includes('RAW_PG_SECRET_RESPONSE_MARKER'));
});
test('T080 autosave after ambiguous acknowledgment must stop subsequent automatic retries',async()=>{
  const h=ui({draftMode:'unknown'});
  h.globalEvents.online();
  assert.equal(h.pendingTimers.length,1);
  await h.pendingTimers.shift()();
  assert.equal(h.stats().draftCalls,1);
  assert.match(h.stats().status,/OUTCOME UNKNOWN/);
  h.globalEvents.online();
  assert.equal(h.pendingTimers.length,0);
  assert.equal(h.stats().draftCalls,1);
});
test('T080 simultaneous Confirm Publish taps cannot issue duplicate network calls',async()=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  const h=ui({publishMode:()=>pending});review(h);
  const first=h.get('confirmPublish').onclick();
  await h.get('confirmPublish').onclick();
  // First promise still pending, so the busy guard must stop a second request.
  assert.equal(h.stats().publishCalls,1);
  release({id:'11111111-1111-4111-8111-111111111111',version:8,
    internalSource:{verificationStatus:'Verified'}});
  await first;
  assert.equal(h.stats().publishCalls,1);
  assert.equal(h.stats().navigate,'published.html');
});
