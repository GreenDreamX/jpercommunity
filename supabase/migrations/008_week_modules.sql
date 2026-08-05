-- ============================================================
-- Migration 008: Week Modules (Modular Content System)
-- ============================================================
-- Menggantikan field tetap (pdf_url, youtube_url, dll) di course_weeks
-- dengan sistem modul fleksibel. Setiap konten per minggu adalah baris
-- terpisah yang bisa ditambah banyak, dikunci, atau disembunyikan.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- WEEK MODULES
-- Tipe yang didukung: file | video | notes | quiz | assignment
-- ────────────────────────────────────────────────────────────
create table if not exists public.week_modules (
  id             uuid primary key default gen_random_uuid(),
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  type           text not null check (type in ('file', 'video', 'notes', 'quiz', 'assignment')),
  title          text not null default '',
  -- content per type:
  -- file:       { "url": "https://...", "filename": "materi.pdf", "size": 12345 }
  -- video:      { "url": "https://youtube.com/...", "embed_url": "https://www.youtube.com/embed/..." }
  -- notes:      { "markdown": "# Rangkuman\n..." }
  -- quiz:       { "quiz_id": "uuid" }
  -- assignment: { "description": "...", "due_at": "ISO8601", "max_size_mb": 5 }
  content        jsonb not null default '{}',
  is_locked      boolean not null default false,
  is_hidden      boolean not null default false,
  order_index    int not null default 0,
  created_at     timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- Enable RLS
-- ────────────────────────────────────────────────────────────
alter table public.week_modules enable row level security;

drop policy if exists "week_modules: full access via service role" on public.week_modules;
create policy "week_modules: full access via service role"
  on public.week_modules for all
  using (true)
  with check (true);

-- ────────────────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────────────────
create index if not exists idx_week_modules_course_week_id
  on public.week_modules(course_week_id);

create index if not exists idx_week_modules_type
  on public.week_modules(type);

create index if not exists idx_week_modules_order
  on public.week_modules(course_week_id, order_index);

-- ────────────────────────────────────────────────────────────
-- Module Submissions (untuk tipe assignment)
-- Menggantikan tabel submissions yang lama untuk submission via modul
-- ────────────────────────────────────────────────────────────
create table if not exists public.module_submissions (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid not null references public.week_modules(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  file_url   text not null,
  file_name  text,
  file_size  bigint,
  submitted_at timestamptz not null default now(),
  unique (module_id, profile_id)  -- satu submission per siswa per modul
);

alter table public.module_submissions enable row level security;

drop policy if exists "module_submissions: full access via service role" on public.module_submissions;
create policy "module_submissions: full access via service role"
  on public.module_submissions for all
  using (true)
  with check (true);

create index if not exists idx_module_submissions_module_id
  on public.module_submissions(module_id);

create index if not exists idx_module_submissions_profile_id
  on public.module_submissions(profile_id);
