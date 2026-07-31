<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$destination = 'https://raspon.de/';
try {
    $claims = verify_checkout_token((string) ($_GET['token'] ?? ''));
    $destination = (string) $claims['returnUrl'];
    $record = load_raspon_order((string) $claims['paymentId']);
    $order = revolut_request('GET', '/orders/' . rawurlencode((string) $record['orderId']));
    $result = synchronize_raspon_order($claims, $order);
    $destination .= (str_contains($destination, '?') ? '&' : '?') . 'payment=' . rawurlencode($result);
} catch (Throwable $e) {
    $destination .= (str_contains($destination, '?') ? '&' : '?') . 'payment=verification-error';
}
header('Cache-Control: no-store');
header('Location: ' . $destination, true, 303);
exit;
