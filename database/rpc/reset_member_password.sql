-- RPC untuk reset password anggota (lupa password)
-- Memverifikasi nama dan nomor telepon, lalu mereset password
-- Panggil dari aplikasi: SELECT reset_member_password('Nama Anggota', '08123456789', 'passwordbaru123');

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
  -- Cari anggota berdasarkan nama dan nomor telepon
  SELECT * INTO member_record FROM members WHERE name = input_name AND phone = input_phone;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nama atau nomor telepon tidak terdaftar');
  END IF;

  -- Validasi password baru minimal 3 karakter
  IF length(input_new_password) < 3 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password baru minimal 3 karakter');
  END IF;

  -- Update password baru dengan hash bcrypt
  UPDATE members 
  SET password = crypt(input_new_password, gen_salt('bf'))
  WHERE id = member_record.id;

  RETURN jsonb_build_object('success', true, 'message', 'Password berhasil direset. Silakan login dengan password baru.');
END;
$$;
