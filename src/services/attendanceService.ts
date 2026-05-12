import { supabase } from './supabaseClient';
import type { Attendance } from '../types/attendance';
import { notifyDataChange } from './refreshService';

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
    console.log('Saving attendance records via RPC:', attendanceRecords);
    
    // Menggunakan RPC untuk menghindari masalah RLS dan mempermudah bulk upsert
    const { error } = await supabase.rpc('save_attendance', { 
      records: attendanceRecords 
    });

    if (error) {
      console.error('Supabase RPC Error (save_attendance):', error);
      throw error;
    }
    
    notifyDataChange();
    return true;
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    // Jika RPC belum ada, fallback ke upsert manual (opsional, tapi lebih baik lempar error agar tahu)
    throw error;
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
