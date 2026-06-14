-- ============================================================
-- MIGRATION: Distribusi Dana Module
-- Menambahkan tabel dan fungsi untuk fitur Distribusi Dana
-- ============================================================

-- 1. Tambah status 'tampil' ke attendance
ALTER TABLE IF EXISTS public.attendance
  DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('hadir', 'izin', 'bolos', 'tampil'));

-- 2. Tabel fund_distributions
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
  created_by UUID REFERENCES public.admin(id),
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

-- ============================================================
-- RPC: get_attendance_with_members
-- Mengembalikan data absensi dengan informasi anggota untuk
-- satu tanggal tertentu
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_attendance_with_members(p_date DATE)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'member_id', m.id,
        'member_name', m.name,
        'member_phone', m.phone,
        'divisi', m.divisi,
        'status', a.status
      )
      ORDER BY m.name ASC
    ),
    '[]'::jsonb
  )
  FROM public.attendance a
  JOIN public.members m ON m.id = a.member_id
  WHERE a.date::date = p_date;
$$;

-- ============================================================
-- RPC: get_attendance_dates_with_count
-- Mengembalikan daftar tanggal absensi beserta jumlah anggota
-- yang hadir/tampil, untuk dipilih saat membuat distribusi
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_attendance_dates_with_count()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', a.date,
        'total_count', COUNT(*)
      )
      ORDER BY a.date DESC
    ),
    '[]'::jsonb
  )
  FROM public.attendance a
  WHERE a.status IN ('hadir', 'tampil')
  GROUP BY a.date;
$$;

-- ============================================================
-- RPC: create_fund_distribution
-- Membuat distribusi dana baru beserta penerima dari absensi
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_fund_distribution(
  p_title TEXT,
  p_date DATE,
  p_source TEXT,
  p_total_amount NUMERIC,
  p_description TEXT,
  p_recipients JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_distribution_id UUID;
  v_recipient_count INTEGER;
  v_total_distributed NUMERIC;
  v_record JSONB;
BEGIN
  -- Hitung jumlah penerima dan total terdistribusi
  v_recipient_count := jsonb_array_length(p_recipients);
  v_total_distributed := 0;

  SELECT COALESCE(SUM((item->>'amount')::numeric), 0)
  INTO v_total_distributed
  FROM jsonb_array_elements(p_recipients) AS item;

  -- Insert distribusi
  INSERT INTO public.fund_distributions (
    title, date, source, total_amount, description,
    member_count, distributed_amount, remaining_amount
  ) VALUES (
    p_title, p_date, p_source, p_total_amount, p_description,
    v_recipient_count, v_total_distributed, p_total_amount - v_total_distributed
  )
  RETURNING id INTO v_distribution_id;

  -- Insert recipients
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_recipients)
  LOOP
    INSERT INTO public.fund_distribution_recipients (
      distribution_id, member_id, attendance_status, amount
    ) VALUES (
      v_distribution_id,
      (v_record->>'member_id')::uuid,
      v_record->>'status',
      (v_record->>'amount')::numeric
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_distribution_id,
    'member_count', v_recipient_count,
    'total_distributed', v_total_distributed,
    'remaining', p_total_amount - v_total_distributed
  );
END;
$$;

-- ============================================================
-- RPC: get_fund_distributions
-- Mengembalikan seluruh distribusi dana
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_fund_distributions()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', fd.id,
        'title', fd.title,
        'date', fd.date,
        'source', fd.source,
        'total_amount', fd.total_amount,
        'description', fd.description,
        'member_count', fd.member_count,
        'distributed_amount', fd.distributed_amount,
        'remaining_amount', fd.remaining_amount,
        'created_at', fd.created_at
      )
      ORDER BY fd.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.fund_distributions fd;
$$;

-- ============================================================
-- RPC: get_fund_distribution_detail
-- Mengembalikan detail distribusi + penerima
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_fund_distribution_detail(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_distribution JSONB;
  v_recipients JSONB;
BEGIN
  -- Ambil data distribusi
  SELECT jsonb_build_object(
    'id', fd.id,
    'title', fd.title,
    'date', fd.date,
    'source', fd.source,
    'total_amount', fd.total_amount,
    'description', fd.description,
    'member_count', fd.member_count,
    'distributed_amount', fd.distributed_amount,
    'remaining_amount', fd.remaining_amount,
    'created_at', fd.created_at
  )
  INTO v_distribution
  FROM public.fund_distributions fd
  WHERE fd.id = p_id;

  -- Ambil penerima dengan nama anggota
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', fdr.id,
        'distribution_id', fdr.distribution_id,
        'member_id', fdr.member_id,
        'member_name', m.name,
        'member_phone', m.phone,
        'divisi', m.divisi,
        'attendance_status', fdr.attendance_status,
        'amount', fdr.amount
      )
      ORDER BY m.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_recipients
  FROM public.fund_distribution_recipients fdr
  JOIN public.members m ON m.id = fdr.member_id
  WHERE fdr.distribution_id = p_id;

  RETURN jsonb_build_object(
    'distribution', v_distribution,
    'recipients', v_recipients
  );
END;
$$;

-- ============================================================
-- RPC: update_recipient_amount
-- Update nominal per penerima
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_recipient_amount(
  p_recipient_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_distribution_id UUID;
  v_old_amount NUMERIC;
  v_diff NUMERIC;
BEGIN
  -- Dapatkan distribution_id dan old amount
  SELECT fdr.distribution_id, fdr.amount
  INTO v_distribution_id, v_old_amount
  FROM public.fund_distribution_recipients fdr
  WHERE fdr.id = p_recipient_id;

  IF v_distribution_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_diff := p_amount - v_old_amount;

  -- Update recipient amount
  UPDATE public.fund_distribution_recipients
  SET amount = p_amount
  WHERE id = p_recipient_id;

  -- Update distribution totals
  UPDATE public.fund_distributions
  SET
    distributed_amount = distributed_amount + v_diff,
    remaining_amount = remaining_amount - v_diff,
    updated_at = now()
  WHERE id = v_distribution_id;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- RPC: delete_fund_distribution
-- Hapus distribusi (cascade ke recipients)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_fund_distribution(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.fund_distributions WHERE id = p_id;
  SELECT FOUND;
$$;
