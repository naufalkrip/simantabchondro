import { supabase } from './supabaseClient';
import type { Member } from '../types/member';
import type { Transaction } from '../types/transaction';
import { notifyDataChange } from './refreshService';

const mapMember = (m: any): Member => ({
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
});

export const getMembers = async (): Promise<Member[]> => {
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return (members || []).map(mapMember);
};

export const getMemberById = async (id: string): Promise<Member | null> => {
  try {
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !member) return null;

    const { data: txData } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('member_id', id)
      .eq('status', 'approved');

    const balance = (txData || []).reduce(
      (acc, t) => t.type === 'setoran' ? acc + t.amount : acc - t.amount,
      0
    );

    return { ...mapMember(member), totalBalance: balance };
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    return null;
  }
};

export const computeMemberBalances = (members: Member[], transactions: Transaction[]): Member[] => {
  return members.map(m => {
    const memberTx = transactions.filter(t => t.member_id === m.id && t.status === 'approved');
    const computedBalance = memberTx.reduce((acc, t) => t.type === 'setoran' ? acc + t.amount : acc - t.amount, 0);
    return { ...m, totalBalance: computedBalance };
  });
};

export const getMembersBankInfo = async (): Promise<Member[]> => {
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, divisi, bank_name, bank_account_number, bank_owner_name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return (members || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    phone: '',
    joinedDate: '',
    divisi: m.divisi || '',
    totalBalance: 0,
    bankOwnerName: m.bank_owner_name,
    bankAccountNumber: m.bank_account_number,
    bankName: m.bank_name,
    username: '',
    password: '',
  }));
};

export const getMembersList = async (): Promise<Member[]> => {
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return (members || []).map(m => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    joinedDate: m.joined_date || m.created_at || new Date().toISOString(),
    divisi: m.divisi,
    totalBalance: 0,
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
        password: member.password || '123'
      }]);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
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
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const deleteMember = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};
