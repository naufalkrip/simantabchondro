import React, { useMemo } from 'react';
import { Users, Calendar, Drum, Wallet, Trophy } from 'lucide-react';
import { Card } from '../../components/ui/Card';

import { getMembers } from '../../services/memberService';
import { getAttendanceByDateRange } from '../../services/attendanceService';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animations';

export const Dashboard: React.FC = () => {
  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers
  });

  const { data: attendanceData = [] } = useQuery({
    queryKey: ['attendance', startOfMonth, endOfMonth],
    queryFn: () => getAttendanceByDateRange(startOfMonth, endOfMonth)
  });

  const monthlyAttendance = useMemo(() => {
    if (attendanceData.length === 0) return 0;
    const hadirCount = attendanceData.filter(d => d.status === 'hadir').length;
    return Math.round((hadirCount / attendanceData.length) * 100);
  }, [attendanceData]);

  const monthlyPerformances = useMemo(() => {
    const uniqueDates = new Set(attendanceData.map(d => d.date));
    return uniqueDates.size;
  }, [attendanceData]);

  const totalAnggota = Array.isArray(members) ? members.length : 0;

  const attendanceRanking = useMemo(() => {
    if (members.length === 0 || attendanceData.length === 0) return [];
    
    return members
      .map(member => {
        const mRecords = attendanceData.filter(d => d.member_id === member.id);
        const hadir = mRecords.filter(d => d.status === 'hadir').length;
        const izin = mRecords.filter(d => d.status === 'izin').length;
        const bolos = mRecords.filter(d => d.status === 'bolos').length;
        return { ...member, hadir, izin, bolos };
      })
      .sort((a, b) => {
        if (a.divisi < b.divisi) return -1;
        if (a.divisi > b.divisi) return 1;
        return b.hadir - a.hadir;
      });
  }, [members, attendanceData]);

  return (
    <div className="space-y-4">
      {/* Quick Navigation / Welcome Banner - Minimalist Version */}
      <div className="px-5 py-4 bg-gradient-to-r from-red-700 to-red-900 text-white shadow-sm rounded-md overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm md:text-lg font-semibold mb-0.5 text-left leading-tight">Kelola SIMANTAB lebih mudah</h3>
            <p className="text-red-50/80 text-[9px] md:text-xs max-w-xl leading-relaxed text-left">
              Semua data anggota, absensi, tabungan, keuangan kini terpusat dalam satu dashboard yang modern dan responsif.
            </p>
          </div>

        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <Wallet size={40} className="md:size-[56px]" />
        </div>
      </div>

      {/* Overview Cards - Flat Style */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={staggerItem} className="p-4 md:p-5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md hover:border-red-100">
          <div className="p-2.5 md:p-3.5 rounded-lg bg-red-50 text-red-600 shrink-0">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 md:mb-3">Total Anggota</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{totalAnggota}</p>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="p-4 md:p-5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md hover:border-blue-100">
          <div className="p-2.5 md:p-3.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Calendar size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 md:mb-3">Kehadiran {currentMonthName}</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{monthlyAttendance}%</p>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="p-4 md:p-5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md hover:border-purple-100">
          <div className="p-2.5 md:p-3.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
            <Drum size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 md:mb-3">Tampilan {currentMonthName}</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{monthlyPerformances} <span className="text-[10px] font-medium text-gray-400">Kegiatan</span></p>
          </div>
        </motion.div>
      </motion.div>

      {/* Attendance Ranking Table */}
      <Card className="overflow-hidden border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Peringkat Kehadiran {currentMonthName}</h3>
          </div>
          <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase">
            <span className="w-10 text-center">Hadir</span>
            <span className="w-10 text-center">Izin</span>
            <span className="w-10 text-center">Bolos</span>
          </div>
        </div>
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto"
        >
          {attendanceRanking.length > 0 ? (
            attendanceRanking.map((member, index) => (
              <motion.div variants={staggerItem} key={member.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-6 flex justify-center">
                    <span className="text-[11px] font-black text-gray-300">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{member.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{member.divisi}</p>
                  </div>
                </div>
                <div className="flex gap-4 font-black">
                  <div className="w-10 text-center text-xs text-green-600 bg-green-50 py-1.5 rounded-lg border border-green-100/30">{member.hadir}</div>
                  <div className="w-10 text-center text-xs text-yellow-600 bg-yellow-50 py-1.5 rounded-lg border border-yellow-100/30">{member.izin}</div>
                  <div className="w-10 text-center text-xs text-red-600 bg-red-50 py-1.5 rounded-lg border border-red-100/30">{member.bolos}</div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm italic">
              Belum ada data absensi untuk bulan ini.
            </div>
          )}
        </motion.div>
      </Card>
    </div>
  );
};


