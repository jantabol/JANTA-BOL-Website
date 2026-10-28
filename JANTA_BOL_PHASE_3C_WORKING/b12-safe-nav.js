/* /[\\\x00-\x1f\x7f]/ANTA BOL B12 T077: same-directory, allowlisted Admin destination after MFA.
 * Never trust user-supplied ?next= URL, return only a known local admin page.
 * No new auth state or role authority; existing JBBackend.requireOwner stays.
 */
(function (root) {
  'use strict';
  const PAGES = new Set([
    'admin.html', 'add-news.html', 'admin-security.html', 'admin-recovery.html',
    'admin-recovery-setup.html', 'reporters.html', 'social.html', 'ads.html',
    'grievances.html', 'compliance.html', 'settings.html', 'analytics.html',
    'live.html', 'admin-password.html'
  ]);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function target(input) {
    const DEFAULT = 'admin.html';
    if (typeof input !== 'string' || input.length > 512 ||
        /[\\\x00-\x1f\x7f]/.test(input) ||
        /[\\\x00-\x1f\x7f]/.test(input) ||
    const part = input.split('?')[0];
    if (!/^[a-z][a-z0-9-]{0,60}\.html$/.test(part) || !PAGES.has(part)) return DEFAULT;
    const qIndex = input.indexOf('?');
    if (qIndex === -1) return part;
    if (input.indexOf('?', qIndex + 1) !== -1) return DEFAULT;
    const query = new URLSearchParams(input.substring(qIndex + 1));
    if ([...query.keys()].some(k => k !== 'id' || query.getAll(k).length !== 1)) return DEFAULT;
    const id = query.get('id');
    if (part !== 'add-news.html' || !UUID.test(id || '')) return DEFAULT;
    return part + '?id=' + encodeURIComponent(id);
  }
  root.JBProdSafeNav = Object.freeze({target});
})(window);