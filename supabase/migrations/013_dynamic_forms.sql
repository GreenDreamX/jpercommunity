-- ============================================================
-- Migration 013: Dynamic Forms & Feedback Database
-- ============================================================

-- 1. Table: forms
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: form_questions
CREATE TABLE IF NOT EXISTS public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'short_text', -- 'short_text' | 'long_text' | 'dropdown' | 'single_choice' | 'rating' | 'file_upload'
  options JSONB DEFAULT '[]'::jsonb, -- array of option strings for dropdown/single_choice
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: form_responses
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- map of question_id -> answer_value
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
CREATE INDEX IF NOT EXISTS idx_form_questions_form ON public.form_questions(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_form_responses_form ON public.form_responses(form_id, submitted_at DESC);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "forms: read all" ON public.forms FOR SELECT USING (true);
CREATE POLICY "forms: insert all" ON public.forms FOR INSERT WITH CHECK (true);
CREATE POLICY "forms: update all" ON public.forms FOR UPDATE USING (true);
CREATE POLICY "forms: delete all" ON public.forms FOR DELETE USING (true);

CREATE POLICY "form_questions: read all" ON public.form_questions FOR SELECT USING (true);
CREATE POLICY "form_questions: insert all" ON public.form_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "form_questions: update all" ON public.form_questions FOR UPDATE USING (true);
CREATE POLICY "form_questions: delete all" ON public.form_questions FOR DELETE USING (true);

CREATE POLICY "form_responses: read all" ON public.form_responses FOR SELECT USING (true);
CREATE POLICY "form_responses: insert all" ON public.form_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "form_responses: update all" ON public.form_responses FOR UPDATE USING (true);
CREATE POLICY "form_responses: delete all" ON public.form_responses FOR DELETE USING (true);

-- Seed Initial Form: 'feedback'
INSERT INTO public.forms (id, slug, title, description, is_published)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'feedback',
  'Form Evaluasi Presensi & Kelas Mingguan',
  'Berikan umpan balik, masukan, dan evaluasi pembelajaran untuk membantu pembina dan pengurus meningkatkan kualitas kelas ekskul.',
  true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description;

-- Seed Questions for 'feedback'
INSERT INTO public.form_questions (id, form_id, question_text, question_type, options, placeholder, is_required, order_index)
VALUES
(
  'b1010000-0000-4000-8000-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Kategori Pertemuan / Kelas',
  'dropdown',
  '["Perkenalan & Hiragana Basics", "Katakana & Kosakata Harian", "Kanji Dasar & JLPT N5", "Kaiwa (Percakapan Harian)", "Shodō (Kaligrafi) & Bunkasai"]'::jsonb,
  'Pilih pertemuan kelas yang dievaluasi',
  true,
  1
),
(
  'b1010000-0000-4000-8000-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Penilaian Kepuasan Sesi Latihan (Rating 1-5)',
  'rating',
  '[]'::jsonb,
  'Berikan bintang 1 sampai 5',
  true,
  2
),
(
  'b1010000-0000-4000-8000-000000000003',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Kesan, Pesan, dan kendala yang Dihadapi',
  'long_text',
  '[]'::jsonb,
  'Tuliskan kesan, pesan, atau kendala yang dihadapi saat mengikuti sesi latihan bahasa Jepang...',
  true,
  3
)
ON CONFLICT (id) DO UPDATE
  SET question_text = EXCLUDED.question_text,
      options = EXCLUDED.options;
