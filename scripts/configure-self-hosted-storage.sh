#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RASPON_APP_DIR:-/opt/raspon}"
ENV_FILE="${APP_DIR}/.env"
NGINX_FILE="/etc/nginx/sites-available/raspon"

[[ -f "$ENV_FILE" && -f "$NGINX_FILE" ]] || { echo "Required production configuration is missing" >&2; exit 1; }

set_env() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  grep -v "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  chmod --reference="$ENV_FILE" "$tmp"
  chown --reference="$ENV_FILE" "$tmp"
  mv "$tmp" "$ENV_FILE"
}

access_key="$(grep '^R2_ACCESS_KEY_ID=' "$ENV_FILE" | cut -d= -f2- || true)"
secret_key="$(grep '^R2_SECRET_ACCESS_KEY=' "$ENV_FILE" | cut -d= -f2- || true)"
[[ -n "$access_key" ]] || access_key="raspon$(openssl rand -hex 12)"
[[ -n "$secret_key" ]] || secret_key="$(openssl rand -hex 32)"

set_env R2_ACCOUNT_ID local
set_env R2_ACCESS_KEY_ID "$access_key"
set_env R2_SECRET_ACCESS_KEY "$secret_key"
set_env R2_BUCKET_NAME raspon-public
set_env R2_PRIVATE_BUCKET_NAME raspon-private
set_env R2_PUBLIC_URL https://raspon.de/media
set_env S3_ENDPOINT https://raspon.de
set_env S3_REGION us-east-1
set_env S3_FORCE_PATH_STYLE true

if ! grep -q 'RASPON_STORAGE_LOCATIONS' "$NGINX_FILE"; then
  cp "$NGINX_FILE" "${NGINX_FILE}.before-storage.$(date -u +%Y%m%dT%H%M%SZ)"
  tmp="$(mktemp)"
  awk '
    !inserted && /^[[:space:]]+location \/ \{/ {
      print "    # RASPON_STORAGE_LOCATIONS"
      print "    location ^~ /storage/ {"
      print "        client_max_body_size 8m;"
      print "        proxy_pass http://127.0.0.1:9000/;"
      print "        proxy_set_header Host $host;"
      print "        proxy_set_header X-Forwarded-Proto $scheme;"
      print "        proxy_request_buffering off;"
      print "    }"
      print ""
      print "    location ^~ /media/ {"
      print "        proxy_pass http://127.0.0.1:9000/raspon-public/;"
      print "        proxy_set_header Host $host;"
      print "        add_header Cache-Control \"public, max-age=31536000, immutable\" always;"
      print "    }"
      print ""
      inserted=1
    }
    { print }
  ' "$NGINX_FILE" > "$tmp"
  cat "$tmp" > "$NGINX_FILE"
  rm -f "$tmp"
fi

if ! grep -q 'RASPON_S3_BUCKET_LOCATIONS' "$NGINX_FILE"; then
  tmp="$(mktemp)"
  awk '
    !inserted && /^[[:space:]]+location \/ \{/ {
      print "    # RASPON_S3_BUCKET_LOCATIONS"
      print "    location ^~ /raspon-public/ {"
      print "        client_max_body_size 8m;"
      print "        proxy_pass http://127.0.0.1:9000;"
      print "        proxy_set_header Host $host;"
      print "        proxy_set_header X-Forwarded-Proto $scheme;"
      print "        proxy_request_buffering off;"
      print "    }"
      print ""
      print "    location ^~ /raspon-private/ {"
      print "        client_max_body_size 8m;"
      print "        proxy_pass http://127.0.0.1:9000;"
      print "        proxy_set_header Host $host;"
      print "        proxy_set_header X-Forwarded-Proto $scheme;"
      print "        proxy_request_buffering off;"
      print "    }"
      print ""
      inserted=1
    }
    { print }
  ' "$NGINX_FILE" > "$tmp"
  cat "$tmp" > "$NGINX_FILE"
  rm -f "$tmp"
fi

nginx -t
systemctl reload nginx
echo "Storage environment and reverse proxy configured"
