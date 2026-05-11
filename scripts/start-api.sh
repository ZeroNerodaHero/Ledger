#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  echo "Example:"
  echo "  export DATABASE_URL='postgresql://ledger:ledger_dev_password@localhost:5432/ledger'"
  exit 1
fi

echo "==> Installing API dependencies..."
cd "$API_DIR"
npm install --include=dev

echo "==> Running migrations..."
npm run migrate

echo "==> Starting API..."
npm run dev
