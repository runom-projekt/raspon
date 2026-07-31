#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
STATUS_DIR="${RASPON_STATUS_DIR:-/var/lib/raspon-ops}"
BACKUP_DIR="${RASPON_BACKUP_DIR:-/var/backups/raspon/postgres}"
STORAGE_BACKUP_DIR="${RASPON_STORAGE_BACKUP_DIR:-/var/backups/raspon/storage}"
SITE_URL="${RASPON_SITE_URL:-https://raspon.de}"
SITE_HOST="${RASPON_SITE_HOST:-raspon.de}"
DISK_LIMIT_PERCENT="${RASPON_DISK_LIMIT_PERCENT:-85}"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
STATUS_PATH="${STATUS_DIR}/monitor-status.json"

umask 077
mkdir -p "$STATUS_DIR"
issues=()
recovered=false

test -f "${APP_DIR}/.env"
set -a
# shellcheck disable=SC1091
. "${APP_DIR}/.env"
set +a

health_ok() {
  local response
  response="$(curl --fail --silent --show-error \
    --connect-timeout 5 --max-time 15 "${SITE_URL}/api/health" 2>/dev/null)" \
    || return 1
  [[ "$response" == *'"database":"ok"'* ]]
}

if ! health_ok; then
  sleep 3
  if ! health_ok; then
    cd "$APP_DIR"
    docker compose -f "$COMPOSE_FILE" restart app > /dev/null
    sleep 8
    if health_ok; then
      recovered=true
    else
      issues+=("health")
    fi
  fi
fi

readiness_response="$(curl --fail --silent --show-error \
  --connect-timeout 5 --max-time 15 "${SITE_URL}/api/health" 2>/dev/null || true)"
if [[ "$readiness_response" == *'"status":"degraded"'* ]]; then
  issues+=("integrations")
fi

operations_response="$(curl --silent --show-error \
  --connect-timeout 5 --max-time 15 \
  -H "x-worker-secret: ${NOTIFICATION_WORKER_SECRET:-}" \
  http://127.0.0.1:3000/api/internal/operations/health 2>/dev/null || true)"
if [[ "$operations_response" != *'"status":"ok"'* ]]; then
  issues+=("operational-queues")
fi

disk_percent="$(df -P / | awk 'NR == 2 { gsub(/%/, "", $5); print $5 }')"
if [[ ! "$disk_percent" =~ ^[0-9]+$ ]] || (( disk_percent >= DISK_LIMIT_PERCENT )); then
  issues+=("disk")
fi

if ! timeout 15 openssl s_client -connect "${SITE_HOST}:443" \
  -servername "$SITE_HOST" < /dev/null 2>/dev/null \
  | openssl x509 -checkend 604800 -noout > /dev/null 2>&1; then
  issues+=("tls")
fi

if ! find "$BACKUP_DIR" -maxdepth 1 -type f \
  -name 'raspon-postgres-*.dump' -mmin -1560 -print -quit \
  | grep -q .; then
  issues+=("backup")
fi
if ! find "$STORAGE_BACKUP_DIR" -maxdepth 1 -type f \
  -name 'raspon-storage-*.tar.gz' -mmin -1560 -print -quit | grep -q .; then
  issues+=("storage-backup")
fi

if ! curl --fail --silent --show-error --connect-timeout 3 --max-time 5 \
  http://127.0.0.1:9000/minio/health/live > /dev/null; then
  issues+=("storage")
fi

if [[ ! -s "${STATUS_DIR}/restore-status.json" ]] \
  || ! find "$STATUS_DIR" -maxdepth 1 -type f \
    -name 'restore-status.json' -mtime -8 -print -quit | grep -q . \
  || ! grep -q '"status":"ok"' "${STATUS_DIR}/restore-status.json"; then
  issues+=("restore")
fi

if [[ ! -s "${STATUS_DIR}/notification-worker-status.json" ]] \
  || ! find "$STATUS_DIR" -maxdepth 1 -type f \
    -name 'notification-worker-status.json' -mmin -3 -print -quit | grep -q . \
  || ! grep -q '"status":"ok"' "${STATUS_DIR}/notification-worker-status.json"; then
  issues+=("notification-worker")
fi

if [[ ! -s "${STATUS_DIR}/booking-expiry-status.json" ]] \
  || ! find "$STATUS_DIR" -maxdepth 1 -type f \
    -name 'booking-expiry-status.json' -mmin -3 -print -quit | grep -q . \
  || ! grep -q '"status":"ok"' "${STATUS_DIR}/booking-expiry-status.json"; then
  issues+=("booking-expiry")
fi

if [[ ! -s "${STATUS_DIR}/payment-reversal-worker-status.json" ]] \
  || ! find "$STATUS_DIR" -maxdepth 1 -type f \
    -name 'payment-reversal-worker-status.json' -mmin -3 -print -quit | grep -q . \
  || ! grep -q '"status":"ok"' "${STATUS_DIR}/payment-reversal-worker-status.json"; then
  issues+=("payment-reversal-worker")
fi

if [[ ! -s "${STATUS_DIR}/cleanup-status.json" ]] \
  || ! find "$STATUS_DIR" -maxdepth 1 -type f \
    -name 'cleanup-status.json' -mtime -8 -print -quit | grep -q . \
  || ! grep -q '"status":"ok"' "${STATUS_DIR}/cleanup-status.json"; then
  issues+=("cleanup")
fi

restart_count="$(docker inspect -f '{{.RestartCount}}' raspon-app-1 2>/dev/null || echo 999)"
if [[ ! "$restart_count" =~ ^[0-9]+$ ]] || (( restart_count > 5 )); then
  issues+=("restarts")
fi

timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if ((${#issues[@]} == 0)); then
  printf '{"status":"ok","timestamp":"%s","recovered":%s,"diskPercent":%s,"appRestarts":%s}\n' \
    "$timestamp" "$recovered" "$disk_percent" "$restart_count" > "${STATUS_PATH}.tmp"
  mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"
  exit 0
fi

issue_list="$(IFS=,; printf '%s' "${issues[*]}")"
printf '{"status":"failed","timestamp":"%s","issues":"%s","recovered":%s,"diskPercent":%s,"appRestarts":%s}\n' \
  "$timestamp" "$issue_list" "$recovered" "$disk_percent" "$restart_count" \
  > "${STATUS_PATH}.tmp"
mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"

if [[ -f "${APP_DIR}/.ops.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${APP_DIR}/.ops.env"
  set +a
fi
if [[ -n "${OPS_ALERT_WEBHOOK_URL:-}" ]]; then
  curl --fail --silent --show-error --max-time 10 \
    -H 'Content-Type: application/json' \
    --data-binary "@${STATUS_PATH}" "$OPS_ALERT_WEBHOOK_URL" > /dev/null || true
fi

printf 'Production monitor failed: %s\n' "$issue_list" >&2
exit 1
