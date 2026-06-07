import { supabase } from './supabaseClient';
import type { Transaction } from '../types/transaction';
import { updateMember } from './memberService';
import { notifyDataChange } from './refreshService';

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.rpc('get_transactions');

  if (error) {
    console.error('Error fetching transactions via RPC:', error);
    return [];
  }

  return data || [];
};

interface FilterOptions {
  type?: 'setoran' | 'penarikan';
  status?: 'pending' | 'approved' | 'rejected';
  member_id?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const getTransactionsFiltered = async (options: FilterOptions = {}): Promise<Transaction[]> => {
  try {
    let query = supabase
      .from('transactions')
      .select('*, member:members(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (options.type) query = query.eq('type', options.type);
    if (options.status) query = query.eq('status', options.status);
    if (options.member_id) query = query.eq('member_id', options.member_id);
    if (options.startDate) query = query.gte('date', options.startDate);
    if (options.endDate) query = query.lte('date', options.endDate);
    if (options.limit) query = query.limit(options.limit);
    if (options.offset && options.limit) query = query.range(options.offset, options.offset + options.limit - 1);

    const { data: txData, error: txError } = await query;

    if (txError) {
      console.error('Error fetching filtered transactions:', txError);
      return [];
    }

    return (txData || []) as unknown as Transaction[];
  } catch (error) {
    console.error('Error in getTransactionsFiltered:', error);
    return [];
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'member'>): Promise<boolean> => {
  try {
    console.log('Adding transaction via RPC:', transaction);
    
    // Menggunakan RPC untuk menghindari masalah RLS (Permission Denied)
    const { data, error } = await supabase.rpc('add_transaction', {
      p_member_id: transaction.member_id,
      p_amount: transaction.amount,
      p_type: transaction.type,
      p_status: transaction.status,
      p_date: transaction.date,
      p_proof_url: transaction.proof_url,
      p_note: transaction.note || ''
    });

    if (error) {
      console.error('Supabase RPC Error (add_transaction):', error);
      throw error;
    }

    console.log('Transaction added successfully:', data);
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return false;
  }
};

export const updateTransactionStatus = async (id: string, status: 'approved' | 'rejected', proof_url?: string): Promise<boolean> => {
  try {
    console.log('Updating transaction status via RPC:', id, status);
    const { error } = await supabase.rpc('update_transaction_status', {
      p_id: id,
      p_status: status,
      p_proof_url: proof_url
    });

    if (error) throw error;

    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
  try {
    const { data: oldTx, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !oldTx) throw fetchError || new Error('Transaction not found');

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Adjust balance if status is approved
    if (oldTx.status === 'approved') {
      // Revert old transaction
      await updateMemberBalance(oldTx.member_id, oldTx.type === 'setoran' ? 'penarikan' : 'setoran', oldTx.amount);
      // Apply new transaction
      if (updates.amount !== undefined || updates.type !== undefined || updates.member_id !== undefined) {
        const finalMemberId = updates.member_id || oldTx.member_id;
        const finalType = (updates.type || oldTx.type) as 'setoran' | 'penarikan';
        const finalAmount = updates.amount !== undefined ? updates.amount : oldTx.amount;
        await updateMemberBalance(finalMemberId, finalType, finalAmount);
      }
    }

    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    return false;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    console.log('Deleting transaction via RPC:', id);
    const { error } = await supabase.rpc('delete_transaction', {
      p_id: id
    });

    if (error) throw error;

    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

const updateMemberBalance = async (memberId: string, type: 'setoran' | 'penarikan', amount: number) => {
  const { data: member, error } = await supabase
    .from('members')
    .select('total_balance')
    .eq('id', memberId)
    .single();

  if (error || !member) return;

  const newBalance = type === 'setoran' 
    ? (member.total_balance || 0) + amount 
    : (member.total_balance || 0) - amount;

  await updateMember(memberId, { totalBalance: newBalance });
};
