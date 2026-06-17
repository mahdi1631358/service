<?php
/**
 * سرویس‌یار - API گزارشات (فقط کاربران ویژه)
 * GET /api/reports.php?type=dashboard  → آمار داشبورد (همه)
 * GET /api/reports.php?type=monthly    → درآمد ماهانه (ویژه)
 * GET /api/reports.php?type=services   → توزیع خدمات (ویژه)
 * GET /api/reports.php?type=customers  → مشتریان برتر (ویژه)
 */
require_once 'config.php';
setHeaders();

$user      = auth();
$techId    = $user['id'];
$isPremium = in_array($user['plan'] ?? 'free', ['gold_monthly', 'gold_yearly']);
$type      = $_GET['type'] ?? 'dashboard';
$db        = getDB();

// ─── داشبورد - برای همه ──────────────────────────────────────
if ($type === 'dashboard') {
    // آمار مشتریان
    $custCount = $db->prepare("SELECT COUNT(*) FROM customers WHERE technician_id = ? AND is_active = 1");
    $custCount->execute([$techId]);

    // سفارش‌های امروز
    $todayOrders = $db->prepare("SELECT COUNT(*) FROM orders WHERE technician_id = ? AND visit_date = CURDATE()");
    $todayOrders->execute([$techId]);

    // سفارش‌های در انتظار
    $pending = $db->prepare("SELECT COUNT(*) FROM orders WHERE technician_id = ? AND status = 'pending'");
    $pending->execute([$techId]);

    // درآمد امروز
    $dailyRev = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) FROM invoices
        WHERE technician_id = ? AND DATE(created_at) = CURDATE() AND payment_status IN ('paid','partial')");
    $dailyRev->execute([$techId]);

    // درآمد ماه جاری
    $monthRev = $db->prepare("SELECT COALESCE(SUM(paid_amount), 0) FROM invoices
        WHERE technician_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $monthRev->execute([$techId]);

    // یادآوری‌های سرویس دوره‌ای
    $reminders = $db->prepare("
        SELECT o.next_service_date, o.service_type, c.name AS customer_name, c.mobile
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.technician_id = ? AND o.next_service_date IS NOT NULL
          AND o.next_service_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY o.next_service_date ASC LIMIT 10
    ");
    $reminders->execute([$techId]);

    // آخرین سفارش‌ها
    $recentOrders = $db->prepare("
        SELECT o.id, o.service_type, o.visit_date, o.status, c.name AS customer_name
        FROM orders o JOIN customers c ON c.id = o.customer_id
        WHERE o.technician_id = ?
        ORDER BY o.created_at DESC LIMIT 5
    ");
    $recentOrders->execute([$techId]);

    respond([
        'customers_count'  => (int)$custCount->fetchColumn(),
        'today_orders'     => (int)$todayOrders->fetchColumn(),
        'pending_orders'   => (int)$pending->fetchColumn(),
        'daily_revenue'    => (float)$dailyRev->fetchColumn(),
        'monthly_revenue'  => (float)$monthRev->fetchColumn(),
        'reminders'        => $reminders->fetchAll(),
        'recent_orders'    => $recentOrders->fetchAll(),
        'isPremium'        => $isPremium,
    ]);
}

// ─── گزارشات ویژه ────────────────────────────────────────────
if (!$isPremium) {
    respondError('این گزارش فقط برای کاربران ویژه است', 403);
}

// ─── درآمد ماهانه ────────────────────────────────────────────
if ($type === 'monthly') {
    $months = $db->prepare("
        SELECT
            MONTH(created_at) AS month_num,
            YEAR(created_at) AS year_num,
            COALESCE(SUM(paid_amount), 0) AS revenue,
            COUNT(*) AS invoice_count
        FROM invoices
        WHERE technician_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year_num ASC, month_num ASC
    ");
    $months->execute([$techId]);

    $persianMonths = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    $data = array_map(function($row) use ($persianMonths) {
        $row['month_name'] = $persianMonths[(int)$row['month_num']];
        return $row;
    }, $months->fetchAll());

    respond($data);
}

// ─── توزیع نوع خدمات ─────────────────────────────────────────
if ($type === 'services') {
    $stmt = $db->prepare("
        SELECT service_type AS name, COUNT(*) AS value
        FROM orders WHERE technician_id = ?
        GROUP BY service_type ORDER BY value DESC LIMIT 10
    ");
    $stmt->execute([$techId]);
    respond($stmt->fetchAll());
}

// ─── مشتریان برتر ────────────────────────────────────────────
if ($type === 'customers') {
    $stmt = $db->prepare("
        SELECT c.name, c.mobile,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(inv.paid_amount), 0) AS total_revenue
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        LEFT JOIN invoices inv ON inv.customer_id = c.id
        WHERE c.technician_id = ? AND c.is_active = 1
        GROUP BY c.id, c.name, c.mobile
        ORDER BY total_revenue DESC LIMIT 10
    ");
    $stmt->execute([$techId]);
    respond($stmt->fetchAll());
}

respondError('نوع گزارش نامعتبر', 400);
