import { supabase } from './supabaseClient';
import { notifyDataChange } from './refreshService';

export interface FinanceTransaction {
  id: string;
  type: 'masuk' | 'keluar';
  amount: number;
  description: string;
  date: string;
  category: 'pengurus' | 'media';
  report_id?: string | null;
}

export interface FinanceReport {
  id: string;
  title: string;
  date: string;
  description: string;
  created_at: string;
}

export interface FinanceReportWithTotals extends FinanceReport {
  total_masuk: number;
  total_keluar: number;
  transaction_count: number;
}

export const getFinanceData = async (category: 'pengurus' | 'media'): Promise<FinanceTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('finance')
      .select('*')
      .eq('category', category)
      .is('report_id', null)
      .order('date', { ascending: true });

    if (error) {
      // report_id column might not exist (migration not run)
      if (error.message?.includes('report_id') || error.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('finance')
          .select('*')
          .eq('category', category)
          .order('date', { ascending: true });

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return [];
  }
};

export const saveFinanceTransaction = async (transaction: Omit<FinanceTransaction, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('finance')
      .insert([transaction]);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Save Finance Error:', error);
    return false;
  }
};

// --- Report functions ---

export const createFinanceReport = async (report: { title: string; date: string; description?: string }): Promise<string> => {
  const { data, error } = await supabase
    .from('finance_reports')
    .insert({ title: report.title, date: report.date, description: report.description || '' })
    .select('id')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Tidak ada data yang dikembalikan');

  notifyDataChange();
  return data.id;
};

export const getFinanceReports = async (): Promise<FinanceReportWithTotals[]> => {
  try {
    const { data: reports, error } = await supabase
      .from('finance_reports')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    if (!reports) return [];

    const { data: transactions, error: txError } = await supabase
      .from('finance')
      .select('report_id, type, amount')
      .not('report_id', 'is', null);

    if (txError) throw txError;

    const txMap: Record<string, { total_masuk: number; total_keluar: number; count: number }> = {};
    for (const tx of transactions || []) {
      if (!txMap[tx.report_id]) {
        txMap[tx.report_id] = { total_masuk: 0, total_keluar: 0, count: 0 };
      }
      if (tx.type === 'masuk') txMap[tx.report_id].total_masuk += Number(tx.amount);
      else txMap[tx.report_id].total_keluar += Number(tx.amount);
      txMap[tx.report_id].count++;
    }

    return reports.map(r => ({
      ...r,
      total_masuk: txMap[r.id]?.total_masuk || 0,
      total_keluar: txMap[r.id]?.total_keluar || 0,
      transaction_count: txMap[r.id]?.count || 0,
    }));
  } catch (error) {
    console.error('Get Reports Error:', error);
    return [];
  }
};

export const getTransactionsByReport = async (reportId: string): Promise<FinanceTransaction[]> => {
  const { data, error } = await supabase
    .from('finance')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching report transactions:', error);
    return [];
  }

  return data || [];
};

export const saveTransactionToReport = async (transaction: Omit<FinanceTransaction, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('finance')
      .insert([transaction]);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Save Report Transaction Error:', error);
    return false;
  }
};

export const deleteFinanceReport = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('finance_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Delete Report Error:', error);
    return false;
  }
};

export const updateFinanceTransaction = async (id: string, updates: Partial<FinanceTransaction>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('finance')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Update Finance Error:', error);
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
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Delete Finance Error:', error);
    return false;
  }
};
