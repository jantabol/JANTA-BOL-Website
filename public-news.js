// Existing C1 public projection only. No draft, internal audit, or privileged DB access.
(() => {
  'use strict';
  const general = document.getElementById('jb-news');
  const tech = document.getElementById('jb-tech-news');
  if (!general && !tech) return;

  // Remove inherited V2 demo-preview handlers without touching protected script.js.
  const otherCategories = new Map();
  document.querySelectorAll('.category-section.category-open[data-category]').forEach(old => {
    const name = old.dataset.category;
    const clean = old.cloneNode(true);
    clean.classList.remove('category-open');
    clean.removeAttribute('data-category');
    clean.removeAttribute('role');
    clean.removeAttribute('tabindex');
    old.replaceWith(clean);
    const body = clean.querySelector('.category-news');
    if (name && body) otherCategories.set(name, body);
  });

  const aliases = {
    politics: ['politics', 'राजनीति'],
    crime: ['crime', 'अपराध', 'क्राइम'],
    education: ['education', 'education and employment', 'शिक्षा एवं रोजगार'],
    sports: ['sports', 'खेल'],
    health: ['health', 'स्वास्थ्य'],
    business: ['business', 'व्यापार'],
    technology: ['technology', 'tech', 'तकनीकी', 'प्रौद्योगिकी'],
    entertainment: ['entertainment', 'मनोरंजन']
  };
  function categoryMatch(value, name) {
    return (aliases[name] || []).includes(String(value || '').trim().toLowerCase());
  }
  function fill(node, items, emptyMessage) {
    if (!node) return;
    node.replaceChildren();
    if (!items.length) {
      const p = document.createElement('p');
      p.textContent = emptyMessage;
      node.appendChild(p);
    } else items.forEach(article => node.appendChild(makeCard(article)));
  }
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
    const date = new Date(article.published_at);
    const formatted = Number.isNaN(date.getTime()) ? '' :
      new Intl.DateTimeFormat('hi-IN', {timeZone:'Asia/Kolkata',day:'numeric',month:'long',year:'numeric'}).format(date);
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
  const loading = 'प्रकाशित खबरें लोड हो रही हैं…';
  for (const node of otherCategories.values()) fill(node, [], loading);
  async function load() {
    try {
      const response = await fetch('/api/public-news', { cache:'no-store', credentials:'omit' });
      if (!response.ok) throw new Error('HTTP '+response.status);
      const payload = await response.json();
      if (!Array.isArray(payload.items)) throw new Error('Unexpected response');
      // Defensive frontend guard; existing RPC + server are the authority.
      const published = payload.items.filter(a => a && a.status === 'published'
        && typeof a.id === 'string' && a.published_at && typeof a.title === 'string');
      fill(general, published.slice(0, 12), 'अभी कोई प्रकाशित खबर उपलब्ध नहीं है।');
      fill(tech, published.filter(a => categoryMatch(a.category,'technology')), 'तकनीकी श्रेणी में अभी कोई प्रकाशित खबर नहीं है।');
      for (const [name,node] of otherCategories) {
        fill(node, published.filter(a => categoryMatch(a.category,name)), 'इस श्रेणी में अभी कोई प्रकाशित खबर नहीं है।');
      }
    } catch(error) {
      const msg = 'अभी प्रकाशित खबरें लोड नहीं हो पा रही हैं। कृपया थोड़ी देर बाद फिर प्रयास करें।';
      fill(general,[],msg);
      fill(tech,[],msg);
      for (const node of otherCategories.values()) fill(node,[],msg);
      console.warn('JANTA BOL public feed temporarily unavailable:',error.message);
    }
  }
  load();
})();