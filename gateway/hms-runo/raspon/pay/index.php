<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
$error = null; $claims = null;
try {
    $token = (string) ($_POST['token'] ?? $_GET['token'] ?? '');
    $claims = verify_checkout_token($token);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $returnUrl = 'https://hms-runo.de/raspon/pay/return.php?token=' . rawurlencode($token);
        $order = revolut_request('POST', '/orders', raspon_order_body($claims, $returnUrl), $claims['paymentId']);
        if (empty($order['checkout_url'])) throw new RuntimeException('Keine Checkout-Adresse erhalten.');
        remember_raspon_order($claims, $order);
        header('Location: ' . $order['checkout_url'], true, 303); exit;
    }
} catch (Throwable $e) { $error = $e->getMessage(); }
function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Sichere Zahlung · Raspon</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f7f7f5;color:#20211f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.top{height:72px;background:#fff;border-bottom:1px solid #e8e8e4;display:flex;align-items:center;padding:0 24px}.logo{font-size:25px;font-weight:900;letter-spacing:-1px}.logo i{color:#ef6c35;font-style:normal}.wrap{max-width:560px;margin:48px auto;padding:0 18px}.card{background:white;border:1px solid #e8e8e4;border-radius:22px;padding:30px;box-shadow:0 12px 35px #25251f0d}.tag{display:inline-block;background:#fff0e8;color:#a63c11;border-radius:99px;padding:6px 10px;font-size:12px;font-weight:700}h1{font-size:26px;margin:18px 0 8px}.muted{color:#6b6d68;font-size:14px}.row{display:flex;justify-content:space-between;padding:18px 0;border-bottom:1px solid #eee}.sum{font-size:24px;font-weight:800}.btn{width:100%;height:52px;border:0;border-radius:999px;background:#ef6c35;color:#fff;font-weight:800;font-size:16px;cursor:pointer;margin-top:24px}.safe{text-align:center;font-size:12px;color:#777;margin-top:14px}.error{background:#fff0f0;color:#a51d1d;padding:16px;border-radius:12px}</style></head><body><header class="top"><div class="logo">RASP<i>O</i>N</div></header><main class="wrap"><section class="card">
<?php if ($error): ?><div class="error"><?=h($error)?></div><p class="muted">Bitte kehren Sie zu Raspon zurück und starten Sie die Zahlung erneut.</p>
<?php else: ?><span class="tag">SICHERE ZAHLUNG</span><h1>Buchung <?=h((string)$claims['bookingCode'])?></h1><p class="muted">Sie bleiben im sicheren Raspon-Zahlungsprozess. Die Abwicklung erfolgt über Revolut.</p><div class="row"><span>Gesamtbetrag</span><span class="sum"><?=h(number_format($claims['amountMinor']/100,2,',','.').' '.$claims['currency'])?></span></div><form method="post"><input type="hidden" name="token" value="<?=h($token)?>"><button class="btn" type="submit">Sicher zur Zahlung</button></form><p class="safe">SSL-verschlüsselt · 3-D Secure · Keine Kartendaten bei Raspon</p><?php endif; ?>
</section></main></body></html>
