#!/usr/bin/env bash
set -Eeuo pipefail

if (($# != 2)); then
  printf 'Usage: %s RELEASE_ID ARCHIVE_PATH\n' "$0" >&2
  exit 64
fi

RELEASE_ID="$1"
ARCHIVE_PATH="$2"
APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
STATUS_DIR="${RASPON_STATUS_DIR:-/var/lib/raspon-ops}"
STAGE_DIR="/opt/raspon-stage-deploy-${RELEASE_ID}"
LOCK_PATH="/run/lock/raspon-deploy.lock"
STATUS_PATH="${STATUS_DIR}/deploy-status.json"
PRODUCTION_ENV="${APP_DIR}/.env"
PROJECT_NAME="raspon"
SMOKE_URL="${RASPON_SMOKE_URL:-https://raspon.de/api/health}"
SMOKE_ATTEMPTS="${RASPON_SMOKE_ATTEMPTS:-30}"

if [[ ! "$RELEASE_ID" =~ ^[a-z0-9][a-z0-9._-]{2,63}$ ]]; then
  printf 'Invalid release ID\n' >&2
  exit 64
fi
if [[ "$ARCHIVE_PATH" != /opt/raspon/releases/*.tar.gz ]]; then
  printf 'Archive must be under /opt/raspon/releases\n' >&2
  exit 64
fi

umask 077
mkdir -p "$STATUS_DIR"
exec 9>"$LOCK_PATH"
if ! flock -n 9; then
  printf 'Another Raspon deployment is running\n' >&2
  exit 75
fi

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
candidate_app="raspon-app:candidate-${RELEASE_ID}"
candidate_migrate="raspon-migrate:candidate-${RELEASE_ID}"
rollback_app="raspon-app:rollback-${RELEASE_ID}"
source_backup="${APP_DIR}/releases/source-before-${RELEASE_ID}.tar.gz"
activated=false
integration_started=false

write_status() {
  local status="$1"
  local phase="$2"
  printf '{"status":"%s","release":"%s","phase":"%s","startedAt":"%s","updatedAt":"%s"}\n' \
    "$status" "$RELEASE_ID" "$phase" "$started_at" \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${STATUS_PATH}.tmp"
  mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"
}

cleanup() {
  if "$integration_started"; then
    docker compose -p "raspon-deploy-test-${RELEASE_ID}" \
      -f "${STAGE_DIR}/docker-compose.integration.yml" down -v \
      > /dev/null 2>&1 || true
  fi
}

rollback() {
  local exit_code=$?
  set +e
  if "$activated" && docker image inspect "$rollback_app" > /dev/null 2>&1; then
    docker tag "$rollback_app" raspon-app:latest
    APP_IMAGE=raspon-app:latest docker compose -p "$PROJECT_NAME" \
      -f "${STAGE_DIR}/docker-compose.prod.yml" --env-file "$PRODUCTION_ENV" \
      up -d --no-deps --force-recreate app > /dev/null 2>&1
  fi
  write_status "failed" "rollback"
  cleanup
  exit "$exit_code"
}
trap rollback ERR
trap cleanup EXIT

write_status "running" "validate"
test -f "$ARCHIVE_PATH"
test -s "$ARCHIVE_PATH"
test -f "$PRODUCTION_ENV"
test ! -e "$source_backup"

if tar -tzf "$ARCHIVE_PATH" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  printf 'Unsafe archive path detected\n' >&2
  exit 65
fi

case "$STAGE_DIR" in
  /opt/raspon-stage-deploy-*) ;;
  *) exit 90 ;;
esac
rm -rf -- "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$STAGE_DIR"
test -f "${STAGE_DIR}/Dockerfile"
test -f "${STAGE_DIR}/docker-compose.prod.yml"
test -f "${STAGE_DIR}/docker-compose.integration.yml"

archive_sha256="$(sha256sum "$ARCHIVE_PATH" | cut -d' ' -f1)"
printf '%s  %s\n' "$archive_sha256" "$ARCHIVE_PATH" \
  > "${APP_DIR}/releases/${RELEASE_ID}.sha256"

write_status "running" "integration"
integration_started=true
docker compose -p "raspon-deploy-test-${RELEASE_ID}" \
  -f "${STAGE_DIR}/docker-compose.integration.yml" \
  up --build --abort-on-container-exit \
  --exit-code-from booking-concurrency-test
docker compose -p "raspon-deploy-test-${RELEASE_ID}" \
  -f "${STAGE_DIR}/docker-compose.integration.yml" down -v
integration_started=false

write_status "running" "backup"
systemctl start raspon-backup.service
test "$(systemctl show raspon-backup.service -p Result --value)" = "success"
tar --exclude='./releases' --exclude='./backups' --exclude='./.env' \
  --exclude='./node_modules' --exclude='./.next' \
  -czf "$source_backup" -C "$APP_DIR" .
docker image inspect raspon-app:latest > /dev/null
docker tag raspon-app:latest "$rollback_app"

set -a
# shellcheck disable=SC1091
. "$PRODUCTION_ENV"
set +a

write_status "running" "build"
docker build --target runner \
  --build-arg "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}" \
  --build-arg "R2_PUBLIC_URL=${R2_PUBLIC_URL:-}" \
  -t "$candidate_app" "$STAGE_DIR"
docker build --target builder -t "$candidate_migrate" "$STAGE_DIR"

write_status "running" "migrate"
APP_IMAGE="$candidate_app" MIGRATE_IMAGE="$candidate_migrate" \
  docker compose -p "$PROJECT_NAME" \
  -f "${STAGE_DIR}/docker-compose.prod.yml" --env-file "$PRODUCTION_ENV" \
  --profile tools run --rm -T migrate

write_status "running" "infrastructure"
docker compose -p "$PROJECT_NAME" \
  -f "${STAGE_DIR}/docker-compose.prod.yml" --env-file "$PRODUCTION_ENV" \
  up -d storage
docker compose -p "$PROJECT_NAME" \
  -f "${STAGE_DIR}/docker-compose.prod.yml" --env-file "$PRODUCTION_ENV" \
  run --rm -T storage-init
curl --fail --silent --show-error --connect-timeout 3 --max-time 10 \
  http://127.0.0.1:9000/minio/health/live > /dev/null

write_status "running" "activate"
docker tag "$candidate_app" raspon-app:latest
activated=true
APP_IMAGE=raspon-app:latest docker compose -p "$PROJECT_NAME" \
  -f "${STAGE_DIR}/docker-compose.prod.yml" --env-file "$PRODUCTION_ENV" \
  up -d --no-deps --force-recreate app

write_status "running" "smoke"
healthy=false
for _ in $(seq 1 "$SMOKE_ATTEMPTS"); do
  if response="$(curl --fail --silent --show-error \
    --connect-timeout 3 --max-time 10 "$SMOKE_URL" 2>/dev/null)" \
    && [[ "$response" == *'"database":"ok"'* ]]; then
    healthy=true
    break
  fi
  sleep 2
done
if ! "$healthy"; then
  printf 'Production smoke test failed\n' >&2
  false
fi

restart_count="$(docker inspect -f '{{.RestartCount}}' raspon-app-1)"
test "$restart_count" = "0"

write_status "running" "publish-source"
tar -xzf "$ARCHIVE_PATH" -C "$APP_DIR"
chmod 750 "${APP_DIR}"/scripts/*.sh

activated=false
write_status "ok" "complete"
printf 'Deployment complete: %s (%s)\n' "$RELEASE_ID" "$archive_sha256"
