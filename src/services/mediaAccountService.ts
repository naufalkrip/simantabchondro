import { supabase } from './supabaseClient';
import { notifyDataChange } from './refreshService';

export interface MediaAccount {
  id: string;
  platform: string;
  username: string;
  password: string;
  status: 'aktif' | 'nonaktif';
  last_updated: string;
  created_at: string;
}

export const getMediaAccounts = async (): Promise<MediaAccount[]> => {
  const { data, error } = await supabase
    .from('media_accounts')
    .select('*')
    .order('platform', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return [];
    }
    console.error('Error fetching media accounts:', error);
    return [];
  }
  return data || [];
};

export const addMediaAccount = async (account: Omit<MediaAccount, 'id' | 'last_updated' | 'created_at'>): Promise<{success: boolean, error?: string}> => {
  const { error } = await supabase
    .from('media_accounts')
    .insert([{ ...account, last_updated: new Date().toISOString() }]);

  if (error) {
    console.error('Error adding media account:', error);
    return { success: false, error: error.message };
  }
  
  notifyDataChange();
  return { success: true };
};

export const updateMediaAccount = async (id: string, updates: Partial<Omit<MediaAccount, 'id' | 'created_at'>>): Promise<{success: boolean, error?: string}> => {
  const { error } = await supabase
    .from('media_accounts')
    .update({ ...updates, last_updated: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating media account:', error);
    return { success: false, error: error.message };
  }
  
  notifyDataChange();
  return { success: true };
};

export const deleteMediaAccount = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('media_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting media account:', error);
    return false;
  }
  
  notifyDataChange();
  return true;
};
