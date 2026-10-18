// auth.js - مدیریت متمرکز وضعیت لاگین و سطوح دسترسی

async function checkAuthStatus() {
  const loginLinks = document.querySelectorAll('.login-link');
  const logoutLinks = document.querySelectorAll('.logout-link');
  const userGreeting = document.getElementById('userGreeting');

  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    
    if (res.ok) {
      const data = await res.json();
      const user = data.user;

      // ذخیره اطلاعات کاربر در متغیر سراسری
      window.currentUser = user;
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('subscription_status', user.subscription_status || 'inactive');
      localStorage.setItem('verification_status', user.verification_status || 'pending');

      // نمایش نام کاربر و دکمه خروج
      loginLinks.forEach(el => el.style.display = 'none');
      logoutLinks.forEach(el => el.style.display = 'inline');
      
      if (userGreeting) {
        userGreeting.textContent = `خوش آمدید، ${user.name || user.phone}`;
        userGreeting.style.display = 'inline';
      }
      
      // اگر کاربر سطح ۴ یا ۵ بود و تأیید نشده بود، پیام هشدار بده
      if (['partner', 'admin'].includes(user.role) && user.verification_status !== 'approved') {
        showVerificationBanner();
      }

      // اگر کاربر لاگین است و در صفحه لاگین یا ثبت‌نام است، به داشبورد هدایت کن
      if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        window.location.href = 'dashboard.html';
      }

    } else {
      // کاربر لاگین نیست (مهمان)
      loginLinks.forEach(el => el.style.display = 'inline');
      logoutLinks.forEach(el => el.style.display = 'none');
      if (userGreeting) userGreeting.style.display = 'none';
      
      // پاک کردن اطلاعات قدیمی
      localStorage.removeItem('user_role');
      localStorage.removeItem('subscription_status');
      localStorage.removeItem('verification_status');
    }
  } catch (err) {
    // خطا در ارتباط با سرور (کاربر مهمان)
    loginLinks.forEach(el => el.style.display = 'inline');
    logoutLinks.forEach(el => el.style.display = 'none');
    if (userGreeting) userGreeting.style.display = 'none';
  }
}

function logoutUser() {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      localStorage.removeItem('user_logged_in');
      localStorage.removeItem('user_phone');
      localStorage.removeItem('user_role');
      localStorage.removeItem('subscription_status');
      localStorage.removeItem('verification_status');
      window.location.href = 'index.html';
    })
    .catch(() => {
      localStorage.removeItem('user_logged_in');
      window.location.href = 'index.html';
    });
}

// نمایش بنر هشدار برای کاربران تأیید نشده
function showVerificationBanner() {
  const banner = document.createElement('div');
  banner.id = 'verificationBanner';
  banner.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #fef7e0;
    color: #b06000;
    text-align: center;
    padding: 10px;
    font-size: 13px;
    font-weight: 600;
    z-index: 9999;
    border-bottom: 1px solid #f9ab00;
    direction: rtl;
  `;
  banner.textContent = '⚠️ حساب شما در انتظار تأیید مدیر است. دسترسی به بخش‌های محرمانه محدود شده است.';
  document.body.prepend(banner);
  document.body.style.paddingTop = '40px';
}

// اجرای خودکار پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  // اضافه کردن رویداد کلیک به دکمه‌های خروج
  const logoutLinks = document.querySelectorAll('.logout-link');
  logoutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  });
});