#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR="${RASPON_BACKUP_DIR:-/var/backups/raspon/postgres}"
STORAGE_BACKUP_DIR="${RASPON_STORAGE_BACKUP_DIR:-/var/backups/raspon/storage}"
STATUS_DIR="${RASPON_STATUS_DIR:-/var/lib/raspon-ops}"
IMAGE="${RASPON_POSTGRES_IMAGE:-postgres:16-alpine}"
STATUS_PATH="${STATUS_DIR}/restore-status.json"
CONTAINER_NAME="raspon-restore-check-$$"

umask 077
mkdir -p "$STATUS_DIR"

latest_backup="$(find "$BACKUP_DIR" -maxdepth 1 -type f \
  -name 'raspon-postgres-*.dump' -printf '%T@ %p\n' \
  | sort -nr | head -n 1 | cut -d' ' -f2-)"
test -n "$latest_backup"
test -s "$latest_backup"
sha256sum --check "${latest_backup}.sha256"
latest_storage_backup="$(find "$STORAGE_BACKUP_DIR" -maxdepth 1 -type f -name 'raspon-storage-*.tar.gz' -printf '%T@ %p\n' | sort -nr | head -n 1 | cut -d' ' -f2-)"
test -n "$latest_storage_backup"
test -s "$latest_storage_backup"
sha256sum --check "${latest_storage_backup}.sha256"
tar -tzf "$latest_storage_backup" > /dev/null
storage_restore_dir="$(mktemp -d)"
tar -xzf "$latest_storage_backup" -C "$storage_restore_dir"
test -d "$storage_restore_dir/.minio.sys"
test -d "$storage_restore_dir/raspon-public"
test -d "$storage_restore_dir/raspon-private"

cleanup() {
  docker rm -f "$CONTAINER_NAME" > /dev/null 2>&1 || true
  if [[ "$storage_restore_dir" == /tmp/tmp.* && -d "$storage_restore_dir" ]]; then
    rm -rf -- "$storage_restore_dir"
  fi
}
on_error() {
  cleanup
  printf '{"status":"failed","timestamp":"%s","backup":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$latest_backup" > "${STATUS_PATH}.tmp"
  mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"
}
trap cleanup EXIT
trap on_error ERR

docker run -d --name "$CONTAINER_NAME" \
  -e POSTGRES_PASSWORD=restore-check-only \
  -e POSTGRES_DB=raspon_restore_check \
  "$IMAGE" > /dev/null

for _ in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" pg_isready \
    -U postgres -d raspon_restore_check > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "$CONTAINER_NAME" pg_isready \
  -U postgres -d raspon_restore_check > /dev/null
docker exec -i "$CONTAINER_NAME" pg_restore \
  --exit-on-error --no-owner --no-acl \
  -U postgres -d raspon_restore_check < "$latest_backup"

table_count="$(docker exec "$CONTAINER_NAME" psql \
  -U postgres -d raspon_restore_check -Atc \
  "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public';")"
test "$table_count" -gt 0
docker exec "$CONTAINER_NAME" psql \
  -U postgres -d raspon_restore_check -Atc \
  'SELECT count(*) FROM "_prisma_migrations";' > /dev/null

printf '{"status":"ok","timestamp":"%s","backup":"%s","storageBackup":"%s","tables":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$latest_backup" "$latest_storage_backup" "$table_count" \
  > "${STATUS_PATH}.tmp"
mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"
trap - ERR

printf 'Restore verified: %s (%s public tables)\n' "$latest_backup" "$table_count"
