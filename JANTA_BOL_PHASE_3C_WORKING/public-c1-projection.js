/* JANTA BOL V3 public publishing bridge.
 * Reuses the EXISTING audited C1 published-only projection RPC.
 * Does not modify Founder Auth, session, MFA, RLS, or production data.
 * No privileged key, arbitrary table SELECT, editorial writes or innerHTML.
 */
(function (root) {
  'use strict';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const MAX = 30;
  const client = root.JBBackend?.client;

  function mapPublished(row) {
    if (!row || row.status !== 'published' ||
        !UUID.test(String(row.id || '')) ||
        !row.published_at || typeof row.title !== 'string' || !row.title.trim()) {
      return null;
    }
    // Explicit public-field allowlist. Backend normalize() private source metadata is never used.
    return {
      id: row.id,
      slug: String(row.slug || ''),
      version: Number(row.version) || 0,
      status: 'published',
      headline: row.title,
      summary: String(row.excerpt || ''),
      content: String(row.body || ''),
      category: String(row.category || ''),
      location: String(row.location || ''),
      author: String(row.reporter_name || ''),
      geoLevel: String(row.geography_level || ''),
      district: String(row.district || ''),
      newsDate: String(row.news_date || ''),
      newsTime: String(row.news_time || ''),
      breaking: row.breaking === true,
      topStory: row.top_story === true,
      publishedAt: row.published_at,
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || ''),
      media: {
        coverImageUrl: String(row.cover_image_url || ''),
        additionalMediaUrls: Array.isArray(row.additional_media_urls)
          ? row.additional_media_urls.filter(x => typeof x === 'string').slice(0, 20)
          : [],
        youtubeUrl: String(row.video_url || '')
      },
      internalSource: { publicAttribution: String(row.public_attribution || '') }
    };
  }

  async function query(id, limit) {
    if (!client || typeof client.rpc !== 'function') throw new Error('PUBLIC_C1_CLIENT_UNAVAILABLE');
    const {data, error} = await client.rpc('jb_c1_public_articles', {
      p_article_id: id || null,
      p_limit: limit
    });
    if (error) throw new Error('PUBLIC_C1_RPC_UNAVAILABLE');
    if (!data || !Array.isArray(data.items)) throw new Error('PUBLIC_C1_INVALID_PROJECTION');
    return data.items.map(mapPublished).filter(Boolean);
  }

  async function list(limit = 20) {
    const bounded = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(MAX, Math.floor(Number(limit))))
      : 20;
    return query(null, bounded);
  }

  async function get(id) {
    if (typeof id !== 'string' || !UUID.test(id)) return null;
    const visible = await query(id, 1);
    // Never treat an unrelated first row as the requested article.
    return visible.find(item => item.id.toLowerCase() === id.toLowerCase()) || null;
  }

  root.JBPublicC1 = Object.freeze({list, get});
})(window);
