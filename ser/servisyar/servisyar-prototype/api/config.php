<?php
/**
 * سرویس‌یار - تنظیمات اتصال به پایگاه داده
 * ServisYar - Database Configuration
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'servisyar_db');     // نام دیتابیس در cPanel
define('DB_USER', 'cpanel_username_servisyar');  // یوزر MySQL در cPanel
define('DB_PASS', 'your_strong_password_here');  // پسورد MySQL
define('DB_CHARSET', 'utf8mb4');

// تنظیمات JWT
define('JWT_SECRET', 'servisyar_secret_key_change_this_2024');
define('JWT_EXPIRE', 86400); // 24 ساعت

// تنظیمات اپ
define('APP_VERSION', '1.2.0');
define('FREE_CUSTOMER_LIMIT', 50);

/**
 * اتصال به دیتابیس با PDO
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'خطا در اتصال به پایگاه داده']));
        }
    }
    return $pdo;
}

/**
 * هدرهای CORS و JSON
 */
function setHeaders(): void {
    $allowed = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $allowed");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * پاسخ موفق
 */
function respond(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * پاسخ خطا
 */
function respondError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * دریافت body درخواست JSON
 */
function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/**
 * احراز هویت با JWT ساده
 */
function auth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        respondError('احراز هویت ناموفق', 401);
    }
    $token = substr($header, 7);
    $decoded = verifyJWT($token);
    if (!$decoded) {
        respondError('توکن نامعتبر یا منقضی شده', 401);
    }
    return $decoded;
}

/**
 * ساخت JWT
 */
function createJWT(array $payload): string {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + JWT_EXPIRE;
    $payload['iat'] = time();
    $payloadEnc = base64url_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sig = base64url_encode(hash_hmac('sha256', "$header.$payloadEnc", JWT_SECRET, true));
    return "$header.$payloadEnc.$sig";
}

/**
 * تایید JWT
 */
function verifyJWT(string $token): array|false {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $payload, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return false;
    $data = json_decode(base64url_decode($payload), true);
    if ($data['exp'] < time()) return false;
    return $data;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}
