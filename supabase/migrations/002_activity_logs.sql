-- Activity logs for tracking administrative and member actions
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  actor_role text not null default 'student',
  action text not null,
  details text not null,
  category text not null default 'UMUM',
  created_at timestamptz not null default now()
);

-- RLS Policy
alter table public.activity_logs enable row level security;

create policy "activity_logs: read all authenticated"
  on public.activity_logs for select
  to authenticated
  using (true);

create policy "activity_logs: insert authenticated"
  on public.activity_logs for insert
  to authenticated
  with check (true);

create index if not exists idx_activity_logs_created_at
  on public.activity_logs(created_at desc);

create index if not exists idx_activity_logs_category
  on public.activity_logs(category);
