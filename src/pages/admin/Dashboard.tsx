import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, CalendarCheck, Wallet, Calendar,
} from 'lucide-react';
import { staggerContainer } from '../../lib/animations';
import { useDashboardData } from '../../hooks/useDashboardData';
import { HeroSection } from '../../components/dashboard/HeroSection';
import { StatCard } from '../../components/dashboard/StatCard';
import { AttendanceRanking } from '../../components/dashboard/AttendanceRanking';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { Skeleton } from '../../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const {
    membersLoading,
    chartLoading,
    totalAnggota,
    monthlyStats,
    monthlyPerformances,
    chartData,
    attendanceRanking,
    activities,
    totalSavings,
    attendanceTrend,
    savingsTrend,
  } = useDashboardData();

  const isLoading = membersLoading;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        chartData={chartData}
        chartLoading={chartLoading}
      />

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
              title="Total Anggota"
              value={totalAnggota}
              icon={Users}
              trend={20}
              trendLabel="dibanding bulan lalu"
              iconBg="bg-red-50 dark:bg-red-900/20"
              iconColor="text-red-600 dark:text-red-400"
              accentBorder="hover:border-red-200 dark:hover:border-red-800/50"
            />
            <StatCard
              title="Kehadiran Bulan Ini"
              value={`${monthlyStats.percentage}%`}
              icon={CalendarCheck}
              trend={attendanceTrend}
              trendLabel="dibanding bulan lalu"
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600 dark:text-emerald-400"
              accentBorder="hover:border-emerald-200 dark:hover:border-emerald-800/50"
            />
            <StatCard
              title="Total Tabungan"
              value={totalSavings}
              icon={Wallet}
              trend={savingsTrend}
              trendLabel="dibanding bulan lalu"
              iconBg="bg-blue-50 dark:bg-blue-900/20"
              iconColor="text-blue-600 dark:text-blue-400"
              accentBorder="hover:border-blue-200 dark:hover:border-blue-800/50"
              formatValue={(val) => `Rp${Number(val).toLocaleString('id-ID')}`}
            />
            <StatCard
              title="Total Kegiatan"
              value={monthlyPerformances}
              icon={Calendar}
              trend={0}
              trendLabel="dibanding bulan lalu"
              iconBg="bg-violet-50 dark:bg-violet-900/20"
              iconColor="text-violet-600 dark:text-violet-400"
              accentBorder="hover:border-violet-200 dark:hover:border-violet-800/50"
            />
          </>
        )}
      </motion.div>

      {/* Bottom Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Attendance Ranking */}
        <div className="lg:col-span-1">
          <AttendanceRanking
            data={attendanceRanking}
            isLoading={membersLoading}
          />
        </div>

        {/* Column 2: Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity
            activities={activities}
            isLoading={membersLoading}
          />
        </div>

        {/* Column 3: Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};
