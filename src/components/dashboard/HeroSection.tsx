import React from 'react';
import { motion } from 'framer-motion';
import { heroVariants, staggerContainer, staggerItem } from '../../lib/animations';
import { ActivityChart } from './ActivityChart';

interface ChartData {
  day: string;
  hadir: number;
  total: number;
}

interface HeroSectionProps {
  chartData: ChartData[];
  chartLoading?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ chartData, chartLoading }) => {
  const currentTime = new Date();
  const hour = currentTime.getHours();
  const greeting = hour >= 4 && hour < 12 ? 'Selamat pagi'
    : hour >= 12 && hour < 15 ? 'Selamat siang'
    : hour >= 15 && hour < 18 ? 'Selamat sore'
    : 'Selamat malam';

  return (
    <motion.div
      variants={heroVariants}
      initial="initial"
      animate="animate"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 px-6 py-6 md:px-8 md:py-7"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 blur-xl" />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/[0.03] rounded-full blur-3xl" />
      <div className="absolute inset-0 hero-pattern opacity-20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
        {/* Left: Greeting */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1 space-y-1.5">
          <motion.p variants={staggerItem} className="text-white/70 text-sm font-medium tracking-wide">
            {greeting}
          </motion.p>
          <motion.h1 variants={staggerItem} className="text-white text-[28px] md:text-[32px] font-bold leading-tight">
            Halo Admin 👋
          </motion.h1>
          <motion.p variants={staggerItem} className="text-white/80 text-sm md:text-base max-w-lg leading-relaxed">
            Kelola anggota, absensi, tabungan, dan keuangan dalam satu tempat.
          </motion.p>
          <motion.div variants={staggerItem} className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-white/60 text-[11px] font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistem aktif
            </div>
            <div className="text-white/20">|</div>
            <div className="text-white/60 text-[11px] font-medium">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Chart */}
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
  );
};
