export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      gradYear,
      message,
      source
    } = data;

    // Email 格式校验（与你的 apply.js 一致）
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400 }
      );
    }

    // 必填字段校验
    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing fields"
        }),
        { status: 400 }
      );
    }

    // D1 插入（显式写 created_at）
    await env.DB.prepare(
      `INSERT INTO consultations
       (first_name, last_name, email, phone, grad_year, message, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        firstName,
        lastName,
        email,
        phone || "",
        gradYear || "",
        message || "",
        source || "homepage"
      )
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
      }),
      { status: 500 }
    );
  }
}
