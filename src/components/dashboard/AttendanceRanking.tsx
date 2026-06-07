import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { Button } from '../ui/Button';

interface MemberRank {
  id: string;
  name: string;
  divisi: string;
  hadir: number;
  izin: number;
  bolos: number;
}

interface AttendanceRankingProps {
  data: MemberRank[];
  isLoading?: boolean;
}

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy size={16} className="text-amber-500" />;
  if (index === 1) return <Medal size={16} className="text-slate-400" />;
  if (index === 2) return <Medal size={16} className="text-amber-700" />;
  return null;
};

const getRankBg = (index: number) => {
  if (index === 0) return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30';
  if (index === 1) return 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/30';
  if (index === 2) return 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-100/50 dark:border-amber-800/20';
  return 'border-transparent';
};

export const AttendanceRanking: React.FC<AttendanceRankingProps> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="skeleton-shimmer h-5 w-40 rounded-md" />
        <div className="skeleton-shimmer h-12 rounded-xl" />
        <div className="skeleton-shimmer h-12 rounded-xl" />
        <div className="skeleton-shimmer h-12 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Peringkat Kehadiran</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Bulan Ini
        </span>
      </div>

      {data.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="divide-y divide-slate-100 dark:divide-slate-700/30 max-h-[360px] overflow-y-auto"
        >
          {data.map((member, index) => (
            <motion.div
              key={member.id}
              variants={staggerItem}
              className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${getRankBg(index)} border-l-2 ${index < 3 ? 'border-l-amber-400' : 'border-l-transparent'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 flex-shrink-0 flex justify-center">
                  {getRankIcon(index) || (
                    <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600">{index + 1}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{member.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase truncate">{member.divisi}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{member.hadir}</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase">Hadir</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{member.izin}</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase">Izin</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">{member.bolos}</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase">Bolos</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="px-5 py-10 text-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Belum ada data absensi</h4>
          <p className="text-xs text-slate-400 dark:text-slate-600 mb-4">Mulai input kehadiran untuk melihat peringkat.</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/absensi')}
          >
            Lihat Absensi <ArrowRight size={12} />
          </Button>
        </div>
      )}
    </div>
  );
};
