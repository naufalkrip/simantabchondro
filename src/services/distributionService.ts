import { supabase } from './supabaseClient';
import { notifyDataChange, subscribeToDataChange } from './refreshService';
import type { AttendanceWithMember, FundDistribution, FundDistributionRecipient } from '../types/distribution';

export const getAttendanceDatesWithCount = async (): Promise<{ date: string; location: string; total_count: number }[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('date, location, status')
      .in('status', ['hadir', 'tampil'])
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance dates with count:', error);
      return [];
    }

    const grouped = new Map<string, { date: string; location: string; total_count: number }>();
    data?.forEach(r => {
      const key = `${r.date}|${r.location || ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, { date: r.date, location: r.location || '', total_count: 0 });
      }
      grouped.get(key)!.total_count += 1;
    });

    return Array.from(grouped.values());
  } catch (err) {
    console.error('Error in getAttendanceDatesWithCount:', err);
    return [];
  }
};

export const getAttendanceWithMembers = async (date: string, location?: string): Promise<AttendanceWithMember[]> => {
  try {
    let query = supabase
      .from('attendance')
      .select('member_id, status')
      .eq('date', date)
      .in('status', ['hadir', 'tampil']);

    if (location) {
      query = query.eq('location', location);
    }

    const { data: attendanceData, error: attendanceError } = await query;

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return [];
    }

    if (!attendanceData || attendanceData.length === 0) return [];

    const memberIds = attendanceData.map(a => a.member_id);

    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('id, name, phone, divisi')
      .in('id', memberIds);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return [];
    }

    const memberMap = new Map((membersData || []).map(m => [m.id, m]));

    return attendanceData
      .map(a => {
        const member = memberMap.get(a.member_id);
        if (!member) return null;
        return {
          member_id: a.member_id,
          member_name: member.name,
          member_phone: member.phone,
          divisi: member.divisi,
          status: a.status,
        } as AttendanceWithMember;
      })
      .filter((m): m is AttendanceWithMember => m !== null)
      .sort((a, b) => a.member_name.localeCompare(b.member_name));
  } catch (err) {
    console.error('Error in getAttendanceWithMembers:', err);
    return [];
  }
};

export const createFundDistribution = async (
  title: string,
  date: string,
  source: string,
  totalAmount: number,
  description: string,
  recipients: { member_id: string; status: string; amount: number }[]
): Promise<any> => {
  try {
    const totalDistributed = recipients.reduce((s, r) => s + r.amount, 0);

    const { data: distData, error: distError } = await supabase
      .from('fund_distributions')
      .insert({
        title,
        date,
        source,
        total_amount: totalAmount,
        description,
        member_count: recipients.length,
        distributed_amount: totalDistributed,
        remaining_amount: totalAmount - totalDistributed,
      })
      .select('id')
      .single();

    if (distError) {
      console.error('Error creating fund distribution:', distError);
      throw distError;
    }

    const distributionId = distData.id;

    const { error: recipError } = await supabase
      .from('fund_distribution_recipients')
      .insert(
        recipients.map(r => ({
          distribution_id: distributionId,
          member_id: r.member_id,
          attendance_status: r.status,
          amount: r.amount,
        }))
      );

    if (recipError) {
      console.error('Error inserting recipients:', recipError);
      throw recipError;
    }

    notifyDataChange();
    return { id: distributionId };
  } catch (err) {
    console.error('Error in createFundDistribution:', err);
    throw err;
  }
};

export const getFundDistributions = async (): Promise<FundDistribution[]> => {
  try {
    const { data, error } = await supabase
      .from('fund_distributions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fund distributions:', error);
      return [];
    }

    return (data as FundDistribution[]) || [];
  } catch (err) {
    console.error('Error in getFundDistributions:', err);
    return [];
  }
};

export const getFundDistributionDetail = async (id: string): Promise<{
  distribution: FundDistribution;
  recipients: FundDistributionRecipient[];
} | null> => {
  try {
    const { data: distData, error: distError } = await supabase
      .from('fund_distributions')
      .select('*')
      .eq('id', id)
      .single();

    if (distError || !distData) {
      console.error('Error fetching distribution:', distError);
      return null;
    }

    const { data: recipData, error: recipError } = await supabase
      .from('fund_distribution_recipients')
      .select('*')
      .eq('distribution_id', id)
      .order('created_at', { ascending: true });

    if (recipError) {
      console.error('Error fetching recipients:', recipError);
      return null;
    }

    // Look up member names
    const memberIds = [...new Set((recipData || []).map(r => r.member_id))];
    let memberMap = new Map<string, { name: string; phone: string; divisi: string }>();

    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from('members')
        .select('id, name, phone, divisi')
        .in('id', memberIds);

      (members || []).forEach(m => {
        memberMap.set(m.id, { name: m.name, phone: m.phone || '', divisi: m.divisi || '' });
      });
    }

    const recipients: FundDistributionRecipient[] = (recipData || []).map(r => {
      const member = memberMap.get(r.member_id);
      return {
        id: r.id,
        distribution_id: r.distribution_id,
        member_id: r.member_id,
        member_name: member?.name || 'Unknown',
        member_phone: member?.phone || '',
        divisi: member?.divisi || '',
        attendance_status: r.attendance_status,
        amount: r.amount,
      };
    });

    return {
      distribution: distData as FundDistribution,
      recipients,
    };
  } catch (err) {
    console.error('Error in getFundDistributionDetail:', err);
    return null;
  }
};

export const updateRecipientAmount = async (
  recipientId: string,
  amount: number
): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('update_recipient_amount', {
      p_recipient_id: recipientId,
      p_amount: amount
    });

    if (error) {
      console.error('Error updating recipient amount:', error);
      return false;
    }

    notifyDataChange();
    return true;
  } catch (err) {
    console.error('Error in updateRecipientAmount:', err);
    return false;
  }
};

export const deleteFundDistribution = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('fund_distributions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting fund distribution:', error);
      return false;
    }

    notifyDataChange();
    return true;
  } catch (err) {
    console.error('Error in deleteFundDistribution:', err);
    return false;
  }
};

export const subscribeToDistributionChanges = (callback: () => void): (() => void) => {
  return subscribeToDataChange(callback);
};

export const getAttendanceDates = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('date')
      .in('status', ['hadir', 'tampil'])
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance dates:', error);
      return [];
    }

    const uniqueDates = [...new Set(data.map(r => r.date))];
    return uniqueDates;
  } catch (err) {
    console.error('Error in getAttendanceDates:', err);
    return [];
  }
};
