// Read-only bridge to the existing Founder-approved C1 public projection RPC.
// Never use service_role or return draft/unpublished/deleted articles.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const rawId = req.query?.id;
  const id = typeof rawId === 'string' ? rawId : null;
  if (rawId !== undefined && (!id || !UUID.test(id))) {
    return res.status(400).json({ error: 'Invalid article id' });
  }
  const category = req.query?.category;
  if (category !== undefined && (typeof category !== 'string' || category.length > 64 || !/^[A-Za-z -]+$/.test(category))) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  const projectUrl = process.env.JB_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.JB_PUBLIC_SUPABASE_KEY;
  if (!projectUrl || !publishableKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(projectUrl)) {
    return res.status(503).json({ error: 'Public news feed not configured' });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch(projectUrl + '/rest/v1/rpc/jb_c1_public_articles', {
        method: 'POST',
        headers: { 'apikey': publishableKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ p_article_id: id || null, p_limit: 30 }),
        signal: controller.signal
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) {
      console.error('public news RPC failed with HTTP', response.status);
      return res.status(502).json({ error: 'News service unavailable' });
    }
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.items)) throw new Error('Unexpected projection format');
    const safe = payload.items.filter(a =>
      a && a.status === 'published' && a.published_at && typeof a.id === 'string' && UUID.test(a.id)
      && (!category || String(a.category || '').toLowerCase() === category.toLowerCase())
    ).map(a => {
      const summary = {
        id: a.id, slug: a.slug || '', title: a.title || '',
        excerpt: a.excerpt || '', category: a.category || '',
        cover_image_url: a.cover_image_url || '', public_attribution: a.public_attribution || '',
        published_at: a.published_at, news_date: a.news_date || null,
        geography_level: a.geography_level || '', district: a.district || '',
        location: a.location || '', top_story: a.top_story === true, breaking: a.breaking === true
      };
      if (id) summary.body = typeof a.body === 'string' ? a.body : '';
      return summary;
    });
    return res.status(200).json(id ? { article: safe[0] || null } : { items: safe, limit: 30 });
  } catch (error) {
    console.error('public news feed error', error?.name || 'unknown');
    return res.status(502).json({ error: 'News service unavailable' });
  }
};