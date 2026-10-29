/* T077 E6: fail closed on every non-canonical origin; no Preview -> Founder/production database client.
 * The production site is served only from jantabol.in (www redirects there).
 * This is a safety gate, NOT an independent preview database. Never bypass it for an admin preview.
 */
(function(root){
  'use strict';
  const canonical = root.location && root.location.protocol === 'https:' &&
    (root.location.hostname === 'jantabol.in' || root.location.hostname === 'www.jantabol.in');
  if (!canonical) {
    root.JB_PREVIEW_NO_PRODUCTION_BACKEND = true;
    root.JB_SUPABASE_CONFIG = null;
    // No backend config => backend-client.js fails before createClient/auth/RPC/write.
    // Prevent an untrusted Preview from inviting Founder credentials.
    const lockPage = () => {
      document.body.innerHTML = '<main role="alert" style="max-width:680px;margin:12vh auto;padding:28px;font:18px/1.6 system-ui,sans-serif;color:#f5f5f5;background:#141414;border:2px solid #b30d12;border-radius:12px"><h1>JANTA BOL — Isolated Preview</h1><p>Yeh Preview jaanbujhkar production database aur Founder login se disconnected hai.</p><p>Real news aur authorized Founder actions ke liye <strong>jantabol.in</strong> use karein.</p><p>Preview par koi publish, edit, delete ya account login allowed nahi hai.</p></main>';
      document.documentElement.style.visibility = 'visible';
    };
    document.documentElement.style.visibility = 'hidden';
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lockPage, {once:true});
    else lockPage();
    return;
  }
  root.JB_PREVIEW_NO_PRODUCTION_BACKEND = false;
  root.JB_SUPABASE_CONFIG = Object.freeze({
    url: 'https://vrffsnkycvjithwtiylt.supabase.co',
    publishableKey: 'sb_publishable_g6TzLABZ0_6nq02Gmcpv7g_W71M90JT'
  });
})(window);
