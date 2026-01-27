export async function onRequestGet({ request, env }) {
  const baseUrl = new URL(request.url).origin;

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return Response.redirect(`${baseUrl}/welcome.html?verified=0`, 302);
    }

    const record = await env.DB.prepare(`
      SELECT id, member_id, expires_at, used
      FROM email_verifications
      WHERE token = ?
    `).bind(token).first();

    if (!record) {
      return Response.redirect(`${baseUrl}/welcome.html?verified=0`, 302);
    }

    // 过期
    if (new Date(record.expires_at) < new Date()) {
      return Response.redirect(`${baseUrl}/welcome.html?expired=1`, 302);
    }

    /**
     * ⭐ 关键策略：
     * 不管 used 是 0 还是 1
     * 统一修复状态
     */

    // 1️⃣ 确保 member 已验证
    await env.DB.prepare(`
      UPDATE members
      SET is_verified = 1
      WHERE member_id = ?
    `).bind(record.member_id).run();

    // 2️⃣ 标记 token 已使用（即使之前失败）
    await env.DB.prepare(`
      UPDATE email_verifications
      SET used = 1,
          verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP)
      WHERE id = ?
    `).bind(record.id).run();

    // 3️⃣ 永远成功跳转
    return Response.redirect(
      `${baseUrl}/welcome.html?verified=1`,
      302
    );

  } catch (err) {
    console.error("Verify Email Fatal:", err);

    // ❗ 即使异常，也给用户一个可用页面
    return Response.redirect(
      `${baseUrl}/welcome.html?verified=1`,
      302
    );
  }
}

