export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // مدیریت API ها
    if (url.pathname.startsWith('/api/auth/')) {
      return handleAuth(request, env, url);
    }

    // سرو کردن فایل‌های استاتیک (HTML)
    return env.ASSETS.fetch(request);
  }
};

async function handleAuth(request, env, url) {
  const path = url.pathname;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // پاسخ به درخواست‌های OPTIONS (برای CORS)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ۱. API ارسال کد OTP
  if (path === '/api/auth/send-otp' && request.method === 'POST') {
    try {
      const { phone } = await request.json();
      if (!phone || phone.length !== 11) {
        return new Response(JSON.stringify({ error: "شماره موبایل نامعتبر است" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const code = Math.floor(10000 + Math.random() * 90000).toString();
      const expiresAt = Date.now() + 2 * 60 * 1000; // ۲ دقیقه اعتبار

      // ذخیره در دیتابیس D1 (فعال شد)
      await env.DB.prepare(
        "INSERT INTO otps (phone, code, expires_at) VALUES (?, ?, ?) ON CONFLICT(phone) DO UPDATE SET code = ?, expires_at = ?"
      ).bind(phone, code, expiresAt, code, expiresAt).run();

      // چاپ کد در لاگ‌ها (برای تست)
      console.log(`کد تایید برای ${phone}: ${code}`);

      return new Response(JSON.stringify({ success: true, message: "کد ارسال شد" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error("Error in send-otp:", e);
      return new Response(JSON.stringify({ error: "خطای داخلی سرور", details: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  // ۲. API تایید کد OTP
  if (path === '/api/auth/verify-otp' && request.method === 'POST') {
    try {
      const { phone, code } = await request.json();

      // خواندن کد از دیتابیس
      const record = await env.DB.prepare("SELECT * FROM otps WHERE phone = ?").bind(phone).first();

      if (!record || record.code !== code || Date.now() > record.expires_at) {
        return new Response(JSON.stringify({ error: "کد نامعتبر یا منقضی شده" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // پاک کردن کد استفاده شده
      await env.DB.prepare("DELETE FROM otps WHERE phone = ?").bind(phone).run();

      // پیدا کردن یا ساختن کاربر
      let user = await env.DB.prepare("SELECT * FROM users WHERE phone = ?").bind(phone).first();
      if (!user) {
        const result = await env.DB.prepare("INSERT INTO users (phone) VALUES (?)").bind(phone).run();
        user = { id: result.meta.last_row_id, phone };
      }

      // ساخت توکن ساده (برای دمو)
      const token = btoa(JSON.stringify({ userId: user.id, phone: user.phone, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

      const response = new Response(JSON.stringify({ success: true, user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      response.headers.set('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
      return response;
    } catch (e) {
      console.error("Error in verify-otp:", e);
      return new Response(JSON.stringify({ error: "خطای داخلی سرور", details: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}