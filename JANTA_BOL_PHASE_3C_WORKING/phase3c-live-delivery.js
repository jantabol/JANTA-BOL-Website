(function(global){
'use strict';
const SETUP_KEY='jbPhase3cEncoderSetupV1';
function rewriteLegacyHandoff(url){
  const u=String(url||'');
  if(!u)throw new Error('CAMERA_LINK_MISSING');
  if(!u.includes('/functions/v1/jb-encoder-handoff'))return u;
  return u.replace('/functions/v1/jb-encoder-handoff','/functions/v1/jb-encoder-launch');
}
function friendlyError(code){
  const c=String(code||'');
  if(/PROVIDER_NOT_READY|LIVE_CAMERA_NOT_READY|HANDOFF_NOT_READY/.test(c))return 'Camera abhi taiyar nahi hai — thodi der baad dobara koshish karein.';
  if(/NOT_AUTHORIZED|PERMISSION|REPORTER_DISABLED|REVOKED/.test(c))return 'Is Live ke liye camera permission available nahi hai.';
  if(/OFFLINE|NETWORK|FETCH|UNAVAILABLE/.test(c))return 'Network problem hai — internet check karke dobara koshish karein.';
  return 'Live camera nahi khuli — dobara koshish karein.';
}
async function prepareReporterCamera(sessionId){
  if(!global.JBLive?.prepareCamera)throw new Error('LIVE_CAMERA_SERVICE_NOT_READY');
  const d=await global.JBLive.prepareCamera(sessionId);
  const h=d?.handoff||{};
  const legacy=h.handoff_url;
  return {
    launch_url:rewriteLegacyHandoff(legacy),
    connector_key:String(h.connector_key||''),
    connector_name:String(h.connector_display_name||''),
    delivery_mode:String(h.connector_delivery_mode||'DIRECT_REDIRECT'),
    expires_at:h.expires_at||null,
    raw:d
  };
}
async function openReporterCamera(sessionId){
  const d=await prepareReporterCamera(sessionId);
  if(d.delivery_mode==='LOCAL_CLIPBOARD_BRIDGE'){
    sessionStorage.setItem(SETUP_KEY,JSON.stringify({
      handoff_url:d.launch_url,
      connector_key:d.connector_key,
      connector_name:d.connector_name,
      expires_at:d.expires_at
    }));
    location.href='encoder-setup.html';
    return d;
  }
  location.href=d.launch_url;
  return d;
}
function articleLink(articleId){
  const id=String(articleId||'').trim();
  if(!id)return '';
  return new URL('article.html?id='+encodeURIComponent(id),location.href).href;
}
async function shareArticle(articleId,headline='JANTA BOL Live'){
  const url=articleLink(articleId); if(!url)throw new Error('LIVE_LINK_NOT_READY');
  if(navigator.share){await navigator.share({title:headline,text:headline,url});return url}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);return url}
  prompt('Live link copy karein',url);return url;
}
global.JB3CDelivery={SETUP_KEY,rewriteLegacyHandoff,friendlyError,prepareReporterCamera,openReporterCamera,articleLink,shareArticle};
})(window);
