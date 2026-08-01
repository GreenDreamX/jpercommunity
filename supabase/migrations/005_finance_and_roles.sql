-- Migration 005: Finance & Uang Kas Tables

-- 1. Uang Kas Mingguan Records
create table if not exists public.kas_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  amount numeric not null default 0,
  paid_at timestamptz not null default now(),
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Unique constraint: Profile can only have 1 record per week
alter table public.kas_records
  drop constraint if exists unique_profile_week_kas;

alter table public.kas_records
  add constraint unique_profile_week_kas unique (profile_id, week_number);

-- Indexes for kas_records
create index if not exists idx_kas_records_profile_id on public.kas_records(profile_id);
create index if not exists idx_kas_records_week_number on public.kas_records(week_number);

-- 2. Finance Transactions (Arus Kas Masuk & Keluar)
create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('in', 'out')),
  category text not null,
  amount numeric not null check (amount >= 0),
  description text not null,
  transaction_date timestamptz not null default now(),
  receipt_url text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indexes for finance_transactions
create index if not exists idx_finance_tx_type on public.finance_transactions(type);
create index if not exists idx_finance_tx_date on public.finance_transactions(transaction_date);

-- Enable RLS
alter table public.kas_records enable row level security;
alter table public.finance_transactions enable row level security;

-- Permissive service role policies
drop policy if exists "Service role full access on kas_records" on public.kas_records;
create policy "Service role full access on kas_records"
  on public.kas_records for all
  using (true)
  with check (true);

drop policy if exists "Service role full access on finance_transactions" on public.finance_transactions;
create policy "Service role full access on finance_transactions"
  on public.finance_transactions for all
  using (true)
  with check (true);
