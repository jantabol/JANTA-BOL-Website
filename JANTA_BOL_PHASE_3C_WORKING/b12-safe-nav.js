/* B12 / T077 - safe post-MFA admin navigation, NOT a new authentication authority. */
(function (root) {
  'use strict';
  const PAGES = new Set([
    'admin.html', 'add-news.html', 'admin-security.html',
    'admin-recovery.html', 'admin-recovery-setup.html',
    'reporters.html', 'social.html', 'ads.html', 'grievances.html',
    'compliance.html', 'settings.html', 'analytics.html',
    'live.html', 'admin-password.html', 'b8-accountability.html', 'b9-analytics.html'
  ]);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function target(input) {
    const DEFAULT = 'admin.html';
    if (typeof input !== 'string' || input.length > 512 ||
        /[\\\x00-\x1f\x7f]/.test(input) ||
        /%(?:2f|5c|00|0[0-9a-f]|1[0-9a-f]|7f)/i.test(input)) return DEFAULT;
    const part = input.split('?')[0];
    if (!/^[a-z][a-z0-9-]{0,60}\.html$/.test(part) || !PAGES.has(part)) return DEFAULT;
    const index = input.indexOf('?');
    if (index === -1) return part;
    if (input.indexOf('?', index + 1) !== -1) return DEFAULT;
    const params = new URLSearchParams(input.substring(index + 1));
    if (params.size !== 1) return DEFAULT;
    const key=[...params.keys()][0];
    if (params.getAll(key).length !== 1) return DEFAULT;
    if (part === 'add-news.html' && key === 'id') {
      const id = params.get('id');
      return UUID.test(id || '') ? part + '?id=' + encodeURIComponent(id) : DEFAULT;
    }
    if (part === 'grievances.html' && key === 'tab') {
      const tab=params.get('tab');
      return /^(inbox|open|closed|archived)$/.test(tab || '') ? part + '?tab=' + tab : DEFAULT;
    }
    if (part === 'b9-analytics.html' && key === 'range') {
      const range=params.get('range');
      return /^(7|30|90)$/.test(range || '') ? part + '?range=' + range : DEFAULT;
    }
    return DEFAULT;
  }
  root.JBProdSafeNav = Object.freeze({ target });
})(window);
