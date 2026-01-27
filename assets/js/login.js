/**
 * login.js
 * 共用于 login.html / welcome.html
 * 负责：
 * 1. 提交登录请求
 * 2. 处理错误提示
 * 3. 登录成功后跳转 dashboard.html
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return; // 页面没有登录表单则直接退出

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("loginError");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (errorBox) errorBox.textContent = "";

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // ⭐ 关键：接收 session cookie
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Login failed.");
        return;
      }

      // ✅ 登录成功
      window.location.href = "/dashboard.html";

    } catch (err) {
      console.error("Login error:", err);
      showError("Network error. Please try again.");
    }
  });

  function showError(message) {
    const errorBox = document.getElementById("loginError");
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    } else {
      alert(message);
    }
  }
});
