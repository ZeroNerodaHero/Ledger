CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  location_note VARCHAR(200),
  tags_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  game_id UUID REFERENCES game(id) ON DELETE SET NULL,
  title VARCHAR(140) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  stake_usd NUMERIC(10,2)[],
  note VARCHAR(500),
  tags_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_stake_length CHECK (cardinality(stake_usd) >= 2 AND cardinality(stake_usd) <= 3)
);

CREATE TABLE IF NOT EXISTS action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('buy_in', 'cash_out')),
  amount_usd NUMERIC(14,2) NOT NULL CHECK (amount_usd > 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  note VARCHAR(500),
  tags_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_user_timestamp ON event (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_game_id ON event (game_id);
CREATE INDEX IF NOT EXISTS idx_game_user_name ON game (user_id, name);
CREATE INDEX IF NOT EXISTS idx_action_event_timestamp ON action (event_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_action_user_timestamp ON action (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_action_type ON action (action_type);
