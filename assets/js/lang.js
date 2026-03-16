// lang.js — FINAL STABLE (Enhanced with Dynamic Component Support)
(function () {
  if (window.__SUPEREDU_LANG_INIT__) return;
  window.__SUPEREDU_LANG_INIT__ = true;

  const STORAGE_KEY = "superedu-lang";
  const VALID = new Set(["en", "zh"]);

  // --- 内部获取语言工具 ---
  function getLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : "en";
  }

  function setLang(v) {
    const lang = VALID.has(v) ? v : "en";
    localStorage.setItem(STORAGE_KEY, lang);
    return lang;
  }

  /**
   * 核心：应用语言函数
   * @param {string} lang - 目标语言 ('en' 或 'zh')
   */
  function applyLanguage(lang) {
    const L = VALID.has(lang) ? lang : getLang();
    const isEN = L === "en";

    // 1. 同步 html lang + body class
    document.documentElement.lang = isEN ? "en" : "zh";
    if (document.body) {
      document.body.classList.toggle("is-zh", !isEN);
    }

    // 2. 切换静态 data-en/data-zh 属性
    document.querySelectorAll("[data-en][data-zh]").forEach((el) => {
      // 处理输入框的 Placeholder
      if (
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        el.hasAttribute("placeholder")
      ) {
        el.placeholder = isEN ? el.dataset.en : el.dataset.zh;
      } else {
        // 处理普通文本内容
        el.textContent = isEN ? el.dataset.en : el.dataset.zh;
      }
    });

    // 3. 切换带特定 ID 后缀的内容块
    document.querySelectorAll("[id$='-en']").forEach((el) => {
      el.style.display = isEN ? "block" : "none";
    });
    document.querySelectorAll("[id$='-zh']").forEach((el) => {
      el.style.display = isEN ? "none" : "block";
    });

    // 4. 同步切换按钮本身的文字
    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = isEN ? "中文" : "EN";

    // ==========================================================
    // ⭐ 新增核心逻辑：联动动态生成的组件 (如 S1-S4)
    // ==========================================================
    
    // 如果页面中定义了 renderServices 函数（负责渲染 S1-S4），则立即调用它
    if (typeof window.renderServices === "function") {
      window.renderServices();
    }
    
    // 如果页面有邮箱验证提示等其他需要刷新的函数
    if (typeof window.updateEmailHint === "function") {
      window.updateEmailHint();
    }
  }

  // 将核心函数暴露给全局，方便其他脚本调用
  window.applyLanguage = applyLanguage;
  window.getCurrentLang = getLang; // 新增：方便 renderServices 内部获取最新语言

  // --- 初始化流程 ---
  function initApply() {
    applyLanguage(getLang());
  }

  // 确保在 DOM 加载后立即执行一次渲染
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApply);
  } else {
    initApply();
  }

  // --- 事件拦截：语言切换按钮点击 ---
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target && e.target.closest && e.target.closest("#langToggle");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const next = getLang() === "en" ? "zh" : "en";
      setLang(next);
      applyLanguage(next);
    },
    true // 使用捕获阶段确保响应优先
  );

  // --- 自动监听：解决导航栏、移动菜单异步加载导致的语言不统一 ---
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

  document.addEventListener("DOMContentLoaded", () => {
    watchAndReapply("#topNav");
    watchAndReapply("#mobileMenu");
  });

  // 处理浏览器后退 (bfcache) 导致的页面状态不一致
  window.addEventListener("pageshow", () => applyLanguage(getLang()));
})();
