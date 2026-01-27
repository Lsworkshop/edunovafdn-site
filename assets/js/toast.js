/* =====================================================
   SuperEdu Toast — Unified (White Card + Progress Bar)
   - Backward compatible:
     showToast("Hello", "success", {duration: 3000})
   - New object API:
     showToast({ key, en, zh, type, duration, position, ... })
===================================================== */
(function () {
  const DEFAULTS = {
    duration: 3200,        // desktop default
    mobileDuration: 5200,  // mobile default (longer to read)
    position: "top-center", // "top-center" | "top-right" | "bottom-center"
    maxWidth: 520,
    closable: true,
  };

  // Built-in bilingual dictionary (extend anytime)
  const DICT = {
    required: {
      en: "Please fill all required fields.",
      zh: "请填写所有必填项。",
    },
    email_invalid: {
      en: "Please enter a valid email address.",
      zh: "请输入正确的邮箱地址。",
    },
    submitting: {
      en: "Submitting…",
      zh: "提交中…",
    },
    failed_try_again: {
      en: "Submission failed — please try again.",
      zh: "提交失败，请重试。",
    },
    unlock_required: {
      en: "Please unlock access first.",
      zh: "请先解锁权限。",
    },
    login_required: {
      en: "Please log in first.",
      zh: "请先登录。",
    },
  };

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
  }

  function getLang() {
    const ls = (localStorage.getItem("superedu-lang") || "").toLowerCase();
    if (ls === "zh" || ls === "en") return ls;
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("zh")) return "zh";
    return "en";
  }

  function ensureRoot(position) {
    const id = "superedu-toast-root";
    let root = document.getElementById(id);

    if (!root) {
      root = document.createElement("div");
      root.id = id;
      document.body.appendChild(root);
    }

    root.style.position = "fixed";
    root.style.zIndex = "99999";
    root.style.pointerEvents = "none";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.gap = "10px";
    root.style.padding = "12px";
    root.style.width = "100%";
    root.style.boxSizing = "border-box";
    root.style.alignItems = "center";

    if (position === "top-right") {
      root.style.top = "12px";
      root.style.right = "12px";
      root.style.left = "auto";
      root.style.bottom = "auto";
      root.style.alignItems = "flex-end";
      root.style.width = "auto";
      root.style.maxWidth = "calc(100vw - 24px)";
    } else if (position === "bottom-center") {
      root.style.bottom = "12px";
      root.style.left = "0";
      root.style.right = "0";
      root.style.top = "auto";
      root.style.alignItems = "center";
    } else {
      root.style.top = "12px";
      root.style.left = "0";
      root.style.right = "0";
      root.style.bottom = "auto";
      root.style.alignItems = "center";
    }

    return root;
  }

  function iconFor(type) {
    if (type === "success") return "✅";
    if (type === "error") return "⛔";
    if (type === "warning") return "⚠️";
    return "ℹ️";
  }

  function accentColor(type) {
    if (type === "success") return "#22c55e";
    if (type === "error") return "#ef4444";
    if (type === "warning") return "#f59e0b";
    return "#3b82f6";
  }

  function makeToastEl(textMessage, type, opts) {
    const wrap = document.createElement("div");
    wrap.className = "superedu-toast";
    wrap.style.pointerEvents = "auto";
    wrap.style.width =
      "min(" +
      (opts.maxWidth || DEFAULTS.maxWidth) +
      "px, calc(100vw - 24px))";
    wrap.style.background = "rgba(255,255,255,0.92)";
    wrap.style.backdropFilter = "blur(10px)";
    wrap.style.border = "1px solid rgba(0,0,0,0.08)";
    wrap.style.borderRadius = "14px";
    wrap.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.12)";
    wrap.style.overflow = "hidden";

    wrap.style.transform = "translateY(-6px)";
    wrap.style.opacity = "0";
    wrap.style.transition = "transform 180ms ease, opacity 180ms ease";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "flex-start";
    row.style.gap = "10px";
    row.style.padding = "12px 12px 10px";

    const icon = document.createElement("div");
    icon.textContent = iconFor(type);
    icon.style.flex = "0 0 auto";
    icon.style.width = "28px";
    icon.style.height = "28px";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.style.borderRadius = "10px";
    icon.style.background = "rgba(0,0,0,0.04)";

    const text = document.createElement("div");
    text.style.flex = "1";
    text.style.fontSize = "14.5px";
    text.style.lineHeight = "1.4";
    text.style.color = "#111827";
    text.style.wordBreak = "break-word";
    text.textContent = String(textMessage || "");

    row.appendChild(icon);
    row.appendChild(text);

    if (opts.closable !== false) {
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close");
      close.style.marginLeft = "6px";
      close.style.flex = "0 0 auto";
      close.style.border = "0";
      close.style.background = "transparent";
      close.style.cursor = "pointer";
      close.style.fontSize = "18px";
      close.style.lineHeight = "18px";
      close.style.color = "rgba(17,24,39,0.55)";
      close.style.padding = "4px 8px";
      close.style.borderRadius = "10px";
      close.addEventListener("mouseenter", () => {
        close.style.background = "rgba(0,0,0,0.06)";
        close.style.color = "rgba(17,24,39,0.85)";
      });
      close.addEventListener("mouseleave", () => {
        close.style.background = "transparent";
        close.style.color = "rgba(17,24,39,0.55)";
      });
      row.appendChild(close);
      wrap.__closeBtn = close;
    }

    const bar = document.createElement("div");
    bar.style.height = "3px";
    bar.style.background = "rgba(0,0,0,0.06)";
    bar.style.position = "relative";

    const barFill = document.createElement("div");
    barFill.style.height = "100%";
    barFill.style.width = "100%";
    barFill.style.background = accentColor(type);
    barFill.style.transformOrigin = "left";
    barFill.style.transform = "scaleX(1)";
    barFill.style.transition = "transform linear";
    bar.appendChild(barFill);

    wrap.appendChild(row);
    wrap.appendChild(bar);

    wrap.__barFill = barFill;

    return wrap;
  }

  // Normalize all inputs into a final { text, type, options }
  function normalizeArgs(messageOrObj, type, options) {
    const lang = getLang();

    // New object API: showToast({ key/en/zh/type/duration/... })
    if (messageOrObj && typeof messageOrObj === "object") {
      const obj = messageOrObj || {};
      const finalType = obj.type || type || "info";
      const finalOptions = { ...(options || {}), ...(obj.options || {}), ...obj };

      // Determine final text
      let text = "";

      // 1) key lookup
      if (obj.key && DICT[obj.key]) {
        text = DICT[obj.key][lang] || DICT[obj.key].en || "";
      }

      // 2) en/zh explicit
      if (!text) {
        if (lang === "zh" && obj.zh) text = obj.zh;
        else if (lang === "en" && obj.en) text = obj.en;
        else text = obj.en || obj.zh || "";
      }

      // 3) fallback
      if (!text) text = "";

      // Remove non-option props that could clash
      delete finalOptions.en;
      delete finalOptions.zh;
      delete finalOptions.key;
      delete finalOptions.type;

      return { text, finalType, finalOptions };
    }

    // Old API: showToast("text", "success", { ... })
    return {
      text: String(messageOrObj ?? ""),
      finalType: type || "info",
      finalOptions: options || {},
    };
  }

  function showToast(messageOrObj, type = "info", options = {}) {
    const optsMerged = { ...DEFAULTS };
    const { text, finalType, finalOptions } = normalizeArgs(messageOrObj, type, options);

    const opts = { ...optsMerged, ...(finalOptions || {}) };

    const explicitDuration = typeof finalOptions?.duration === "number";
    const duration = explicitDuration
      ? finalOptions.duration
      : (isMobile() ? opts.mobileDuration : opts.duration);

    const root = ensureRoot(opts.position);
    const toast = makeToastEl(text, finalType, opts);

    root.appendChild(toast);

    let closed = false;
    let timerId = null;

    const close = () => {
      if (closed) return;
      closed = true;
      if (timerId) clearTimeout(timerId);

      toast.style.opacity = "0";
      toast.style.transform = "translateY(-6px)";
      setTimeout(() => toast.remove(), 180);
    };

    if (toast.__closeBtn) toast.__closeBtn.addEventListener("click", close);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    if (toast.__barFill) {
      toast.__barFill.style.transitionDuration = duration + "ms";
      requestAnimationFrame(() => {
        toast.__barFill.style.transform = "scaleX(0)";
      });
    }

    timerId = setTimeout(close, duration);

    // nice-to-have: pause on hover (desktop)
    toast.addEventListener("mouseenter", () => {
      if (timerId) clearTimeout(timerId);
      if (toast.__barFill) {
        // freeze at current state
        const computed = getComputedStyle(toast.__barFill).transform;
        toast.__barFill.style.transitionDuration = "0ms";
        toast.__barFill.style.transform = computed === "none" ? "scaleX(1)" : computed;
      }
    });

    toast.addEventListener("mouseleave", () => {
      // keep it simple: give user a bit more time after hover
      if (!closed) timerId = setTimeout(close, 900);
      if (toast.__barFill) {
        toast.__barFill.style.transitionDuration = "900ms";
        toast.__barFill.style.transform = "scaleX(0)";
      }
    });

    return { close };
  }

  // expose
  window.showToast = showToast;

  // optional: allow extending dictionary in future
  window.showToastDict = function (patch) {
    if (!patch || typeof patch !== "object") return;
    Object.keys(patch).forEach((k) => {
      DICT[k] = { ...(DICT[k] || {}), ...(patch[k] || {}) };
    });
  };
})();
