// JANTA BOL public reader: consume only the existing C1 published projection.
// Safe DOM rendering: never inject article text as HTML.
(() => {
  'use strict';
  const general = document.getElementById('jb-news');
  const tech = document.getElementById('jb-tech-news');
  if (!general && !tech) return;

  function makeCard(article) {
    const card = document.createElement('article');
    card.className = 'jb-live-news-card';
    const imageUrl = article.cover_image_url;
    if (typeof imageUrl === 'string' && /^https:\/\//i.test(imageUrl)) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.className = 'jb-news-image';
      card.appendChild(img);
    }
    const meta = document.createElement('p');
    meta.className = 'jb-news-meta';
    const d = new Date(article.published_at);
    const formatted = isNaN(d.getTime()) ? '' : d.toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });
    meta.textContent = [article.category, formatted].filter(Boolean).join(' • ');
    card.appendChild(meta);
    const h = document.createElement('h3');
    h.textContent = article.title || 'समाचार';
    card.appendChild(h);
    if (article.excerpt) {
      const excerpt = document.createElement('p');
      excerpt.textContent = article.excerpt;
      card.appendChild(excerpt);
    }
    const link = document.createElement('a');
    link.href = '/article.html?id=' + encodeURIComponent(article.id);
    link.className = 'jb-news-read';
    link.textContent = 'पूरी खबर पढ़ें →';
    card.appendChild(link);
    return card;
  }
  function fill(node, items, emptyMessage) {
    if (!node) return;
    node.replaceChildren();
    if (!items.length) {
      const p = document.createElement('p');
      p.textContent = emptyMessage;
      node.appendChild(p);
      return;
    }
    items.forEach(item => node.appendChild(makeCard(item)));
  }
  async function load() {
    try {
      const res = await fetch('/api/public-news', { cache: 'no-store', credentials: 'omit' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data.items)) throw new Error('Bad response');
      fill(general, data.items.slice(0, 12), 'अभी कोई प्रकाशित खबर उपलब्ध नहीं है।');
      fill(tech, data.items.filter(a => String(a.category).toLowerCase() === 'technology'), 'तकनीकी श्रेणी में अभी कोई प्रकाशित खबर नहीं है।');
    } catch (err) {
      const msg = 'अभी प्रकाशित खबरें लोड नहीं हो पा रही हैं। कृपया थोड़ी देर बाद फिर प्रयास करें।';
      fill(general, [], msg);
      fill(tech, [], msg);
      console.warn('JANTA BOL public feed unavailable:', err.message);
    }
  }
  load();
})();