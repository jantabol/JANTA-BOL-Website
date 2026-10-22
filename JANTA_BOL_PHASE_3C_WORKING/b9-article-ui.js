/* Optional B9 display/related block only; failure must never affect Article PURL, Ads or Share. */
(function(){
'use strict';
const p=new URLSearchParams(location.search);
if(p.get('preview')==='admin')return;
const id=p.get('id');
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||'')))return;
const root=document.getElementById('root');
if(!root)return;
let initialized=false;
const t=(tag,content)=>{const x=document.createElement(tag);x.textContent=String(content??'');return x;};
function linkFor(article){try{return JBB9.articleLink(article.id);}catch(_){return null;}}
async function display(){
 if(initialized||!root.querySelector('article.article'))return;
 initialized=true;observer.disconnect();
 const article=root.querySelector('article.article');
 try{
  const metric=await JBB9.publicMetrics(id);
  if(metric&&(metric.views_enabled||metric.shares_enabled)){
   const m=t('aside','');m.className='b9-metrics';
   if(metric.views_enabled&&Number.isSafeInteger(Number(metric.views)))m.appendChild(t('span','👁 '+Number(metric.views).toLocaleString('en-IN')+' Views   '));
   if(metric.shares_enabled&&Number.isSafeInteger(Number(metric.shares)))m.appendChild(t('span','↗ '+Number(metric.shares).toLocaleString('en-IN')+' Shares'));
   if(m.childNodes.length)article.appendChild(m);
  }
 }catch(_){/* analytics failure isolated from article content and PURL */ }
 try{
  const related=await JBB9.related(id);
  if(!related?.length)return;
  const section=document.createElement('aside');section.className='b9-related';
  section.appendChild(t('h2','संबंधित खबरें'));
  const list=document.createElement('ul');
  for(const row of related.slice(0,5)){
   const link=linkFor(row);if(!link)continue;
   const li=document.createElement('li'),a=t('a',row.title||'खबर पढ़ें');
   a.href=link;li.appendChild(a);list.appendChild(li);
  }
  section.appendChild(list);
  const all=t('a','सभी खबरें देखें →');all.href='b9-search.html';section.appendChild(all);
  article.appendChild(section);
 }catch(_){/* Search failure never blocks direct article view */ }
}
const observer=new MutationObserver(()=>{void display();});
observer.observe(root,{childList:true,subtree:true});
void display();
})();
