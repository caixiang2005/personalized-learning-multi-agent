#!/usr/bin/env bash
# Clone and start official Dify on port 8080
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DIFY_DIR="${DIFY_HOME:-$ROOT/dify-src}"
PORT="${DIFY_PORT:-8080}"

if [[ ! -f "$DIFY_DIR/docker/docker-compose.yaml" ]]; then
  echo "[dify] cloning langgenius/dify (shallow)..."
  git clone --depth 1 https://github.com/langgenius/dify.git "$DIFY_DIR"
fi

cd "$DIFY_DIR/docker"
if [[ ! -f .env ]]; then
  cp .env.example .env
  sed -i "s/^EXPOSE_NGINX_PORT=.*/EXPOSE_NGINX_PORT=$PORT/" .env || true
  if ! grep -q '^EXPOSE_NGINX_PORT=' .env; then
    echo "EXPOSE_NGINX_PORT=$PORT" >> .env
  fi
  sed -i "s/^NGINX_PORT=.*/NGINX_PORT=$PORT/" .env || true
fi

echo "[dify] docker compose up -d (first pull is slow)..."
docker compose up -d
echo "[dify] console -> http://127.0.0.1:$PORT"
echo "[dify] optional seed: integrations/dify/seed_agents.sql"
