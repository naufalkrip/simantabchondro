import { supabase } from './supabaseClient';
import type { Member } from '../types/member';

export const getMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return (data || []).map(m => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    joinedDate: m.joined_date || m.created_at || new Date().toISOString(),
    divisi: m.divisi,
    totalBalance: m.total_balance || 0,
    bankOwnerName: m.bank_owner_name,
    bankAccountNumber: m.bank_account_number,
    bankName: m.bank_name,
    username: m.username,
    password: m.password
  }));
};

export const addMember = async (member: Omit<Member, 'id' | 'totalBalance'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('members')
      .insert([{
        name: member.name,
        phone: member.phone,
        joined_date: member.joinedDate,
        divisi: member.divisi,
        bank_owner_name: member.bankOwnerName,
        bank_account_number: member.bankAccountNumber,
        bank_name: member.bankName,
        username: member.username,
        password: member.password,
        total_balance: 0
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding member:', error);
    return false;
  }
};

export const updateMember = async (id: string, updates: Partial<Member>): Promise<boolean> => {
  try {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.joinedDate !== undefined) dbUpdates.joined_date = updates.joinedDate;
    if (updates.divisi !== undefined) dbUpdates.divisi = updates.divisi;
    if (updates.totalBalance !== undefined) dbUpdates.total_balance = updates.totalBalance;
    if (updates.bankOwnerName !== undefined) dbUpdates.bank_owner_name = updates.bankOwnerName;
    if (updates.bankAccountNumber !== undefined) dbUpdates.bank_account_number = updates.bankAccountNumber;
    if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.password !== undefined) dbUpdates.password = updates.password;

    const { error } = await supabase
      .from('members')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating member:', error);
    return false;
  }
};

export const deleteMember = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting member:', error);
    return false;
  }
};
