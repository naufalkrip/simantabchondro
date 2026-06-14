export interface FundDistribution {
  id: string;
  title: string;
  date: string;
  source: string;
  total_amount: number;
  description: string;
  member_count: number;
  recipient_count?: number;
  distributed_amount: number;
  remaining_amount: number;
  created_at: string;
}

export interface FundDistributionRecipient {
  id: string;
  distribution_id: string;
  member_id: string;
  member_name: string;
  member_phone?: string;
  divisi?: string;
  attendance_status: string;
  amount: number;
}

export interface AttendanceDateSummary {
  date: string;
  location: string;
  total_count: number;
}

export interface AttendanceWithMember {
  member_id: string;
  member_name: string;
  member_phone: string;
  divisi: string;
  status: 'hadir' | 'tampil' | 'izin' | 'bolos';
}

export interface DistributionFormData {
  title: string;
  date: string;
  source: string;
  total_amount: number;
  description: string;
}

export interface DistributionSummary {
  total_amount: number;
  member_count: number;
  per_person: number;
  distributed_amount: number;
  remaining_amount: number;
}
