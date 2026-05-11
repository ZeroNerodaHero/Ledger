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
