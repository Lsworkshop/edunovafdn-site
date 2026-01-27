/* =====================================================
   Auth Nav Switch — FINAL (match your IDs)
   IDs:
   - Desktop auth:  #desktopAuth
   - Mobile auth:   #mobileAuth
   - Desktop member:#navMembership
   - Mobile member: #mobileMembership
===================================================== */

(function () {
  async function isLoggedIn() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      return !!(res.ok && data && data.success);
    } catch {
      return false;
    }
  }

  async function logoutAndRedirect() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      }).catch(() => { /* ignore */ });

      // 清理前端本地角色（避免 access.js 误判）
      localStorage.removeItem("snovaRole");
      sessionStorage.removeItem("snovaRole");

      // 兼容你旧的 demo 存储（如仍存在）
      localStorage.removeItem("snovaAuth");
      localStorage.removeItem("snovaUserEmail");

      // 用 replace 防回退回到已登录页面
      window.location.replace("/login.html");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout error. Please try again.");
    }
  }

  function setAuthAnchor(el, loggedIn) {
    if (!el) return;

    // 移除之前可能绑定过的 onclick（避免重复绑定）
    el.onclick = null;

    if (loggedIn) {
      el.dataset.en = "Logout";
      el.dataset.zh = "退出";
      el.textContent = "Logout";

      // 点击直接退出（不再依赖 /logout.html）
      el.href = "#";
      el.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          logoutAndRedirect();
        },
        { once: true }
      );
    } else {
      el.dataset.en = "Login";
      el.dataset.zh = "登录";
      el.textContent = "Login";
      el.href = "/login.html";
    }
  }

  function setMembershipAnchor(el, loggedIn) {
    if (!el) return;

    if (loggedIn) {
      el.href = "/dashboard.html";
      el.dataset.en = "Dashboard";
      el.dataset.zh = "会员中心";
      el.textContent = "Dashboard";
    } else {
      el.href = "/membership.html";
      el.dataset.en = "Membership";
      el.dataset.zh = "会员中心";
      el.textContent = "Membership";
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const loggedIn = await isLoggedIn();

    // ✅ Auth links (your actual IDs)
    setAuthAnchor(document.getElementById("desktopAuth"), loggedIn);
    setAuthAnchor(document.getElementById("mobileAuth"), loggedIn);

    // ✅ Membership links (your IDs)
    setMembershipAnchor(document.getElementById("navMembership"), loggedIn);
    setMembershipAnchor(document.getElementById("mobileMembership"), loggedIn);

    // 如果你的 lang.js 提供 applyLanguage，就让它重新渲染一遍
    if (typeof window.applyLanguage === "function") window.applyLanguage();
  });
})();
