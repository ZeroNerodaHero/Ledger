#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_DIR="$RUN_DIR/pids"
LOG_DIR="$RUN_DIR/logs"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"
DB_NAME="${DB_NAME:-ledger}"
DB_USER="${DB_USER:-ledger}"
DB_PASSWORD="${DB_PASSWORD:-ledger_dev_password}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

API_PID_FILE="$PID_DIR/api.pid"
WEB_PID_FILE="$PID_DIR/web.pid"
CADDY_PID_FILE="$PID_DIR/caddy.pid"
CADDYFILE="$RUN_DIR/Caddyfile"

mkdir -p "$PID_DIR" "$LOG_DIR"

usage() {
  echo "Usage: ./manage.sh <start|stop|status>"
}

as_root() {
  local target_user=""
  if [[ "${1:-}" == "-u" ]]; then
    target_user="${2:-}"
    shift 2
  fi

  if [[ -n "$target_user" ]]; then
    if [[ "$(id -u)" -eq 0 ]]; then
      if command -v runuser >/dev/null 2>&1; then
        runuser -u "$target_user" -- "$@"
      else
        su -s /bin/bash "$target_user" -c "$(printf '%q ' "$@")"
      fi
    elif command -v sudo >/dev/null 2>&1; then
      sudo -u "$target_user" "$@"
    else
      echo "This operation needs sudo to run as $target_user: $*"
      exit 1
    fi
    return
  fi

  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "This operation needs root privileges: $*"
    exit 1
  fi
}

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file")"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

stop_process() {
  local name="$1"
  local pid_file="$2"
  if is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    echo "Stopping $name (pid $pid)..."
    kill "$pid" 2>/dev/null || true
  else
    echo "$name not running"
  fi
  rm -f "$pid_file"
}

ensure_linux_dependencies() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    echo "manage.sh is intended for Linux droplets."
    exit 1
  fi
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "apt-get not found. Install required dependencies manually."
    exit 1
  fi

  local missing=()
  command -v node >/dev/null 2>&1 || missing+=("nodejs")
  command -v npm >/dev/null 2>&1 || missing+=("npm")
  command -v psql >/dev/null 2>&1 || missing+=("postgresql" "postgresql-contrib")
  command -v caddy >/dev/null 2>&1 || missing+=("caddy")

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Installing dependencies: ${missing[*]}"
    as_root apt-get update
    as_root apt-get install -y "${missing[@]}"
  fi
}

ensure_postgres() {
  as_root systemctl enable --now postgresql

  local psql_cmd="psql -v ON_ERROR_STOP=1"
  as_root -u postgres bash -lc "$psql_cmd <<'SQL'
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '${DB_USER}', '${DB_PASSWORD}');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', '${DB_USER}', '${DB_PASSWORD}');
  END IF;
END
\$\$;

SELECT format('CREATE DATABASE %I OWNER %I', '${DB_NAME}', '${DB_USER}')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}')
\gexec
SQL"
}

install_node_dependencies() {
  echo "Installing API dependencies..."
  (cd "$API_DIR" && npm install --include=dev)
  echo "Installing frontend dependencies..."
  (cd "$WEB_DIR" && npm install)
}

run_migrations() {
  echo "Running migrations..."
  (cd "$API_DIR" && DATABASE_URL="$DATABASE_URL" npm run migrate)
}

start_api() {
  stop_process "API" "$API_PID_FILE" >/dev/null 2>&1 || true
  echo "Starting API on :$API_PORT ..."
  (
    cd "$API_DIR"
    DATABASE_URL="$DATABASE_URL" PORT="$API_PORT" npm run dev >> "$LOG_DIR/api.log" 2>&1
  ) &
  echo $! > "$API_PID_FILE"
}

start_web() {
  stop_process "Frontend" "$WEB_PID_FILE" >/dev/null 2>&1 || true
  echo "Starting frontend on :$WEB_PORT ..."
  (
    cd "$WEB_DIR"
    NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" npm run dev -- -p "$WEB_PORT" >> "$LOG_DIR/web.log" 2>&1
  ) &
  echo $! > "$WEB_PID_FILE"
}

write_caddyfile() {
  cat > "$CADDYFILE" <<EOF
:80 {
  reverse_proxy localhost:${WEB_PORT}
}

:443 {
  tls internal
  reverse_proxy localhost:${WEB_PORT}
}
EOF
}

start_caddy() {
  rm -f "$CADDY_PID_FILE"
  write_caddyfile
  echo "Starting caddy on :80 and :443 ..."
  as_root bash -lc "nohup caddy run --config '$CADDYFILE' --adapter caddyfile >> '$LOG_DIR/caddy.log' 2>&1 & echo \$! > '$CADDY_PID_FILE'"
}

status_process() {
  local name="$1"
  local pid_file="$2"
  if is_running "$pid_file"; then
    echo "$name: running (pid $(cat "$pid_file"))"
  else
    echo "$name: stopped"
  fi
}

cmd="${1:-}"
case "$cmd" in
  start)
    ensure_linux_dependencies
    ensure_postgres
    install_node_dependencies
    run_migrations
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
    ;;
  stop)
    stop_process "Caddy" "$CADDY_PID_FILE"
    stop_process "Frontend" "$WEB_PID_FILE"
    stop_process "API" "$API_PID_FILE"
    ;;
  status)
    status_process "API" "$API_PID_FILE"
    status_process "Frontend" "$WEB_PID_FILE"
    status_process "Caddy" "$CADDY_PID_FILE"
    ;;
  *)
    usage
    exit 1
    ;;
esac
