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

Run everything (install deps + provision local Postgres + migrate + API + frontend + Caddy reverse proxy):

```bash
./manage.sh start
```

Check status:

```bash
./manage.sh status
```

Stop all:

```bash
./manage.sh stop
```

Notes:
- Caddy listens on ports `80` and `443` and proxies to frontend `3000`.
- `manage.sh` is designed for Linux droplets and auto-installs missing packages with `apt-get`.

## Linux Droplet Startup

```bash
./manage.sh start
```

This script:
- installs dependencies
- provisions local Postgres and runs migrations
- starts API + frontend
- installs/starts Caddy on ports `80` and `443`

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
