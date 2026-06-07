import React from 'react';
import { motion } from 'framer-motion';
import { Clock, History } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../lib/animations';

interface Activity {
  id: string;
  type: 'login' | 'absensi' | 'tabungan' | 'anggota' | 'laporan' | 'keuangan';
  text: string;
  time: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface RecentActivityProps {
  activities: Activity[];
  isLoading?: boolean;
}

const iconColors: Record<string, { color: string; bg: string }> = {
  login: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  absensi: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  tabungan: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  anggota: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  laporan: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  keuangan: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
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

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="skeleton-shimmer h-5 w-36 rounded-md" />
        <div className="skeleton-shimmer h-14 rounded-xl" />
        <div className="skeleton-shimmer h-14 rounded-xl" />
        <div className="skeleton-shimmer h-14 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aktivitas Terbaru</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Live</span>
      </div>

      {activities.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="px-5 py-4 space-y-0 max-h-[360px] overflow-y-auto"
        >
          {activities.map((activity, index) => {
            const colors = iconColors[activity.type] || iconColors.login;
            const Icon = activity.icon;
            return (
              <motion.div
                key={activity.id}
                variants={staggerItem}
                className="flex gap-3 pb-4 relative"
              >
                {index < activities.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100 dark:bg-slate-700/50" />
                )}
                <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 relative z-10`}>
                  <Icon size={14} className={colors.color} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{activity.text}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{getTimeAgo(activity.time)}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="px-5 py-10 text-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <History size={24} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Belum ada aktivitas</h4>
          <p className="text-xs text-slate-400 dark:text-slate-600">Aktivitas akan muncul di sini.</p>
        </div>
      )}
    </div>
  );
};
