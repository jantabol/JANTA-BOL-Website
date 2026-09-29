(function (global) {
  'use strict';
  console.log('ADMIN-DATA-JS LOADED');
  // Legacy local-only helper retained for V3 compatibility.
  // Real Phase-2 Supabase access lives in backend-client.js.
  const KEYS = {
    drafts: 'jantaBolDrafts',
    published: 'jantaBolPublishedNews',
    trash: 'jantaBolTrash',
    settings: 'jantaBolAdminSettings',
    editDraft: 'jantaBolEditDraft',
    editPublished: 'jantaBolEditPublished'
  };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (_) { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function now() { return new Date().toISOString(); }
  function uid() {
    if (global.crypto && crypto.randomUUID) return 'JB-' + crypto.randomUUID();
    return 'JB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }
  function ensureId(item) {
    if (!item.id) item.id = uid();
    if (!item.createdAt) item.createdAt = item.savedAt || item.publishedAt || now();
    return item;
  }
  function normalize(item) {
    const x = ensureId(Object.assign({}, item || {}));
    x.status = x.status || 'draft';
    x.internalSource = Object.assign({
      type: '', name: '', url: '', informationDate: '', note: '',
      verificationStatus: 'Pending Verification', evidence: '', publicAttribution: ''
    }, x.internalSource || {});
    x.verificationTrail = Array.isArray(x.verificationTrail) ? x.verificationTrail : [];
    x.social = Object.assign({
      enabled: false, facebook: false, instagram: false, whatsapp: false, youtube: false,
      caption: '', status: {facebook:'Not Selected',instagram:'Not Selected',whatsapp:'Not Selected',youtube:'Not Selected'}
    }, x.social || {});
    x.media = Object.assign({ coverImageUrl:'', additionalMediaUrls:[], youtubeUrl:'' }, x.media || {});
    x.lifecycle = Array.isArray(x.lifecycle) ? x.lifecycle : [];
    return x;
  }
  function migrateList(key) {
    const list = read(key, []);
    let changed = false;
    const out = list.map(item => {
      const before = item && item.id;
      const n = normalize(item);
      if (!before) changed = true;
      return n;
    });
    if (changed) write(key, out);
    return out;
  }
  function getDrafts() { return migrateList(KEYS.drafts); }
  function getPublished() { return migrateList(KEYS.published); }
  function getTrash() { return migrateList(KEYS.trash); }
  function setDrafts(v) { write(KEYS.drafts, v.map(normalize)); }
  function setPublished(v) { write(KEYS.published, v.map(normalize)); }
  function setTrash(v) { write(KEYS.trash, v.map(normalize)); }
  function findById(list, id) { return list.find(x => x.id === id); }
  function upsert(list, item) {
    const n = normalize(item);
    const idx = list.findIndex(x => x.id === n.id);
    if (idx >= 0) list[idx] = n; else list.unshift(n);
    return list;
  }
  function removeById(list, id) { return list.filter(x => x.id !== id); }
  function addLifecycle(item, action, note) {
    const n = normalize(item);
    n.lifecycle.push({ action, at: now(), note: note || '' });
    return n;
  }
  function addVerificationTrail(item, previousStatus, nextStatus, note) {
    const n = normalize(item);
    if (previousStatus !== nextStatus || note) {
      n.verificationTrail.push({ from: previousStatus || '', to: nextStatus || '', note: note || '', at: now() });
    }
    return n;
  }
  function saveDraft(item) {
    let n = addLifecycle(item, 'draft-saved');
    n.status = 'draft'; n.savedAt = now(); n.updatedAt = now();
    let drafts = removeById(getDrafts(), n.id);
    let published = removeById(getPublished(), n.id);
    setPublished(published);
    setDrafts(upsert(drafts, n));
    return n;
  }
  function publish(item) {
    let n = normalize(item);
    const existing = findById(getPublished(), n.id);
    n.status = 'published'; n.updatedAt = now();
    if (!n.publishedAt) n.publishedAt = now();
    n = addLifecycle(n, existing ? 'published-correction' : 'published');
    const drafts = removeById(getDrafts(), n.id);
    const published = upsert(removeById(getPublished(), n.id), n);
    setDrafts(drafts); setPublished(published);
    return n;
  }
  function unpublish(id) {
    const published = getPublished();
    const item = findById(published, id);
    if (!item) return null;
    let n = addLifecycle(item, 'unpublished-to-draft');
    n.status = 'draft'; n.savedAt = now(); n.updatedAt = now();
    setPublished(removeById(published, id));
    setDrafts(upsert(removeById(getDrafts(), id), n));
    return n;
  }
  function moveToTrash(id, from) {
    const source = from === 'published' ? getPublished() : getDrafts();
    const item = findById(source, id);
    if (!item) return null;
    let n = addLifecycle(item, 'moved-to-trash', from);
    n.previousStatus = from; n.status = 'deleted'; n.deletedAt = now();
    if (from === 'published') setPublished(removeById(source, id)); else setDrafts(removeById(source, id));
    setTrash(upsert(removeById(getTrash(), id), n));
    return n;
  }
  function restoreFromTrash(id) {
    const trash = getTrash();
    const item = findById(trash, id);
    if (!item) return null;
    let n = addLifecycle(item, 'restored-from-trash');
    const target = n.previousStatus === 'published' ? 'published' : 'draft';
    n.status = target; delete n.deletedAt;
    setTrash(removeById(trash, id));
    if (target === 'published') setPublished(upsert(removeById(getPublished(), id), n));
    else setDrafts(upsert(removeById(getDrafts(), id), n));
    return n;
  }
  function permanentlyDelete(id) { setTrash(removeById(getTrash(), id)); }
  function getSettings() {
    return Object.assign({ socialGlobalEnabled:false }, read(KEYS.settings, {}));
  }
  function saveSettings(s) { write(KEYS.settings, Object.assign(getSettings(), s)); }
  function getArticlePreviewUrl(id) {
    const url = new URL('article.html', global.location.href);
    url.searchParams.set('id', id);
    return url.href;
  }
  function publicMasterUrlAvailable() {
    return /^https?:$/.test(global.location.protocol) && !/^(localhost|127\.0\.0\.1)$/i.test(global.location.hostname);
  }
  function esc(v) { const d=document.createElement('div'); d.textContent=String(v ?? ''); return d.innerHTML; }

  global.JBData = {
    KEYS, now, uid, normalize, getDrafts, getPublished, getTrash, setDrafts, setPublished, setTrash,
    saveDraft, publish, unpublish, moveToTrash, restoreFromTrash, permanentlyDelete,
    getSettings, saveSettings, getArticlePreviewUrl, publicMasterUrlAvailable,
    addVerificationTrail, esc, findById
  };
})(window);