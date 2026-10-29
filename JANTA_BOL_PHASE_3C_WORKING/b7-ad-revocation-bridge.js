/* JANTA BOL / T036 ADS-019 — REVIEW ONLY: separately gated viewer revocation.
 * NOT referenced by article.html/index.html; wire ONLY together with
 * audited public boolean RPC and first-approved paid-ad release E2/E3/E5.
 * Never fetch a replacement ad. Never inspect GPS, user or advertiser info.
 */
(function(g){'use strict';
 const id=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 function watch(x){
  const {slot,box,campaignId,creativeId,client}=x||{};
  if(!slot||!box||!id.test(String(campaignId||''))||
    !id.test(String(creativeId||''))||typeof client?.rpc!=='function'||
    typeof g.setInterval!=='function'||typeof g.clearInterval!=='function'||
    typeof slot.replaceChildren!=='function')return false;
  if(box.parentNode!==slot)return false;
  let stopped=false,busy=false;
  const stop=()=>{
   if(stopped)return;stopped=true;g.clearInterval(timer);
   if(typeof g.removeEventListener==='function')
    g.removeEventListener('pagehide',stop);
  };
  const remove=()=>{
   if(stopped)return;
   stop();
   // Stop playback before removing DOM. Never create/reselect a new card.
   const vid=typeof box.querySelector==='function'?box.querySelector('video'):null;
   try{vid?.pause?.()}catch(_){}
   if(box.parentNode===slot)slot.replaceChildren();
  };
  const tick=async()=>{
   if(stopped||busy)return;
   if(box.parentNode!==slot){stop();return}
   busy=true;
   try{
    const {data,error}=await client.rpc('jb_ad_visibility_alive_public',{
      p_campaign:campaignId,p_creative:creativeId
    });
    // An unavailable/invalid trusted state is NOT permission to keep a paid
    // card visible. Fail CLOSED without replacing it, preserving NEWS body.
    if(error||data!==true)remove();
   }catch(_){remove()}
   finally{busy=false}
  };
  const timer=g.setInterval(tick,15000);
  if(typeof g.addEventListener==='function')
   g.addEventListener('pagehide',stop);
  // No initial feed/refetch or in-page rotation.
  return {stop,checkNow:tick};
 }
 g.JBAdRevocation={watch};
})(window);
