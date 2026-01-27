(function () {
  const STORAGE_KEY = "superedu-lang";

  function applyLanguage(lang) {
    const isEN = lang === "en";

    // ① 切换全站 data-en/data-zh 元素（菜单 & 通用）
    document.querySelectorAll("[data-en]").forEach(el => {
      // 对 input/textarea placeholder 特殊处理
      if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.hasAttribute("placeholder")) {
        el.placeholder = isEN ? el.dataset.en : el.dataset.zh;
      } else {
        el.textContent = isEN ? el.dataset.en : el.dataset.zh;
      }
    });

    // ② 切换正文中 id 结尾 -en / -zh 的元素（Education 专用）
    document.querySelectorAll("[id$='-en']").forEach(el => {
      el.style.display = isEN ? "block" : "none";
    });
    document.querySelectorAll("[id$='-zh']").forEach(el => {
      el.style.display = isEN ? "none" : "block";
    });

    // ③ 同步主菜单语言按钮文字
    const toggleBtn = document.getElementById("langToggle");
    if (toggleBtn) {
      toggleBtn.textContent = isEN ? "中文" : "EN";
    }
  }

  // 初始化页面语言
  const savedLang = localStorage.getItem(STORAGE_KEY) || "en";
  applyLanguage(savedLang);

  // 绑定主菜单语言按钮点击事件
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
  document.addEventListener("DOMContentLoaded", () => {
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(t => t.value = '');
  });

})();

