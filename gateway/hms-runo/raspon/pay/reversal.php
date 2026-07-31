<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
try {
    $raw = file_get_contents('php://input') ?: '';
    $timestamp = $_SERVER['HTTP_X_GATEWAY_TIMESTAMP'] ?? '';
    $provided = $_SERVER['HTTP_X_GATEWAY_SIGNATURE'] ?? '';
    if (!ctype_digit($timestamp) || abs(round(microtime(true)*1000)-(int)$timestamp) > 300000) throw new RuntimeException('Stale request');
    $expected = hash_hmac('sha256', $timestamp . '.' . $raw, cfg('RASPON_GATEWAY_SECRET'));
    if (!hash_equals($expected, $provided)) throw new RuntimeException('Invalid signature');
    $request = json_decode($raw, true);
    if (!is_array($request) || !in_array($request['type'] ?? '', ['CANCEL_ORDER','FULL_REFUND'], true) || !preg_match('/^[0-9a-f-]{36}$/i',(string)($request['providerOrderId'] ?? ''))) throw new RuntimeException('Invalid request');
    if (($request['type'] ?? '') === 'CANCEL_ORDER') {
        $order = revolut_request('POST', '/orders/' . rawurlencode($request['providerOrderId']) . '/cancel', null, (string)$request['reversalId']);
        $result = ['providerOperationId' => (string)($order['id'] ?? $request['providerOrderId']), 'state' => 'COMPLETED'];
    } else {
        if (!is_int($request['amountMinor'] ?? null) || $request['amountMinor'] < 1 || !preg_match('/^[A-Z]{3}$/',(string)($request['currency'] ?? ''))) throw new RuntimeException('Invalid amount');
        $refund = revolut_request('POST', '/orders/' . rawurlencode($request['providerOrderId']) . '/refund', [
            'amount' => $request['amountMinor'], 'currency' => $request['currency'],
            'merchant_order_data' => ['reference' => (string)$request['reversalId']],
            'metadata' => ['source' => 'RASPON', 'reversal_id' => (string)$request['reversalId']],
            'description' => 'Raspon booking cancellation refund',
        ], (string)$request['reversalId']);
        $result = ['providerOperationId' => (string)($refund['id'] ?? ''), 'state' => strtolower((string)($refund['state'] ?? '')) === 'completed' ? 'COMPLETED' : 'SUBMITTED'];
        if ($result['providerOperationId'] === '') throw new RuntimeException('Missing refund order ID');
    }
    header('Content-Type: application/json'); echo json_encode($result);
} catch (Throwable $e) { http_response_code(400); header('Content-Type: application/json'); echo '{"error":"rejected"}'; }
