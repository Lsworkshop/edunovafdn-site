// lang.js — FINAL STABLE (persist + one-click toggle + auto re-apply after nav updates)
(function () {
  if (window.__SUPEREDU_LANG_INIT__) return;
  window.__SUPEREDU_LANG_INIT__ = true;

  const STORAGE_KEY = "superedu-lang";
  const VALID = new Set(["en", "zh"]);

  function getLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : "en";
  }

  function setLang(v) {
    const lang = VALID.has(v) ? v : "en";
    localStorage.setItem(STORAGE_KEY, lang);
    return lang;
  }

  function applyLanguage(lang) {
    const L = VALID.has(lang) ? lang : getLang();
    const isEN = L === "en";

    // 同步 html lang + body class（供你的中文字体 CSS 使用）
    document.documentElement.lang = isEN ? "en" : "zh";
    if (document.body) document.body.classList.toggle("is-zh", !isEN);

    // ① 切换 data-en/data-zh
    document.querySelectorAll("[data-en][data-zh]").forEach((el) => {
      if (
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        el.hasAttribute("placeholder")
      ) {
        el.placeholder = isEN ? el.dataset.en : el.dataset.zh;
      } else {
        el.textContent = isEN ? el.dataset.en : el.dataset.zh;
      }
    });

    // ② 切换 -en/-zh 内容块
    document.querySelectorAll("[id$='-en']").forEach((el) => {
      el.style.display = isEN ? "block" : "none";
    });
    document.querySelectorAll("[id$='-zh']").forEach((el) => {
      el.style.display = isEN ? "none" : "block";
    });

    // ③ 同步按钮文字
    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = isEN ? "中文" : "EN";
  }

  // 暴露给 menu.js 等使用
  window.applyLanguage = applyLanguage;

  // --- 初始化（不依赖脚本顺序）
  function initApply() {
    applyLanguage(getLang());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApply);
  } else {
    initApply();
  }

  // --- 一次点击必生效：捕获阶段拦截 langToggle 点击
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target && e.target.closest && e.target.closest("#langToggle");
      if (!btn) return;

      // 关键：避免被 mobile menu / dropdown 等 click 逻辑抢走
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const next = getLang() === "en" ? "zh" : "en";
      setLang(next);
      applyLanguage(next);
    },
    true // ✅ capture
  );

  // --- 兜底：如果 nav/menu 被后续脚本重绘，自动重新应用语言（解决“要点两次”）
  function watchAndReapply(selector) {
    const root = document.querySelector(selector);
    if (!root) return null;

    let raf = 0;
    const obs = new MutationObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => applyLanguage(getLang()));
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    return obs;
  }

  // 重点盯住菜单区域（按你项目常见 id）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      watchAndReapply("#topNav");
      watchAndReapply("#mobileMenu");
    });
  } else {
    watchAndReapply("#topNav");
    watchAndReapply("#mobileMenu");
  }

  // bfcache 返回也保持语言
  window.addEventListener("pageshow", () => applyLanguage(getLang()));
})();
