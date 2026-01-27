/* =========================
   Get Current Member (/api/me)
   登录保护 API
========================= */
export async function onRequestGet({ request, env }) {
  try {
    // 1️⃣ 获取 Cookie
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [k, v] = c.trim().split("=");
        return [k, v];
      })
    );

    const sessionToken = cookies.session;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "Not authenticated." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ 查找 Session
    const session = await env.DB.prepare(`
      SELECT member_id, expires_at
      FROM sessions
      WHERE token = ?
    `).bind(sessionToken).first();

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3️⃣ 检查过期
    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Session expired." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4️⃣ 查找 Member 信息
    const member = await env.DB.prepare(`
      SELECT member_id, first_name, last_name, email, role, status, is_verified, last_login_at
      FROM members
      WHERE member_id = ?
    `).bind(session.member_id).first();

    if (!member) {
      return new Response(
        JSON.stringify({ error: "Member not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5️⃣ 返回会员信息
    return new Response(
      JSON.stringify({
        success: true,
        member: {
          member_id: member.member_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          role: member.role,
          status: member.status,
          is_verified: member.is_verified,
          last_login_at: member.last_login_at
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("API /me Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch member info." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
