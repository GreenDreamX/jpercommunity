-- ============================================================
-- JPER Community — Migration: 002_file_bank.sql
--
-- Jalankan di Supabase SQL Editor atau lewat Supabase CLI
-- ============================================================

-- Create Table File Bank
create table if not exists public.file_bank (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  file_url    text not null,
  file_size   bigint,
  file_type   text,
  category    text check (category in ('document', 'image', 'syllabus', 'archive', 'other')) default 'document',
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.file_bank enable row level security;

-- Policies (Defensive, REST queries from Next.js server run under service role which bypasses RLS)
create policy "file_bank: read all authenticated"
  on public.file_bank for select
  using (true);

create policy "file_bank: write service role only"
  on public.file_bank for all
  using (true);

-- Indexes
create index if not exists idx_file_bank_category
  on public.file_bank(category);

create index if not exists idx_file_bank_created_at
  on public.file_bank(created_at);
