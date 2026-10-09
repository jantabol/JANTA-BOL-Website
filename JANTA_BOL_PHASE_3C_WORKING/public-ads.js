/* P4-T035: public ads, no GPS access, fail closed. */
(function(g){'use strict';
function safe(u){try{const x=new URL(String(u||''));return x.protocol==='https:'?x.href:''}catch(_){return ''}}
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e}
async function render(placement,scope='global'){
const slot=document.querySelector('[data-jb-ad-placement="'+placement+'"]');if(!slot)return;
slot.replaceChildren();try{
if(!g.JBBackend?.client)return;
const {data,error}=await g.JBBackend.client.rpc('jb_ad_public_feed',{p_placement:placement,p_scope:scope});
if(error||!Array.isArray(data)||!data.length)return;
const ad=data[0],box=node('aside','jb-public-ad');box.setAttribute('aria-label','विज्ञापन');
box.append(node('div','jb-public-ad-label','विज्ञापन'));
if(ad.creative_type==='text'&&ad.text_body)box.append(node('p','jb-public-ad-text',ad.text_body));
else if(ad.creative_type==='image'&&safe(ad.media_url)){const img=node('img','jb-public-ad-image');img.src=safe(ad.media_url);img.alt='विज्ञापन';img.loading='lazy';box.append(img)}
else if(ad.creative_type==='video'&&safe(ad.media_url)){const v=node('video','jb-public-ad-video');v.src=safe(ad.media_url);v.controls=true;v.preload='none';v.playsInline=true;box.append(v)}
else return;
if(ad.cta_type==='website'&&safe(ad.cta_target)){const a=node('a','jb-public-ad-cta','अधिक जानकारी');a.href=safe(ad.cta_target);a.target='_blank';a.rel='noopener noreferrer sponsored';box.append(a)}
slot.append(box);
}catch(_){slot.replaceChildren()}
}
g.JBPublicAds={render};
})(window);
