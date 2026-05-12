#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_DIR="$RUN_DIR/pids"
LOG_DIR="$RUN_DIR/logs"

API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"

API_PID_FILE="$PID_DIR/api.pid"
WEB_PID_FILE="$PID_DIR/web.pid"
CADDY_PID_FILE="$PID_DIR/caddy.pid"

mkdir -p "$PID_DIR" "$LOG_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  echo "Example:"
  echo "  export DATABASE_URL='postgresql://ledger:ledger_dev_password@localhost:5432/ledger'"
  exit 1
fi

is_running() {
  local pid_file="$1"
  if [[ ! -f "$pid_file" ]]; then
    return 1
  fi
  local pid
  pid="$(cat "$pid_file")"
  if [[ -z "$pid" ]]; then
    return 1
  fi
  kill -0 "$pid" 2>/dev/null
}

stop_if_running() {
  local name="$1"
  local pid_file="$2"
  if is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    echo "Stopping old $name (pid $pid)..."
    kill "$pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
}

ensure_caddy() {
  if command -v caddy >/dev/null 2>&1; then
    return
  fi

  if [[ "$(uname -s)" != "Linux" ]]; then
    echo "This script is intended for Linux droplets."
    exit 1
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    echo "caddy not found and apt-get unavailable."
    echo "Install caddy manually and re-run this script."
    exit 1
  fi

  echo "Installing caddy..."
  if command -v sudo >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y caddy
  else
    apt-get update
    apt-get install -y caddy
  fi
}

write_caddyfile() {
  cat > "$RUN_DIR/Caddyfile" <<EOF
:80 {
  reverse_proxy localhost:${WEB_PORT}
}

:443 {
  tls internal
  reverse_proxy localhost:${WEB_PORT}
}
EOF
}

start_api() {
  stop_if_running "API" "$API_PID_FILE"
  echo "Starting API on :$API_PORT ..."
  (
    cd "$API_DIR"
    PORT="$API_PORT" npm run dev >> "$LOG_DIR/api.log" 2>&1
  ) &
  echo $! > "$API_PID_FILE"
}

start_web() {
  stop_if_running "frontend" "$WEB_PID_FILE"
  echo "Starting frontend on :$WEB_PORT ..."
  (
    cd "$WEB_DIR"
    NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" npm run dev -- -p "$WEB_PORT" >> "$LOG_DIR/web.log" 2>&1
  ) &
  echo $! > "$WEB_PID_FILE"
}

start_caddy() {
  stop_if_running "caddy" "$CADDY_PID_FILE"
  ensure_caddy
  write_caddyfile

  echo "Starting caddy on :80 and :443 ..."
  if command -v sudo >/dev/null 2>&1; then
    sudo caddy run --config "$RUN_DIR/Caddyfile" --adapter caddyfile >> "$LOG_DIR/caddy.log" 2>&1 &
  else
    caddy run --config "$RUN_DIR/Caddyfile" --adapter caddyfile >> "$LOG_DIR/caddy.log" 2>&1 &
  fi
  echo $! > "$CADDY_PID_FILE"
}

echo "Installing dependencies..."
(cd "$API_DIR" && npm install --include=dev)
(cd "$WEB_DIR" && npm install)

echo "Running migrations..."
(cd "$API_DIR" && npm run migrate)

start_api
start_web
start_caddy

echo
echo "Started."
echo "Visit:"
echo "  http://<droplet-ip>/"
echo "  https://<droplet-ip>/"
echo
echo "Logs:"
echo "  $LOG_DIR/api.log"
echo "  $LOG_DIR/web.log"
echo "  $LOG_DIR/caddy.log"
