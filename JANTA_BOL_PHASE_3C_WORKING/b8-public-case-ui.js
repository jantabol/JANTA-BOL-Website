/** B8 G4: PUBLIC browser UI. Displays only strict server-approved enum translations. */
import {createPublicCaseReader,isUuid,canonicalArticleHref,canonicalCaseHref}
 from './b8-public-case-client.js';
const $=id=>document.getElementById(id);
const statusLabels=Object.freeze({
 UNDER_REVIEW:'जाँच जारी है',RECORDS_REQUESTED:'रिकॉर्ड माँगे गए हैं',
 AWAITING_RESPONSE:'जवाब की प्रतीक्षा',UPDATED:'जानकारी अपडेट हुई है',
 CLOSED:'मामला बंद किया गया है'
});
const setStatus=(message,unavailable=false)=>{
 $('status').textContent=message;
 $('status').classList.toggle('unavailable',unavailable);
};
const el=(tag,text,className)=>{
 const x=document.createElement(tag);
 if(text!==undefined)x.textContent=String(text);
 if(className)x.className=className;
 return x;
};
const toDate=s=>new Intl.DateTimeFormat('hi-IN',{
 dateStyle:'medium',timeStyle:'short'
}).format(new Date(s));
function renderCard(row){
 const card=el('article',undefined,'card');
 const title=el('h2',row.topic+' — '+row.area);
 const state=el('p','स्थिति: '+(statusLabels[row.status]||'समीक्षा जारी'));
 const approved=el('small','Public revision '+row.revision+' • Founder approval '+toDate(row.approvedAt));
 const permalink=el('p');const self=el('a','Case की स्थायी सार्वजनिक पहचान');
 self.href=canonicalCaseHref(row.id);permalink.append(self);
 const safeNotice=el('p','यह आंतरिक दस्तावेज नहीं है। अधिकारी का जवाब और उसकी स्वतंत्र पुष्टि अलग-अलग जाँचते हैं।','notice');
 const h=el('h3','सार्वजनिक घटनाक्रम');
 const timeline=el('ol',undefined,'timeline');
 for(const event of row.milestones){
   const item=el('li');
   item.append(el('strong',event.title),el('div',toDate(event.date),'time'));
   timeline.append(item);
 }
 if(row.milestones.length===0)timeline.append(el('li','अभी कोई स्वीकृत सार्वजनिक Milestone नहीं है।'));
 const linked=el('h3','प्रकाशित संबंधित खबरें');
 const articles=el('ul');
 for(const articleId of row.articleIds){
   const item=el('li');const a=el('a','News Article: '+articleId);
   // Only the existing Article page, no new publisher or rewritten master URL.
   a.href=canonicalArticleHref(articleId);
   item.append(a);articles.append(item);
 }
 if(row.articleIds.length===0)articles.append(el('li','कोई प्रकाशित Article उपलब्ध नहीं है।'));
 card.append(title,state,approved,permalink,safeNotice,h,timeline,linked,articles);
 return card;
}
let requestEpoch=0;
let lastVisibleCheckAt=0;
async function render(query=null){
 // Latest-result-wins: a slow older approved response must NOT redraw a case
 // after a newer response revealed HIDE/unpublish or a different Case selection.
 const epoch=++requestEpoch;
 const root=$('cases');root.replaceChildren();
 const api=window.JBBackend?.client;
 if(!api?.rpc){setStatus('Public service उपलब्ध नहीं है। कोई निजी जानकारी दिखाई नहीं जाएगी।',true);return;}
 const reader=createPublicCaseReader(api);
 try{
  setStatus('सुरक्षित Public Projection की Server जाँच जारी…');
  if(query){
   if(!isUuid(query)){setStatus('Case ID सही UUID नहीं है।',true);return;}
   const data=await reader.case(query);
   if(epoch!==requestEpoch)return;
   if(!data){setStatus('यह Case सार्वजनिक रूप से उपलब्ध नहीं है।',true);return;}
   root.append(renderCard(data));setStatus('Founder-approved सार्वजनिक Case दिखाई जा रही है।');
  }else{
   const list=await reader.feed(12);
   if(epoch!==requestEpoch)return;
   for(const data of list)root.append(renderCard(data));
   setStatus(list.length?list.length+' स्वीकृत Public Case दिखाई जा रही हैं।':
     'अभी कोई स्वीकृत सार्वजनिक Accountability Case नहीं है।');
  }
 }catch(_){
  if(epoch!==requestEpoch)return;
  root.replaceChildren();
  // Do not echo server error body, SQL, private IDs or hidden moderation decisions.
  setStatus('सार्वजनिक Case लोड नहीं हो सका। बाद में फिर प्रयास करें।',true);
 }
}
$('caseForm').addEventListener('submit',e=>{
 e.preventDefault();
 const id=$('caseId').value.trim();
 if(id){const url=new URL(window.location.href);url.searchParams.set('id',id);
  history.replaceState(null,'',url);
 }
 render(id||null);
});
$('latest').addEventListener('click',()=>{
 $('caseId').value='';
 const url=new URL(window.location.href);url.search='';
 history.replaceState(null,'',url);render();
});
// Returning to a previously open page or a browser back-forward cache must
// re-check the Founder-approved server projection, not trust old DOM snapshots.
// No periodic polling: conserve the existing free hosted provider budget.
function currentCaseId(){
 return new URLSearchParams(window.location.search).get('id');
}
function revalidateVisible(){
 if(document.hidden || Date.now()-lastVisibleCheckAt<10000)return;
 lastVisibleCheckAt=Date.now();
 render(currentCaseId()||null);
}
document.addEventListener('visibilitychange',revalidateVisible);
window.addEventListener('pageshow',e=>{if(e.persisted){
 lastVisibleCheckAt=0;
 revalidateVisible();
}});
const asked=new URLSearchParams(window.location.search).get('id');
if(asked)$('caseId').value=asked;
render(asked||null);
