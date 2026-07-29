-- Migration: 004_profile_customization.sql
-- Menambahkan kustomisasi sosial media & privasi nomor whatsapp, serta jurusan siswa

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_whatsapp BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;

ALTER TABLE public.student_academic_info ADD COLUMN IF NOT EXISTS jurusan TEXT;
