/* JANTA BOL public-news bridge — read-only, existing C1 RPC; no admin/auth modifications. */
(() => {
  "use strict";
  const API = "https://vrffsnkycvjithwtiylt.supabase.co/rest/v1/rpc/jb_c1_public_articles";
  const KEY = "sb_publishable_g6TzLABZ0_6nq02Gmcpv7g_W71M90JT";
  const MAX = 30;
  const categories = {
    technology: ["technology", "तकनीकी", "tech", "प्रौद्योगिकी"],
    politics: ["politics", "political", "राजनीति"],
    crime: ["crime", "क्राइम", "अपराध"],
    education: ["education", "शिक्षा", "education and employment", "रोजगार"],
    sports: ["sports", "खेल"],
    health: ["health", "स्वास्थ्य"],
    business: ["business", "व्यापार", "economy"],
    entertainment: ["entertainment", "मनोरंजन"]
  };

  function categoryOf(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return Object.keys(categories).find(k => categories[k].includes(normalized)) || "other";
  }
  function elem(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = String(text);
    return item;
  }
  function safeImage(value) {
    if (!value || typeof value !== "string") return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch { return null; }
  }
  function articleHref(item) {
    return "article.html?id=" + encodeURIComponent(item.id);
  }
  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "";
    return new Intl.DateTimeFormat("hi-IN", {
      timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric"
    }).format(date);
  }
  async function loadFeed(id) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const body = {p_limit: id ? 1 : MAX};
      if (id) body.p_article_id = id;
      const response = await fetch(API, {
        method: "POST", mode: "cors", cache: "no-store", signal: controller.signal,
        headers: {apikey: KEY, "Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error("Public feed HTTP " + response.status);
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.items)) throw new Error("Invalid public feed response");
      // RPC is the security boundary; this additional browser-side filter is only defensive.
      return payload.items.filter(item => item && item.status === "published" &&
        typeof item.id === "string" && typeof item.title === "string" && item.published_at);
    } finally {
      clearTimeout(timer);
    }
  }
  function articleCard(item) {
    const card = elem("article", "jb-live-card");
    const url = articleHref(item);
    const imageSrc = safeImage(item.cover_image_url);
    if (imageSrc) {
      const imageLink = elem("a", "jb-live-image-link");
      imageLink.href = url;
      const image = elem("img", "jb-live-image");
      image.loading = "lazy";
      image.alt = item.title;
      image.src = imageSrc;
      imageLink.append(image);
      card.append(imageLink);
    }
    const info = elem("div", "jb-live-card-body");
    const meta = elem("p", "jb-live-meta", [item.category, formatDate(item.published_at)]
      .filter(Boolean).join(" • "));
    const link = elem("a", "jb-live-title", item.title);
    link.href = url;
    info.append(meta, link);
    if (item.excerpt) info.append(elem("p", "jb-live-excerpt", item.excerpt));
    const readLink = elem("a", "jb-live-read", "पूरी खबर पढ़ें →");
    readLink.href = url;
    info.append(readLink);
    card.append(info);
    return card;
  }
  function message(text) {
    return elem("p", "jb-live-message", text);
  }
  function renderHome(items, failure) {
    const featured = document.querySelector(".featured-news .news-grid");
    const latest = document.querySelector(".latest-news-section");
    const title = document.querySelector(".featured-news h2");
    if (title) title.textContent = "प्रकाशित समाचार";
    const featureSection = document.querySelector(".featured-news");
    if (featureSection) featureSection.id = "jb-published-news";
    const heroLink = document.querySelector(".hero-btn");
    if (heroLink) {
      heroLink.href = "#jb-published-news";
      heroLink.textContent = "▶ प्रकाशित खबरें देखें";
    }
    // Overwrite demo cards; never expose the pre-existing placeholder headlines.
    if (featured) featured.replaceChildren(
      ...(failure ? [message("प्रकाशित खबरें अभी लोड नहीं हो सकीं। थोड़ी देर बाद दोबारा खोलें।")] :
        items.length ? items.slice(0, 5).map(articleCard) :
        [message("अभी कोई प्रकाशित खबर उपलब्ध नहीं है।")])
    );
    if (latest) {
      const latestTitle = elem("h2", "", "📰 ताज़ा प्रकाशित खबरें");
      const content = failure ? [message("समाचार सेवा अभी उपलब्ध नहीं है।")] :
        items.length ? items.slice(0, 10).map(articleCard) :
        [message("अभी कोई प्रकाशित खबर नहीं है।")];
      latest.replaceChildren(latestTitle, ...content);
    }
    document.querySelectorAll(".category-section[data-category]").forEach(section => {
      const category = section.dataset.category;
      // Old V2 click listeners read dataset.category and open demo previews.
      delete section.dataset.category;
      section.removeAttribute("role");
      section.removeAttribute("tabindex");
      const container = section.querySelector(".category-news");
      if (!container) return;
      const records = items.filter(item => categoryOf(item.category) === category);
      container.replaceChildren(...(failure ?
        [message("अभी खबरें लोड नहीं हो सकीं।")] :
        records.length ? records.map(articleCard) :
        [message("इस श्रेणी में अभी कोई प्रकाशित खबर नहीं है।")]));
    });
    document.body.classList.add("jb-feed-ready");
  }
  function renderArticle(items, failure) {
    const main = document.getElementById("jb-public-article");
    if (!main) return;
    if (failure) { main.replaceChildren(message("खबर लोड नहीं हो सकी। कृपया दोबारा कोशिश करें।")); return; }
    const article = items[0];
    if (!article) { main.replaceChildren(message("यह प्रकाशित खबर उपलब्ध नहीं है।")); return; }
    document.title = article.title + " | JANTA BOL";
    const headline = elem("h1", "jb-article-heading", article.title);
    const meta = elem("p", "jb-live-meta", [article.category, formatDate(article.published_at)]
      .filter(Boolean).join(" • "));
    main.replaceChildren(meta, headline);
    const imageSrc = safeImage(article.cover_image_url);
    if (imageSrc) {
      const image = elem("img", "jb-article-image");
      image.src = imageSrc;
      image.alt = article.title;
      main.append(image);
    }
    if (article.excerpt) main.append(elem("p", "jb-article-excerpt", article.excerpt));
    const body = elem("div", "jb-article-body");
    // No innerHTML: editorial text is displayed as text to prevent HTML/script injection.
    const paragraphs = String(article.body || "").split(/\n\s*\n/).filter(Boolean);
    for (const paragraph of paragraphs) {
      const p = elem("p", "", paragraph.trim());
      p.style.whiteSpace = "pre-line";
      body.append(p);
    }
    main.append(body);
    if (article.public_attribution) main.append(elem("p", "jb-live-meta",
      "स्रोत/श्रेय: " + article.public_attribution));
  }
  async function run() {
    const detail = document.body.hasAttribute("data-jb-public-article");
    if (detail) {
      const id = new URLSearchParams(location.search).get("id") || "";
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        renderArticle([], false);
        return;
      }
      try { renderArticle(await loadFeed(id), false); }
      catch (error) { console.warn("Public article feed unavailable", error); renderArticle([], true); }
      return;
    }
    try { renderHome(await loadFeed(), false); }
    catch (error) { console.warn("Public feed unavailable", error); renderHome([], true); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, {once:true});
  else run();
})();
