-- RPC untuk mengubah password admin
-- Membutuhkan kolom: username, password (bcrypt hash), updated_at di tabel admin
-- Panggil dari aplikasi: SELECT change_admin_password('admin', 'lama123', 'baru123');

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
  -- Cari admin berdasarkan username
  SELECT * INTO admin_record FROM admin WHERE username = input_username;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Admin tidak ditemukan');
  END IF;

  -- Verifikasi password lama dengan bcrypt
  IF admin_record.password != crypt(input_old_password, admin_record.password) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password lama salah');
  END IF;

  -- Validasi password baru
  IF length(input_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password baru minimal 8 karakter');
  END IF;

  -- Update password baru dengan hash bcrypt
  UPDATE admin 
  SET password = crypt(input_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE username = input_username;

  RETURN jsonb_build_object('success', true, 'message', 'Password berhasil diubah');
END;
$$;
