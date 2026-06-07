import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getMembers } from '../services/memberService';
import { getAttendanceByDateRange } from '../services/attendanceService';
import { getTransactionsFiltered } from '../services/transactionService';
import type { Member } from '../types/member';

interface ChartData {
  day: string;
  status: string;
  label: string;
}

interface Activity {
  id: string;
  type: 'absensi' | 'tabungan';
  text: string;
  time: string;
  status?: string;
  amount?: number;
}

export const useMemberDashboardData = () => {
  const memberId = sessionStorage.getItem('member_id') || '';

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const start7days = sevenDaysAgo.toISOString().split('T')[0];
  const endToday = now.toISOString().split('T')[0];

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

  const { data: attendanceMonth = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-member', memberId, startOfMonth, endOfMonth],
    queryFn: () => getAttendanceByDateRange(startOfMonth, endOfMonth),
  });

  const { data: attendance7Days = [], isLoading: chartLoading } = useQuery({
    queryKey: ['attendance-member-chart', memberId, start7days, endToday],
    queryFn: () => getAttendanceByDateRange(start7days, endToday),
  });

  // Only fetch recent transactions (last 3 months) for activity feed
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const start3months = threeMonthsAgo.toISOString().split('T')[0];

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions-member-recent', memberId, start3months, endToday],
    queryFn: () => getTransactionsFiltered({
      status: 'approved',
      member_id: memberId,
      startDate: start3months,
      endDate: endToday,
    }),
  });

  // My profile with balance from DB (instant, no transaction scan)
  const member: Member | null = useMemo(() => {
    return members.find(m => m.id === memberId) || null;
  }, [members, memberId]);

  // My attendance filtered to this member
  const myAttendance = useMemo(() =>
    attendanceMonth.filter(a => a.member_id === memberId),
    [attendanceMonth, memberId]
  );

  // My transactions filtered to this member
  const myTransactions = useMemo(() =>
    transactions.filter(t => t.member_id === memberId),
    [transactions, memberId]
  );

  // Monthly attendance stats
  const attendanceStats = useMemo(() => {
    if (myAttendance.length === 0) return { hadir: 0, izin: 0, bolos: 0, total: 0, percentage: 0 };
    const hadir = myAttendance.filter(d => d.status === 'hadir').length;
    const izin = myAttendance.filter(d => d.status === 'izin').length;
    const bolos = myAttendance.filter(d => d.status === 'bolos').length;
    const percentage = Math.round((hadir / myAttendance.length) * 100);
    return { hadir, izin, bolos, total: myAttendance.length, percentage };
  }, [myAttendance]);

  // Performances count (unique dates where location contains 'penampilan')
  const performancesCount = useMemo(() => {
    const uniqueDates = new Set(
      myAttendance
        .filter(a => a.location && a.location.toLowerCase().includes('penampilan') && a.status === 'hadir')
        .map(a => a.date)
    );
    return uniqueDates.size;
  }, [myAttendance]);

  // Total savings balance
  const totalBalance = member?.totalBalance || 0;

  // Chart data (7 days)
  const chartData: ChartData[] = useMemo(() => {
    const days: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = attendance7Days.filter(d => d.date === dateStr && d.member_id === memberId);
      const hadir = dayRecords.filter(d => d.status === 'hadir').length;
      const izin = dayRecords.filter(d => d.status === 'izin').length;
      const bolos = dayRecords.filter(d => d.status === 'bolos').length;
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      days.push({ day: dayName, status: hadir > 0 ? 'hadir' : izin > 0 ? 'izin' : bolos > 0 ? 'bolos' : 'none', label: dateLabel });
    }
    return days;
  }, [attendance7Days, memberId]);

  // Recent activities
  const activities: Activity[] = useMemo(() => {
    const result: Activity[] = [];

    const sortedAttendance = [...myAttendance].sort((a, b) => b.date.localeCompare(a.date));
    sortedAttendance.slice(0, 5).forEach(record => {
      result.push({
        id: `att-${record.id}`,
        type: 'absensi',
        text: `Kehadiran ${new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        time: record.date,
        status: record.status,
      });
    });

    const sortedTx = [...myTransactions].sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date));
    sortedTx.slice(0, 5).forEach(tx => {
      result.push({
        id: `tx-${tx.id}`,
        type: 'tabungan',
        text: `${tx.type === 'setoran' ? 'Setoran' : 'Penarikan'} tabungan`,
        time: tx.created_at || tx.date,
        amount: tx.amount,
      });
    });

    result.sort((a, b) => b.time.localeCompare(a.time));
    return result.slice(0, 10);
  }, [myAttendance, myTransactions]);

  const isLoading = membersLoading || attendanceLoading || transactionsLoading;

  return {
    member,
    membersLoading,
    attendanceLoading,
    transactionsLoading,
    chartLoading: chartLoading || attendanceLoading,
    isLoading,
    myAttendance,
    myTransactions,
    attendanceStats,
    performancesCount,
    totalBalance,
    chartData,
    activities,
  };
};
