export interface Attendance {
  id: string;
  member_id: string;
  date: string;
  status: 'hadir' | 'izin' | 'bolos';
  location?: string;
}
