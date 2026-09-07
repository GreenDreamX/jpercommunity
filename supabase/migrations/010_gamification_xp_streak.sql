-- ============================================================
-- Migration 010: Gamification (XP, Streak, & Leaderboard)
-- ============================================================
-- Menambahkan kolom xp, streak_count, dan last_login_date pada tabel profiles
-- ============================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Indeks untuk query papan peringkat (leaderboard) secara cepat
CREATE INDEX IF NOT EXISTS idx_profiles_xp_streak 
  ON public.profiles(xp DESC, streak_count DESC);
