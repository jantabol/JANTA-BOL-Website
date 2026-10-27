/* B9 public Android archive: user-entered values are ALWAYS text nodes, never HTML. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const form=$('b9Filters'),status=$('b9Status'),results=$('b9Results'),more=$('b9More');
let cursor=null,filters=null,request=0,busy=false;
const t=(tag,str,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=String(str??'');return el;};
function values(){
 const f=new FormData(form),v={};for(const [k,value] of f.entries())v[k]=String(value).trim();
 v.limit=20;return v;
}
function details(item){
 if(!item||typeof item!=='object')return null;
 const a=document.createElement('article');a.className='b9-result';
 const heading=t('h3','');const link=t('a',item.title||'बिना शीर्षक');
 try{link.href=JBB9.articleLink(item.id);}catch(_){return null;}
 heading.appendChild(link);a.appendChild(heading);
 const extra=[item.news_date,item.location,item.district,item.category].filter(Boolean).join(' • ');
 a.appendChild(t('p',extra,'b9-meta'));
 if(item.excerpt)a.appendChild(t('p',String(item.excerpt).slice(0,260)));
 const topics=Array.isArray(item.terms)?item.terms:[];
 if(topics.length){const box=document.createElement('div');box.className='b9-tags';for(const topic of topics.slice(0,25)){if(!topic?.label)continue;box.appendChild(t('span',(topic.kind==='tag'?'#':'')+topic.label,'b9-chip'));}a.appendChild(box);}
 return a;
}
async function search(append=false){
 if(busy)return;busy=true;const current=++request;
 $('b9Submit').disabled=true;more.disabled=true;
 status.className='b9-status';status.textContent='प्रकाशित खबरें खोजी जा रही हैं…';
 try{
   const response=await JBB9.search({...filters,cursor:append?cursor:null});
   if(current!==request)return;
   if(!append)results.replaceChildren();
   for(const item of response.items){const element=details(item);if(element)results.appendChild(element);}
   cursor=response.next_cursor||null;
   more.hidden=!cursor;
   if(!results.childElementCount){
      results.appendChild(t('p','इस खोज में कोई प्रकाशित खबर नहीं मिली।','b9-empty'));
      status.textContent='कोई नतीजा नहीं मिला। निजी या अप्रकाशित खबर यहाँ नहीं दिखाई जाएगी।';
   }else status.textContent='प्रकाशित खबरें: '+results.childElementCount+(cursor?' — और खबरें उपलब्ध हैं।':'');
 }catch(e){
   if(current!==request)return;
   more.hidden=true;cursor=null;
   results.replaceChildren(); // RPC outage: never mislabel old results as the new filter response.
   status.className='b9-status b9-error';
   status.textContent='खोज अभी उपलब्ध नहीं है। पुराने परिणाम हटाए गए हैं। Direct Article URL सुरक्षित और स्वतंत्र रहेगा।';
 }finally{busy=false;$('b9Submit').disabled=false;more.disabled=false;}
}
function cleanUrlState(){
 const params=new URLSearchParams();
 for(const [k,v] of Object.entries(filters||{})){if(v!==null&&v!==''&&v!==undefined)params.set(k,String(v));}
 params.delete('limit');
 history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():''));
}
/* Invalid input MUST invalidate old successful results, not present stale articles as the invalid query's answer. */
function invalidFilters(error){
 request++; // Ignore any in-flight search response for the previous filters.
 cursor=null;
 results.replaceChildren();
 more.hidden=true;
 status.className='b9-status b9-error';
 const code=String(error?.message||'');
 const messages={
  B9_INVALID_DATE_RANGE:'गलत तारीख सीमा: शुरुआती तारीख आखिरी तारीख से बाद की नहीं हो सकती। कृपया तारीखें सही करें।',
  B9_INVALID_DATE:'तारीख सही प्रारूप में चुनें।',
  B9_INVALID_ARTICLE_ID:'Article ID गलत है। कृपया पूरी सही ID दर्ज करें।',
  B9_INVALID_YEAR:'वर्ष 1900 से 2200 के बीच होना चाहिए।',
  B9_INVALID_MONTH:'सही महीना चुनें।',
  B9_INVALID_CURSOR:'खोज पेज रीसेट करके दोबारा प्रयास करें।'
 };
 status.textContent=(messages[code]||'Filter सही नहीं है। कृपया दर्ज जानकारी जाँचें।')+' पुराने Search Results छिपा दिए गए हैं।';
}
form.addEventListener('submit',e=>{e.preventDefault();try{
 const next=values();
 JBB9.cleanSearch(next);
 filters=next;
 cleanUrlState();
 cursor=null;
 search(false);
}catch(error){invalidFilters(error);}});
form.addEventListener('reset',()=>{setTimeout(()=>{filters=values();cursor=null;cleanUrlState();search(false);},0);});
more.addEventListener('click',()=>search(true));
async function extras(){
 try{
   const topics=await JBB9.taxonomy();
   const datalist=$('b9Terms');datalist.replaceChildren();
   for(const row of topics.slice(0,50)){if(typeof row?.slug!=='string')continue;const option=document.createElement('option');option.value=row.slug;option.label=row.label||row.slug;datalist.appendChild(option);}
 }catch(_){/* taxonomy failure never blocks Article search */ }
 try{
  const out=$('b9Reporters'),rows=await JBB9.reporterDiscovery();out.replaceChildren();
  if(!rows.length){out.appendChild(t('p','फिलहाल सार्वजनिक संवाददाता सूची उपलब्ध नहीं है।','b9-muted'));return;}
  const list=document.createElement('ul');
  for(const row of rows){list.appendChild(t('li',row.display_name+' — '+row.public_articles+' प्रकाशित खबरें'));}
  out.appendChild(list);
 }catch(_){$('b9Reporters').textContent='सार्वजनिक नाम सूची उपलब्ध नहीं है।';}
}
for(const el of form.querySelectorAll('[name]')){
 const v=new URLSearchParams(location.search).get(el.name);if(v!==null)el.value=v;
}
filters=values();
search(false);extras();
})();
