#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
STATUS_DIR="${RASPON_STATUS_DIR:-/var/lib/raspon-ops}"
RELEASE_DIR="${APP_DIR}/releases"
KEEP_RELEASES="${RASPON_RELEASE_RETENTION_COUNT:-10}"
LOCK_PATH="/run/lock/raspon-deploy.lock"
STATUS_PATH="${STATUS_DIR}/cleanup-status.json"

[[ "$KEEP_RELEASES" =~ ^[0-9]+$ ]] && (( KEEP_RELEASES >= 3 ))
[[ "$RELEASE_DIR" == /opt/raspon/releases ]]
umask 077
mkdir -p "$STATUS_DIR"
exec 9>"$LOCK_PATH"
flock -n 9

before_bytes="$(df -B1 / | awk 'NR == 2 { print $3 }')"
removed_release_files=0

prune_release_pattern() {
  local pattern="$1"
  local -a files=()
  mapfile -t files < <(find "$RELEASE_DIR" -maxdepth 1 -type f -name "$pattern" -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-)
  if ((${#files[@]} <= KEEP_RELEASES)); then return; fi
  local file
  for file in "${files[@]:KEEP_RELEASES}"; do
    case "$file" in
      "$RELEASE_DIR"/*) rm -f -- "$file"; ((removed_release_files+=1)) ;;
      *) printf 'Unsafe release path: %s\n' "$file" >&2; exit 90 ;;
    esac
  done
}

prune_release_pattern 'raspon-release-*.tar.gz'
prune_release_pattern 'source-before-*.tar.gz'
prune_release_pattern '*.sha256'

# Build cache is reproducible and never contains production data.
docker builder prune --all --force > /dev/null
docker container prune --force --filter 'until=24h' > /dev/null
docker image prune --force > /dev/null

after_bytes="$(df -B1 / | awk 'NR == 2 { print $3 }')"
freed_bytes=$((before_bytes - after_bytes))
if (( freed_bytes < 0 )); then freed_bytes=0; fi
disk_percent="$(df -P / | awk 'NR == 2 { gsub(/%/, "", $5); print $5 }')"
timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '{"status":"ok","timestamp":"%s","freedBytes":%s,"removedReleaseFiles":%s,"diskPercent":%s}\n' \
  "$timestamp" "$freed_bytes" "$removed_release_files" "$disk_percent" > "${STATUS_PATH}.tmp"
mv -f -- "${STATUS_PATH}.tmp" "$STATUS_PATH"
