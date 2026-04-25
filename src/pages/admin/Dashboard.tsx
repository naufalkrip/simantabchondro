import React, { useEffect, useState } from 'react';
import { Users, Calendar, Drum, Wallet } from 'lucide-react';

import { getMembers } from '../../services/memberService';
import { getAttendanceByDateRange } from '../../services/attendanceService';
import type { Member } from '../../types/member';

export const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<number>(0);
  const [monthlyPerformances, setMonthlyPerformances] = useState<number>(0);

  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  useEffect(() => {
    const loadDashboardData = async () => {
      const fetchedMembers = await getMembers();
      setMembers(fetchedMembers);

      const attendanceData = await getAttendanceByDateRange(startOfMonth, endOfMonth);
      
      // Calculate attendance percentage
      if (attendanceData.length > 0) {
        const hadirCount = attendanceData.filter(d => d.status === 'hadir').length;
        const percent = Math.round((hadirCount / attendanceData.length) * 100);
        setMonthlyAttendance(percent);
      }

      // Calculate total performances (unique dates)
      const uniqueDates = new Set(attendanceData.map(d => d.date));
      setMonthlyPerformances(uniqueDates.size);
    };

    loadDashboardData();
  }, []);

  const totalAnggota = Array.isArray(members) ? members.length : 0;
  /*
  const totalSaldo = Array.isArray(members) 
    ? members.reduce((sum, member) => sum + (member?.totalBalance || 0), 0) 
    : 0;
  
  // Dummy data for latest transactions
  const latestTransactions = [
    { id: 1, type: 'Setoran', amount: 50000, date: '2026-04-23', memberName: 'Budi Santoso' },
    { id: 2, type: 'Penarikan', amount: 20000, date: '2026-04-22', memberName: 'Andi Wijaya' },
    { id: 3, type: 'Setoran', amount: 100000, date: '2026-04-21', memberName: 'Citra Dewi' },
  ];

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);};
  */

  return (
    <div className="space-y-6">
      {/* Quick Navigation / Welcome Banner - Minimalist Version */}
      <div className="p-4 bg-gradient-to-r from-red-700 to-red-900 text-white shadow-sm rounded-md overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-0.5">Kelola SIMANTAB lebih mudah</h3>
            <p className="text-red-50/80 text-xs max-w-xl leading-relaxed">
              Semua data anggota, absensi, tabungan, keuangan kini terpusat dalam satu dashboard yang modern dan responsif.
            </p>
          </div>

        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <Wallet size={70} />
        </div>
      </div>

      {/* Overview Cards - Flat Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 text-red-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 leading-none">Total Anggota</p>
            <p className="text-2xl font-black text-gray-800 mt-2 leading-none">{totalAnggota}</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 leading-none">Kehadiran {currentMonthName}</p>
            <p className="text-2xl font-black text-gray-800 mt-2 leading-none">{monthlyAttendance}%</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Drum size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 leading-none">Tampilan {currentMonthName}</p>
            <p className="text-2xl font-black text-gray-800 mt-2 leading-none">{monthlyPerformances} <span className="text-xs font-medium text-gray-400">Kegiatan</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};


