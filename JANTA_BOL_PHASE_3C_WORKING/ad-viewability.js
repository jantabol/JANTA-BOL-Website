/* B7 / ADS-049 — 50% of ad on screen for 1000ms, continuously.
 * STAGING MODULE, NOT YET ENABLED ON PUBLIC PAGE. A browser observer
 * supplies only a client-side eligibility signal: it is NOT server proof
 * of a human view and MUST NOT directly increment the event ledger or billing.
 * Pending protected view-token backend and paired rollout; fail closed.
 */
(function(g){'use strict';
const active=new WeakMap();
const noop=()=>{};
function watch(element,onQualified){
 if(!element||typeof onQualified!=='function'||
    typeof g.IntersectionObserver!=='function'||
    !g.document||typeof g.document.addEventListener!=='function'||
    typeof g.setTimeout!=='function'||typeof g.clearTimeout!=='function')
  return noop;
 const prev=active.get(element);
 if(prev)return prev.dispose;
 let fraction=0,timer=null,started=0,stopped=false,qualified=false;
 function now(){return g.performance?.now?.() ?? Date.now();}
 function visible(){
  return g.document.visibilityState==='visible'&&
    element.isConnected!==false&&fraction>=0.5;
 }
 function cancel(){if(timer!==null){g.clearTimeout(timer);timer=null;}}
 function dispose(){
  if(stopped)return;
  stopped=true;cancel();
  observer.disconnect();
  g.document.removeEventListener('visibilitychange',refresh);
  active.delete(element);
 }
 function finish(){
  timer=null;
  if(stopped||qualified||!visible())return;
  const elapsed=now()-started;
  if(elapsed<1000){
   // A throttled/early timer must never qualify before full 1000ms.
   timer=g.setTimeout(finish,Math.max(1,Math.ceil(1000-elapsed)));
   return;
  }
  qualified=true;
  dispose();
  try{
   const result=onQualified();
   // Stats/backend outages are independent of news rendering.
   if(result&&typeof result.catch==='function')result.catch(noop);
  }catch(_){}
 }
 function refresh(){
  cancel();
  if(stopped||qualified||!visible())return;
  started=now();
  timer=g.setTimeout(finish,1000);
 }
 const observer=new g.IntersectionObserver(entries=>{
  if(stopped)return;
  for(const entry of entries){
   if(entry.target===element){
    fraction=entry.isIntersecting?Number(entry.intersectionRatio)||0:0;
    refresh();
   }
  }
 },{threshold:[0,0.5,1]});
 active.set(element,{dispose});
 g.document.addEventListener('visibilitychange',refresh);
 try{observer.observe(element)}
 catch(_){dispose();return noop;}
 return dispose;
}
g.JBAdViewability={watch};
})(window);
