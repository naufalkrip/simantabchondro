import { supabase } from './supabaseClient';
import type { Transaction } from '../types/transaction';
import { updateMember } from './memberService';

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      member:members(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'member'>): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        member_id: transaction.member_id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        date: transaction.date,
        proof_url: transaction.proof_url,
        note: transaction.note
      }])
      .select()
      .single();

    if (error) throw error;

    // If transaction is approved, update member balance
    if (transaction.status === 'approved' && data) {
      await updateMemberBalance(transaction.member_id, transaction.type, transaction.amount);
    }

    return true;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return false;
  }
};

export const updateTransactionStatus = async (id: string, status: 'approved' | 'rejected', proof_url?: string): Promise<boolean> => {
  try {
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transaction) throw fetchError || new Error('Transaction not found');

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status, proof_url: proof_url || transaction.proof_url })
      .eq('id', id);

    if (updateError) throw updateError;

    if (status === 'approved' && transaction.status !== 'approved') {
      await updateMemberBalance(transaction.member_id, transaction.type, transaction.amount);
    }

    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
