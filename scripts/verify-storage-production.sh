#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
ENV_FILE="${APP_DIR}/.env"
cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

docker run --rm --network raspon_default --add-host raspon.de:host-gateway --env-file "$ENV_FILE" \
  -v "${APP_DIR}/scripts/verify-storage-sdk.mjs:/app/verify-storage-sdk.mjs:ro" \
  raspon-migrate:latest node /app/verify-storage-sdk.mjs
