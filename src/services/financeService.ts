import { supabase } from './supabaseClient';

export interface FinanceTransaction {
  id: string;
  type: 'masuk' | 'keluar';
  amount: number;
  description: string;
  date: string;
  category: 'pengurus' | 'media';
}

export const getFinanceData = async (category: 'pengurus' | 'media'): Promise<FinanceTransaction[]> => {
  const { data, error } = await supabase
    .from('finance')
    .select('*')
    .eq('category', category)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching finance data:', error);
    return [];
  }

  return data || [];
};

export const saveFinanceTransaction = async (transaction: Omit<FinanceTransaction, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('finance')
      .insert([transaction]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Save Finance Error:', error);
    return false;
  }
};

export const deleteFinanceTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete Finance Error:', error);
    return false;
  }
};
