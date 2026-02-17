// lang.js — stable i18n + keep language + no double-click
(function () {
  // 防止同一页面重复加载 lang.js 导致绑定两次事件
  if (window.__SUPEREDU_LANG_INIT__) return;
  window.__SUPEREDU_LANG_INIT__ = true;

  const STORAGE_KEY = "superedu-lang";
  const VALID = new Set(["en", "zh"]);

  function getSavedLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : "en";
  }

  function applyLanguage(lang) {
    const L = VALID.has(lang) ? lang : "en";
    const isEN = L === "en";

    // 同步 html lang + body class（给你的中文字体 CSS 用）
    document.documentElement.lang = isEN ? "en" : "zh";
    if (document.body) document.body.classList.toggle("is-zh", !isEN);

    // ① 切换全站 data-en/data-zh 元素
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

    // ② 切换 id 结尾 -en / -zh（Education 专用）
    document.querySelectorAll("[id$='-en']").forEach((el) => {
      el.style.display = isEN ? "block" : "none";
    });
    document.querySelectorAll("[id$='-zh']").forEach((el) => {
      el.style.display = isEN ? "none" : "block";
    });

    // ③ 同步语言按钮文字（显示“切换到另一种语言”）
    const toggleBtn = document.getElementById("langToggle");
    if (toggleBtn) toggleBtn.textContent = isEN ? "中文" : "EN";
  }

  // ✅ 暴露给 menu.js / 其他脚本调用
  window.applyLanguage = applyLanguage;

  // —— 初始化：DOM 就绪后再做一次（避免菜单/组件后插入时漏翻译）
  document.addEventListener("DOMContentLoaded", () => {
    const saved = getSavedLang();
    applyLanguage(saved);

    // ④ 清空 textarea，保证 placeholder 正常显示
    document.querySelectorAll("textarea").forEach((t) => (t.value = ""));

    // ✅ 用事件委托绑定语言切换（不怕按钮被重渲染/替换）
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest && e.target.closest("#langToggle");
      if (!btn) return;

      const current = getSavedLang();
      const next = current === "en" ? "zh" : "en";
      localStorage.setItem(STORAGE_KEY, next);

      // 立刻切换
      applyLanguage(next);

      // ✅ 兜底：有些页面/脚本会在你点击后异步改菜单文字
      // 让它们改完后我们再把语言渲染回去，避免“要点两次”
      setTimeout(() => applyLanguage(next), 0);
      setTimeout(() => applyLanguage(next), 120);
    });
  });

  // 某些浏览器从 bfcache 返回页面时，DOMContentLoaded 不再触发：这里兜底一次
  window.addEventListener("pageshow", () => {
    applyLanguage(getSavedLang());
  });
})();
