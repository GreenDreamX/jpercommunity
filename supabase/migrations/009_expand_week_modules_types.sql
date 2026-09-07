-- ============================================================
-- Migration 009: Expand Week Modules Types
-- ============================================================
-- Menambahkan 5 tipe modul baru: flashcard, audio, grammar, external_link, live_session
-- Total 10 tipe modul: file, video, notes, quiz, assignment, flashcard, audio, grammar, external_link, live_session
-- ============================================================

-- Drop existing check constraint if any and recreate
alter table public.week_modules
  drop constraint if exists week_modules_type_check;

alter table public.week_modules
  add constraint week_modules_type_check
  check (type in ('file', 'video', 'notes', 'quiz', 'assignment', 'flashcard', 'audio', 'grammar', 'external_link', 'live_session'));
