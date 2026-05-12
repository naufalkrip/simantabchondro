import { supabase } from './supabaseClient';
import { notifyDataChange } from './refreshService';

export interface MediaInventory {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'bagus' | 'jelek';
  created_at: string;
}

export const getMediaInventory = async (): Promise<MediaInventory[]> => {
  const { data, error } = await supabase
    .from('media_inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      // Relation does not exist - user hasn't run the migration yet
      return [];
    }
    console.error('Error fetching media inventory:', error);
    return [];
  }
  return data || [];
};

export const addMediaInventory = async (item: Omit<MediaInventory, 'id' | 'created_at'>): Promise<{success: boolean, error?: string}> => {
  const { error } = await supabase
    .from('media_inventory')
    .insert([item]);

  if (error) {
    console.error('Error adding media inventory:', error);
    return { success: false, error: error.message };
  }
  
  notifyDataChange();
  return { success: true };
};

export const updateMediaInventory = async (id: string, updates: Partial<MediaInventory>): Promise<{success: boolean, error?: string}> => {
  const { error } = await supabase
    .from('media_inventory')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating media inventory:', error);
    return { success: false, error: error.message };
  }
  
  notifyDataChange();
  return { success: true };
};

export const deleteMediaInventory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('media_inventory')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting media inventory:', error);
    return false;
  }
  
  notifyDataChange();
  return true;
};
