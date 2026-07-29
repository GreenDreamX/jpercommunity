-- ============================================================
-- JPER Community — Migration: 003_notulensi.sql
--
-- Jalankan di Supabase SQL Editor atau lewat Supabase CLI
-- ============================================================

-- Create Table Notulensi
create table if not exists public.notulensi (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.notulensi enable row level security;

-- Policies (Defensive, REST queries from Next.js server run under service role)
create policy "notulensi: read all authenticated"
  on public.notulensi for select
  using (true);

create policy "notulensi: write service role only"
  on public.notulensi for all
  using (true);

-- Index
create index if not exists idx_notulensi_updated_at
  on public.notulensi(updated_at);
