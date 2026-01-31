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

function isValidPassword(pw) {
  return (
    typeof pw === "string" &&
    pw.length >= 8 &&
    /[A-Za-z]/.test(pw) &&
    /[0-9]/.test(pw)
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

function generateMemberId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const l1 = letters[Math.floor(Math.random() * 26)];
  const l2 = letters[Math.floor(Math.random() * 26)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `EDU-${l1}${l2}${num}`;
}


function generateVerificationToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

/* =========================
   Send Verification Email
========================= */
async function sendVerificationEmail({
  env,
  email,
  token,
  firstName,
  lastName
}) {

  const baseUrl = "https://edunovafdn.org";
  const verifyLink =
    `${baseUrl}/api/verify-email?token=${token}`;

  const body = new URLSearchParams();
  body.append("from", "Edunova Education <team@edunovafdn.org>");
  body.append("to", email);
  body.append("subject", "✅Please verify your email | 请验证您的邮箱");

  body.append(
  "html",
  `
  <div style="
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    color: #1f2937;
  ">

    <p>
      Hello <strong>${firstName} ${lastName}</strong>,
    </p>

    <p>
      Thank you for registering with <strong>Edunova Foundation</strong>.
    </p>

    <p>
      To complete your registration, please verify your email address by clicking the button below:
    </p>

    <p style="margin: 24px 0;">
      <a href="${verifyLink}"
         target="_blank"
         style="
           display: inline-block;
           padding: 12px 26px;
           background-color: #2563eb;
           color: #ffffff;
           text-decoration: none;
           border-radius: 6px;
           font-size: 18px;
           font-weight: 600;
         ">
        👉Verify My Email
      </a>
    </p>
    <p>
      This verification link will expire in <strong>24 hours</strong>.
    </p>
    <p style="margin-top: 32px;">
      If you have any questions, please feel free to reply to this email directly：
      <strong>team@edunovafdn.org</strong>
    </p>
    <p style="margin-top: 24px;">
          ——<strong>超能教育 · Edunova Foundation</strong>
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p>
      您好，<strong>${firstName} ${lastName}</strong>：
    </p>
    <p>
      感谢您注册 <strong>超能教育（Edunova Foundation）</strong>。
    </p>
    <p>
      请点击下方按钮完成邮箱验证，以正式激活您的账户：
    </p>
    <p style="margin: 24px 0;">
      <a href="${verifyLink}"
         target="_blank"
         style="
           display: inline-block;
           padding: 12px 26px;
           background-color: #2563eb;
           color: #ffffff;
           text-decoration: none;
           border-radius: 6px;
           font-size: 18px;
           font-weight: 600;
         ">
        👉点击验证邮箱
      </a>
    </p>
    <p>
      该验证链接将在 <strong>24 小时后失效</strong>。
    </p>
    <p style="margin-top: 32px;">
      如有任何问题，欢迎直接回复本邮件：<strong>team@edunovafdn.org</strong>
    </p>
    <p style="margin-top: 24px;">
          ——<strong>超能教育 · Edunova Foundation</strong>
    </p>
  </div>
  `
);


  const auth =
    "Basic " + btoa(`api:${env.MAILGUN_API_KEY}`);

  const res = await fetch(
    `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Mailgun error: " + text);
  }
}

/* =========================
   Register API
========================= */
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      password,
      referral_code
    } = body;

    const normalizedEmail = normalizeEmail(email);


    if (!first_name || !last_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    if (!isValidEmail(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format." }),
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return new Response(
        JSON.stringify({
          error:
            "Password must be at least 8 characters and include letters and numbers."
        }),
        { status: 400 }
      );
    }

    const emailExists = await env.DB
      .prepare("SELECT 1 FROM members WHERE email = ?")
      .bind(normalizedEmail)
      .first();

    if (emailExists) {
      return new Response(
        JSON.stringify({
          error: "This email is already registered."
        }),
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);

    let member_id;
    let exists;
    do {
      member_id = generateMemberId();
      exists = await env.DB
        .prepare("SELECT 1 FROM members WHERE member_id = ?")
        .bind(member_id)
        .first();
    } while (exists);

    await env.DB.prepare(`
      INSERT INTO members (
        first_name,
        last_name,
        email,
        member_id,
        password_hash,
        referral_code,
        role,
        source,
        status,
        is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      first_name,
      last_name,
      normalizedEmail,
      member_id,
      password_hash,
      referral_code || null,
      "member",
      "register",
      "active",
      0
    ).run();

    const token = generateVerificationToken();
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    await env.DB.prepare(`
      INSERT INTO email_verifications (
        member_id,
        email,
        token,
        expires_at
      ) VALUES (?, ?, ?, ?)
    `).bind(
      member_id,
      normalizedEmail,
      token,
      expiresAt
    ).run();

    await sendVerificationEmail({
  env,
  normalizedEmail,
  token,
  firstName: first_name,
  lastName: last_name
});


    return new Response(
      JSON.stringify({
        success: true,
        verification_required: true,
        message:
          "Registration successful. Please check your email to verify your account."
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Register API Error:", err);
    return new Response(
      JSON.stringify({ error: "Registration failed." }),
      { status: 500 }
    );
  }
}
