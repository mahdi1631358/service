# 🚀 راهنمای کامل نصب سرویس‌یار روی cPanel

---

## ✅ پیش‌نیاز هاست
- PHP 8.0 یا بالاتر
- MySQL 5.7 یا بالاتر
- mod_rewrite فعال باشه
- حجم فایل آپلود: حداقل 10MB

---

## مرحله ۱ — آماده‌سازی دیتابیس

1. وارد **cPanel** شو
2. برو به **MySQL Databases**
3. یه دیتابیس جدید بساز: `servisyar_db`
4. یه یوزر بساز: `servisyar_user` با یه پسورد قوی
5. یوزر رو به دیتابیس **attach** کن با دسترسی **All Privileges**

---

## مرحله ۲ — تنظیم فایل config.php

فایل `api/config.php` رو باز کن و این خطوط رو تغییر بده:

```php
define('DB_NAME', 'cpanelusername_servisyar_db');  // ← نام کامل دیتابیس
define('DB_USER', 'cpanelusername_servisyar_user'); // ← نام کامل یوزر
define('DB_PASS', 'پسورد_قوی_خودت');               // ← پسورد MySQL
define('JWT_SECRET', 'یه_کلید_تصادفی_32_کاراکتر');  // ← تغییر ضروری!
```

> ⚠️ در cPanel نام دیتابیس و یوزر همیشه با نام cPanel account شروع میشه
> مثلاً: `john_servisyar_db` نه `servisyar_db`

---

## مرحله ۳ — دانلود فونت (مهم!)

چون برنامه به هیچ CDN خارجی وصل نمیشه، باید فونت رو دانلود کنی:

1. برو به: https://github.com/rastikerdar/vazirmatn/releases/latest
2. فایل `vazirmatn-font-files.zip` رو دانلود کن
3. از داخل zip، این ۴ فایل woff2 رو بردار:
   - `VazirMatn-Regular.woff2`
   - `VazirMatn-Medium.woff2`
   - `VazirMatn-Bold.woff2`
   - `VazirMatn-ExtraBold.woff2`
4. این فایل‌ها رو در پوشه `public_html/fonts/` آپلود کن

---

## مرحله ۴ — Build کردن React

روی کامپیوتر خودت:

```bash
# نصب وابستگی‌ها
npm install

# ساخت نسخه production
npm run build
```

خروجی در پوشه `dist/` ساخته میشه.

---

## مرحله ۵ — آپلود فایل‌ها

### ساختار نهایی `public_html`:
```
public_html/
├── index.html              ← از dist/
├── assets/                 ← از dist/assets/
├── fonts/                  ← فایل‌های woff2 (مرحله ۳)
├── .htaccess               ← از پروژه
└── api/
    ├── .htaccess           ← از پروژه
    ├── config.php          ← تنظیم‌شده (مرحله ۲)
    ├── install.php
    ├── auth.php
    ├── customers.php
    ├── orders.php
    ├── invoices.php
    ├── reports.php
    └── settings.php
```

### روش آپلود:
**گزینه الف - File Manager cPanel:**
1. برو به File Manager → public_html
2. فایل‌ها رو آپلود کن

**گزینه ب - FileZilla (FTP):**
1. اطلاعات FTP رو از cPanel بگیر
2. محتوی dist/ رو به public_html آپلود کن
3. پوشه api/ رو آپلود کن

---

## مرحله ۶ — نصب دیتابیس

1. مرورگر رو باز کن و برو به:
   ```
   https://yourdomain.com/api/install.php
   ```
2. اگه موفق بود، پیام ✅ می‌بینی
3. **اطلاعات ورود اولیه:**
   - شماره موبایل: `09121234567`
   - رمز عبور: `admin1234`

> ⚠️ **بعد از نصب موفق، فوری فایل install.php رو حذف کن!**
> (از File Manager یا FTP)

---

## مرحله ۷ — تست و ورود

1. برو به: `https://yourdomain.com`
2. با اطلاعات بالا وارد شو
3. از بخش **تنظیمات** پروفایل و رمز رو تغییر بده

---

## 🔒 نکات امنیتی مهم

| کار | اولویت |
|-----|--------|
| حذف `install.php` بعد از نصب | 🔴 فوری |
| تغییر `JWT_SECRET` در config.php | 🔴 فوری |
| تغییر رمز عبور پیش‌فرض | 🔴 فوری |
| فعال‌کردن SSL (HTTPS) | 🟡 مهم |
| بکاپ منظم دیتابیس | 🟡 مهم |

---

## 🛠️ رفع مشکلات رایج

**خطا: 500 Internal Server Error**
- فایل config.php رو چک کن
- مطمئن شو نام دیتابیس و یوزر درسته

**خطا: صفحه سفید یا 404**
- مطمئن شو .htaccess آپلود شده
- mod_rewrite رو از cPanel فعال کن

**فونت لود نمیشه**
- مطمئن شو فایل‌های woff2 در public_html/fonts/ هستن
- مسیر فایل‌ها رو در src/fonts.css چک کن

**API ارتباط برقرار نمیکنه**
- مطمئن شو پوشه api/ داخل public_html هست
- آدرس api/ رو در مرورگر تست کن

---

## 📊 مدیریت دیتابیس با phpMyAdmin

1. وارد cPanel → phpMyAdmin
2. دیتابیس `servisyar_db` رو انتخاب کن
3. جداول:
   - `technicians` — اطلاعات تعمیرکاران
   - `customers` — مشتریان
   - `orders` — سفارش‌ها
   - `invoices` + `invoice_items` — فاکتورها
   - `payments` — پرداخت‌ها
   - `settings` — تنظیمات

### بکاپ دستی:
phpMyAdmin → Export → Quick → SQL → Go

---

## 🔄 بروزرسانی اپ

1. تغییرات رو ایجاد کن
2. `npm run build` اجرا کن
3. فقط فایل‌های `dist/` رو جایگزین کن
4. **فایل‌های `api/` رو دست نزن** (مگه PHP تغییر کرده باشه)
