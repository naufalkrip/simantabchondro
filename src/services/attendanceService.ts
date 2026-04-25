import { supabase } from './supabaseClient';
import type { Attendance } from '../types/attendance';

export const getAttendanceByDate = async (date: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', date);

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }

  return data || [];
};

export const saveAttendance = async (attendanceRecords: Omit<Attendance, 'id'>[]): Promise<boolean> => {
  try {
    // Supabase supports upsert. We'll use member_id and date as the unique constraint if possible, 
    // but without knowing the schema perfectly, we'll try to upsert based on id if it existed, 
    // or just insert/update manually.
    // For simplicity and assuming member_id + date is unique in the DB:
    const { error } = await supabase
      .from('attendance')
      .upsert(attendanceRecords, { onConflict: 'member_id,date' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving attendance:', error);
    return false;
  }
};

export const getAttendanceHistory = async (): Promise<{ date: string; location: string }[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('date, location')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance history:', error);
    return [];
  }

  const historyMap = new Map<string, string>();
  data?.forEach(r => {
    if (!historyMap.has(r.date)) {
      historyMap.set(r.date, r.location || '');
    }
  });

  return Array.from(historyMap.entries()).map(([date, location]) => ({
    date,
    location
  }));
};

export const getAttendanceByDateRange = async (startDate: string, endDate: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.error('Error fetching attendance range:', error);
    return [];
  }

  return data || [];
};
