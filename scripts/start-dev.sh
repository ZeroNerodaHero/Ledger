#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  echo "Example:"
  echo "  export DATABASE_URL='postgresql://ledger:ledger_dev_password@localhost:5432/ledger'"
  exit 1
fi

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"

echo "==> Installing API dependencies..."
cd "$API_DIR"
npm install --include=dev

echo "==> Running DB migrations..."
npm run migrate

echo "==> Installing frontend dependencies..."
cd "$WEB_DIR"
npm install

echo "==> Starting API on port $API_PORT..."
cd "$API_DIR"
PORT="$API_PORT" npm run dev &
API_PID=$!

cleanup() {
  echo
  echo "==> Shutting down services..."
  kill "$API_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "==> Starting frontend on port $WEB_PORT..."
cd "$WEB_DIR"
NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" npm run dev -- -p "$WEB_PORT"
