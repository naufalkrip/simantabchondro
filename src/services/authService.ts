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
