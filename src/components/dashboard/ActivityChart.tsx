import React from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { staggerItem } from '../../lib/animations';

interface ChartData {
  day: string;
  hadir: number;
  total: number;
}

interface ActivityChartProps {
  data: ChartData[];
  isLoading?: boolean;
}

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

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, isLoading }) => {
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
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="total" stroke="#e2e8f0" fill="#f8fafc" strokeWidth={0} />
          <Line
            type="monotone"
            dataKey="hadir"
            stroke="#dc2626"
            strokeWidth={2.5}
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
