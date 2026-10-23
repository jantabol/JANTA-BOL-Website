/* Only secure existing Founder session can load/modify B9 analytics. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const text=(tag,value)=>{const x=document.createElement(tag);x.textContent=String(value??'');return x;};
const msg=(value,fail=false)=>{const x=$('status');x.className='b9-status'+(fail?' b9-error':'');x.textContent=value;};
const datestamp=d=>d.toISOString().slice(0,10);
const todayIST=()=>{const pieces=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=s=>pieces.find(p=>p.type===s).value;return get('year')+'-'+get('month')+'-'+get('day');};
const shift=(date,days)=>{const x=new Date(date+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+days);return datestamp(x);};
function updatePeriod(){
 const p=$('period').value;const d=todayIST();
 if(p==='custom')return;
 $('to').value=d;$('from').value=p==='today'?d:shift(d,-(p==='7d'?6:29));
}
$('period').addEventListener('change',updatePeriod);
function interval(){
 const a=$('from').value,b=$('to').value;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b)||a>b)throw Error('सही IST तारीख सीमा चुनें।');
 return [new Date(a+'T00:00:00+05:30').toISOString(),new Date(shift(b,1)+'T00:00:00+05:30').toISOString()];
}
function number(n){return Number(n||0).toLocaleString('en-IN');}
async function report(){
 try{
  await JBBackend.requireOwner();
  const [a,b]=interval();msg('Server से raw (निजी) Event Counts लोड हो रहे हैं…');
  const data=await JBB9.ownerAnalytics(a,b,$('order').value,100);
  const summary=$('summary');summary.replaceChildren();
  const s=data?.summary||{};
  summary.appendChild(text('p','Views: '+number(s.views)+' | Shares: '+number(s.shares)+' | Total Events: '+number(s.total)));
  summary.appendChild(text('p','समय: '+$('from').value+' से '+$('to').value+' (India Standard Time)'));
  const tbody=$('articleRows');tbody.replaceChildren();
  for(const r of (data?.articles||[])){
   const tr=document.createElement('tr'),td=document.createElement('td'),anchor=text('a',r.title||r.id);
   anchor.href=JBB9.articleLink(r.id);td.appendChild(anchor);tr.appendChild(td);
   tr.appendChild(text('td',number(r.views)));tr.appendChild(text('td',number(r.shares)));tbody.appendChild(tr);
  }
  if(!tbody.childElementCount){const tr=document.createElement('tr');const td=text('td','इस अवधि में कोई रिकॉर्ड नहीं मिला।');td.colSpan=3;tr.appendChild(td);tbody.appendChild(tr);}
  msg('सुरक्षित Analytics रिपोर्ट खुल गई। Raw Count केवल Founder को दिखता है।');
 }catch(e){
  $('summary').replaceChildren();
  $('articleRows').replaceChildren(); // Old period totals must never be mistaken for the failed range.
  msg('सुरक्षित Analytics उपलब्ध नहीं है। पुरानी रिपोर्ट हटाई गई है। News/Article publishing स्वतंत्र है।',true);
 }
}
$('b9AnalyticsFilter').addEventListener('submit',e=>{e.preventDefault();report();});
$('globalDisplay').addEventListener('submit',async e=>{
 e.preventDefault();try{
 await JBB9.ownerMetricSettings({globalSettings:true,views:$('globalViews').checked,shares:$('globalShares').checked});
 msg('Global Public Views/Shares सुरक्षित और Audited।');}catch(err){msg(String(err.message||err),true);}
});
$('articleDisplay').addEventListener('submit',async e=>{
 e.preventDefault();try{
 const raw=$('viewOverride').value.trim();
 await JBB9.ownerMetricSettings({globalSettings:false,articleId:$('articleId').value.trim(),
 views:$('articleViews').checked,shares:$('articleShares').checked,override:raw===''?null:Number(raw)});
 msg('Article Display सुरक्षित; असली Views/Shares नहीं बदले।');}catch(err){msg(String(err.message||err),true);}
});
$('taxonomyAssign').addEventListener('submit',async e=>{
 e.preventDefault();try{
 await JBB9.ownerAssignTerm($('termArticle').value.trim(),$('termKind').value,
 $('termSlug').value.trim(),$('termLabel').value.trim(),$('termAction').value);
 msg('मानव-स्वीकृत Topic/Tag दर्ज हुआ। पुरानी खबर की ID और URL सुरक्षित हैं।');
 }catch(err){msg(String(err.message||err),true);}
});
updatePeriod();
if(document.documentElement.dataset.jbAuth==='ready')report();
else addEventListener('jb-auth-ready',report,{once:true});
})();
