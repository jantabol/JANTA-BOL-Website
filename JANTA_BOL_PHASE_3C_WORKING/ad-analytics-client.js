/* B7 / P4-T040 — STAGING: paired with ad-viewability.js.
 * NOT linked into article.html/index.html until the reviewed server
 * view-ticket migration and official geo/public-feed cutover are released
 * atomically, Android E3 passes and fraud controls are accepted.
 * Advertiser impressions are CLIENT-REPORTED, not human-verified reach.
 */
(function(g){'use strict';
const pending=new WeakSet();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function hexRandom(){
 const arr=new Uint8Array(16);
 g.crypto.getRandomValues(arr);
 return Array.from(arr,b=>b.toString(16).padStart(2,'0')).join('');
}
async function prepare({element,articleId,campaignId,creativeId}={}){
 if(!element||element.isConnected===false||pending.has(element)||
    !uuid.test(String(articleId||''))||
    !uuid.test(String(campaignId||''))||
    !uuid.test(String(creativeId||''))||
    typeof g.crypto?.getRandomValues!=='function'||
    typeof g.IntersectionObserver!=='function'||
    typeof g.JBAdViewability?.watch!=='function'||
    typeof g.JBBackend?.client?.rpc!=='function')return false;
 // Claim the ad element exactly once, even if concurrent code calls prepare.
 pending.add(element);
 try{
  const {data,error}=await g.JBBackend.client.rpc('jb_ad_issue_view_ticket',{
   p_article:articleId,p_campaign:campaignId,p_creative:creativeId,
   p_open_nonce:hexRandom()
  });
  if(error||typeof data!=='string'||!/^[0-9a-f]{48}$/.test(data)||
     element.isConnected===false)return false;
  // Ticket is held in a closure ONLY. No HTML attribute, query string,
  // cookie, durable storage or raw-ID tracking is ever written.
  g.JBAdViewability.watch(element,async()=>{
   try{
    const receipt=await g.JBBackend?.client?.rpc(
      'jb_ad_qualify_view_ticket',{p_token:data});
    return receipt?.error?false:receipt?.data===true;
   }catch(_){return false}
  });
  return true;
 }catch(_){return false}
}
g.JBAdAnalytics={prepare};
})(window);
