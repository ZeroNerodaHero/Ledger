# Ledger Mock Stack

This repository now contains a mock MVP scaffold with:
- `web` (Next.js + Jotai)
- `api` (Node API placeholder)
- `realtime-cron` (Node cron placeholder)
- `postgres` (starter schema init)

## Run

```bash
docker compose up --build
```

## Local Dev Startup

```bash
export DATABASE_URL='postgresql://ledger:ledger_dev_password@localhost:5432/ledger'
./scripts/start-dev.sh
```

## All-in-One Manager

Run everything (migrate + API + frontend + Caddy reverse proxy):

```bash
export DATABASE_URL='postgresql://ledger:ledger_dev_password@localhost:5432/ledger'
./manage start
```

Check status:

```bash
./manage status
```

Stop all:

```bash
./manage stop
```

Notes:
- Caddy listens on ports `80` and `443` and proxies to frontend `3000`.
- If Caddy is missing, `./manage start` attempts install via Homebrew on macOS.

## Endpoints
- Web: `http://localhost:3000`
- API health: `http://localhost:4000/healthz`
- Cron health: `http://localhost:4100/healthz`
- Postgres: `localhost:5432`

## Notes
- This is a mock-up foundation, not full business logic yet.
- Detailed implementation plan lives in `plan.md`.
- Copy `env.yaml.example` to `env.yaml` for local secrets/config.
- `env.yaml` is gitignored and will not be committed.
