const menuBtn = document.querySelector(".menu-btn");
const sideMenu = document.querySelector(".side-menu");
const closeMenu = document.querySelector(".close-menu");
const overlay = document.querySelector(".menu-overlay");
menuBtn.addEventListener("click", () => {

    sideMenu.classList.add("open");

    overlay.style.opacity = "1";
    overlay.style.visibility = "visible";

    document.body.style.overflow = "hidden";

});
closeMenu.addEventListener("click", () => {

    sideMenu.classList.remove("open");

    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";

    document.body.style.overflow = "auto";

});
overlay.addEventListener("click", () => {

    sideMenu.classList.remove("open");

    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";

    document.body.style.overflow = "auto";

});
// Close menu with ESC key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {

        sideMenu.classList.remove("open");

        overlay.style.opacity = "0";
        overlay.style.visibility = "hidden";

        document.body.style.overflow = "auto";
    }
});
// Close menu when any menu link is clicked
document.querySelectorAll(".side-menu a").forEach(link => {
    link.addEventListener("click", () => {
        sideMenu.classList.remove("open");

        overlay.style.opacity = "0";
        overlay.style.visibility = "hidden";

        document.body.style.overflow = "auto";
    });
});
// Dropdown Menu

document.querySelectorAll(".menu-toggle").forEach(button => {
    button.addEventListener("click", function (e) {
        e.stopPropagation();

        const parent = this.parentElement;

        document.querySelectorAll(".menu-group").forEach(group => {
            if (group !== parent) {
                group.classList.remove("active");
            }
        });

        parent.classList.toggle("active");
    });
});

document.addEventListener("click", () => {
    document.querySelectorAll(".menu-group").forEach(group => {
        group.classList.remove("active");
    });
});

// ===== V2.4 FINAL REVIEW: Top Story + Shivpuri Tehsil actions =====
(() => {
  const modal = document.getElementById("preview-modal");
  const title = document.getElementById("preview-modal-title");
  const text = document.getElementById("preview-modal-text");
  const kicker = document.getElementById("preview-modal-kicker");
  const closeBtn = modal?.querySelector(".preview-modal-close");

  function openPreview(kickerText, titleText, bodyText) {
    if (!modal) return;
    kicker.textContent = kickerText;
    title.textContent = titleText;
    text.textContent = bodyText;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePreview() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";
  }

  document.querySelector(".top-story-open")?.addEventListener("click", () => {
    openPreview(
      "टॉप स्टोरी",
      "शिवपुरी में भारी बारिश, कई रास्ते बंद",
      "लगातार बारिश के कारण कई ग्रामीण क्षेत्रों का संपर्क टूटा। प्रशासन ने अलर्ट जारी किया।"
    );
  });

  document.querySelectorAll(".tehsil-card[data-tehsil]").forEach(card => {
    const open = () => {
      const name = card.dataset.tehsil;
      openPreview(
        "📍 शिवपुरी जिला",
        name,
        `${name} की खबरें जल्द यहाँ उपलब्ध होंगी।`
      );
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  closeBtn?.addEventListener("click", closePreview);
  modal?.addEventListener("click", e => {
    if (e.target === modal) closePreview();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal?.classList.contains("open")) closePreview();
  });
})();


// ===== V2.4 FINAL REVIEW: Video News + Latest News actions =====
(() => {
  const modal = document.getElementById("preview-modal");
  const title = document.getElementById("preview-modal-title");
  const text = document.getElementById("preview-modal-text");
  const kicker = document.getElementById("preview-modal-kicker");

  function openSectionPreview(kickerText, titleText, bodyText) {
    if (!modal || !title || !text || !kicker) return;
    kicker.textContent = kickerText;
    title.textContent = titleText;
    text.textContent = bodyText;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  const videoCard = document.querySelector(".video-news-open");
  const openVideo = () => openSectionPreview(
    "🎥 वीडियो न्यूज़",
    "शिवपुरी में भारी बारिश, देखें पूरी रिपोर्ट",
    "वीडियो रिपोर्ट जल्द यहाँ उपलब्ध होगी।"
  );
  videoCard?.addEventListener("click", openVideo);
  videoCard?.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openVideo();
    }
  });

  document.querySelector(".latest-news-open")?.addEventListener("click", () => {
    openSectionPreview(
      "📰 ताज़ा खबरें",
      "शिवपुरी में भारी बारिश, कई गांवों का संपर्क टूटा",
      "लगातार बारिश के कारण कई गांवों की सड़कें बंद हो गई हैं। प्रशासन ने अलर्ट जारी किया है।"
    );
  });
})();

// ===== T080: published-only geographic coverage, reuse existing C1 public RPC =====
// This fixes the old static preview without changing Founder Auth, publishing or news data.
(() => {
  const modal = document.getElementById("preview-modal");
  const title = document.getElementById("preview-modal-title");
  const text = document.getElementById("preview-modal-text");
  const kicker = document.getElementById("preview-modal-kicker");
  const regions = {
    world: { title: "🌍 दुनिया न्यूज़", levels: ["global", "world"] },
    india: { title: "🇮🇳 भारत न्यूज़", levels: ["india"] },
    mp: { title: "❤️ मध्य प्रदेश", levels: ["mp", "madhya pradesh"] }
  };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let activeLoad = 0;
  const normalized = value => String(value || "").trim().toLowerCase();

  async function openCoverage(card) {
    const region = regions[card.dataset.coverage];
    if (!modal || !title || !text || !kicker || !region) return;
    const request = ++activeLoad;
    kicker.textContent = "🌍 कवरेज नेटवर्क";
    title.textContent = region.title;
    text.textContent = "प्रकाशित खबरें लोड हो रही हैं…";
    const dialog = modal.querySelector(".preview-modal-card");
    if (dialog) {
      dialog.style.maxHeight = "min(84vh, 760px)";
      dialog.style.overflowY = "auto";
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const stillCurrent = () => request === activeLoad &&
      modal.classList.contains("open") && title.textContent === region.title;
    try {
      // C1 is the audited anonymous published-only projection. Never query articles
      // directly or use a service key in a public browser.
      if (!window.JBPublicC1 || typeof window.JBPublicC1.list !== "function") {
        throw new Error("PUBLIC_C1_NOT_READY");
      }
      const rows = await window.JBPublicC1.list(30);
      if (!stillCurrent()) return;
      if (!Array.isArray(rows)) throw new Error("PUBLIC_C1_INVALID");
      const matches = rows.filter(n => n && n.status === "published" &&
        !!n.publishedAt && UUID.test(String(n.id || "")) &&
        !!String(n.headline || "").trim() &&
        region.levels.includes(normalized(n.geoLevel)));
      text.replaceChildren();
      if (!matches.length) {
        text.textContent = "इस क्षेत्र में अभी कोई प्रकाशित खबर उपलब्ध नहीं है।";
        return;
      }
      const count = document.createElement("span");
      count.style.cssText = "display:block;margin-bottom:12px;color:#e6e6e6;font-weight:700";
      count.textContent = matches.length + " प्रकाशित खबरें";
      text.appendChild(count);
      matches.forEach(n => {
        const item = document.createElement("span");
        item.style.cssText = "display:block;padding:12px 0;border-top:1px solid #393939";
        const heading = document.createElement("span");
        heading.style.cssText = "display:block;color:#fff;font-weight:700;line-height:1.5";
        heading.textContent = n.headline;
        const info = document.createElement("span");
        info.style.cssText = "display:block;font-size:13px;color:#c4c4c4;margin:5px 0";
        info.textContent = [n.category, n.location || n.district].filter(Boolean).join(" • ");
        const link = document.createElement("a");
        link.href = "article.html?id=" + encodeURIComponent(n.id);
        link.style.cssText = "display:inline-block;padding:7px 0;color:#ff6464;font-weight:700;overflow-wrap:anywhere";
        link.textContent = "पूरी खबर पढ़ें →";
        item.appendChild(heading);
        if (info.textContent) item.appendChild(info);
        item.appendChild(link);
        text.appendChild(item);
      });
    } catch (_) {
      if (stillCurrent()) text.textContent = "समाचार सेवा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।";
    }
  }

  document.querySelectorAll(".coverage-open[data-coverage]").forEach(card => {
    card.addEventListener("click", () => openCoverage(card));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        return openCoverage(card);
      }
    });
  });
})();


// ===== V2.4 CATEGORY + TRENDING FOUNDATION =====
(() => {
  const modal = document.getElementById("preview-modal");
  const title = document.getElementById("preview-modal-title");
  const text = document.getElementById("preview-modal-text");
  const kicker = document.getElementById("preview-modal-kicker");

  const categories = {
    politics: ["🏛️ राजनीति", "राजनीति, सरकार और जनहित से जुड़ी खबरें"],
    crime: ["🚨 क्राइम", "क्राइम, पुलिस और जनसुरक्षा से जुड़ी खबरें"],
    education: ["🎓 शिक्षा एवं रोजगार", "शिक्षा, परीक्षा और रोजगार से जुड़ी खबरें"],
    sports: ["🏏 खेल", "खेल, मैच, टूर्नामेंट और खिलाड़ियों से जुड़ी खबरें"],
    health: ["🏥 स्वास्थ्य", "स्वास्थ्य, अस्पताल और जनस्वास्थ्य से जुड़ी खबरें"],
    business: ["💼 व्यापार", "व्यापार, बाज़ार और अर्थव्यवस्था से जुड़ी खबरें"],
    technology: ["💻 तकनीकी", "तकनीकी, डिजिटल अपडेट्स और इनोवेशन से जुड़ी खबरें"],
    entertainment: ["🎬 मनोरंजन", "मनोरंजन, फिल्म और टेलीविजन से जुड़ी खबरें"]
  };

  function openPreview(kickerText, titleText, bodyText) {
    if (!modal || !title || !text || !kicker) return;
    kicker.textContent = kickerText;
    title.textContent = titleText;
    text.textContent = bodyText;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  document.querySelectorAll(".category-open[data-category]").forEach(card => {
    const open = () => {
      const item = categories[card.dataset.category];
      if (!item) return;
      openPreview("📰 श्रेणी", item[0], `${item[1]} जल्द यहाँ उपलब्ध होंगी।`);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  document.querySelectorAll(".trending-open").forEach(card => {
    const open = () => {
      const rank = card.querySelector(".trending-rank")?.textContent.trim() || "";
      const source = card.querySelector(".trending-source")?.textContent.trim() || "ट्रेंडिंग";
      const headline = card.querySelector("h3")?.textContent.trim() || "ट्रेंडिंग खबर";
      openPreview(`📈 ट्रेंडिंग #${rank}`, headline, `${source} • पूरी खबर V3 में प्रकाशित समाचार से जुड़ेगी।`);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  document.querySelector(".trending-all-open")?.addEventListener("click", () => {
    openPreview("📈 ट्रेंडिंग न्यूज़", "सभी ट्रेंडिंग खबरें", "ट्रेंडिंग न्यूज़ की पूरी सूची V3 में प्रकाशित समाचार और वास्तविक व्यूज़/एडिटोरियल चयन से जुड़ेगी।");
  });
})();


// ===== V2.4 ABOUT + CITIZEN REPORTER =====
(() => {
  const previewModal = document.getElementById("preview-modal");
  const previewTitle = document.getElementById("preview-modal-title");
  const previewText = document.getElementById("preview-modal-text");
  const previewKicker = document.getElementById("preview-modal-kicker");

  function openPreview(kickerText, titleText, bodyText) {
    if (!previewModal || !previewTitle || !previewText || !previewKicker) return;
    previewKicker.textContent = kickerText;
    previewTitle.textContent = titleText;
    previewText.textContent = bodyText;
    previewModal.classList.add("open");
    previewModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  document.querySelector(".about-open")?.addEventListener("click", () => {
    openPreview(
      "👥 JANTA-BOL के बारे में",
      "स्वतंत्र • स्थानीय • भरोसेमंद",
      "JANTA-BOL स्थानीय आवाज़, सत्यापित जानकारी और जिम्मेदार डिजिटल पत्रकारिता पर केंद्रित एक स्वतंत्र न्यूज़ प्लेटफ़ॉर्म है।"
    );
  });

  document.getElementById("citizen-news-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    openPreview(
      "📢 अपनी खबर भेजें",
      "जानकारी प्राप्त हुई",
      "यह V2 डेमो है। वास्तविक submission V3/Admin system से जोड़ा जाएगा। भेजी गई जानकारी को JANTA BOL द्वारा सत्यापित किया जाएगा।"
    );
  });

  const reporterModal = document.getElementById("reporter-modal");
  const closeReporter = reporterModal?.querySelector(".reporter-modal-close");

  function openReporter() {
    if (!reporterModal) return;
    reporterModal.classList.add("open");
    reporterModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeReporterModal() {
    if (!reporterModal) return;
    reporterModal.classList.remove("open");
    reporterModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";
  }

  document.querySelector(".official-reporter-open")?.addEventListener("click", openReporter);
  closeReporter?.addEventListener("click", closeReporterModal);

  reporterModal?.addEventListener("click", (e) => {
    if (e.target === reporterModal) closeReporterModal();
  });

  document.getElementById("official-reporter-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    closeReporterModal();
    openPreview(
      "🎙️ आधिकारिक रिपोर्टर आवेदन",
      "आवेदन प्राप्त हुआ",
      "यह V2 डेमो है। वास्तविक आवेदन, दस्तावेज़ और verification workflow V3/Admin system से जोड़ा जाएगा।"
    );
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reporterModal?.classList.contains("open")) {
      closeReporterModal();
    }
  });
})();