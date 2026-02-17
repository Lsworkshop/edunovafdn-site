// lang.js — Stable i18n (data-en/data-zh) + expose applyLanguage
(function () {
  const STORAGE_KEY = "superedu-lang";

  function applyLanguage(lang) {
    const isEN = lang === "en";

    // ① 切换全站 data-en/data-zh 元素（菜单 & 通用）
    // 只处理同时存在 data-en 和 data-zh 的元素，避免误伤
    document.querySelectorAll("[data-en][data-zh]").forEach((el) => {
      // 对 input/textarea 的 placeholder 特殊处理
      if (
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        el.hasAttribute("placeholder")
      ) {
        el.placeholder = isEN ? el.dataset.en : el.dataset.zh;
      } else {
        el.textContent = isEN ? el.dataset.en : el.dataset.zh;
      }
    });

    // ② 切换正文中 id 结尾 -en / -zh 的元素（Education 专用）
    document.querySelectorAll("[id$='-en']").forEach((el) => {
      el.style.display = isEN ? "block" : "none";
    });
    document.querySelectorAll("[id$='-zh']").forEach((el) => {
      el.style.display = isEN ? "none" : "block";
    });

    // ③ 同步主菜单语言按钮文字
    const toggleBtn = document.getElementById("langToggle");
    if (toggleBtn) {
      toggleBtn.textContent = isEN ? "中文" : "EN";
    }

    // （可选但推荐）同步 html lang + body class，方便你用 CSS 做中文字体优化
    document.documentElement.lang = isEN ? "en" : "zh";
    document.body.classList.toggle("is-zh", !isEN);
  }

  // ✅ 关键：暴露给 menu.js / access.js 使用
  window.applyLanguage = applyLanguage;

  // 初始化页面语言（越早越好，但不放在 forEach 里面）
  const savedLang = localStorage.getItem(STORAGE_KEY) || "en";
  applyLanguage(savedLang);

  // 绑定主菜单语言按钮点击事件
  document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("langToggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const current = localStorage.getItem(STORAGE_KEY) || "en";
        const next = current === "en" ? "zh" : "en";
        localStorage.setItem(STORAGE_KEY, next);
        applyLanguage(next);
      });
    }

    // ④ 页面加载时清空表单 textarea 的 value，保证 placeholder 正常显示
    document.querySelectorAll("textarea").forEach((t) => (t.value = ""));
  });
})();
