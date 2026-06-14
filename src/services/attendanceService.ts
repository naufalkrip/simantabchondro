import { supabase } from './supabaseClient';
import type { Attendance } from '../types/attendance';
import { notifyDataChange } from './refreshService';

export const getAttendanceByDateAndLocation = async (date: string, location: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', date)
    .eq('location', location);

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }

  return data || [];
};

export const saveAttendance = async (attendanceRecords: Omit<Attendance, 'id'>[]): Promise<boolean> => {
  try {
    if (attendanceRecords.length === 0) return true;

    const records = attendanceRecords.map(r => ({
      member_id: r.member_id,
      date: r.date,
      status: r.status,
      location: r.location || ''
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'member_id,date,location' });

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    notifyDataChange();
    return true;
  } catch (error: any) {
    console.error('Error saving attendance:', error);
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

  const seen = new Set<string>();
  const result: { date: string; location: string }[] = [];

  data?.forEach(r => {
    const key = `${r.date}|${r.location || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ date: r.date, location: r.location || '' });
    }
  });

  return result;
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
