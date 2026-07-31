#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
BACKUP_DIR="${RASPON_BACKUP_DIR:-/var/backups/raspon/postgres}"
STORAGE_BACKUP_DIR="${RASPON_STORAGE_BACKUP_DIR:-/var/backups/raspon/storage}"
STATUS_DIR="${RASPON_STATUS_DIR:-/var/lib/raspon-ops}"
RETENTION_DAYS="${RASPON_BACKUP_RETENTION_DAYS:-14}"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"

umask 077
mkdir -p "$BACKUP_DIR" "$STORAGE_BACKUP_DIR" "$STATUS_DIR"
cd "$APP_DIR"

set -a
# shellcheck disable=SC1091
. ./.env
set +a

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_path="${BACKUP_DIR}/raspon-postgres-${timestamp}.dump"
temporary_path="${final_path}.partial"
storage_final_path="${STORAGE_BACKUP_DIR}/raspon-storage-${timestamp}.tar.gz"
storage_temporary_path="${storage_final_path}.partial"
status_path="${STATUS_DIR}/backup-status.json"

on_error() {
  rm -f -- "$temporary_path" "$storage_temporary_path"
  printf '{"status":"failed","timestamp":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${status_path}.tmp"
  mv -f -- "${status_path}.tmp" "$status_path"
}
trap on_error ERR

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump --format=custom --compress=9 --no-owner --no-acl \
  -U "$POSTGRES_USER" "$POSTGRES_DB" > "$temporary_path"

test -s "$temporary_path"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore --list < "$temporary_path" > /dev/null

storage_mount="$(docker volume inspect raspon_raspon_storage_data --format '{{.Mountpoint}}')"
[[ "$storage_mount" == /var/lib/docker/volumes/*/_data ]]
tar -C "$storage_mount" -czf "$storage_temporary_path" .
test -s "$storage_temporary_path"
tar -tzf "$storage_temporary_path" > /dev/null

checksum="$(sha256sum "$temporary_path" | cut -d' ' -f1)"
printf '%s  %s\n' "$checksum" "$final_path" > "${temporary_path}.sha256"
mv -f -- "$temporary_path" "$final_path"
mv -f -- "${temporary_path}.sha256" "${final_path}.sha256"
storage_checksum="$(sha256sum "$storage_temporary_path" | cut -d' ' -f1)"
printf '%s  %s\n' "$storage_checksum" "$storage_final_path" > "${storage_temporary_path}.sha256"
mv -f -- "$storage_temporary_path" "$storage_final_path"
mv -f -- "${storage_temporary_path}.sha256" "${storage_final_path}.sha256"

find "$BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'raspon-postgres-*.dump' -o -name 'raspon-postgres-*.dump.sha256' \) \
  -mtime "+${RETENTION_DAYS}" -delete
find "$STORAGE_BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'raspon-storage-*.tar.gz' -o -name 'raspon-storage-*.tar.gz.sha256' \) \
  -mtime "+${RETENTION_DAYS}" -delete

size_bytes="$(stat -c %s "$final_path")"
storage_size_bytes="$(stat -c %s "$storage_final_path")"
printf '{"status":"ok","timestamp":"%s","file":"%s","sizeBytes":%s,"storageFile":"%s","storageSizeBytes":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$final_path" "$size_bytes" "$storage_final_path" "$storage_size_bytes" \
  > "${status_path}.tmp"
mv -f -- "${status_path}.tmp" "$status_path"
trap - ERR

printf 'Backups verified: database=%s bytes storage=%s bytes\n' "$size_bytes" "$storage_size_bytes"
