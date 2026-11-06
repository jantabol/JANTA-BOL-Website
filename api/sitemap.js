/**
 * Public, read-only sitemap for JANTA BOL.
 * Uses the EXISTING published-only B9 search RPC: no service-role key,
 * private editorial data, direct table reads, or changes to RLS/auth.
 */
const BASE = 'https://jantabol.in';
const API = 'https://vrffsnkycvjithwtiylt.supabase.co/rest/v1/rpc/jb_b9_search';
// Public publishable key already shipped in the website's supabase-config.js.
const PUBLISHABLE_KEY = 'sb_publishable_6l_UCUEpr4qTKgWtZfK5rA_E2-ggahs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PAGES = 100;
const LIMIT = 50;

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function publishedPage(cursor) {
  const response = await fetch(API, {
    method: 'POST',
    headers: {
      apikey: PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      p_query: '', p_id: null, p_date_from: null, p_date_to: null,
      p_year: null, p_month: null, p_district: null, p_location: '',
      p_category: null, p_term: '', p_sort: 'latest',
      p_cursor: cursor, p_limit: LIMIT
    }),
    signal: AbortSignal.timeout(6500)
  });
  if (!response.ok) throw new Error('PUBLIC_SEARCH_UNAVAILABLE');
  const data = await response.json();
  if (!data || !Array.isArray(data.items) || data.items.length > LIMIT) {
    throw new Error('PUBLIC_SEARCH_INVALID');
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  try {
    const urls = [
      BASE + '/',
      BASE + '/JANTA_BOL_PHASE_3C_WORKING/b9-search.html'
    ];
    const ids = new Set();
    const cursorKeys = new Set();
    let cursor = null;
    let finished = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await publishedPage(cursor);
      for (const item of data.items) {
        const id = String(item && item.id || '').toLowerCase();
        if (!UUID.test(id) || ids.has(id)) continue;
        // Published-only RPC is the authority. Preserve one permanent URL per news.
        ids.add(id);
        urls.push(BASE + '/JANTA_BOL_PHASE_3C_WORKING/article.html?id=' + id);
      }
      if (!data.next_cursor) {
        finished = true;
        break;
      }
      if (typeof data.next_cursor !== 'object' || Array.isArray(data.next_cursor)) {
        throw new Error('PUBLIC_CURSOR_INVALID');
      }
      const key = JSON.stringify(data.next_cursor);
      if (cursorKeys.has(key)) throw new Error('PUBLIC_CURSOR_LOOP');
      cursorKeys.add(key);
      cursor = data.next_cursor;
    }
    // Never publish a partial sitemap as complete if the result exceeds this bounded capacity.
    if (!finished) throw new Error('PUBLIC_SITEMAP_CAP');
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => '  <url><loc>' + escapeXml(u) + '</loc></url>').join('\n') +
      '\n</urlset>\n';
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(req.method === 'HEAD' ? '' : xml);
  } catch (_) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('Sitemap temporarily unavailable');
  }
}
