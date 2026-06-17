<?php
/**
 * سرویس‌یار - API سفارش‌ها
 * GET    /api/orders.php              → لیست سفارش‌ها
 * GET    /api/orders.php?id=X        → یک سفارش
 * POST   /api/orders.php             → ثبت سفارش
 * PUT    /api/orders.php?id=X        → ویرایش سفارش
 * DELETE /api/orders.php?id=X        → حذف سفارش
 */
require_once 'config.php';
setHeaders();

$user   = auth();
$techId = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db     = getDB();

// ─── GET: لیست یا یک سفارش ───────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("
            SELECT o.*, c.name AS customer_name, c.mobile AS customer_mobile
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            WHERE o.id = ? AND o.technician_id = ?
        ");
        $stmt->execute([$id, $techId]);
        $order = $stmt->fetch();
        if (!$order) respondError('سفارش یافت نشد', 404);
        respond($order);
    }

    $status = $_GET['status'] ?? '';
    $date   = $_GET['date'] ?? '';
    $limit  = min((int)($_GET['limit'] ?? 50), 200);
    $offset = (int)($_GET['offset'] ?? 0);

    $sql    = "SELECT o.*, c.name AS customer_name, c.mobile AS customer_mobile
               FROM orders o
               JOIN customers c ON c.id = o.customer_id
               WHERE o.technician_id = ?";
    $params = [$techId];

    if ($status && $status !== 'all') {
        $sql .= " AND o.status = ?";
        $params[] = $status;
    }
    if ($date) {
        $sql .= " AND o.visit_date = ?";
        $params[] = $date;
    }

    $sql .= " ORDER BY o.visit_date DESC, o.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    // آمار برای داشبورد
    $statsStmt = $db->prepare("
        SELECT
            COUNT(*) AS total,
            SUM(status = 'pending') AS pending,
            SUM(status = 'inprogress') AS inprogress,
            SUM(status = 'completed') AS completed,
            SUM(status = 'cancelled') AS cancelled,
            SUM(visit_date = CURDATE()) AS today
        FROM orders WHERE technician_id = ?
    ");
    $statsStmt->execute([$techId]);
    $stats = $statsStmt->fetch();

    respond(['orders' => $orders, 'stats' => $stats]);
}

// ─── POST: ثبت سفارش جدید ────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();
    $customerId  = (int)($body['customer_id'] ?? 0);
    $serviceType = trim($body['service_type'] ?? '');
    $visitDate   = $body['visit_date'] ?? '';

    if (!$customerId)  respondError('انتخاب مشتری الزامی است');
    if (!$serviceType) respondError('نوع خدمات الزامی است');
    if (!$visitDate)   respondError('تاریخ مراجعه الزامی است');

    // بررسی مالکیت مشتری
    $check = $db->prepare("SELECT id FROM customers WHERE id = ? AND technician_id = ? AND is_active = 1");
    $check->execute([$customerId, $techId]);
    if (!$check->fetch()) respondError('مشتری یافت نشد', 404);

    $stmt = $db->prepare("INSERT INTO orders
        (technician_id, customer_id, service_type, description, visit_date, visit_time, status, next_service_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $techId, $customerId,
        $serviceType,
        trim($body['description'] ?? ''),
        $visitDate,
        $body['visit_time'] ?? null,
        $body['status'] ?? 'pending',
        $body['next_service_date'] ?? null,
    ]);

    $newId = $db->lastInsertId();
    $new = $db->prepare("SELECT o.*, c.name AS customer_name FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?");
    $new->execute([$newId]);
    respond($new->fetch(), 201);
}

// ─── PUT: ویرایش سفارش ───────────────────────────────────────
if ($method === 'PUT' && $id) {
    $check = $db->prepare("SELECT id FROM orders WHERE id = ? AND technician_id = ?");
    $check->execute([$id, $techId]);
    if (!$check->fetch()) respondError('سفارش یافت نشد', 404);

    $body = getBody();
    $stmt = $db->prepare("UPDATE orders SET
        service_type = ?, description = ?, visit_date = ?, visit_time = ?,
        status = ?, next_service_date = ?
        WHERE id = ?");
    $stmt->execute([
        trim($body['service_type'] ?? ''),
        trim($body['description'] ?? ''),
        $body['visit_date'] ?? '',
        $body['visit_time'] ?? null,
        $body['status'] ?? 'pending',
        $body['next_service_date'] ?? null,
        $id
    ]);
    respond(['message' => 'سفارش با موفقیت ویرایش شد']);
}

// ─── DELETE: حذف سفارش ───────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $check = $db->prepare("SELECT id FROM orders WHERE id = ? AND technician_id = ?");
    $check->execute([$id, $techId]);
    if (!$check->fetch()) respondError('سفارش یافت نشد', 404);

    $db->prepare("DELETE FROM orders WHERE id = ?")->execute([$id]);
    respond(['message' => 'سفارش حذف شد']);
}

respondError('متد نامعتبر', 405);
