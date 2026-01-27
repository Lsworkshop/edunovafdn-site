/* =========================
   Logout API
========================= */

export async function onRequestPost({ request, env }) {
  try {
    // 解析 cookie
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [key, ...v] = c.trim().split("=");
        return [key, decodeURIComponent(v.join("="))];
      })
    );
    const sessionToken = cookies.session;

    // 删除 session 数据库记录（可选，但推荐）
    if (sessionToken) {
      await env.DB.prepare(`
        DELETE FROM sessions
        WHERE token = ?
      `).bind(sessionToken).run();
    }

    // 清除浏览器 cookie
    const clearCookie = [
      "session=;",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      "Max-Age=0"
    ].join("; ");

    return new Response(
      JSON.stringify({ success: true, message: "Logged out successfully." }),
      {
        status: 200,
        headers: {
          "Set-Cookie": clearCookie,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Logout API Error:", err);
    return new Response(
      JSON.stringify({ error: "Logout failed." }),
      { status: 500 }
    );
  }
}
