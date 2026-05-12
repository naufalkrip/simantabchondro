-- RPC untuk invalidasi semua session admin
-- Membutuhkan kolom: session_version integer di tabel admin
-- Panggil dari aplikasi: SELECT invalidate_admin_sessions('admin');

CREATE OR REPLACE FUNCTION invalidate_admin_sessions(
  input_username text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT * INTO admin_record FROM admin WHERE username = input_username;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Admin tidak ditemukan');
  END IF;

  UPDATE admin 
  SET session_version = COALESCE(session_version, 0) + 1,
      updated_at = now()
  WHERE username = input_username;

  RETURN jsonb_build_object('success', true, 'message', 'Semua session berhasil dinonaktifkan');
END;
$$;
