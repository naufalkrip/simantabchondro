-- ============================================================
-- SIMANTAB - Complete Database Setup Script
-- Copy and paste the ENTIRE script into Supabase SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. DROP EXISTING TABLES (safe for fresh setup)
-- ============================================================

DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.media_inventory CASCADE;
DROP TABLE IF EXISTS public.media_accounts CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.finance CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.admin CASCADE;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- 3a. admin
CREATE TABLE public.admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  session_version integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3b. members
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  joined_date date DEFAULT CURRENT_DATE,
  divisi text NOT NULL DEFAULT 'Anggota',
  total_balance numeric DEFAULT 0 NOT NULL,
  bank_owner_name text,
  bank_account_number text,
  bank_name text,
  username text,
  password text DEFAULT '123',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3c. transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('setoran', 'penarikan')),
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_url text,
  note text DEFAULT '',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3d. attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  date text NOT NULL,
  status text NOT NULL CHECK (status IN ('hadir', 'izin', 'bolos')),
  location text DEFAULT '',
  UNIQUE(member_id, date)
);

-- 3e. finance
CREATE TABLE public.finance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('masuk', 'keluar')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL CHECK (category IN ('pengurus', 'media')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3f. schedules
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('latihan', 'tampilan', 'rapat', 'lainnya'))
);

-- 3g. media_accounts
CREATE TABLE public.media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  username text NOT NULL,
  password text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  last_updated timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3h. media_inventory
CREATE TABLE public.media_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  condition text NOT NULL DEFAULT 'bagus' CHECK (condition IN ('bagus', 'jelek')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3i. settings
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
-- admin
DROP POLICY IF EXISTS "Allow all on admin" ON public.admin;
CREATE POLICY "Allow all on admin" ON public.admin FOR ALL USING (true);

-- members
DROP POLICY IF EXISTS "Allow all on members" ON public.members;
CREATE POLICY "Allow all on members" ON public.members FOR ALL USING (true);

-- transactions (SELECT allowed, writes via RPC)
DROP POLICY IF EXISTS "Allow read on transactions" ON public.transactions;
CREATE POLICY "Allow read on transactions" ON public.transactions FOR SELECT USING (true);

-- attendance (SELECT allowed, writes via RPC)
DROP POLICY IF EXISTS "Allow read on attendance" ON public.attendance;
CREATE POLICY "Allow read on attendance" ON public.attendance FOR SELECT USING (true);

-- schedules (all via RPC)
DROP POLICY IF EXISTS "Allow all on schedules" ON public.schedules;
CREATE POLICY "Allow all on schedules" ON public.schedules FOR ALL USING (true);

-- finance (direct CRUD)
DROP POLICY IF EXISTS "Allow all on finance" ON public.finance;
CREATE POLICY "Allow all on finance" ON public.finance FOR ALL USING (true);

-- media_accounts (direct CRUD)
DROP POLICY IF EXISTS "Allow all on media_accounts" ON public.media_accounts;
CREATE POLICY "Allow all on media_accounts" ON public.media_accounts FOR ALL USING (true);

-- media_inventory (direct CRUD)
DROP POLICY IF EXISTS "Allow all on media_inventory" ON public.media_inventory;
CREATE POLICY "Allow all on media_inventory" ON public.media_inventory FOR ALL USING (true);

-- settings (direct CRUD)
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true);

-- ============================================================
-- 5. RPC FUNCTIONS
-- ============================================================

-- 5a. login_admin
CREATE OR REPLACE FUNCTION login_admin(
  input_username text,
  input_password text
)
RETURNS TABLE(id uuid, username text, session_version integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.username, a.session_version
  FROM public.admin a
  WHERE a.username = input_username
    AND (a.password = crypt(input_password, a.password) OR a.password = input_password);
END;
$$;

-- 5b. login_member
CREATE OR REPLACE FUNCTION login_member(
  input_phone text,
  input_password text
)
RETURNS TABLE(id uuid, name text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.phone
  FROM public.members m
  WHERE m.phone = input_phone
    AND (m.password = crypt(input_password, m.password) OR m.password = input_password);
END;
$$;

-- 5c. get_transactions (returns JSON with nested member info)
CREATE OR REPLACE FUNCTION get_transactions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'member_id', t.member_id,
      'type', t.type,
      'amount', t.amount,
      'date', t.date::text,
      'status', t.status,
      'proof_url', t.proof_url,
      'note', t.note,
      'created_at', t.created_at,
      'member', jsonb_build_object('name', COALESCE(m.name, 'Unknown'))
    )
    ORDER BY t.date DESC, t.created_at DESC
  ), '[]'::jsonb) INTO result
  FROM public.transactions t
  LEFT JOIN public.members m ON m.id = t.member_id;
  RETURN result;
END;
$$;

-- 5d. add_transaction
CREATE OR REPLACE FUNCTION add_transaction(
  p_member_id uuid,
  p_amount numeric,
  p_type text,
  p_status text,
  p_date date,
  p_proof_url text DEFAULT '',
  p_note text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.transactions (member_id, amount, type, status, date, proof_url, note)
  VALUES (p_member_id, p_amount, p_type, p_status, p_date, p_proof_url, p_note)
  RETURNING id INTO v_id;

  IF p_status = 'approved' THEN
    UPDATE public.members
    SET total_balance = total_balance + CASE WHEN p_type = 'setoran' THEN p_amount ELSE -p_amount END
    WHERE id = p_member_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- 5e. update_transaction_status
CREATE OR REPLACE FUNCTION update_transaction_status(
  p_id uuid,
  p_status text,
  p_proof_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status text;
  v_member_id uuid;
  v_amount numeric;
  v_type text;
BEGIN
  SELECT status, member_id, amount, type INTO v_old_status, v_member_id, v_amount, v_type
  FROM public.transactions WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaksi tidak ditemukan');
  END IF;

  IF p_proof_url IS NOT NULL THEN
    UPDATE public.transactions SET status = p_status, proof_url = p_proof_url WHERE id = p_id;
  ELSE
    UPDATE public.transactions SET status = p_status WHERE id = p_id;
  END IF;

  IF v_old_status != 'approved' AND p_status = 'approved' THEN
    UPDATE public.members
    SET total_balance = total_balance + CASE WHEN v_type = 'setoran' THEN v_amount ELSE -v_amount END
    WHERE id = v_member_id;
  ELSIF v_old_status = 'approved' AND p_status != 'approved' THEN
    UPDATE public.members
    SET total_balance = total_balance - CASE WHEN v_type = 'setoran' THEN v_amount ELSE -v_amount END
    WHERE id = v_member_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5f. delete_transaction
CREATE OR REPLACE FUNCTION delete_transaction(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_member_id uuid;
  v_amount numeric;
  v_type text;
BEGIN
  SELECT status, member_id, amount, type INTO v_status, v_member_id, v_amount, v_type
  FROM public.transactions WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaksi tidak ditemukan');
  END IF;

  DELETE FROM public.transactions WHERE id = p_id;

  IF v_status = 'approved' THEN
    UPDATE public.members
    SET total_balance = total_balance - CASE WHEN v_type = 'setoran' THEN v_amount ELSE -v_amount END
    WHERE id = v_member_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5g. get_schedules
CREATE OR REPLACE FUNCTION get_schedules()
RETURNS SETOF public.schedules
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.schedules ORDER BY date ASC, time ASC;
END;
$$;

-- 5h. add_schedule
CREATE OR REPLACE FUNCTION add_schedule(
  p_title text,
  p_date date,
  p_time text,
  p_location text,
  p_description text,
  p_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.schedules (title, date, time, location, description, type)
  VALUES (p_title, p_date, p_time, p_location, p_description, p_type)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- 5i. update_schedule
CREATE OR REPLACE FUNCTION update_schedule(
  p_id uuid,
  p_title text,
  p_date date,
  p_time text,
  p_location text,
  p_description text,
  p_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.schedules
  SET title = p_title, date = p_date, time = p_time, location = p_location,
      description = p_description, type = p_type
  WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Jadwal tidak ditemukan');
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5j. delete_schedule
CREATE OR REPLACE FUNCTION delete_schedule(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.schedules WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Jadwal tidak ditemukan');
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5k. save_attendance (bulk upsert)
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
    ON CONFLICT (member_id, date)
    DO UPDATE SET status = EXCLUDED.status, location = EXCLUDED.location;
  END LOOP;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5l. change_admin_password (from existing migration)
CREATE OR REPLACE FUNCTION change_admin_password(
  input_username text,
  input_old_password text,
  input_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT * INTO admin_record FROM public.admin WHERE username = input_username;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Admin tidak ditemukan');
  END IF;

  IF admin_record.password != crypt(input_old_password, admin_record.password)
     AND admin_record.password != input_old_password THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password lama salah');
  END IF;

  IF length(input_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password baru minimal 8 karakter');
  END IF;

  UPDATE public.admin
  SET password = crypt(input_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE username = input_username;

  RETURN jsonb_build_object('success', true, 'message', 'Password berhasil diubah');
END;
$$;

-- 5m. invalidate_admin_sessions (from existing migration)
CREATE OR REPLACE FUNCTION invalidate_admin_sessions(input_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT * INTO admin_record FROM public.admin WHERE username = input_username;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Admin tidak ditemukan');
  END IF;

  UPDATE public.admin
  SET session_version = COALESCE(session_version, 0) + 1,
      updated_at = now()
  WHERE username = input_username;

  RETURN jsonb_build_object('success', true, 'message', 'Semua session berhasil dinonaktifkan');
END;
$$;

-- 5n. reset_member_password (from existing migration)
CREATE OR REPLACE FUNCTION reset_member_password(
  input_name text,
  input_phone text,
  input_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_record RECORD;
BEGIN
  SELECT * INTO member_record FROM public.members WHERE name = input_name AND phone = input_phone;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nama atau nomor telepon tidak terdaftar');
  END IF;

  IF length(input_new_password) < 3 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password baru minimal 3 karakter');
  END IF;

  UPDATE public.members
  SET password = crypt(input_new_password, gen_salt('bf'))
  WHERE id = member_record.id;

  RETURN jsonb_build_object('success', true, 'message', 'Password berhasil direset. Silakan login dengan password baru.');
END;
$$;

-- ============================================================
-- 6. DEFAULT DATA
-- ============================================================

-- Insert default admin (username: admin, password: admin123)
INSERT INTO public.admin (username, password)
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value)
VALUES
  ('bank_info', '{"bankName": "BCA", "accountNumber": "1234567890", "accountHolder": "ADMIN SIMANTAB"}'::jsonb),
  ('activity_categories', '["Latihan Rutin", "Tampilan Parade", "Rapat Pengurus"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 7. ENABLE REALTIME (for transactions table)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  END IF;
END
$$;

-- ============================================================
-- DONE! Your SIMANTAB database is now ready to use.
-- Default login: username = "admin", password = "admin123"
-- ============================================================
