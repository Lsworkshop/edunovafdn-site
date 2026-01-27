/* =====================================================
   SnovaEdu Unified Access Control — TOAST + AUTH SYNC
   Effective roles:
   - visitor
   - quick   (Quick Unlock)
   - lead    (Join List / Express Interest)
   - member  (Logged-in Member via cookie /api/me)
===================================================== */

(function () {
  document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       i18n (toast)
    =============================== */
    function getLang() {
      return localStorage.getItem("superedu-lang") || localStorage.getItem("snova-lang") || "en";
    }
    function t(key) {
      const lang = getLang();
      const dict = {
        accessRequired: { en: "Access required", zh: "需要权限" },
        quickNeed: { en: "Please unlock EduCenter first.", zh: "请先完成 Quick Unlock 才能进入 EduCenter。" },
        leadNeed: { en: "EduCommunity requires Join List access.", zh: "EduCommunity 需要 Join List 权限。" },
        memberNeed: { en: "Members only. Please log in.", zh: "仅限会员。请先登录。" }
      };
      return (dict[key] && dict[key][lang]) || (dict[key] && dict[key].en) || key;
    }

    /* ===============================
       1) Role storage helpers
    =============================== */
    function getStoredRole() {
      return (
        localStorage.getItem("snovaRole") ||
        sessionStorage.getItem("snovaRole") ||
        "visitor"
      );
    }

    function setRole(role, persistent = true) {
      if (persistent) {
        localStorage.setItem("snovaRole", role);
        sessionStorage.removeItem("snovaRole");
      } else {
        sessionStorage.setItem("snovaRole", role);
      }
    }

    function clearRole() {
      localStorage.removeItem("snovaRole");
      sessionStorage.removeItem("snovaRole");
    }

    /* ===============================
       2) Detect REAL login (cookie)
       - If logged in, treat as member
       - And sync snovaRole -> member
    =============================== */
    async function isLoggedInByCookie() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        return !!(res.ok && data && data.success);
      } catch {
        return false;
      }
    }

    // Role priority helper
    function maxRole(a, b) {
      const rank = { visitor: 0, quick: 1, lead: 2, member: 3 };
      return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b;
    }

    // Main init async (so page guard uses effective role)
    (async function initAccess() {
      let role = getStoredRole();

      const loggedIn = await isLoggedInByCookie();
      if (loggedIn) {
        // logged-in member should always be highest
        role = maxRole(role, "member");

        // ✅ sync once so other pages (education/community) stop redirecting
        if (getStoredRole() !== "member") {
          setRole("member", true);
        }
      }

      const isQuick  = ["quick", "lead", "member"].includes(role);
      const isLead   = ["lead", "member"].includes(role);
      const isMember = role === "member";

      /* ===============================
         3) Page Guard (redirect only for direct page access)
      =============================== */
      const pageType = document.body?.dataset?.page;

      if (pageType) {
        if (pageType === "quick-required" && !isQuick) {
          window.location.replace("/quick-unlock.html");
          return;
        }

        if (pageType === "lead-required" && !isLead) {
          window.location.replace("/education.html");
          return;
        }

        if ((pageType === "member-only" || pageType === "forum-required") && !isMember) {
          window.location.replace("/login.html");
          return;
        }
      }

      /* ===============================
         4) Toast UI
      =============================== */
      function ensureToastStyles() {
        if (document.getElementById("snovaToastStyles")) return;

        const style = document.createElement("style");
        style.id = "snovaToastStyles";
        style.textContent = `
          #snovaToastHost{
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            bottom: 20px;
            z-index: 9999;
            width: min(520px, calc(100vw - 24px));
            pointer-events: none;
          }
          .snova-toast{
            pointer-events: auto;
            display: grid;
            grid-template-columns: 40px 1fr 32px;
            gap: 12px;
            align-items: start;
            background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
            border: 1px solid rgba(59,130,246,.18);
            border-radius: 16px;
            padding: 12px 12px 10px;
            box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
            animation: snovaToastIn 180ms ease-out;
            overflow: hidden;
          }
          .snova-toast--warn{ border-color: rgba(245,158,11,.22); }
          .snova-toast__icon{
            width: 40px; height: 40px;
            border-radius: 12px;
            display:flex; align-items:center; justify-content:center;
            background: rgba(245,158,11,.12);
            font-size: 18px;
          }
          .snova-toast__title{
            margin: 2px 0 2px;
            font-weight: 700;
            font-size: 14px;
            color: #111827;
          }
          .snova-toast__msg{
            margin: 0;
            font-size: 13px;
            color: rgba(17,24,39,.78);
            line-height: 1.4;
          }
          .snova-toast__close{
            appearance:none;
            border:none;
            background: transparent;
            color: rgba(17,24,39,.55);
            font-size: 16px;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 10px;
          }
          .snova-toast__close:hover{ background: rgba(17,24,39,.06); }
          .snova-toast__bar{
            grid-column: 1 / -1;
            height: 3px;
            background: rgba(99,102,241,.14);
            border-radius: 999px;
            overflow: hidden;
            margin-top: 8px;
          }
          .snova-toast__bar i{
            display:block;
            height:100%;
            width:100%;
            transform-origin: left;
            background: linear-gradient(90deg,#3b82f6,#8b5cf6);
            animation: snovaToastBar linear forwards;
          }
          @keyframes snovaToastIn{
            from{ transform: translateY(8px); opacity: 0; }
            to{ transform: translateY(0); opacity: 1; }
          }
          @keyframes snovaToastOut{
            from{ transform: translateY(0); opacity: 1; }
            to{ transform: translateY(8px); opacity: 0; }
          }
          @keyframes snovaToastBar{
            from{ transform: scaleX(1); }
            to{ transform: scaleX(0); }
          }
          @media (max-width: 640px){
            #snovaToastHost{ bottom: 16px; }
            .snova-toast{ grid-template-columns: 36px 1fr 30px; border-radius: 14px; }
            .snova-toast__icon{ width: 36px; height: 36px; }
          }
        `;
        document.head.appendChild(style);

        const host = document.createElement("div");
        host.id = "snovaToastHost";
        document.body.appendChild(host);
      }

      function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;",
          '"': "&quot;", "'": "&#039;"
        }[m]));
      }

      function showToast(message, opts = {}) {
        ensureToastStyles();

        const isMobile =
          (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) ||
          window.innerWidth <= 640;

        const duration = opts.duration ?? (isMobile ? 9000 : 3600);
        const barDuration = Math.max(2500, Math.min(15000, duration));

        const host = document.getElementById("snovaToastHost");
        if (!host) return;

        const toast = document.createElement("div");
        toast.className = "snova-toast snova-toast--warn";
        toast.innerHTML = `
          <div class="snova-toast__icon" aria-hidden="true">🔒</div>
          <div>
            <p class="snova-toast__title">${escapeHtml(t("accessRequired"))}</p>
            <p class="snova-toast__msg">${escapeHtml(message)}</p>
          </div>
          <button class="snova-toast__close" aria-label="Close">✕</button>
          <div class="snova-toast__bar" aria-hidden="true"><i style="animation-duration:${barDuration}ms"></i></div>
        `;

        const closeBtn = toast.querySelector(".snova-toast__close");

        const remove = () => {
          toast.style.animation = "snovaToastOut 180ms ease forwards";
          setTimeout(() => toast.remove(), 200);
        };

        closeBtn?.addEventListener("click", remove);
        host.appendChild(toast);
        setTimeout(remove, barDuration);
      }

      /* ===============================
         5) Navigation Control (deny => toast only)
         capture=true + stopImmediatePropagation => mobile safe
      =============================== */
      function guardNav(id, allowFn, denyKey) {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener("click", (e) => {
          if (allowFn()) return;

          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

          showToast(t(denyKey));
          return false;
        }, true);
      }

      // EduCenter
      guardNav("navEduCenter", () => isQuick, "quickNeed");
      guardNav("mobileEduCenter", () => isQuick, "quickNeed");

      // EduCommunity
      guardNav("navEduCommunity", () => isLead, "leadNeed");
      guardNav("mobileEduCommunity", () => isLead, "leadNeed");

      // EduForum (Members only)
      guardNav("navForum", () => isMember, "memberNeed");
      guardNav("mobileForum", () => isMember, "memberNeed");

      /* ===============================
         6) Upgrade APIs
      =============================== */
      window.unlockQuick = function (redirect = "/education.html") {
        setRole("quick");
        window.location.replace(redirect);
      };

      window.upgradeToLead = function (redirect = "/education.html") {
        setRole("lead");
        window.location.replace(redirect);
      };

      window.upgradeToMember = function (redirect = "/education.html") {
        setRole("member");
        window.location.replace(redirect);
      };

      window.logoutMember = function () {
        clearRole();
        window.location.replace("/");
      };
    })();
  });
})();
