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
  const { data, error } = await supabase.rpc('get_schedules');

  if (error) {
    console.error('Error fetching schedules via RPC:', error);
    return [];
  }

  // Filter to show only current month and future months
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return (data || []).filter((s: any) => {
    const scheduleDate = new Date(s.date);
    return scheduleDate >= startOfCurrentMonth;
  });
};

export const addSchedule = async (schedule: Omit<Schedule, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('add_schedule', {
      p_title: schedule.title,
      p_date: schedule.date,
      p_time: schedule.time,
      p_location: schedule.location,
      p_description: schedule.description,
      p_type: schedule.type
    });

    if (error) {
      console.error('Supabase RPC Error (add_schedule):', error);
      throw error;
    }
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Add Schedule Error:', error);
    return false;
  }
};

export const updateSchedule = async (id: string, updatedData: Partial<Schedule>): Promise<boolean> => {
  try {
    // Kita mengirim semua parameter, yang tidak diupdate bisa diset null oleh frontend jika tidak ada
    // atau lebih baik kita membuat RPC update yang bisa menerima input partial.
    // Tapi karena form selalu memberikan data lengkap, kita bisa fetch yang lama dulu jika perlu,
    // atau buat RPC update_schedule_partial.
    // Di sini kita asumsikan updatedData berisi semua kolom karena form di frontend memberikan semuanya.
    const { error } = await supabase.rpc('update_schedule', {
      p_id: id,
      p_title: updatedData.title,
      p_date: updatedData.date,
      p_time: updatedData.time,
      p_location: updatedData.location,
      p_description: updatedData.description,
      p_type: updatedData.type
    });

    if (error) {
      console.error('Supabase RPC Error (update_schedule):', error);
      throw error;
    }
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Update Schedule Error:', error);
    return false;
  }
};

export const deleteSchedule = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('delete_schedule', {
      p_id: id
    });

    if (error) {
      console.error('Supabase RPC Error (delete_schedule):', error);
      throw error;
    }
    notifyDataChange();
    return true;
  } catch (error) {
    console.error('Delete Schedule Error:', error);
    return false;
  }
};
