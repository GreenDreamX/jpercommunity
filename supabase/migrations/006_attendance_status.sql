-- Migration 006: Add status column to attendance_records and manual attendance support

-- Add status column (hadir/izin/sakit/alpa/dispen)
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'hadir'
    CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa', 'dispen'));

-- Add unique constraint: 1 record per member per session
ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS uq_att_record_session_profile;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT uq_att_record_session_profile
    UNIQUE (attendance_session_id, profile_id);

-- Index for fast lookup by status
CREATE INDEX IF NOT EXISTS idx_attendance_records_status
  ON public.attendance_records(status);
