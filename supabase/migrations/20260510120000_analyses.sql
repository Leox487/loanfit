-- Run in Supabase SQL editor or via CLI migrations.
create extension if not exists "pgcrypto";

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  document_type text not null,
  raw_text text not null,
  loan_readiness_score integer not null,
  dscr numeric,
  revenue_trend text not null,
  debt_load text not null,
  cash_flow_consistency text not null,
  red_flags jsonb not null default '[]'::jsonb,
  fix_list jsonb not null default '[]'::jsonb,
  loan_types_qualified jsonb not null default '[]'::jsonb,
  full_report text not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_id_idx on public.analyses (user_id);
create index if not exists analyses_created_at_idx on public.analyses (created_at desc);
