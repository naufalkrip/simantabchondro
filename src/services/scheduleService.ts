import { supabase } from './supabaseClient';
import { notifyDataChange } from './refreshService';

export interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: 'latihan' | 'tampilan' | 'rapat' | 'lainnya';
}

export const getSchedules = async (): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  // Filter to show only current month and future months
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return (data || []).filter(s => {
    const scheduleDate = new Date(s.date);
    return scheduleDate >= startOfCurrentMonth;
  });
};

export const addSchedule = async (schedule: Omit<Schedule, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('schedules')
      .insert([schedule]);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Add Schedule Error:', error);
    return false;
  }
};

export const updateSchedule = async (id: string, updatedData: Partial<Schedule>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('schedules')
      .update(updatedData)
      .eq('id', id);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Update Schedule Error:', error);
    return false;
  }
};

export const deleteSchedule = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Delete Schedule Error:', error);
    return false;
  }
};
