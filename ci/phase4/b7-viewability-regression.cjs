'use strict';
// Synthetic deterministic browser DOM/timers only. No Production ad events.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const source=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ad-viewability.js','utf8');
function browser(withObserver=true){
 let now=0,nextId=1,callback=null,observed=null,disconnected=0;
 const tasks=new Map(),listeners=new Map();
 const doc={visibilityState:'visible',
   addEventListener(name,fn){listeners.set(name,fn)},
   removeEventListener(name,fn){if(listeners.get(name)===fn)listeners.delete(name)}
 };
 const win={
   document:doc,performance:{now:()=>now},
   setTimeout(fn,delay){const id=nextId++;tasks.set(id,{fn,at:now+delay});return id},
   clearTimeout(id){tasks.delete(id)}
 };
 if(withObserver)win.IntersectionObserver=class{
   constructor(fn,options){
    callback=fn; assert.deepEqual(JSON.parse(JSON.stringify(options.threshold)),[0,0.5,1]);
   }
   observe(el){observed=el}
   disconnect(){disconnected++}
 };
 vm.runInNewContext(source,{window:win,Date,WeakMap,Number,Math});
 const el={isConnected:true},api=win.JBAdViewability;
 function fire(ratio){
  assert.ok(callback,'observer not attached');
  callback([{target:el,isIntersecting:ratio>0,intersectionRatio:ratio}]);
 }
 function hidden(value){
  doc.visibilityState=value?'hidden':'visible';
  listeners.get('visibilitychange')?.();
 }
 function advance(ms){
  const limit=now+ms;let n=0;
  while(true){
   let pair=null;
   for(const [id,task] of tasks){
    if(task.at<=limit&&(!pair||task.at<pair[1].at))pair=[id,task];
   }
   if(!pair)break;
   if(++n>1000)throw Error('BAD_FAKE_TIMER_LOOP');
   tasks.delete(pair[0]);now=pair[1].at;pair[1].fn();
  }
  now=limit;
 }
 return {api,el,fire,hidden,advance,doc,win,tasks,listeners,
  get observed(){return observed},get disconnected(){return disconnected}
 };
}
test('ADS-049: 49% visible for 15 seconds never qualifies',()=>{
 const f=browser();let count=0;f.api.watch(f.el,()=>count++);
 f.fire(.49);f.advance(15000);
 assert.equal(count,0);assert.equal(f.tasks.size,0);
});
test('ADS-049: >=50% viewport continuously for >=1000ms qualifies once',()=>{
 const f=browser();let count=0;f.api.watch(f.el,()=>count++);
 f.fire(.5);f.advance(999);assert.equal(count,0);
 f.advance(1);assert.equal(count,1);assert.equal(f.disconnected,1);
 f.advance(300000);assert.equal(count,1);assert.equal(f.tasks.size,0);
});
test('ADS-049: scrolling within >=50% does not restart continuous one-second timer',()=>{
 const f=browser();let count=0;f.api.watch(f.el,()=>count++);
 f.fire(.55);f.advance(300);f.fire(.85);f.advance(300);
 f.fire(.62);f.advance(399);assert.equal(count,0);
 f.advance(1);assert.equal(count,1);
});
test('ADS-049: fast scroll to 10% at 900ms resets elapsed view',()=>{
 const f=browser();let count=0;f.api.watch(f.el,()=>count++);
 f.fire(1);f.advance(900);f.fire(.1);f.advance(5000);
 assert.equal(count,0);f.fire(.75);f.advance(999);
 assert.equal(count,0);f.advance(1);assert.equal(count,1);
});
test('ADS-049: hidden browser tab during countdown cannot count',()=>{
 const f=browser();let count=0;f.api.watch(f.el,()=>count++);
 f.fire(.75);f.advance(700);f.hidden(true);f.advance(25000);
 assert.equal(count,0);f.hidden(false);f.advance(999);
 assert.equal(count,0);f.advance(1);assert.equal(count,1);
});
test('ADS-049: document not visible before observer starts fails closed',()=>{
 const f=browser();let count=0;f.hidden(true);
 f.api.watch(f.el,()=>count++);f.fire(1);f.advance(2000);
 assert.equal(count,0);f.hidden(false);f.advance(1000);assert.equal(count,1);
});
test('ADS-049: removed element never counts and can be cleaned',()=>{
 const f=browser();let count=0;const dispose=f.api.watch(f.el,()=>count++);
 f.fire(.8);f.el.isConnected=false;f.advance(1000);
 assert.equal(count,0);dispose();assert.equal(f.disconnected,1);
 assert.equal(f.listeners.size,0);
});
test('ADS-049: duplicate watchers reuse one observer; independent dispose cancels',()=>{
 const f=browser();let count=0;
 const first=f.api.watch(f.el,()=>count++);
 const second=f.api.watch(f.el,()=>count+=100);
 assert.equal(second,first);f.fire(1);f.advance(500);
 first();f.advance(2000);assert.equal(count,0);
 assert.equal(f.disconnected,1);assert.equal(f.tasks.size,0);
});
test('ADS-049: stats callback throws: news/app never crashes',()=>{
 const f=browser();f.api.watch(f.el,()=>{throw Error('STATS_UNAVAILABLE')});
 f.fire(1);assert.doesNotThrow(()=>f.advance(1000));
});
test('ADS-049: missing IntersectionObserver emits no false count',()=>{
 const f=browser(false);let count=0;
 const dispose=f.api.watch(f.el,()=>count++);
 f.advance(9000);dispose();assert.equal(count,0);
});
test('ADS-049: no backend event or tracking sent by unpaired viewability module',()=>{
 assert.doesNotMatch(source,/\.rpc\s*\(|ad_events|jb_ad_event|jb_ad_record_event/);
 assert.doesNotMatch(source,/geolocation|clientWidth|innerHTML|localStorage|setInterval\s*\(/i);
 assert.match(source,/visibilityState==='visible'/);
 assert.match(source,/fraction>=0\.5/);
 assert.match(source,/elapsed<1000/);
 const article=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
 const home=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
 assert.doesNotMatch(article,/ad-viewability\.js/);
 assert.doesNotMatch(home,/ad-viewability\.js/);
});
