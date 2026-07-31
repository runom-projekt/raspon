<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
try {
    $raw = file_get_contents('php://input') ?: '';
    $timestamp = $_SERVER['HTTP_REVOLUT_REQUEST_TIMESTAMP'] ?? '';
    $provided = $_SERVER['HTTP_REVOLUT_SIGNATURE'] ?? '';
    if (!ctype_digit($timestamp) || abs(round(microtime(true)*1000)-(int)$timestamp) > 300000) throw new RuntimeException('Stale webhook');
    $expected = 'v1=' . hash_hmac('sha256', 'v1.' . $timestamp . '.' . $raw, cfg('HMS_REVOLUT_WEBHOOK_SECRET'));
    $valid = false; foreach (explode(',', $provided) as $part) if (hash_equals($expected, trim($part))) $valid = true;
    if (!$valid) throw new RuntimeException('Invalid signature');
    $event = json_decode($raw, true); $orderId = (string)($event['order_id'] ?? '');
    if (!in_array($event['event'] ?? '', ['ORDER_COMPLETED','ORDER_PAYMENT_FAILED','ORDER_PAYMENT_DECLINED'], true) || !preg_match('/^[0-9a-f-]{36}$/i',$orderId)) throw new RuntimeException('Invalid event');
    $order = revolut_request('GET', '/orders/' . rawurlencode($orderId));
    if (strtolower((string)($order['type'] ?? '')) === 'refund') {
        $reference = (string)($order['metadata']['reversal_id'] ?? $order['merchant_order_data']['reference'] ?? '');
        if (($order['metadata']['source'] ?? '') !== 'RASPON' || $reference === '') throw new RuntimeException('Refund source mismatch');
        raspon_callback_to(cfg('RASPON_REVERSAL_CALLBACK_URL'), [
          'event' => ($event['event'] ?? '') === 'ORDER_COMPLETED' ? 'REFUND_COMPLETED' : 'REFUND_FAILED',
          'reversalId' => $reference, 'providerOperationId' => $orderId,
          'amountMinor' => (int)($order['amount'] ?? -1), 'currency' => strtoupper((string)($order['currency'] ?? '')),
        ]);
    } else {
        $paymentId = (string)($order['metadata']['payment_id'] ?? $order['merchant_order_data']['reference'] ?? '');
        if (($order['metadata']['source'] ?? '') !== 'RASPON' || $paymentId === '') throw new RuntimeException('Order source mismatch');
        raspon_callback([
          'eventId' => ($event['event'] ?? '') . ':' . $orderId,
          'event' => ($event['event'] ?? '') === 'ORDER_COMPLETED' ? 'PAYMENT_COMPLETED' : 'PAYMENT_FAILED',
          'source' => 'RASPON',
          'paymentId' => $paymentId,
          'providerOrderId' => $orderId, 'amountMinor' => (int)($order['amount'] ?? -1),
          'currency' => strtoupper((string)($order['currency'] ?? '')),
        ]);
    }
    http_response_code(200); echo '{"received":true}';
} catch (Throwable $e) { http_response_code(400); echo '{"error":"rejected"}'; }
