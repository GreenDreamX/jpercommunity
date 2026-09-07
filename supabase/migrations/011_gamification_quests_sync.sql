-- ============================================================
-- Migration 011: Gamification Quests & Daily Login Sync
-- ============================================================
-- Menambahkan kolom daily_quests_data dan daily_login_claimed_date
-- pada tabel profiles untuk sinkronisasi penuh ke Supabase
-- ============================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS daily_quests_data JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS daily_login_claimed_date DATE;

-- Indeks untuk pencarian cepat berdasarkan tanggal login
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_date 
  ON public.profiles(last_login_date);
