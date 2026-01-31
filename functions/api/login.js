/* ========================= 
   Password Hash (Web Crypto)
========================= */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* =========================
   Helpers
========================= */

// Generate secure session token
function generateSessionToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// Cookie builder
function buildSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 7) {
  return [
    `session=${token}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Path=/`,
    `Domain=edunovafdn.org`,  // ⚡ 指定域名
    `Max-Age=${maxAgeSeconds}`
  ].join("; ");
}

/* =========================
   Login API
========================= */
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { email, password } = body;

    /* ---------- Required ---------- */
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required." }),
        { status: 400 }
      );
    }

    // ✅ 仅新增：统一 email 为小写再查询（不改任何其他逻辑）
    const normalizedEmail = String(email).trim().toLowerCase();

    /* ---------- Find Member ---------- */
    const member = await env.DB.prepare(`
      SELECT
        member_id,
        email,
        password_hash,
        is_verified,
        status
      FROM members
      WHERE email = ?
    `).bind(normalizedEmail).first();

    if (!member) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password." }),
        { status: 401 }
      );
    }

    /* ---------- Status Check ---------- */
    if (member.status !== "active") {
      return new Response(
        JSON.stringify({ error: "This account is inactive." }),
        { status: 403 }
      );
    }

    if (member.is_verified !== 1) {
      return new Response(
        JSON.stringify({ error: "Please verify your email before logging in." }),
        { status: 403 }
      );
    }

    /* ---------- Password Verify ---------- */
    const password_hash = await hashPassword(password);

    if (password_hash !== member.password_hash) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password." }),
        { status: 401 }
      );
    }

    /* ---------- Create Session ---------- */
    const session_token = generateSessionToken();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    await env.DB.prepare(`
      INSERT INTO sessions (
        member_id,
        token,
        expires_at
      ) VALUES (?, ?, ?)
    `).bind(member.member_id, session_token, expiresAt).run();

    /* ---------- Update Last Login ---------- */
    await env.DB.prepare(`
      UPDATE members
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE member_id = ?
    `).bind(member.member_id).run();

    /* ---------- Success ---------- */
    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful."
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": buildSessionCookie(session_token),
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    console.error("Login API Error:", err);
    return new Response(
      JSON.stringify({ error: "Login failed." }),
      { status: 500 }
    );
  }
}
