import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getMembers } from '../services/memberService';
import { getAttendanceByDateRange } from '../services/attendanceService';
import { getTransactionsFiltered } from '../services/transactionService';
import { getFinanceData } from '../services/financeService';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck, Wallet, Banknote,
} from 'lucide-react';

interface ChartData {
  day: string;
  hadir: number;
  total: number;
}

interface MemberRank {
  id: string;
  name: string;
  divisi: string;
  hadir: number;
  izin: number;
  bolos: number;
}

interface Activity {
  id: string;
  type: 'login' | 'absensi' | 'tabungan' | 'anggota' | 'laporan' | 'keuangan';
  text: string;
  time: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const useDashboardData = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // 7 days ago
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const start7days = sevenDaysAgo.toISOString().split('T')[0];
  const endToday = now.toISOString().split('T')[0];

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

  const { data: attendanceMonth = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', startOfMonth, endOfMonth],
    queryFn: () => getAttendanceByDateRange(startOfMonth, endOfMonth),
  });

  const { data: attendance7Days = [], isLoading: chartLoading } = useQuery({
    queryKey: ['attendance-chart', start7days, endToday],
    queryFn: () => getAttendanceByDateRange(start7days, endToday),
  });

  // Only fetch recent transactions (last 3 months) for activity feed
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const start3months = threeMonthsAgo.toISOString().split('T')[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-recent', start3months, endToday],
    queryFn: () => getTransactionsFiltered({ status: 'approved', startDate: start3months, endDate: endToday }),
  });

  const { data: financeData = [] } = useQuery({
    queryKey: ['finance-pengurus'],
    queryFn: () => getFinanceData('pengurus'),
  });

  const totalAnggota = members.length;

  // Monthly attendance stats
  const monthlyStats = useMemo(() => {
    if (attendanceMonth.length === 0) return { percentage: 0, hadir: 0, izin: 0, bolos: 0, totalRecords: 0 };
    const hadir = attendanceMonth.filter(d => d.status === 'hadir').length;
    const izin = attendanceMonth.filter(d => d.status === 'izin').length;
    const bolos = attendanceMonth.filter(d => d.status === 'bolos').length;
    const percentage = Math.round((hadir / attendanceMonth.length) * 100);
    return { percentage, hadir, izin, bolos, totalRecords: attendanceMonth.length };
  }, [attendanceMonth]);

  // Monthly performances count (unique dates)
  const monthlyPerformances = useMemo(() => {
    const uniqueDates = new Set(attendanceMonth.map(d => d.date));
    return uniqueDates.size;
  }, [attendanceMonth]);

  // Last month attendance for trend comparison
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const { data: lastMonthAttendance = [] } = useQuery({
    queryKey: ['attendance-last-month', lastMonthStart, lastMonthEnd],
    queryFn: () => getAttendanceByDateRange(lastMonthStart, lastMonthEnd),
  });

  const lastMonthPercentage = useMemo(() => {
    if (lastMonthAttendance.length === 0) return 0;
    const hadir = lastMonthAttendance.filter(d => d.status === 'hadir').length;
    return Math.round((hadir / lastMonthAttendance.length) * 100);
  }, [lastMonthAttendance]);

  // Total savings from member balances (instant, no transaction scan)
  const totalSavings = useMemo(() => {
    return members.reduce((acc, m) => acc + (m.totalBalance || 0), 0);
  }, [members]);

  // Last month transactions (limited scope for trend)
  const { data: lastMonthTx = [] } = useQuery({
    queryKey: ['transactions-last-month', lastMonthStart, lastMonthEnd],
    queryFn: () => getTransactionsFiltered({ status: 'approved', startDate: lastMonthStart, endDate: lastMonthEnd }),
  });

  const lastMonthSavings = useMemo(() => {
    return lastMonthTx.reduce((acc, t) =>
      t.type === 'setoran' ? acc + t.amount : acc - t.amount, 0
    );
  }, [lastMonthTx]);

  // Chart data (7 days)
  const chartData: ChartData[] = useMemo(() => {
    const days: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = attendance7Days.filter(d => d.date === dateStr);
      const hadir = dayRecords.filter(d => d.status === 'hadir').length;
      const total = dayRecords.length;
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({ day: dayName, hadir, total });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance7Days]);

  // Attendance ranking
  const attendanceRanking: MemberRank[] = useMemo(() => {
    if (members.length === 0 || attendanceMonth.length === 0) return [];
    return members
      .map(member => {
        const mRecords = attendanceMonth.filter(d => d.member_id === member.id);
        return {
          id: member.id,
          name: member.name,
          divisi: member.divisi,
          hadir: mRecords.filter(d => d.status === 'hadir').length,
          izin: mRecords.filter(d => d.status === 'izin').length,
          bolos: mRecords.filter(d => d.status === 'bolos').length,
        };
      })
      .sort((a, b) => {
        if (a.divisi < b.divisi) return -1;
        if (a.divisi > b.divisi) return 1;
        return b.hadir - a.hadir;
      });
  }, [members, attendanceMonth]);

  // Recent activities
  const activities: Activity[] = useMemo(() => {
    const result: Activity[] = [];

    // From attendance data
    const sortedAttendance = [...attendanceMonth].sort((a, b) => b.date.localeCompare(a.date));
    const seenDates = new Set<string>();
    sortedAttendance.forEach(record => {
      if (!seenDates.has(record.date)) {
        seenDates.add(record.date);
        const member = members.find(m => m.id === record.member_id);
        result.push({
          id: `att-${record.date}`,
          type: 'absensi',
          text: `Absensi ${record.date} dibuat${member ? ` oleh ${member.name}` : ''}`,
          time: `${record.date}T08:00:00`,
          icon: CalendarCheck,
          color: '',
          bgColor: '',
        });
      }
    });

    // From transactions
    const sortedTx = [...transactions].sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date));
    sortedTx.slice(0, 5).forEach(tx => {
      const member = members.find(m => m.id === tx.member_id);
      result.push({
        id: `tx-${tx.id}`,
        type: 'tabungan',
        text: `${tx.type === 'setoran' ? 'Setoran' : 'Penarikan'} tabungan ${member ? member.name : ''} Rp${tx.amount.toLocaleString('id-ID')}`,
        time: tx.created_at || `${tx.date}T09:00:00`,
        icon: Wallet,
        color: '',
        bgColor: '',
      });
    });

    // From finance data
    const sortedFinance = [...financeData].sort((a, b) => b.date.localeCompare(a.date));
    sortedFinance.slice(0, 3).forEach(f => {
      result.push({
        id: `fin-${f.id}`,
        type: 'keuangan',
        text: `${f.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} keuangan: ${f.description}`,
        time: `${f.date}T10:00:00`,
        icon: Banknote,
        color: '',
        bgColor: '',
      });
    });

    // Sort by time desc
    result.sort((a, b) => b.time.localeCompare(a.time));
    return result.slice(0, 10);
  }, [attendanceMonth, transactions, financeData, members]);

  // Trends
  const attendanceTrend = lastMonthPercentage > 0
    ? Math.round(((monthlyStats.percentage - lastMonthPercentage) / lastMonthPercentage) * 100)
    : 0;

  const savingsTrend = lastMonthSavings > 0
    ? Math.round(((totalSavings - lastMonthSavings) / lastMonthSavings) * 100)
    : 0;

  return {
    members,
    membersLoading,
    attendanceLoading,
    chartLoading: chartLoading || attendanceLoading,
    totalAnggota,
    monthlyStats,
    monthlyPerformances,
    chartData,
    attendanceRanking,
    activities,
    totalSavings,
    attendanceTrend,
    savingsTrend,
    lastMonthPercentage,
  };
};
