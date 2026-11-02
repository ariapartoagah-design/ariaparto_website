// auth.js - مدیریت متمرکز وضعیت لاگین (فقط با localStorage)

function checkAuthStatus() {
  const loginLinks = document.querySelectorAll('.login-link');
  const logoutLinks = document.querySelectorAll('.logout-link');
  const userGreeting = document.getElementById('userGreeting');

  // بررسی وضعیت لاگین فقط از localStorage
  const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
  const userPhone = localStorage.getItem('user_phone') || '';

  if (isLoggedIn) {
    // کاربر لاگین است
    loginLinks.forEach(el => el.style.display = 'none');
    logoutLinks.forEach(el => el.style.display = 'inline');
    
    if (userGreeting) {
      userGreeting.textContent = `خوش آمدید، ${userPhone}`;
      userGreeting.style.display = 'inline';
    }
  } else {
    // کاربر مهمان
    loginLinks.forEach(el => el.style.display = 'inline');
    logoutLinks.forEach(el => el.style.display = 'none');
    if (userGreeting) userGreeting.style.display = 'none';
  }
}

function logoutUser() {
  // پاک کردن اطلاعات از localStorage
  localStorage.removeItem('user_logged_in');
  localStorage.removeItem('user_phone');
  localStorage.removeItem('user_role');
  localStorage.removeItem('subscription_status');
  localStorage.removeItem('verification_status');
  
  // هدایت به صفحه اصلی
  window.location.href = 'index.html';
}

// اجرای خودکار پس از بارگذاری هر صفحه
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