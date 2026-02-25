-- ============================================================
-- Financial Analyst Dashboard — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── pipeline_runs ──────────────────────────────────────────────────────────
create table if not exists pipeline_runs (
  id              uuid primary key default gen_random_uuid(),
  run_at          timestamptz not null default now(),
  trigger         text not null default 'scheduled', -- 'scheduled' | 'manual'
  status          text not null default 'success',   -- 'success' | 'failed'
  model           text,
  input_tokens    integer,
  output_tokens   integer,
  duration_s      real,
  created_at      timestamptz not null default now()
);

-- ── portfolio_snapshots ────────────────────────────────────────────────────
create table if not exists portfolio_snapshots (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid references pipeline_runs(id) on delete cascade,
  snapshot_date     date not null,
  total_value       numeric(14,2),
  total_cost_basis  numeric(14,2),
  total_gain_loss   numeric(14,2),
  total_positions   integer,
  brokerages_json   jsonb,   -- { "Stash": { "value": 76000, "positions": 42 }, ... }
  asset_types_json  jsonb,   -- { "etf": { "value": 136000, "pct": 79.3 }, ... }
  created_at        timestamptz not null default now()
);
create index if not exists idx_snapshots_date on portfolio_snapshots(snapshot_date desc);

-- ── holdings ───────────────────────────────────────────────────────────────
create table if not exists holdings (
  id            uuid primary key default gen_random_uuid(),
  snapshot_id   uuid references portfolio_snapshots(id) on delete cascade,
  brokerage     text not null,
  ticker        text not null,
  name          text,
  type          text,          -- 'etf' | 'equity' | 'cash'
  quantity      numeric(16,6),
  cost_basis    numeric(14,2), -- nullable (SoFi/Acorns don't provide)
  price         numeric(12,4),
  value         numeric(14,2),
  gain_loss     numeric(14,2), -- nullable
  gain_loss_pct numeric(10,4), -- nullable
  currency      text default 'USD',
  created_at    timestamptz not null default now()
);
create index if not exists idx_holdings_snapshot on holdings(snapshot_id);
create index if not exists idx_holdings_ticker    on holdings(ticker);

-- ── enrichment ─────────────────────────────────────────────────────────────
create table if not exists enrichment (
  id            uuid primary key default gen_random_uuid(),
  snapshot_id   uuid references portfolio_snapshots(id) on delete cascade,
  ticker        text not null,
  technicals    jsonb,  -- price, sma_50, rsi_14, macd, bb_*, etc.
  fundamentals  jsonb,  -- sector, pe_trailing, analyst_target, etc.
  performance   jsonb,  -- return_1d..6m, pct_from_52w_high, analyst_upside_pct
  news          jsonb,  -- [{ title, publisher, link, published }]
  created_at    timestamptz not null default now()
);
create index if not exists idx_enrichment_snapshot on enrichment(snapshot_id);
create index if not exists idx_enrichment_ticker   on enrichment(ticker);
-- GIN index for JSONB queries
create index if not exists idx_enrichment_technicals on enrichment using gin(technicals);

-- ── analysis_reports ───────────────────────────────────────────────────────
create table if not exists analysis_reports (
  id                    uuid primary key default gen_random_uuid(),
  run_id                uuid references pipeline_runs(id) on delete cascade,
  analysis_date         date not null,
  overall_health        text,   -- 'strong' | 'moderate' | 'weak'
  summary               text,
  sector_concentration  text,
  risk_level            text,
  top_concern           text,
  action_items          jsonb,  -- string[]
  watchlist             jsonb,  -- [{ ticker, reason }]
  created_at            timestamptz not null default now()
);
create index if not exists idx_reports_date on analysis_reports(analysis_date desc);

-- ── recommendations ────────────────────────────────────────────────────────
create table if not exists recommendations (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid references analysis_reports(id) on delete cascade,
  ticker         text not null,
  name           text,
  brokerage      text,
  action         text not null,  -- 'BUY' | 'SELL' | 'HOLD'
  confidence     text,           -- 'high' | 'medium' | 'low'
  urgency        text,           -- 'immediate' | 'soon' | 'no_rush'
  thesis         text,
  bull_case      text,
  bear_case      text,
  key_signals    jsonb,   -- string[]
  risk_factors   jsonb,   -- string[]
  position_note  text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_recs_report  on recommendations(report_id);
create index if not exists idx_recs_action  on recommendations(action);
create index if not exists idx_recs_ticker  on recommendations(ticker);

-- ── refresh_requests ───────────────────────────────────────────────────────
create table if not exists refresh_requests (
  id              uuid primary key default gen_random_uuid(),
  requested_at    timestamptz not null default now(),
  status          text not null default 'pending', -- 'pending'|'running'|'completed'|'failed'
  picked_up_at    timestamptz,
  completed_at    timestamptz,
  error_message   text
);
create index if not exists idx_refresh_status on refresh_requests(status, requested_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Enable RLS on all tables
alter table pipeline_runs        enable row level security;
alter table portfolio_snapshots  enable row level security;
alter table holdings             enable row level security;
alter table enrichment           enable row level security;
alter table analysis_reports     enable row level security;
alter table recommendations      enable row level security;
alter table refresh_requests     enable row level security;

-- ── Policies: authenticated users can read everything ──────────────────────
-- (Single-user app — any logged-in user = you)
create policy "Auth users can read pipeline_runs"
  on pipeline_runs for select to authenticated using (true);

create policy "Auth users can read portfolio_snapshots"
  on portfolio_snapshots for select to authenticated using (true);

create policy "Auth users can read holdings"
  on holdings for select to authenticated using (true);

create policy "Auth users can read enrichment"
  on enrichment for select to authenticated using (true);

create policy "Auth users can read analysis_reports"
  on analysis_reports for select to authenticated using (true);

create policy "Auth users can read recommendations"
  on recommendations for select to authenticated using (true);

create policy "Auth users can read refresh_requests"
  on refresh_requests for select to authenticated using (true);

-- ── Policies: authenticated users can insert refresh requests ──────────────
create policy "Auth users can insert refresh_requests"
  on refresh_requests for insert to authenticated with check (true);

-- ── Policies: service_role can do everything (used by Mac sync scripts) ────
-- service_role bypasses RLS by default in Supabase — no explicit policy needed.
-- Just use the service_role key in sync_to_supabase.py and poll_refresh.py.

-- ============================================================
-- Done! Verify with:
--   select count(*) from pipeline_runs;
--   select tablename from pg_tables where schemaname = 'public';
-- ============================================================
