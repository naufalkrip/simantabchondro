import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, CalendarCheck, Wallet, BarChart3, Upload, ArrowRight,
} from 'lucide-react';
import { staggerContainer, staggerItem } from '../../lib/animations';

interface Action {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  bgColor: string;
  hoverBorder: string;
}

const actions: Action[] = [
  { label: 'Tambah Anggota', icon: UserPlus, path: '/admin/members', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', hoverBorder: 'hover:border-red-200 dark:hover:border-red-800/50' },
  { label: 'Absensi Hari Ini', icon: CalendarCheck, path: '/admin/absensi', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/50' },
  { label: 'Setoran Tabungan', icon: Wallet, path: '/admin/setoran', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-800/50' },
  { label: 'Laporan Keuangan', icon: BarChart3, path: '/admin/keuangan-chondro', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-900/20', hoverBorder: 'hover:border-violet-200 dark:hover:border-violet-800/50' },
  { label: 'Upload Media', icon: Upload, path: '/admin/manajemen-media', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800/50' },
];

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Quick Actions</h3>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="p-3 space-y-1"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.path}
              variants={staggerItem}
              onClick={() => navigate(action.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent ${action.hoverBorder} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group text-left`}
            >
              <div className={`w-9 h-9 rounded-xl ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={action.color} />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {action.label}
              </span>
              <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
