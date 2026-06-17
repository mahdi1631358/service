<?php
/**
 * سرویس‌یار - API تنظیمات و اشتراک
 * GET /api/settings.php              → دریافت تنظیمات
 * PUT /api/settings.php              → ذخیره تنظیمات
 * PUT /api/settings.php?action=upgrade → ارتقاء اشتراک (شبیه‌سازی)
 */
require_once 'config.php';
setHeaders();

$user   = auth();
$techId = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ─── GET: دریافت تنظیمات ────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare("SELECT * FROM settings WHERE technician_id = ?");
    $stmt->execute([$techId]);
    $settings = $stmt->fetch();

    // اگه تنظیمات وجود نداره، بساز
    if (!$settings) {
        $db->prepare("INSERT INTO settings (technician_id) VALUES (?)")->execute([$techId]);
        $stmt->execute([$techId]);
        $settings = $stmt->fetch();
    }

    // اطلاعات پلن
    $techStmt = $db->prepare("SELECT plan, plan_expire, name, phone, address, specialty, logo_url FROM technicians WHERE id = ?");
    $techStmt->execute([$techId]);
    $tech = $techStmt->fetch();

    $isPremium = in_array($tech['plan'], ['gold_monthly', 'gold_yearly']);
    $planExpired = $tech['plan_expire'] && strtotime($tech['plan_expire']) < time();

    respond([
        'settings'   => $settings,
        'technician' => $tech,
        'isPremium'  => $isPremium && !$planExpired,
        'planExpire' => $tech['plan_expire'],
    ]);
}

// ─── PUT: ذخیره تنظیمات ────────────────────────────────────
if ($method === 'PUT' && !$action) {
    $body = getBody();

    $db->prepare("UPDATE settings SET
        accent_color = ?, dark_mode = ?, sms_reminder = ?, invoice_prefix = ?, tax_default = ?
        WHERE technician_id = ?")
       ->execute([
           $body['accent_color']   ?? '#4A90E2',
           (int)($body['dark_mode']    ?? 0),
           (int)($body['sms_reminder'] ?? 1),
           $body['invoice_prefix'] ?? 'INV',
           (float)($body['tax_default']   ?? 0),
           $techId
       ]);

    // ویرایش پروفایل تعمیرکار
    if (!empty($body['name']) || !empty($body['address'])) {
        $db->prepare("UPDATE technicians SET name = ?, address = ?, specialty = ? WHERE id = ?")
           ->execute([
               $body['name'] ?? '',
               $body['address'] ?? '',
               $body['specialty'] ?? '',
               $techId
           ]);
    }

    respond(['message' => 'تنظیمات ذخیره شد']);
}

// ─── PUT: ارتقاء اشتراک ─────────────────────────────────────
if ($method === 'PUT' && $action === 'upgrade') {
    $body = getBody();
    $plan = $body['plan'] ?? '';

    if (!in_array($plan, ['gold_monthly', 'gold_yearly'])) {
        respondError('پلن نامعتبر است');
    }

    // محاسبه تاریخ انقضا
    $expire = $plan === 'gold_yearly'
        ? date('Y-m-d H:i:s', strtotime('+1 year'))
        : date('Y-m-d H:i:s', strtotime('+1 month'));

    $db->prepare("UPDATE technicians SET plan = ?, plan_expire = ? WHERE id = ?")
       ->execute([$plan, $expire, $techId]);

    respond([
        'message'    => 'اشتراک ویژه با موفقیت فعال شد',
        'plan'       => $plan,
        'plan_expire'=> $expire,
        'isPremium'  => true,
    ]);
}

respondError('متد نامعتبر', 405);
