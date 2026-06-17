<?php
/**
 * سرویس‌یار - API فاکتورها
 * GET    /api/invoices.php           → لیست فاکتورها
 * GET    /api/invoices.php?id=X      → یک فاکتور با اقلام
 * POST   /api/invoices.php           → ایجاد فاکتور
 * PUT    /api/invoices.php?id=X      → ویرایش فاکتور
 * DELETE /api/invoices.php?id=X      → حذف فاکتور
 */
require_once 'config.php';
setHeaders();

$user   = auth();
$techId = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db     = getDB();

function calcTotal(float $labor, float $discount, float $tax, array $items): float {
    $itemsTotal = array_reduce($items, fn($s, $i) => $s + ($i['quantity'] * $i['unit_price']), 0);
    $subtotal   = $itemsTotal + $labor;
    $after      = $subtotal - $discount;
    return $after + ($after * $tax / 100);
}

// ─── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("
            SELECT inv.*, c.name AS customer_name, c.mobile AS customer_mobile
            FROM invoices inv
            JOIN customers c ON c.id = inv.customer_id
            WHERE inv.id = ? AND inv.technician_id = ?
        ");
        $stmt->execute([$id, $techId]);
        $invoice = $stmt->fetch();
        if (!$invoice) respondError('فاکتور یافت نشد', 404);

        $items = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
        $items->execute([$id]);
        $invoice['items'] = $items->fetchAll();

        respond($invoice);
    }

    $payStatus = $_GET['payment_status'] ?? '';
    $limit     = min((int)($_GET['limit'] ?? 50), 200);
    $offset    = (int)($_GET['offset'] ?? 0);

    $sql    = "SELECT inv.*, c.name AS customer_name FROM invoices inv
               JOIN customers c ON c.id = inv.customer_id
               WHERE inv.technician_id = ?";
    $params = [$techId];

    if ($payStatus && $payStatus !== 'all') {
        $sql .= " AND inv.payment_status = ?";
        $params[] = $payStatus;
    }

    $sql .= " ORDER BY inv.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $invoices = $stmt->fetchAll();

    // آمار مالی
    $fin = $db->prepare("
        SELECT
            SUM(total_amount) AS total_revenue,
            SUM(CASE WHEN payment_status='paid' THEN total_amount ELSE 0 END) AS paid_revenue,
            SUM(CASE WHEN payment_status='unpaid' THEN total_amount ELSE 0 END) AS unpaid_revenue,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) AS today_revenue,
            SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) THEN total_amount ELSE 0 END) AS month_revenue
        FROM invoices WHERE technician_id = ?
    ");
    $fin->execute([$techId]);

    respond(['invoices' => $invoices, 'finance' => $fin->fetch()]);
}

// ─── POST: ایجاد فاکتور ──────────────────────────────────────
if ($method === 'POST') {
    $body       = getBody();
    $customerId = (int)($body['customer_id'] ?? 0);
    $items      = $body['items'] ?? [];

    if (!$customerId) respondError('انتخاب مشتری الزامی است');
    if (empty($items)) respondError('حداقل یک قلم خدمت الزامی است');

    $labor    = (float)($body['labor_cost'] ?? 0);
    $discount = (float)($body['discount'] ?? 0);
    $tax      = (float)($body['tax_percent'] ?? 0);
    $total    = calcTotal($labor, $discount, $tax, $items);

    // شماره فاکتور خودکار
    $prefix = 'INV';
    $settingsStmt = $db->prepare("SELECT invoice_prefix FROM settings WHERE technician_id = ?");
    $settingsStmt->execute([$techId]);
    $settings = $settingsStmt->fetch();
    if ($settings) $prefix = $settings['invoice_prefix'];

    $lastNum = $db->prepare("SELECT COUNT(*) FROM invoices WHERE technician_id = ?");
    $lastNum->execute([$techId]);
    $num = str_pad($lastNum->fetchColumn() + 1, 4, '0', STR_PAD_LEFT);
    $invoiceNumber = $prefix . '-' . date('Ym') . '-' . $num;

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("INSERT INTO invoices
            (technician_id, order_id, customer_id, invoice_number, labor_cost, discount, tax_percent, total_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $techId,
            !empty($body['order_id']) ? (int)$body['order_id'] : null,
            $customerId,
            $invoiceNumber,
            $labor, $discount, $tax, $total,
            trim($body['notes'] ?? ''),
        ]);
        $invId = $db->lastInsertId();

        $itemStmt = $db->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)");
        foreach ($items as $item) {
            $itemStmt->execute([
                $invId,
                trim($item['description'] ?? ''),
                (float)($item['quantity'] ?? 1),
                (float)($item['unit_price'] ?? 0),
            ]);
        }

        $db->commit();

        $new = $db->prepare("SELECT inv.*, c.name AS customer_name FROM invoices inv JOIN customers c ON c.id = inv.customer_id WHERE inv.id = ?");
        $new->execute([$invId]);
        $invoice = $new->fetch();

        $itemsFetch = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
        $itemsFetch->execute([$invId]);
        $invoice['items'] = $itemsFetch->fetchAll();

        respond($invoice, 201);
    } catch (Exception $e) {
        $db->rollBack();
        respondError('خطا در ذخیره فاکتور: ' . $e->getMessage());
    }
}

// ─── PUT: ثبت/ویرایش پرداخت ──────────────────────────────────
if ($method === 'PUT' && $id) {
    $check = $db->prepare("SELECT id, total_amount FROM invoices WHERE id = ? AND technician_id = ?");
    $check->execute([$id, $techId]);
    $invoice = $check->fetch();
    if (!$invoice) respondError('فاکتور یافت نشد', 404);

    $body      = getBody();
    $paidAmt   = (float)($body['paid_amount'] ?? 0);
    $total     = (float)$invoice['total_amount'];
    $payStatus = $paidAmt >= $total ? 'paid' : ($paidAmt > 0 ? 'partial' : 'unpaid');
    $paidAt    = $paidAmt > 0 ? date('Y-m-d H:i:s') : null;

    $db->prepare("UPDATE invoices SET payment_status=?, paid_amount=?, paid_at=? WHERE id=?")
       ->execute([$payStatus, $paidAmt, $paidAt, $id]);

    // ثبت پرداخت در جدول payments
    if ($paidAmt > 0) {
        $db->prepare("INSERT INTO payments (technician_id, invoice_id, amount, method, reference_code)
                      VALUES (?, ?, ?, ?, ?)")
           ->execute([$techId, $id, $paidAmt, $body['method'] ?? 'cash', $body['reference_code'] ?? null]);
    }

    respond(['message' => 'پرداخت ثبت شد', 'payment_status' => $payStatus]);
}

// ─── DELETE ───────────────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $check = $db->prepare("SELECT id FROM invoices WHERE id = ? AND technician_id = ?");
    $check->execute([$id, $techId]);
    if (!$check->fetch()) respondError('فاکتور یافت نشد', 404);

    $db->prepare("DELETE FROM invoices WHERE id = ?")->execute([$id]);
    respond(['message' => 'فاکتور حذف شد']);
}

respondError('متد نامعتبر', 405);
