export interface Transaction {
  id: string;
  member_id: string;
  type: 'setoran' | 'penarikan';
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  proof_url?: string;
  note?: string;
  created_at?: string;
  member?: {
    name: string;
  };
}
