// menu.js — FINAL STABLE (no jitter, no logic change)
(function () {
  const nav = document.getElementById('topNav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const maxTransparent = 60;

  if (!nav) return;

  /* ===============================
     Mobile menu initial state
  =============================== */
  if (mobileMenu) {
    if (!mobileMenu.hasAttribute('aria-hidden')) {
      mobileMenu.setAttribute('aria-hidden', 'true');
    }

    const hidden = mobileMenu.getAttribute('aria-hidden') === 'true';
    mobileMenu.style.display = hidden ? 'none' : 'block';
    mobileMenu.style.opacity = hidden ? '0' : '1';
  }

  /* ===============================
     Hamburger toggle
  =============================== */
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.getAttribute('aria-hidden') === 'false';

      mobileMenu.setAttribute('aria-hidden', String(isOpen));
      mobileMenu.style.display = isOpen ? 'none' : 'block';
      mobileMenu.style.opacity = isOpen ? '0' : '1';

      hamburger.classList.toggle('open', !isOpen);

      if (isOpen) {
        mobileMenu.querySelectorAll('details').forEach(d => (d.open = false));
      }
    });
  }

  /* ===============================
     Close mobile menu on link click
  =============================== */
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        if (window.innerWidth >= 1024) return;

        e.preventDefault();
        const href = a.getAttribute('href');

        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.style.opacity = '0';
        hamburger && hamburger.classList.remove('open');

        mobileMenu.querySelectorAll('details').forEach(d => (d.open = false));

        setTimeout(() => {
          window.location.href = href;
        }, 120);
      });
    });
  }

  /* ===============================
     Scroll behavior (SAFE)
  =============================== */
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const y = window.scrollY || window.pageYOffset;

      if (y > maxTransparent) {
        nav.classList.remove('nav--transparent');
        nav.classList.add('nav--solid');
      } else {
        nav.classList.add('nav--transparent');
        nav.classList.remove('nav--solid');
      }

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll);

  // ⚠️ 延迟首次执行，避免首屏闪
  window.addEventListener('load', () => {
    onScroll();
  });

  /* ===============================
     Responsive padding + reset
  =============================== */
  function adjustForMobile() {
    const inner = document.querySelector('.nav-inner');
    if (!inner) return;

    if (window.innerWidth <= 720) {
      inner.style.padding = '12px 18px';
    } else {
      inner.style.padding = '14px 20px';

      if (mobileMenu) {
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.style.display = 'none';
        mobileMenu.style.opacity = '0';
        mobileMenu.querySelectorAll('details').forEach(d => (d.open = false));
      }
      hamburger && hamburger.classList.remove('open');
    }
  }

  window.addEventListener('resize', adjustForMobile);
  window.addEventListener('load', adjustForMobile);

  /* ===============================
     Brand text alignment
  =============================== */
  const brandText = document.querySelector('.brand-text');
  if (brandText) {
    brandText.style.transform = 'translateY(-2px)';
  }
})();

/* ===============================
   Mobile action buttons routing
=============================== */
document.addEventListener('DOMContentLoaded', () => {
  const mobileRegister = document.getElementById('mobileRegister');
  const mobileUnlock = document.getElementById('mobileUnlock');

  if (mobileRegister) {
    mobileRegister.addEventListener('click', () => {
      window.location.href = '/register.html';
    });
  }

  if (mobileUnlock) {
    mobileUnlock.addEventListener('click', () => {
      window.location.href = '/quick-unlock.html';
    });
  }
});

/* ===============================
   Anchor navigation (Desktop safe)
=============================== */
document.querySelectorAll('a[href^="/index.html#"], a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    const id = href.includes('#') ? href.split('#')[1] : null;
    const target = id && document.getElementById(id);

    if (target) {
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});

window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('nav-preload');
  });
});

async function syncAuthNav() {
  const desktopAuth = document.getElementById("navAuth");
  const mobileAuth = document.getElementById("mobileAuth");

  // 可选：Membership 改 Dashboard
  const desktopMembership = document.querySelector('a[href="/membership.html"]');
  const mobileMembership  = document.querySelector('#mobileMenu a[href="/membership.html"]');

  try {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();

    const loggedIn = res.ok && data && data.success;

    if (loggedIn) {
      // Login -> Logout
      if (desktopAuth) {
        desktopAuth.href = "/logout.html";
        desktopAuth.textContent = (localStorage.getItem("superedu-lang") === "zh") ? "退出" : "Logout";
        desktopAuth.dataset.en = "Logout";
        desktopAuth.dataset.zh = "退出";
      }
      if (mobileAuth) {
        mobileAuth.href = "/logout.html";
        mobileAuth.textContent = (localStorage.getItem("superedu-lang") === "zh") ? "退出" : "Logout";
        mobileAuth.dataset.en = "Logout";
        mobileAuth.dataset.zh = "退出";
      }

      // Membership -> Dashboard（如果你决定）
      if (desktopMembership) {
        desktopMembership.href = "/dashboard.html";
        desktopMembership.textContent = (localStorage.getItem("superedu-lang") === "zh") ? "会员主页" : "Dashboard";
        desktopMembership.dataset.en = "Dashboard";
        desktopMembership.dataset.zh = "会员主页";
      }
      if (mobileMembership) {
        mobileMembership.href = "/dashboard.html";
        mobileMembership.textContent = (localStorage.getItem("superedu-lang") === "zh") ? "会员主页" : "Dashboard";
        mobileMembership.dataset.en = "Dashboard";
        mobileMembership.dataset.zh = "会员主页";
      }

    } else {
      // 未登录：保持 Login
      // （可按需把 Dashboard/会员改回 Membership）
    }
  } catch (e) {
    // 网络/解析异常：不改变导航
  }
}

document.addEventListener("DOMContentLoaded", syncAuthNav);

/* =========================================================
   Touch Dropdown Support (iPad / touch devices)
   Add to the END of /assets/js/menu.js
========================================================= */
(function () {
  function closeAllDropdowns(exceptEl) {
    document.querySelectorAll(".nav-item.dropdown.open").forEach((dd) => {
      if (exceptEl && dd === exceptEl) return;
      dd.classList.remove("open");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll(".nav-item.dropdown");

    dropdowns.forEach((dd) => {
      const toggle = dd.querySelector(".dropdown-toggle");
      if (!toggle) return;

      // Make sure it's focusable (you already have tabindex="0")
      toggle.addEventListener("click", (e) => {
        // On touch devices, click should toggle the dropdown.
        // Prevent accidental text selection / weird focus behavior.
        e.preventDefault();
        e.stopPropagation();

        const isOpen = dd.classList.contains("open");
        closeAllDropdowns(dd);
        dd.classList.toggle("open", !isOpen);
      });

      // Keyboard support (Enter / Space)
      toggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const isOpen = dd.classList.contains("open");
          closeAllDropdowns(dd);
          dd.classList.toggle("open", !isOpen);
        }
        if (e.key === "Escape") {
          dd.classList.remove("open");
        }
      });

      // Clicking items should close dropdown
      dd.querySelectorAll(".dropdown-menu a").forEach((a) => {
        a.addEventListener("click", () => dd.classList.remove("open"));
      });
    });

    // Click outside closes
    document.addEventListener("click", () => closeAllDropdowns());

    // Scroll / resize closes (prevents “stuck open”)
    window.addEventListener("scroll", () => closeAllDropdowns(), { passive: true });
    window.addEventListener("resize", () => closeAllDropdowns());
  });
})();