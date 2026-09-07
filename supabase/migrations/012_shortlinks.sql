-- ============================================================
-- Migration 012: Shortlinks Table & Default Slugs (s.jper.my.id)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shortlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  title TEXT,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by slug
CREATE INDEX IF NOT EXISTS idx_shortlinks_slug ON public.shortlinks(slug);

-- RLS Policy
ALTER TABLE public.shortlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shortlinks: read all"
  ON public.shortlinks FOR SELECT
  USING (true);

CREATE POLICY "shortlinks: insert all"
  ON public.shortlinks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "shortlinks: update all"
  ON public.shortlinks FOR UPDATE
  USING (true);

CREATE POLICY "shortlinks: delete all"
  ON public.shortlinks FOR DELETE
  USING (true);

-- Insert Default Shortlinks
INSERT INTO public.shortlinks (slug, target_url, title)
VALUES
  ('reg', 'https://forms.jper.my.id/register', 'Form Pendaftaran Anggota Baru'),
  ('lms', 'https://lms.jper.my.id', 'Portal LMS Pembelajaran'),
  ('studio', 'https://studio.jper.my.id', 'Studio Admin & Pengurus'),
  ('docs', 'https://docs.jper.my.id', 'Pusat Dokumentasi Resmi'),
  ('privacy', 'https://docs.jper.my.id/privacy', 'Kebijakan Privasi (UU PDP)'),
  ('terms', 'https://docs.jper.my.id/terms', 'Syarat & Ketentuan Layanan'),
  ('kurikulum', 'https://docs.jper.my.id/kurikulum', 'Silabus Kurikulum Bahasa Jepang'),
  ('wa', 'https://wa.me/6283850967918', 'WhatsApp Pembina SMKN 1 Majalaya')
ON CONFLICT (slug) DO UPDATE
  SET target_url = EXCLUDED.target_url,
      title = EXCLUDED.title;
