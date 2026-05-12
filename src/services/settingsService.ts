import { supabase } from './supabaseClient';
import { notifyDataChange } from './refreshService';

export const getSetting = async (key: string): Promise<any> => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // not found error code
      console.error(`Error fetching setting ${key}:`, error);
    }
    return null;
  }
  return data?.value;
};

export const updateSetting = async (key: string, value: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    
    notifyDataChange();
    return true;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
};

export const changeAdminPassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const username = sessionStorage.getItem('admin_username');
    if (!username) {
      return { success: false, message: 'Sesi admin tidak ditemukan' };
    }

    const { data, error } = await supabase.rpc('change_admin_password', {
      input_username: username,
      input_old_password: oldPassword,
      input_new_password: newPassword
    });

    if (error) throw error;
    return data || { success: false, message: 'Gagal mengubah password' };
  } catch (error) {
    console.error('Error changing admin password:', error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
};

export const invalidateAdminSessions = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const username = sessionStorage.getItem('admin_username');
    if (!username) {
      return { success: false, message: 'Sesi admin tidak ditemukan' };
    }

    const { data, error } = await supabase.rpc('invalidate_admin_sessions', {
      input_username: username
    });

    if (error) throw error;
    return data || { success: true, message: 'Session berhasil dinonaktifkan' };
  } catch (error) {
    console.error('Error invalidating admin sessions:', error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
};
