(async function(){
  if(!window.JBBackend)return;
  let news=[];try{news=await JBBackend.listPublishedPublic(30)}catch(e){console.error('JANTA BOL backend feed error',e)}

  let liveRows=[];
  try{
    const q=await JBBackend.client.from('public_live_feed')
      .select('article_id,permanent_url,headline,public_location,public_status,is_priority,public_reporter_label,feed_transition_state,active_source_type,updated_at')
      .in('public_status',['LIVE','INTERRUPTED'])
      .order('is_priority',{ascending:false})
      .order('updated_at',{ascending:false})
      .limit(50);
    if(q.error)throw q.error;
    liveRows=q.data||[];
  }catch(e){console.error('JANTA BOL public Live feed error',e)}

  const css='border:1px solid #333;border-radius:12px;padding:14px;margin-bottom:12px;background:#111;color:#fff';
  function articleCard(n,compact){const a=document.createElement('article');a.className='v3-live-card';a.style.cssText=css;a.innerHTML=`<div style="font-size:12px;color:#ff6060">${JBBackend.esc(n.category||'News')} • ${JBBackend.esc(n.location||'')}</div><h3 style="margin:7px 0">${JBBackend.esc(n.headline)}</h3>${compact?'':`<p style="opacity:.8">${JBBackend.esc(n.summary||'')}</p>`}<a style="color:#ff6060;font-weight:bold" href="article.html?id=${encodeURIComponent(n.id)}">पूरी खबर पढ़ें →</a>`;return a}
  function liveCard(x){
    const a=document.createElement('article');a.className='v3-public-live-card';a.style.cssText=css+(x.is_priority?';border-left:4px solid #b30000':'');
    const state=x.public_status==='INTERRUPTED'||x.feed_transition_state==='TEMPORARILY_INTERRUPTED'?'Live temporarily interrupted':(x.feed_transition_state==='SWITCHING'?'Live feed switching…':'LIVE');
    const href=/^article\.html\?id=[0-9a-f-]+$/i.test(String(x.permanent_url||''))?String(x.permanent_url):('article.html?id='+encodeURIComponent(x.article_id));
    a.innerHTML=`<div style="font-size:12px;color:#ff6060;font-weight:bold">${x.is_priority?'⭐ PRIORITY LIVE · ':''}🔴 ${JBBackend.esc(state)}</div><h3 style="margin:7px 0">${JBBackend.esc(x.headline)}</h3><div style="opacity:.8;font-size:13px">${JBBackend.esc(x.public_location||'')} · ${JBBackend.esc(x.public_reporter_label||'JANTA BOL Reporter')}${x.active_source_type?' · '+JBBackend.esc(x.active_source_type):''}</div><a style="display:inline-block;margin-top:9px;color:#ff6060;font-weight:bold" href="${JBBackend.esc(href)}">LIVE देखें →</a>`;
    return a;
  }
  const latestSection=document.querySelector('.latest-news-section');
  if(liveRows.length){
    const liveBox=document.createElement('section');liveBox.id='v3-public-live-feed';liveBox.style.cssText='max-width:1100px;margin:0 auto 24px;padding:0 16px';
    const title=document.createElement('div');title.innerHTML='<h2 style="margin:0 0 8px;color:#fff">🔴 LIVE</h2>';liveBox.appendChild(title);
    liveRows.forEach(x=>liveBox.appendChild(liveCard(x)));
    (latestSection||document.querySelector('.featured-news')||document.body).insertAdjacentElement(latestSection?'beforebegin':'afterend',liveBox);
  }
  if(latestSection){const box=document.createElement('section');box.id='v3-published-feed';box.style.cssText='max-width:1100px;margin:0 auto 24px;padding:0 16px';const title=document.createElement('div');title.innerHTML='<h2 style="margin:0 0 8px;color:#fff">📰 Published News</h2>';box.appendChild(title);if(!news.length){const e=document.createElement('div');e.style.cssText='padding:14px;border:1px solid #333;border-radius:10px';e.textContent='Abhi koi backend-published news nahi hai.';box.appendChild(e)}else news.slice(0,8).forEach(n=>box.appendChild(articleCard(n,false)));latestSection.insertAdjacentElement('beforebegin',box)}
  const categoryMap={Politics:'politics',Crime:'crime',Education:'education',Sports:'sports',Health:'health',Business:'business',Technology:'technology',Entertainment:'entertainment',Administration:'administration',Krishi:'agriculture','Dharm-Sanskriti':'religion-culture',Mausam:'weather',Other:'other'};Object.entries(categoryMap).forEach(([category,id])=>{const section=document.getElementById(id);if(!section)return;const matches=news.filter(n=>n.category===category);if(!matches.length)return;const holder=section.querySelector('.category-news')||section;const wrap=document.createElement('div');wrap.className='v3-category-live';wrap.style.cssText='margin-top:12px';matches.slice(0,3).forEach(n=>wrap.appendChild(articleCard(n,true)));holder.appendChild(wrap)});
  const top=news.find(n=>n.topStory),featured=document.querySelector('.featured-news');if(top&&featured){const box=document.createElement('div');box.style.cssText='max-width:1100px;margin:12px auto;padding:0 16px';box.innerHTML='<div style="font-size:12px;color:#ff6060;font-weight:bold;margin-bottom:8px">⭐ TOP STORY</div>';box.appendChild(articleCard(top,false));featured.insertAdjacentElement('afterend',box)}
  const breaking=news.find(n=>n.breaking),breakingSection=document.querySelector('.breaking-news');if(breaking&&breakingSection){const link=document.createElement('a');link.href='article.html?id='+encodeURIComponent(breaking.id);link.textContent=' • '+breaking.headline;link.style.cssText='color:inherit;text-decoration:none;font-weight:bold;margin-left:8px';const content=breakingSection.querySelector('.breaking-content')||breakingSection;content.appendChild(link)}
})();