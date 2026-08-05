-- ============================================================
-- Migration 007: Course Access Control & Quiz Time Limit
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- COURSE ACCESS (multi-angkatan)
-- Jika tidak ada entry untuk suatu course → semua angkatan bisa akses.
-- Jika ada entry → hanya angkatan yang terdaftar yang bisa akses.
-- ────────────────────────────────────────────────────────────
create table if not exists public.course_access (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  angkatan   text not null,
  created_at timestamptz not null default now(),
  unique (course_id, angkatan)
);

-- ────────────────────────────────────────────────────────────
-- COURSE UNLOCKS (whitelist member spesifik)
-- Member spesifik yang bisa akses course terlepas dari angkatan.
-- ────────────────────────────────────────────────────────────
create table if not exists public.course_unlocks (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, profile_id)
);

-- ────────────────────────────────────────────────────────────
-- Tambah kolom time_limit_minutes ke quizzes
-- 0 = tidak ada batas waktu
-- > 0 = menit, LMS tampilkan countdown timer
-- ────────────────────────────────────────────────────────────
alter table public.quizzes
  add column if not exists time_limit_minutes int not null default 0;

-- ────────────────────────────────────────────────────────────
-- Tambah field assignment ke course_weeks
-- Submission tidak upload file ke Supabase — hanya link URL ke Cloudflare R2
-- ────────────────────────────────────────────────────────────
alter table public.course_weeks
  add column if not exists assignment_title       text,
  add column if not exists assignment_due_at      timestamptz,
  add column if not exists assignment_description text;

-- ────────────────────────────────────────────────────────────
-- Update submissions table — tambah file_name untuk display
-- ────────────────────────────────────────────────────────────
alter table public.submissions
  add column if not exists file_name text;

-- ────────────────────────────────────────────────────────────
-- Enable RLS
-- ────────────────────────────────────────────────────────────
alter table public.course_access  enable row level security;
alter table public.course_unlocks enable row level security;

-- Permissive policies (enforcement di API layer dengan service role)
drop policy if exists "course_access: full access via service role" on public.course_access;
create policy "course_access: full access via service role"
  on public.course_access for all
  using (true)
  with check (true);

drop policy if exists "course_unlocks: full access via service role" on public.course_unlocks;
create policy "course_unlocks: full access via service role"
  on public.course_unlocks for all
  using (true)
  with check (true);

-- ────────────────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────────────────
create index if not exists idx_course_access_course_id
  on public.course_access(course_id);

create index if not exists idx_course_access_angkatan
  on public.course_access(angkatan);

create index if not exists idx_course_unlocks_course_id
  on public.course_unlocks(course_id);

create index if not exists idx_course_unlocks_profile_id
  on public.course_unlocks(profile_id);
