export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      services,
      notes
    } = data;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400 });
    }

    if (!firstName || !lastName || !email || !services) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing fields"
      }), { status: 400 });
    }

    await env.DB.prepare(
      `INSERT INTO applications
       (first_Name, last_Name, email, phone, country, services, notes, created_At)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        firstName,
        lastName,
        email,
        phone || "",
        country || "",
        JSON.stringify(services),
        notes || ""
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), { status: 500 });
  }
}
