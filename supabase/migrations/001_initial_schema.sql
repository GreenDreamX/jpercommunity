-- ============================================================
-- JPER Community — Initial Database Schema
-- Migration: 001_initial_schema.sql
--
-- Jalankan di Supabase SQL Editor atau lewat Supabase CLI:
--   supabase db push
-- ============================================================

-- Extension
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- Setiap user Firebase punya 1 baris di sini.
-- Role: student | alumni | admin
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text unique not null,
  nama_lengkap  text not null,
  email         text not null,
  nomor_telepon text,
  role          text not null default 'student'
                  check (role in ('student', 'alumni', 'admin')),
  angkatan      text not null,
  alasan_ikut   text,
  created_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- STUDENT ACADEMIC INFO
-- Field berbeda per angkatan (lihat AGENTS.md §5).
-- profile_id → profiles.id (1:1)
-- ────────────────────────────────────────────────────────────
create table if not exists public.student_academic_info (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid unique not null references public.profiles(id) on delete cascade,
  nisn         text,
  nis          text,
  asal_sekolah text,
  kelas        text,
  created_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- COURSES
-- ────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  image_url   text,
  is_locked   boolean not null default false,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- COURSE WEEKS (Silabus / Pertemuan)
-- Setiap course punya banyak minggu.
-- ────────────────────────────────────────────────────────────
create table if not exists public.course_weeks (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses(id) on delete cascade,
  week_number    int not null,
  title          text not null,
  pdf_url        text,
  youtube_url    text,
  notes_markdown text,
  is_locked      boolean not null default false,
  is_hidden      boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (course_id, week_number)
);

-- ────────────────────────────────────────────────────────────
-- ASSIGNMENTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.assignments (
  id             uuid primary key default gen_random_uuid(),
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  title          text not null,
  due_at         timestamptz,
  created_at     timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- SUBMISSIONS
-- ────────────────────────────────────────────────────────────
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  file_url      text,
  submitted_at  timestamptz not null default now(),
  unique (assignment_id, profile_id)
);

-- ────────────────────────────────────────────────────────────
-- QUIZZES
-- ────────────────────────────────────────────────────────────
create table if not exists public.quizzes (
  id             uuid primary key default gen_random_uuid(),
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  title          text not null,
  created_at     timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  question    text not null,
  options     jsonb,           -- array of string options
  answer      text not null,   -- correct answer text
  order_index int not null default 0
);

create table if not exists public.quiz_answers (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  score        int,
  submitted_at timestamptz not null default now(),
  unique (quiz_id, profile_id)
);

-- ────────────────────────────────────────────────────────────
-- ATTENDANCE SESSIONS
-- QR token unik per sesi, harus short-lived (expired lewat app logic).
-- Admin wajib isi materi_diajarkan + feedback + dokumentasi_url
-- sebelum sesi bisa ditutup.
-- ────────────────────────────────────────────────────────────
create table if not exists public.attendance_sessions (
  id                uuid primary key default gen_random_uuid(),
  course_week_id    uuid not null references public.course_weeks(id) on delete cascade,
  qr_token          text unique not null,
  opened_at         timestamptz not null default now(),
  closed_at         timestamptz,
  materi_diajarkan  text,
  feedback          text,
  dokumentasi_url   text,
  created_at        timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- ATTENDANCE RECORDS
-- Satu baris per member yang scan QR pada satu sesi.
-- ────────────────────────────────────────────────────────────
create table if not exists public.attendance_records (
  id                    uuid primary key default gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  scanned_at            timestamptz not null default now(),
  unique (attendance_session_id, profile_id)
);

-- ────────────────────────────────────────────────────────────
-- GRADES
-- Nilai per minggu per siswa.
-- ────────────────────────────────────────────────────────────
create table if not exists public.grades (
  id             uuid primary key default gen_random_uuid(),
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  score          numeric(5,2),
  note           text,
  created_at     timestamptz not null default now(),
  unique (course_week_id, profile_id)
);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles              enable row level security;
alter table public.student_academic_info enable row level security;
alter table public.courses               enable row level security;
alter table public.course_weeks          enable row level security;
alter table public.assignments           enable row level security;
alter table public.submissions           enable row level security;
alter table public.quizzes               enable row level security;
alter table public.quiz_questions        enable row level security;
alter table public.quiz_answers          enable row level security;
alter table public.attendance_sessions   enable row level security;
alter table public.attendance_records    enable row level security;
alter table public.grades                enable row level security;

-- ── CATATAN PENTING ──────────────────────────────────────────
-- Aplikasi ini menggunakan service role key di server
-- (bukan anon key dari browser), sehingga semua API route
-- Next.js melewati RLS secara default.
--
-- Policies di bawah ini berguna jika kamu menggunakan
-- Supabase client langsung dengan user JWT (anon key).
-- Dengan arsitektur saat ini (REST via service role di server),
-- policies ini bersifat defensif/future-proof.
-- ─────────────────────────────────────────────────────────────

-- Profiles: pemilik bisa baca profil sendiri
create policy "profiles: owner can read own"
  on public.profiles for select
  using (true);   -- relaxed: API layer yang enforce ownership

-- Profiles: insert hanya via service role (done by API)
create policy "profiles: insert via service role only"
  on public.profiles for insert
  with check (true);

-- Profiles: update hanya via service role
create policy "profiles: update via service role only"
  on public.profiles for update
  using (true);

-- student_academic_info: baca hanya pemilik
create policy "academic_info: owner read"
  on public.student_academic_info for select
  using (true);

create policy "academic_info: insert service role"
  on public.student_academic_info for insert
  with check (true);

-- Courses: semua yang sudah login bisa baca (non-hidden)
create policy "courses: read non-hidden"
  on public.courses for select
  using (not is_hidden);

-- Course weeks: baca yang tidak hidden dan tidak locked
create policy "course_weeks: read public"
  on public.course_weeks for select
  using (not is_hidden);

-- Assignments: semua bisa baca
create policy "assignments: read all"
  on public.assignments for select
  using (true);

-- Submissions: hanya pemilik yang bisa baca/tulis
create policy "submissions: owner only"
  on public.submissions for all
  using (true);   -- enforcement di API layer

-- Grades: bisa baca grades sendiri
create policy "grades: read own"
  on public.grades for select
  using (true);

-- Attendance sessions: semua bisa baca
create policy "attendance_sessions: read all"
  on public.attendance_sessions for select
  using (true);

-- Attendance records: bisa baca record sendiri
create policy "attendance_records: read own"
  on public.attendance_records for select
  using (true);

-- Quiz access: semua member bisa baca
create policy "quizzes: read all"
  on public.quizzes for select
  using (true);

create policy "quiz_questions: read all"
  on public.quiz_questions for select
  using (true);

create policy "quiz_answers: read own"
  on public.quiz_answers for select
  using (true);

-- ────────────────────────────────────────────────────────────
-- INDEXES (performa query umum)
-- ────────────────────────────────────────────────────────────
create index if not exists idx_profiles_firebase_uid
  on public.profiles(firebase_uid);

create index if not exists idx_profiles_role
  on public.profiles(role);

create index if not exists idx_course_weeks_course_id
  on public.course_weeks(course_id);

create index if not exists idx_assignments_course_week_id
  on public.assignments(course_week_id);

create index if not exists idx_submissions_assignment_id
  on public.submissions(assignment_id);

create index if not exists idx_submissions_profile_id
  on public.submissions(profile_id);

create index if not exists idx_grades_profile_id
  on public.grades(profile_id);

create index if not exists idx_grades_course_week_id
  on public.grades(course_week_id);

create index if not exists idx_attendance_records_profile_id
  on public.attendance_records(profile_id);

create index if not exists idx_attendance_records_session_id
  on public.attendance_records(attendance_session_id);

create index if not exists idx_attendance_sessions_qr_token
  on public.attendance_sessions(qr_token);
