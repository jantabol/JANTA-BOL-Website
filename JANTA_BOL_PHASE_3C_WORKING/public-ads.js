/* P4-T035: canonical public projection, no device location, independent failure path. */
(function(g){'use strict';
const requests=new WeakMap();
function safe(value){try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch(_){return ''}}
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e}
function scopeForArticle(item){
 if(item?.geoLevel==='Local-Pichhore')return 'local';
 if(item?.geoLevel==='Shivpuri')return 'district:shivpuri';
 return 'global';
}
function cta(ad){
 if(ad.cta_type==='website'||ad.cta_type==='map')return {url:safe(ad.cta_target),label:ad.cta_type==='map'?'नक्शा देखें':'अधिक जानकारी'};
 if((ad.cta_type==='call'||ad.cta_type==='whatsapp')&&/^\+?[0-9][0-9 ()-]{5,19}$/.test(String(ad.cta_target||''))){
  const phone=String(ad.cta_target).replace(/[ ()-]/g,'');
  return {url:ad.cta_type==='call'?'tel:'+phone:'https://wa.me/'+phone.replace(/^\+/,''),label:ad.cta_type==='call'?'कॉल करें':'WhatsApp'};
 }
 return null;
}
async function render(placement,scope='global'){
 const slot=[...document.querySelectorAll('[data-jb-ad-placement]')].find(e=>e.dataset.jbAdPlacement===placement);if(!slot)return;
 const request={};requests.set(slot,request);slot.replaceChildren();
 const current=()=>requests.get(slot)===request;
 try{
  if(!g.JBBackend?.client)return;
  const {data,error}=await g.JBBackend.client.rpc('jb_ad_public_feed',{p_placement:placement,p_scope:scope});
  if(!current()||error||!Array.isArray(data)||!data.length)return;
  const ad=data[0],box=node('aside','jb-public-ad');box.setAttribute('aria-label','विज्ञापन');
  box.append(node('div','jb-public-ad-label','विज्ञापन'));
  if(ad.creative_type==='text'&&String(ad.text_body||'').trim())box.append(node('p','jb-public-ad-text',ad.text_body));
  else if(ad.creative_type==='image'&&safe(ad.media_url)){
   const img=node('img','jb-public-ad-image');img.src=safe(ad.media_url);img.alt='विज्ञापन';img.loading='lazy';img.referrerPolicy='no-referrer';
   img.addEventListener('error',()=>{if(current())slot.replaceChildren()},{once:true});box.append(img);
  }else if(ad.creative_type==='video'&&safe(ad.media_url)){
   const video=node('video','jb-public-ad-video');video.src=safe(ad.media_url);video.controls=true;video.preload='none';video.playsInline=true;
   video.setAttribute('aria-label','वीडियो विज्ञापन');video.addEventListener('error',()=>{if(current())slot.replaceChildren()},{once:true});box.append(video);
  }else return;
  const link=cta(ad);
  if(link?.url){const a=node('a','jb-public-ad-cta',link.label);a.href=link.url;if(!link.url.startsWith('tel:'))a.target='_blank';a.rel='noopener noreferrer sponsored';box.append(a)}
  if(current())slot.append(box);
 }catch(_){if(current())slot.replaceChildren()}
}
g.JBPublicAds={render,scopeForArticle};
})(window);
