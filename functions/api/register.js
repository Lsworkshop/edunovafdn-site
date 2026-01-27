export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const { firstName, lastName, email, referralCode } = data;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400 });
    }

    if (!firstName || !lastName || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
      });
    }

    const now = new Date().toISOString();

    // 插入 D1 数据库
    await env.DB.prepare(
      `INSERT INTO users (firstName, lastName, email, referralCode, createdAt)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(firstName, lastName, email, referralCode || null, now)
    .run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
}
