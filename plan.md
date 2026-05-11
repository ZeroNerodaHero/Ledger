# Ledger MVP Plan

## Goal
Build a dockerized MVP for tracking personal financial movement:
- API server
- Real-time cron server
- Postgres database
- Next.js frontend using Jotai

This plan is intentionally focused on a quick, mockable foundation so schema and business logic can evolve after the stack is running.

## Product Shape (MVP)
- A user can create an account and sign in.
- A user can add financial movement events (loss/spend/income).
- A user can view transaction history and summary totals.
- A background cron process creates recurring entries and daily rollups.
- Data is stored in Postgres with audit-friendly timestamps.

## Proposed Architecture
- `apps/web`: Next.js app (React + Jotai + React Query).
- `apps/api`: Node.js API for auth, transactions, categories, and summary reads.
- `apps/realtime-cron`: Node.js worker for recurring events, reminders, and rollups.
- `postgres`: persistent relational store.

### Communication
- Web -> API: HTTP JSON (`/api/v1/*`).
- API -> Web: optional websocket updates for real-time refresh events.
- API + Cron -> Postgres: shared relational schema.
- Cron -> API/Web: event notifications (later can move to outbox + pub/sub).

## Initial Data Model (Mock v0)
Keep schema intentionally small now; expand later.

1. `app_user`
- `id`, `email`, `display_name`, `timezone`, `created_at`, `updated_at`

2. `category`
- `id`, `user_id`, `name`, `kind` (`expense|income|loss`), `created_at`

3. `transaction_event`
- `id`, `user_id`, `category_id`, `event_type` (`expense|income|loss|adjustment`)
- `amount_cents`, `currency`, `occurred_at`, `note`, `metadata`, `created_at`

4. `recurring_rule`
- `id`, `user_id`, `name`, `cron_expr`, `amount_cents`, `event_type`
- `category_id`, `is_active`, `next_run_at`, `last_run_at`, `created_at`

## API Scope (v0)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions`
- `GET /api/v1/stats/summary`
- `GET /healthz`

## Delivery Plan

### Phase 1: Mock Infra (this deliverable)
- Create monorepo directories for web/api/cron/postgres init.
- Add Dockerfiles for each app.
- Add `docker-compose.yml` connecting all four services.
- Add minimal service code and placeholder health endpoints.

### Phase 2: Auth + Core Writes
- Implement session auth.
- Add user + transaction create/list endpoints.
- Add migration scripts and seed data.

### Phase 3: Dashboard + Jotai State
- Build Next.js dashboard.
- Add transaction form and filter atoms.
- Hook UI to API with React Query.

### Phase 4: Cron + Realtime
- Add recurring rule execution loop.
- Emit update events and refresh summary views.
- Add idempotency keys and basic retry logic.

### Phase 5: Hardening
- Better input validation and error handling.
- Structured logs and request/job correlation IDs.
- Backups/migrations workflow and CI checks.

## Decisions Made
- Frontend: Next.js + Jotai (aligned to provided package list).
- Backend runtime: Node-based services (aligned to current infra package style).
- DB: Postgres for user and transaction tracking.
- Cron: separate service to isolate background workloads.

## Open Questions (Next Iteration)
- Should transactions remain single-table or move toward double-entry ledger?
- Should auth be session-cookie first or JWT first?
- How much realtime do we need in MVP (push vs poll)?
- Which recurring rules are required first (monthly bills, subscriptions, reminders)?
