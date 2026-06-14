-- ============================================================
-- MIGRATION: Distribusi Dana Module + Multi Sesi
-- Jalankan di Supabase SQL Editor (https://supabase.com/dashboard/project/oqgncefjzcayspyujvat/sql/new)
-- ============================================================

-- 1. Tambah status 'tampil' ke attendance
ALTER TABLE IF EXISTS public.attendance
  DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('hadir', 'izin', 'bolos', 'tampil'));

-- 2. Ubah UNIQUE constraint: (member_id, date) → (member_id, date, location)
-- agar bisa multiple sesi per tanggal dibedakan oleh lokasi
ALTER TABLE IF EXISTS public.attendance
  DROP CONSTRAINT IF EXISTS attendance_member_id_date_key;
ALTER TABLE IF EXISTS public.attendance
  DROP CONSTRAINT IF EXISTS attendance_member_date_key;

ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT attendance_member_date_location_key
  UNIQUE (member_id, date, location);

-- 3. Update RPC save_attendance untuk pakai constraint baru
CREATE OR REPLACE FUNCTION save_attendance(records jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r jsonb;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(records)
  LOOP
    INSERT INTO public.attendance (member_id, date, status, location)
    VALUES (
      (r->>'member_id')::uuid,
      r->>'date',
      r->>'status',
      COALESCE(r->>'location', '')
    )
    ON CONFLICT (member_id, date, location)
    DO UPDATE SET status = EXCLUDED.status;
  END LOOP;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Tabel fund_distributions
CREATE TABLE IF NOT EXISTS public.fund_distributions (
CREATE TABLE IF NOT EXISTS public.fund_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  member_count INTEGER NOT NULL DEFAULT 0,
  distributed_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel fund_distribution_recipients
CREATE TABLE IF NOT EXISTS public.fund_distribution_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES public.fund_distributions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS policies (izinkan semua operasi untuk anon/authenticated)
ALTER TABLE public.fund_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_distribution_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.fund_distributions;
CREATE POLICY "Allow all" ON public.fund_distributions
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.fund_distribution_recipients;
CREATE POLICY "Allow all" ON public.fund_distribution_recipients
  FOR ALL USING (true) WITH CHECK (true);
