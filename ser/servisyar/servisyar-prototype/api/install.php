<?php
/**
 * سرویس‌یار - نصب خودکار دیتابیس
 * فقط یکبار اجرا کن، بعد این فایل رو حذف کن!
 * آدرس: yourdomain.com/api/install.php
 */
require_once 'config.php';
setHeaders();

$db = getDB();

$tables = [

// ━━━━━━━━━━━━━━━━━━━ جدول تعمیرکاران ━━━━━━━━━━━━━━━━━━━
'technicians' => "
CREATE TABLE IF NOT EXISTS `technicians` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL COMMENT 'نام و نام خانوادگی',
  `phone`       VARCHAR(20)  NOT NULL UNIQUE COMMENT 'شماره موبایل',
  `address`     VARCHAR(255) DEFAULT NULL COMMENT 'آدرس',
  `specialty`   VARCHAR(150) DEFAULT NULL COMMENT 'تخصص',
  `logo_url`    VARCHAR(500) DEFAULT NULL COMMENT 'آدرس لوگو',
  `password`    VARCHAR(255) NOT NULL COMMENT 'پسورد هش شده',
  `plan`        ENUM('free','gold_monthly','gold_yearly') DEFAULT 'free',
  `plan_expire` DATETIME     DEFAULT NULL,
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

// ━━━━━━━━━━━━━━━━━━━ جدول مشتریان ━━━━━━━━━━━━━━━━━━━
'customers' => "
CREATE TABLE IF NOT EXISTS `customers` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`  INT UNSIGNED NOT NULL,
  `name`           VARCHAR(100) NOT NULL COMMENT 'نام مشتری',
  `mobile`         VARCHAR(15)  NOT NULL COMMENT 'شماره موبایل',
  `address`        VARCHAR(300) DEFAULT NULL COMMENT 'آدرس',
  `notes`          TEXT         DEFAULT NULL COMMENT 'توضیحات - نوع دستگاه',
  `is_active`      TINYINT(1)   DEFAULT 1,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE CASCADE,
  INDEX idx_tech (`technician_id`),
  INDEX idx_mobile (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

// ━━━━━━━━━━━━━━━━━━━ جدول سفارش‌ها ━━━━━━━━━━━━━━━━━━━
'orders' => "
CREATE TABLE IF NOT EXISTS `orders` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`    INT UNSIGNED NOT NULL,
  `customer_id`      INT UNSIGNED NOT NULL,
  `service_type`     VARCHAR(150) NOT NULL COMMENT 'نوع خدمات',
  `description`      TEXT         DEFAULT NULL COMMENT 'توضیحات سفارش',
  `visit_date`       DATE         NOT NULL COMMENT 'تاریخ مراجعه',
  `visit_time`       TIME         DEFAULT NULL COMMENT 'ساعت مراجعه',
  `status`           ENUM('pending','inprogress','completed','cancelled') DEFAULT 'pending',
  `next_service_date` DATE        DEFAULT NULL COMMENT 'تاریخ سرویس بعدی',
  `reminder_sent`    TINYINT(1)   DEFAULT 0,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`)   REFERENCES `customers`(`id`)   ON DELETE CASCADE,
  INDEX idx_tech_date (`technician_id`, `visit_date`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

// ━━━━━━━━━━━━━━━━━━━ جدول فاکتورها ━━━━━━━━━━━━━━━━━━━
'invoices' => "
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`  INT UNSIGNED NOT NULL,
  `order_id`       INT UNSIGNED DEFAULT NULL,
  `customer_id`    INT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(30)  NOT NULL UNIQUE COMMENT 'شماره فاکتور',
  `labor_cost`     DECIMAL(12,0) DEFAULT 0 COMMENT 'اجرت',
  `discount`       DECIMAL(12,0) DEFAULT 0 COMMENT 'تخفیف',
  `tax_percent`    DECIMAL(5,2)  DEFAULT 0 COMMENT 'درصد مالیات',
  `total_amount`   DECIMAL(12,0) DEFAULT 0 COMMENT 'جمع کل',
  `payment_status` ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
  `paid_amount`    DECIMAL(12,0) DEFAULT 0 COMMENT 'مبلغ پرداخت شده',
  `paid_at`        DATETIME      DEFAULT NULL COMMENT 'تاریخ پرداخت',
  `notes`          TEXT          DEFAULT NULL,
  `created_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`)   REFERENCES `customers`(`id`)   ON DELETE CASCADE,
  INDEX idx_tech_status (`technician_id`, `payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

// ━━━━━━━━━━━━━━━━━━━ جدول اقلام فاکتور ━━━━━━━━━━━━━━━━━━━
'invoice_items' => "
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_id`  INT UNSIGNED NOT NULL,
  `description` VARCHAR(200) NOT NULL COMMENT 'شرح خدمت/قطعه',
  `quantity`    DECIMAL(8,2) DEFAULT 1,
  `unit_price`  DECIMAL(12,0) DEFAULT 0 COMMENT 'قیمت واحد',
  `total_price` DECIMAL(12,0) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

// ━━━━━━━━━━━━━━━━━━━ جدول پرداخت‌ها ━━━━━━━━━━━━━━━━━━━
'payments' => "
CREATE TABLE IF NOT EXISTS `payments` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`  INT UNSIGNED NOT NULL,
  `invoice_id`     INT UNSIGNED NOT NULL,
  `amount`         DECIMAL(12,0) NOT NULL COMMENT 'مبلغ پرداخت',
  `method`         ENUM('cash','card','transfer','other') DEFAULT 'cash',
  `reference_code` VARCHAR(100)  DEFAULT NULL COMMENT 'کد پیگیری',
  `paid_at`        DATETIME      DEFAULT CURRENT_TIMESTAMP,
  `notes`          VARCHAR(300)  DEFAULT NULL,
  FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invoice_id`)    REFERENCES `invoices`(`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

// ━━━━━━━━━━━━━━━━━━━ جدول تنظیمات ━━━━━━━━━━━━━━━━━━━
'settings' => "
CREATE TABLE IF NOT EXISTS `settings` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`   INT UNSIGNED NOT NULL UNIQUE,
  `accent_color`    VARCHAR(10)  DEFAULT '#4A90E2',
  `dark_mode`       TINYINT(1)   DEFAULT 0,
  `sms_reminder`    TINYINT(1)   DEFAULT 1,
  `invoice_prefix`  VARCHAR(10)  DEFAULT 'INV',
  `tax_default`     DECIMAL(5,2) DEFAULT 0,
  `updated_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"

];

$errors = [];
foreach ($tables as $name => $sql) {
    try {
        $db->exec($sql);
    } catch (PDOException $e) {
        $errors[] = "جدول $name: " . $e->getMessage();
    }
}

// ─── داده‌های نمونه ───────────────────────────────────
if (empty($errors)) {
    try {
        // بررسی اینکه آیا تعمیرکار نمونه وجود داره
        $check = $db->query("SELECT COUNT(*) FROM technicians")->fetchColumn();
        if ($check == 0) {
            $hashedPass = password_hash('admin1234', PASSWORD_BCRYPT);
            $db->exec("INSERT INTO technicians (name, phone, address, specialty, password, plan)
                VALUES ('حسین تهرانی', '09121234567', 'تهران، بلوار میرداماد', 'تعمیر پکیج و کولر گازی', '$hashedPass', 'free')");

            $techId = $db->lastInsertId();

            // مشتریان نمونه
            $db->exec("INSERT INTO customers (technician_id, name, mobile, address, notes) VALUES
                ($techId, 'علی رضایی',    '09121111111', 'تهران، ولیعصر، پلاک ۱۲', 'پکیج ایران رادیاتور'),
                ($techId, 'مریم احمدی',   '09352222222', 'تهران، تجریش، کوچه بهار', 'کولر گازی ال‌جی'),
                ($techId, 'حسین محمدی',   '09193333333', 'تهران، پونک، بلوار اصلی', 'آبگرمکن جوتا'),
                ($techId, 'فاطمه کریمی',  '09014444444', 'تهران، نارمک', 'ماشین لباسشویی'),
                ($techId, 'رضا موسوی',    '09305555555', 'تهران، شهرک غرب', 'تاسیسات ساختمان')");

            // تنظیمات پیش‌فرض
            $db->exec("INSERT INTO settings (technician_id) VALUES ($techId)");
        }
    } catch (PDOException $e) {
        $errors[] = 'داده نمونه: ' . $e->getMessage();
    }
}

if (empty($errors)) {
    respond([
        'message'     => '✅ نصب موفق! دیتابیس سرویس‌یار آماده است',
        'tables'      => array_keys($tables),
        'login'       => ['phone' => '09121234567', 'password' => 'admin1234'],
        'warning'     => '⚠️ این فایل را پس از نصب حذف کنید!'
    ]);
} else {
    respondError('خطا در نصب: ' . implode(' | ', $errors));
}
