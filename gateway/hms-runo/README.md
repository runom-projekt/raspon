# Raspon payment gateway on hms-runo.de

Upload `raspon/pay/` below the HMS document root. Put a copy of
`raspon-gateway-config.example.php` one directory **above** the document root as
`raspon-gateway-config.php`; never publish or commit the real file.

Required public routes:

- `https://hms-runo.de/raspon/pay/?token=...`
- `https://hms-runo.de/raspon/pay/webhook.php` (Revolut webhook)
- `https://hms-runo.de/raspon/pay/return.php` (browser-return reconciliation)

The two servers share only a random HMAC secret. Browser sessions and passwords
are never shared. Checkout claims expire after 15 minutes; callbacks are signed,
timestamped, replay-safe in Raspon and matched against the stored amount/currency.
The gateway stores only an HMAC-keyed payment-to-order mapping below
`DOCUMENT_ROOT/.private/raspon-orders` (mode `0600`). On the browser return it
retrieves the authoritative Revolut order, validates source, amount and currency,
then retries the signed Raspon callback before redirecting the customer.

HMS Runo is the merchant of record. Every Revolut order created by this gateway
contains `metadata.source=RASPON`; this marker is also required on the signed
callback, so Raspon transactions remain separately reportable.
