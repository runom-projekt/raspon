<?php
declare(strict_types=1);

$externalConfig = dirname((string) $_SERVER['DOCUMENT_ROOT']) . '/raspon-gateway-config.php';
if (is_file($externalConfig)) require $externalConfig;
$stratoConfig = rtrim((string) $_SERVER['DOCUMENT_ROOT'], '/\\') . '/.private/raspon-gateway-config.php';
if (!defined('RASPON_GATEWAY_SECRET') && is_file($stratoConfig)) require $stratoConfig;

function cfg(string $name): string {
    $value = getenv($name) ?: (defined($name) ? constant($name) : '');
    if (!is_string($value) || $value === '') throw new RuntimeException("Missing configuration: {$name}");
    return $value;
}
function decode_b64url(string $input): string|false { return base64_decode(strtr($input, '-_', '+/'), true); }
function verify_checkout_token(string $token): array {
    $parts = explode('.', $token);
    if (count($parts) !== 2) throw new RuntimeException('Ungültiger Zahlungslink.');
    [$payload, $signature] = $parts;
    $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, cfg('RASPON_GATEWAY_SECRET'), true)), '+/', '-_'), '=');
    if (!hash_equals($expected, $signature)) throw new RuntimeException('Ungültiger Zahlungslink.');
    $decoded = decode_b64url($payload);
    $claims = $decoded === false ? null : json_decode($decoded, true);
    if (!is_array($claims) || ($claims['version'] ?? null) !== 1 || ($claims['expiresAt'] ?? 0) <= time()) throw new RuntimeException('Der Zahlungslink ist abgelaufen.');
    if (!preg_match('/^[A-Z]{3}$/', (string) ($claims['currency'] ?? '')) || !is_int($claims['amountMinor'] ?? null) || $claims['amountMinor'] < 1) throw new RuntimeException('Ungültige Zahlungsdaten.');
    $return = parse_url((string) ($claims['returnUrl'] ?? ''));
    if (($return['scheme'] ?? '') !== 'https' || ($return['host'] ?? '') !== 'raspon.de') throw new RuntimeException('Ungültige Rücksprungadresse.');
    return $claims;
}
function revolut_base(): string {
    return (getenv('HMS_REVOLUT_ENVIRONMENT') ?: 'sandbox') === 'production' ? 'https://merchant.revolut.com/api' : 'https://sandbox-merchant.revolut.com/api';
}
function revolut_request(string $method, string $path, ?array $body = null, ?string $idempotencyKey = null): array {
    $headers = ['Authorization: Bearer ' . cfg('HMS_REVOLUT_API_KEY'), 'Revolut-Api-Version: 2026-04-20', 'Content-Type: application/json'];
    if ($idempotencyKey) $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
    $ch = curl_init(revolut_base() . $path);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_SLASHES));
    $raw = curl_exec($ch); $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); $error = curl_error($ch); curl_close($ch);
    if ($raw === false || $status < 200 || $status >= 300) throw new RuntimeException("Payment provider error ({$status}) {$error}");
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) throw new RuntimeException('Invalid payment provider response.');
    return $decoded;
}
function raspon_callback_to(string $url, array $payload): void {
    $raw = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $timestamp = (string) round(microtime(true) * 1000);
    $signature = hash_hmac('sha256', $timestamp . '.' . $raw, cfg('RASPON_GATEWAY_SECRET'));
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $raw, CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Gateway-Timestamp: ' . $timestamp, 'X-Gateway-Signature: ' . $signature], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
    curl_exec($ch); $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    if ($status < 200 || $status >= 300) throw new RuntimeException("Raspon callback failed ({$status})");
}
function raspon_callback(array $payload): void { raspon_callback_to(cfg('RASPON_CALLBACK_URL'), $payload); }

function raspon_order_body(array $claims, string $redirectUrl): array {
    return [
        'amount' => $claims['amountMinor'], 'currency' => $claims['currency'],
        'description' => 'Raspon ' . $claims['bookingCode'],
        'merchant_order_data' => ['reference' => $claims['paymentId']],
        'metadata' => ['source' => 'RASPON', 'payment_id' => $claims['paymentId'], 'booking_code' => $claims['bookingCode']],
        'redirect_url' => $redirectUrl,
    ];
}

function raspon_order_store_path(string $paymentId): string {
    $base = rtrim((string) $_SERVER['DOCUMENT_ROOT'], '/\\') . '/.private/raspon-orders';
    if (!is_dir($base) && !mkdir($base, 0700, true) && !is_dir($base)) throw new RuntimeException('Order store unavailable.');
    return $base . '/' . hash_hmac('sha256', $paymentId, cfg('RASPON_GATEWAY_SECRET')) . '.json';
}

function remember_raspon_order(array $claims, array $order): void {
    $orderId = (string) ($order['id'] ?? '');
    if (!preg_match('/^[0-9a-f-]{36}$/i', $orderId)) throw new RuntimeException('Invalid provider order ID.');
    $record = json_encode(['paymentId' => $claims['paymentId'], 'orderId' => $orderId, 'createdAt' => time()], JSON_UNESCAPED_SLASHES);
    $path = raspon_order_store_path((string) $claims['paymentId']);
    $temporary = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
    if (file_put_contents($temporary, $record, LOCK_EX) === false) throw new RuntimeException('Order store unavailable.');
    chmod($temporary, 0600);
    if (!rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Order store unavailable.'); }
}

function load_raspon_order(string $paymentId): array {
    $path = raspon_order_store_path($paymentId);
    if (!is_file($path)) throw new RuntimeException('Order mapping not found.');
    $record = json_decode((string) file_get_contents($path), true);
    if (!is_array($record) || !hash_equals((string) ($record['paymentId'] ?? ''), $paymentId) || !preg_match('/^[0-9a-f-]{36}$/i', (string) ($record['orderId'] ?? ''))) throw new RuntimeException('Invalid order mapping.');
    return $record;
}

function validate_raspon_order(array $claims, array $order): void {
    if (($order['metadata']['source'] ?? '') !== 'RASPON' || !hash_equals((string) $claims['paymentId'], (string) ($order['metadata']['payment_id'] ?? $order['merchant_order_data']['reference'] ?? ''))) throw new RuntimeException('Order source mismatch.');
    if ((int) ($order['amount'] ?? -1) !== $claims['amountMinor'] || strtoupper((string) ($order['currency'] ?? '')) !== $claims['currency']) throw new RuntimeException('Order amount mismatch.');
}

function synchronize_raspon_order(array $claims, array $order): string {
    validate_raspon_order($claims, $order);
    $state = strtolower((string) ($order['state'] ?? ''));
    $orderId = (string) $order['id'];
    if ($state === 'completed') {
        raspon_callback(['eventId' => 'RETURN_COMPLETED:' . $orderId, 'event' => 'PAYMENT_COMPLETED', 'source' => 'RASPON', 'paymentId' => $claims['paymentId'], 'providerOrderId' => $orderId, 'amountMinor' => $claims['amountMinor'], 'currency' => $claims['currency']]);
        return 'success';
    }
    if (in_array($state, ['failed', 'cancelled'], true)) {
        raspon_callback(['eventId' => 'RETURN_FAILED:' . $orderId, 'event' => 'PAYMENT_FAILED', 'source' => 'RASPON', 'paymentId' => $claims['paymentId'], 'providerOrderId' => $orderId, 'amountMinor' => $claims['amountMinor'], 'currency' => $claims['currency']]);
        return 'failed';
    }
    return 'pending';
}
