<?php
/**
 * سرویس‌یار - احراز هویت (ورود / ثبت‌نام / تجدید توکن)
 * POST /api/auth.php?action=login    → ورود
 * POST /api/auth.php?action=register → ثبت‌نام
 * GET  /api/auth.php?action=me       → اطلاعات کاربر جاری
 * PUT  /api/auth.php?action=profile  → ویرایش پروفایل
 */
require_once 'config.php';
setHeaders();

$action = $_GET['action'] ?? 'login';
$method = $_SERVER['REQUEST_METHOD'];

// ─── ورود ────────────────────────────────────────────────────
if ($action === 'login' && $method === 'POST') {
    $body  = getBody();
    $phone = trim($body['phone'] ?? '');
    $pass  = $body['password'] ?? '';

    if (!$phone || !$pass) respondError('شماره موبایل و رمز عبور الزامی است');

    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM technicians WHERE phone = ?");
    $stmt->execute([$phone]);
    $tech = $stmt->fetch();

    if (!$tech || !password_verify($pass, $tech['password'])) {
        respondError('شماره موبایل یا رمز عبور اشتباه است', 401);
    }

    unset($tech['password']);
    $token = createJWT(['id' => $tech['id'], 'phone' => $tech['phone'], 'plan' => $tech['plan']]);

    respond(['token' => $token, 'technician' => $tech]);
}

// ─── ثبت‌نام ──────────────────────────────────────────────────
if ($action === 'register' && $method === 'POST') {
    $body = getBody();
    $name  = trim($body['name'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $pass  = $body['password'] ?? '';

    if (!$name || !$phone || !$pass) respondError('نام، شماره موبایل و رمز عبور الزامی است');
    if (strlen($phone) < 10) respondError('شماره موبایل نامعتبر است');
    if (strlen($pass) < 6)  respondError('رمز عبور باید حداقل ۶ کاراکتر باشد');

    $db = getDB();
    $check = $db->prepare("SELECT id FROM technicians WHERE phone = ?");
    $check->execute([$phone]);
    if ($check->fetch()) respondError('این شماره موبایل قبلاً ثبت شده است');

    $hashed = password_hash($pass, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO technicians (name, phone, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $phone, $hashed]);

    $id = $db->lastInsertId();
    $db->prepare("INSERT INTO settings (technician_id) VALUES (?)")->execute([$id]);

    $token = createJWT(['id' => $id, 'phone' => $phone, 'plan' => 'free']);
    respond(['token' => $token, 'message' => 'ثبت‌نام موفق!']);
}

// ─── اطلاعات کاربر جاری ──────────────────────────────────────
if ($action === 'me' && $method === 'GET') {
    $user = auth();
    $db = getDB();
    $stmt = $db->prepare("SELECT id, name, phone, address, specialty, logo_url, plan, plan_expire, created_at FROM technicians WHERE id = ?");
    $stmt->execute([$user['id']]);
    $tech = $stmt->fetch();
    if (!$tech) respondError('کاربر یافت نشد', 404);
    respond($tech);
}

// ─── ویرایش پروفایل ──────────────────────────────────────────
if ($action === 'profile' && $method === 'PUT') {
    $user = auth();
    $body = getBody();

    $fields = [];
    $params = [];

    if (!empty($body['name']))      { $fields[] = 'name = ?';      $params[] = $body['name']; }
    if (!empty($body['address']))   { $fields[] = 'address = ?';   $params[] = $body['address']; }
    if (!empty($body['specialty'])) { $fields[] = 'specialty = ?'; $params[] = $body['specialty']; }
    if (!empty($body['logo_url']))  { $fields[] = 'logo_url = ?';  $params[] = $body['logo_url']; }

    if (!empty($body['new_password'])) {
        $fields[] = 'password = ?';
        $params[] = password_hash($body['new_password'], PASSWORD_BCRYPT);
    }

    if (empty($fields)) respondError('هیچ فیلدی برای ویرایش ارسال نشده');

    $params[] = $user['id'];
    $db = getDB();
    $db->prepare("UPDATE technicians SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    respond(['message' => 'پروفایل با موفقیت بروزرسانی شد']);
}

respondError('درخواست نامعتبر', 405);
