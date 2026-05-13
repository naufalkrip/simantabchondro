import { supabase } from './supabaseClient';

/**
 * Service for handling authentication using Supabase RPC functions
 * This matches the requirement to use crypt() for password verification
 */

export const loginAdmin = async (username: string, password: string) => {
  try {
    const { data, error } = await supabase.rpc('login_admin', {
      input_username: username,
      input_password: password
    });

    if (error) {
      console.error('Admin login query error:', error);
      return null;
    }

    console.log('Admin login result:', data);
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Unexpected admin login error:', err);
    return null;
  }
};

export const resetAdminPassword = async (username: string, oldPassword: string, newPassword: string) => {
  try {
    const { data, error } = await supabase.rpc('change_admin_password', {
      input_username: username,
      input_old_password: oldPassword,
      input_new_password: newPassword
    });

    if (error) {
      console.error('Reset admin password error:', error);
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }

    return data || { success: false, message: 'Gagal mereset password' };
  } catch (err) {
    console.error('Unexpected reset admin password error:', err);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
};

export const resetMemberPassword = async (name: string, phone: string, newPassword: string) => {
  try {
    const { data, error } = await supabase.rpc('reset_member_password', {
      input_name: name,
      input_phone: phone,
      input_new_password: newPassword
    });

    if (error) {
      console.error('Reset member password error:', error);
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }

    return data || { success: false, message: 'Gagal mereset password' };
  } catch (err) {
    console.error('Unexpected reset member password error:', err);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
};

export const loginMember = async (phone: string, password: string) => {
  try {
    const { data, error } = await supabase.rpc('login_member', {
      input_phone: phone,
      input_password: password
    });

    if (error) {
      console.error('Member login query error:', error);
      return null;
    }

    console.log('Member login result:', data);
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Unexpected member login error:', err);
    return null;
  }
};
