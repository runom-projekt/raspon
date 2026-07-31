#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
STATUS_DIR="${RASPON_STATUS_DIR:-/var/lib/raspon-ops}"
STATUS_PATH="${STATUS_DIR}/booking-expiry-status.json"

umask 077
mkdir -p "$STATUS_DIR"
cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

test -n "${NOTIFICATION_WORKER_SECRET:-}"
response="$(curl --fail --silent --show-error \
  --connect-timeout 5 --max-time 50 \
  -X POST \
  -H "x-worker-secret: ${NOTIFICATION_WORKER_SECRET}" \
  http://127.0.0.1:3000/api/internal/bookings/expire)"

printf '{"status":"ok","timestamp":"%s","result":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$response" > "${STATUS_PATH}.tmp"
mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"
