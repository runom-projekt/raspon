<?php
define('RASPON_GATEWAY_SECRET', 'replace-with-the-same-random-32-plus-character-secret-as-raspon');
define('RASPON_CALLBACK_URL', 'https://raspon.de/api/internal/payment-gateway/events');
define('RASPON_REVERSAL_CALLBACK_URL', 'https://raspon.de/api/internal/payment-gateway/reversals/events');
define('HMS_REVOLUT_API_KEY', 'replace-with-revolut-secret-key');
define('HMS_REVOLUT_WEBHOOK_SECRET', 'replace-with-revolut-webhook-secret');
putenv('HMS_REVOLUT_ENVIRONMENT=sandbox');
