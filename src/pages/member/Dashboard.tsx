import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck, Wallet, TrendingUp, Calendar,
  CheckCircle2, Clock, XCircle, Image as ImageIcon, Activity,
  UserCircle
} from 'lucide-react';
import clsx from 'clsx';
import { staggerContainer, staggerItem, heroVariants } from '../../lib/animations';
import { useMemberDashboardData } from '../../hooks/useMemberDashboardData';
import { StatCard } from '../../components/dashboard/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Hadir: <span className="text-emerald-600 dark:text-emerald-400">{payload[0]?.value || 0}</span>
          <span className="text-slate-300 mx-1">/</span>
          Total: {payload[1]?.value || 0}
        </p>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300"
            style={{ width: `${payload[1]?.value ? ((payload[0]?.value || 0) / payload[1]?.value) * 100 : 0}%` }}
          />
        </div>
      </div>
    );
  }
  return null;
};

const ActivityChart: React.FC<{ data: { day: string; hadir: number; total: number }[]; isLoading?: boolean }> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full min-h-[180px] flex items-center justify-center">
        <div className="skeleton-shimmer rounded-xl w-full h-full min-h-[180px]" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
        <Activity size={32} className="mb-2" />
        <p className="text-xs font-medium">Belum ada data aktivitas</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerItem} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="total" stroke="#e2e8f0" fill="#f8fafc" strokeWidth={0} />
          <Line type="monotone" dataKey="hadir" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }} animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export const Dashboard: React.FC = () => {
  const {
    member,
    isLoading,
    chartLoading,
    myAttendance,
    myTransactions,
    attendanceStats,
    performancesCount,
    totalBalance,
    activities,
  } = useMemberDashboardData();

  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const storedName = sessionStorage.getItem('member_name') || 'Anggota';

  // Convert member chart data to admin format for ActivityChart
  const chartData = (() => {
    const now = new Date();
    const days: { day: string; hadir: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = myAttendance.filter(a => a.date === dateStr);
      const hadir = dayRecords.filter(d => d.status === 'hadir').length;
      const total = dayRecords.length;
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({ day: dayName, hadir, total });
    }
    return days;
  })();

  const currentTime = new Date();
  const hour = currentTime.getHours();
  const greeting = hour >= 4 && hour < 12 ? 'Selamat pagi'
    : hour >= 12 && hour < 15 ? 'Selamat siang'
    : hour >= 15 && hour < 18 ? 'Selamat sore'
    : 'Selamat malam';

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        variants={heroVariants}
        initial="initial"
        animate="animate"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 px-6 py-6 md:px-8 md:py-7"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 blur-xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute inset-0 hero-pattern opacity-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1 space-y-1.5">
            <motion.p variants={staggerItem} className="text-white/70 text-sm font-medium tracking-wide">
              {greeting}
            </motion.p>
            <motion.h1 variants={staggerItem} className="text-white text-[28px] md:text-[32px] font-bold leading-tight">
              Halo, {member?.name || storedName} 👋
            </motion.h1>
            <motion.p variants={staggerItem} className="text-white/80 text-sm md:text-base max-w-lg leading-relaxed">
              Pantau kehadiran, tabungan, dan jadwal kegiatan Anda di sini.
            </motion.p>
            <motion.div variants={staggerItem} className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-white/60 text-[11px] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Anggota aktif
              </div>
              <div className="text-white/20">|</div>
              <div className="text-white/60 text-[11px] font-medium">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="w-full md:w-72 h-[130px] md:h-[150px] bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Aktivitas 7 Hari</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-white/50 text-[9px]">Hadir</span>
              </div>
            </div>
            <div className="h-[calc(100%-20px)]">
              <ActivityChart data={chartData} isLoading={chartLoading} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
      >
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Kehadiran Bulan Ini"
              value={`${attendanceStats.percentage}%`}
              icon={CalendarCheck}
              trend={attendanceStats.percentage}
              trendLabel="rata-rata kehadiran"
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600 dark:text-emerald-400"
              accentBorder="hover:border-emerald-200 dark:hover:border-emerald-800/50"
            />
            <StatCard
              title="Total Tabungan"
              value={totalBalance}
              icon={Wallet}
              trend={myTransactions.filter(t => t.type === 'setoran').length}
              trendLabel="total setoran"
              iconBg="bg-blue-50 dark:bg-blue-900/20"
              iconColor="text-blue-600 dark:text-blue-400"
              accentBorder="hover:border-blue-200 dark:hover:border-blue-800/50"
              formatValue={(val) => formatCurrency(Number(val))}
            />
            <StatCard
              title="Riwayat Hadir"
              value={attendanceStats.hadir}
              icon={CheckCircle2}
              trend={attendanceStats.total > 0 ? Math.round((attendanceStats.hadir / attendanceStats.total) * 100) : 0}
              trendLabel="dari total kehadiran"
              iconBg="bg-green-50 dark:bg-green-900/20"
              iconColor="text-green-600 dark:text-green-400"
              accentBorder="hover:border-green-200 dark:hover:border-green-800/50"
            />
            <StatCard
              title="Penampilan"
              value={performancesCount}
              icon={TrendingUp}
              trend={0}
              trendLabel="bulan ini"
              iconBg="bg-violet-50 dark:bg-violet-900/20"
              iconColor="text-violet-600 dark:text-violet-400"
              accentBorder="hover:border-violet-200 dark:hover:border-violet-800/50"
            />
          </>
        )}
      </motion.div>

      {/* Bottom Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Attendance History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Riwayat Kehadiran</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {attendanceStats.total} Data
            </span>
          </div>

          {myAttendance.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-[360px] overflow-y-auto">
              {[...myAttendance].reverse().map(att => (
                <div key={att.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center',
                      att.status === 'hadir' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                      att.status === 'izin' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                      'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    )}>
                      {att.status === 'hadir' ? <CheckCircle2 size={16} /> :
                       att.status === 'izin' ? <Clock size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(att.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">{att.location || 'Latihan Rutin'}</p>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg',
                    att.status === 'hadir' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    att.status === 'izin' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  )}>
                    {att.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Belum ada kehadiran</h4>
              <p className="text-xs text-slate-400 dark:text-slate-600">Riwayat kehadiran akan muncul di sini.</p>
            </div>
          )}
        </div>

        {/* Column 2: Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Transaksi Terakhir</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {myTransactions.length} Data
            </span>
          </div>

          {myTransactions.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-[360px] overflow-y-auto">
              {[...myTransactions].reverse().slice(0, 10).map(tx => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center',
                      tx.type === 'setoran' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                      'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    )}>
                      {tx.type === 'setoran' ? <TrendingUp size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(tx.amount)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg',
                      tx.type === 'setoran' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                      'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    )}>
                      {tx.type}
                    </span>
                    {tx.proof_url && (
                      <button
                        onClick={() => setSelectedProofUrl(tx.proof_url || null)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        title="Lihat Bukti Transfer"
                      >
                        <ImageIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Wallet size={24} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Belum ada transaksi</h4>
              <p className="text-xs text-slate-400 dark:text-slate-600">Riwayat transaksi akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!selectedProofUrl}
        onClose={() => setSelectedProofUrl(null)}
        title="Bukti Transfer"
        maxWidth="lg"
      >
        {selectedProofUrl && (
          <div className="space-y-4">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <img
                src={selectedProofUrl}
                alt="Bukti Transfer Detail"
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-sm mx-auto"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => setSelectedProofUrl(null)}
              >
                Tutup Preview
              </Button>
              <a
                href={selectedProofUrl}
                download={`Bukti_Transfer_${new Date().getTime()}.png`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-slate-200 dark:border-slate-600">
                  Unduh Gambar
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
