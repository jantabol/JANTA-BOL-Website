/* P4-T035: canonical public projection, no device location, independent failure path. */
(function(g){'use strict';
const requests=new WeakMap();
const pinnedArticleSlots=new WeakSet(); // ADS-025: one article opening -> one selection, never rotate in-place.
/* ADS-056: a malicious local or private address is not a public Ad CTA
   or media host. No GPS/IP collection or URL proxy is introduced. */
function safe(value){
 try{
  const raw=String(value||'');
  if(/[\u0000-\u001f\u007f]/.test(raw))return '';
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password)return '';
  const h=u.hostname.toLowerCase();
  // Public links must use DNS names, not localhost, IP literal, IPv6, or
  // RFC1918 / intranet / internal destinations.
  if(!h.includes('.')||h.startsWith('.')||h.endsWith('.')||/\s/.test(h))return '';
  if(/(^|\.)(localhost|local|internal)$/.test(h))return '';
  if(/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(h)||h.includes(':')||h.startsWith('['))return '';
  return u.href;
 }catch(_){return ''}
}
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e}
function scopeForArticle(item){
 if(item?.geoLevel==='Local-Pichhore')return 'local';
 const district=String(item?.district||'').trim().toLowerCase();
 if(['shivpuri','guna','ashoknagar'].includes(district))return 'district:'+district;
 if(item?.geoLevel==='Shivpuri')return 'district:shivpuri';
 return 'global';
}
/* ADS-013: Keep the canonical news body as text, and move only the existing
   single ad region. A list item, tiny heading, photo caption or blank line
   is not an editorial paragraph. Short news keeps the existing end fallback. */
function semanticParagraph(value){
 const s=String(value||'').trim();
 return s.length>=20 && s.split(/\s+/u).length>=3
  && !/^(?:[-*•]\s+|\d+[.)]\s+|(?:photo|caption|image|फोटो|चित्र|तस्वीर|कैप्शन)\s*[:：])/iu.test(s);
}
function articleParagraphOffset(value){
 const text=String(value||'');
 const breaks=/\r?\n[ \t]*(?:\r?\n[ \t]*)+/g;
 const paragraphs=[];let start=0,match;
 while((match=breaks.exec(text))!==null){
  if(semanticParagraph(text.slice(start,match.index)))paragraphs.push({end:match.index});
  start=breaks.lastIndex;
 }
 if(semanticParagraph(text.slice(start)))paragraphs.push({end:text.length});
 if(paragraphs.length<3)return null;
 // Exactly three paragraphs: after paragraph two; longer articles: after three.
 return paragraphs[paragraphs.length===3?1:2].end;
}
function placeArticleSlot(root){
 const body=root?.querySelector?.('.article .body');
 const region=document.querySelector('.jb-ad-region');
 if(!body||!region||region.parentNode===body)return false;
 const textNode=body.firstChild;
 if(!textNode||textNode.nodeType!==3)return false;
 const offset=articleParagraphOffset(textNode.textContent);
 if(offset===null)return false;
 // splitText preserves every original character and existing Article ID/URL.
 const tail=textNode.splitText(offset);
 body.insertBefore(region,tail);
 return true;
}
/* G3/G4 rollout adapter (NOT YET WIRED): server selects from the immutable
   published Article UUID, never client-asserted district, tehsil, GPS or IP.
   Keep the legacy renderer intact until paired backend/frontend release
   has passed production parity, verified LGD catalog and Android E3. */
function scopeForVerifiedArticleId(id){
 const value=String(id||'').trim();
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)?
   'article:'+value.toLowerCase():'';
}
async function renderVerifiedArticle(id){
 const scope=scopeForVerifiedArticleId(id);
 if(!scope)return false;
 await render('article',scope);
 return true;
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
 // Pin before the network request to prevent concurrent/delayed re-selection.
 // Failure or zero eligible ads remains empty for this article view.
 if(placement==='article'){if(pinnedArticleSlots.has(slot))return;pinnedArticleSlots.add(slot);}
 const request={};requests.set(slot,request);slot.replaceChildren();
 const current=()=>requests.get(slot)===request;
 try{
  if(!g.JBBackend?.client)return;
  const {data,error}=await g.JBBackend.client.rpc('jb_ad_public_feed',{p_placement:placement,p_scope:scope});
  if(!current()||error||!Array.isArray(data)||!data.length)return;
  const ad=data[0],box=node('aside','jb-public-ad');box.setAttribute('aria-label','विज्ञापन');
  let mediaNode=null;
  box.append(node('div','jb-public-ad-label','विज्ञापन'));
  if(ad.creative_type==='text'&&String(ad.text_body||'').trim())box.append(node('p','jb-public-ad-text',ad.text_body));
  else if(ad.creative_type==='image'&&safe(ad.media_url)){
   const img=node('img','jb-public-ad-image');mediaNode=img;img.src=safe(ad.media_url);img.alt='विज्ञापन';img.loading='lazy';img.referrerPolicy='no-referrer';
   img.addEventListener('error',()=>{if(current())slot.replaceChildren()},{once:true});box.append(img);
  }else if(ad.creative_type==='video'&&safe(ad.media_url)){
   const video=node('video','jb-public-ad-video');mediaNode=video;video.src=safe(ad.media_url);video.controls=true;video.preload='none';video.playsInline=true;
   video.setAttribute('aria-label','वीडियो विज्ञापन');video.addEventListener('error',()=>{if(current())slot.replaceChildren()},{once:true});box.append(video);
  }else return;
  const link=cta(ad);
  let ctaElement=null;
  if(link?.url){const a=node('a','jb-public-ad-cta',link.label);a.href=link.url;if(!link.url.startsWith('tel:'))a.target='_blank';a.rel='noopener noreferrer sponsored';box.append(a);ctaElement=a}
  if(current()){
   slot.append(box);
   // Staged/optional: only a server-bound Article UUID is eligible for a
   // protected view-ticket handshake. Current legacy articles still send
   // free-text scope and NO analytics JS is loaded: ZERO production change.
   // Deliberately not awaited: stats never block, remove or rotate News.
   const articleId=String(scope).startsWith('article:')?String(scope).slice(8):'';
   if(placement==='article'&&
      scopeForVerifiedArticleId(articleId)===scope&&
      typeof g.JBAdAnalytics?.prepare==='function'){
    let reportStarted=false;
    const beginReport=()=>{
     if(reportStarted||!current()||box.isConnected===false)return;
     if(mediaNode?.tagName==='IMG'&&(!mediaNode.complete||mediaNode.naturalWidth<=0))return;
     if(mediaNode?.tagName==='VIDEO'&&mediaNode.readyState<2)return;
     reportStarted=true;
     try{
      const reporting=g.JBAdAnalytics.prepare({
       element:box,ctaElement,articleId,campaignId:ad.campaign_id,creativeId:ad.creative_id
      });
      if(reporting&&typeof reporting.catch==='function')reporting.catch(()=>{});
     }catch(_){}
    };
    // Text is immediately rendered. Images and video MUST display actual
    // content before a 50%/1s view token is prepared. A slow/broken image
    // or unloaded video controls are NOT billable ad exposure evidence.
    if(!mediaNode)beginReport();
    else if(mediaNode.tagName==='IMG'){
     if(mediaNode.complete&&mediaNode.naturalWidth>0)beginReport();
     else mediaNode.addEventListener('load',beginReport,{once:true});
    }else if(mediaNode.tagName==='VIDEO'){
     if(mediaNode.readyState>=2)beginReport();
     else mediaNode.addEventListener('loadeddata',beginReport,{once:true});
    }
   }
  }
 }catch(_){if(current())slot.replaceChildren()}
}
g.JBPublicAds={render,scopeForArticle,scopeForVerifiedArticleId,renderVerifiedArticle,articleParagraphOffset,placeArticleSlot};
})(window);
