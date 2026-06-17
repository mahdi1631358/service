<?php
/**
 * سرویس‌یار - API مشتریان
 * GET    /api/customers.php           → لیست مشتریان
 * GET    /api/customers.php?id=X      → یک مشتری
 * POST   /api/customers.php           → ثبت مشتری جدید
 * PUT    /api/customers.php?id=X      → ویرایش مشتری
 * DELETE /api/customers.php?id=X      → حذف مشتری
 */
require_once 'config.php';
setHeaders();

$user   = auth();
$techId = $user['id'];
$isPremium = in_array($user['plan'] ?? 'free', ['gold_monthly', 'gold_yearly']);
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db     = getDB();

// ─── GET: لیست یا یک مشتری ───────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM customers WHERE id = ? AND technician_id = ? AND is_active = 1");
        $stmt->execute([$id, $techId]);
        $customer = $stmt->fetch();
        if (!$customer) respondError('مشتری یافت نشد', 404);
        respond($customer);
    }

    $search = $_GET['q'] ?? '';
    $limit  = min((int)($_GET['limit'] ?? 50), 200);
    $offset = (int)($_GET['offset'] ?? 0);

    $sql    = "SELECT * FROM customers WHERE technician_id = ? AND is_active = 1";
    $params = [$techId];

    if ($search) {
        $sql .= " AND (name LIKE ? OR mobile LIKE ? OR address LIKE ?)";
        $like = "%$search%";
        $params = array_merge($params, [$like, $like, $like]);
    }

    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $customers = $stmt->fetchAll();

    // تعداد کل برای pagination
    $countStmt = $db->prepare("SELECT COUNT(*) FROM customers WHERE technician_id = ? AND is_active = 1");
    $countStmt->execute([$techId]);
    $total = $countStmt->fetchColumn();

    respond([
        'customers' => $customers,
        'total'     => (int)$total,
        'limit'     => FREE_CUSTOMER_LIMIT,
        'isPremium' => $isPremium,
        'atLimit'   => !$isPremium && $total >= FREE_CUSTOMER_LIMIT,
    ]);
}

// ─── POST: ثبت مشتری جدید ────────────────────────────────────
if ($method === 'POST') {
    // بررسی محدودیت رایگان
    if (!$isPremium) {
        $count = $db->prepare("SELECT COUNT(*) FROM customers WHERE technician_id = ? AND is_active = 1");
        $count->execute([$techId]);
        if ($count->fetchColumn() >= FREE_CUSTOMER_LIMIT) {
            respondError("نسخه رایگان فقط تا {FREE_CUSTOMER_LIMIT} مشتری پشتیبانی می‌کند. برای بیشتر، اشتراک ویژه تهیه کنید.", 403);
        }
    }

    $body   = getBody();
    $name   = trim($body['name'] ?? '');
    $mobile = trim($body['mobile'] ?? '');

    if (!$name)   respondError('نام مشتری الزامی است');
    if (!$mobile) respondError('شماره موبایل الزامی است');

    $stmt = $db->prepare("INSERT INTO customers (technician_id, name, mobile, address, notes) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $techId, $name, $mobile,
        trim($body['address'] ?? ''),
        trim($body['notes'] ?? ''),
    ]);

    $newId = $db->lastInsertId();
    $new = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $new->execute([$newId]);
    respond($new->fetch(), 201);
}

// ─── PUT: ویرایش مشتری ───────────────────────────────────────
if ($method === 'PUT' && $id) {
    // بررسی مالکیت
    $check = $db->prepare("SELECT id FROM customers WHERE id = ? AND technician_id = ?");
    $check->execute([$id, $techId]);
    if (!$check->fetch()) respondError('مشتری یافت نشد', 404);

    $body = getBody();
    $stmt = $db->prepare("UPDATE customers SET name=?, mobile=?, address=?, notes=? WHERE id=?");
    $stmt->execute([
        trim($body['name'] ?? ''),
        trim($body['mobile'] ?? ''),
        trim($body['address'] ?? ''),
        trim($body['notes'] ?? ''),
        $id
    ]);
    respond(['message' => 'مشتری با موفقیت ویرایش شد']);
}

// ─── DELETE: حذف منطقی مشتری ─────────────────────────────────
if ($method === 'DELETE' && $id) {
    $check = $db->prepare("SELECT id FROM customers WHERE id = ? AND technician_id = ?");
    $check->execute([$id, $techId]);
    if (!$check->fetch()) respondError('مشتری یافت نشد', 404);

    $db->prepare("UPDATE customers SET is_active = 0 WHERE id = ?")->execute([$id]);
    respond(['message' => 'مشتری حذف شد']);
}

respondError('متد نامعتبر', 405);
