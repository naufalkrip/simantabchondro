import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import { staggerItem } from '../../lib/animations';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend: number;
  trendLabel: string;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  formatValue?: (val: number | string) => string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconBg,
  iconColor,
  accentBorder,
  formatValue,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value as string) || 0;

  useEffect(() => {
    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 1000;
    const totalSteps = 60;
    const increment = numericValue / totalSteps;
    let current = 0;
    let step = 0;
    const stepTime = duration / totalSteps;
    const timer = setInterval(() => {
      step++;
      current = Math.round(increment * step);
      if (step >= totalSteps || current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [numericValue]);

  const isTrendUp = trend >= 0;

  return (
    <motion.div
      variants={staggerItem}
      className={clsx(
        'relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5',
        'shadow-sm hover:shadow-lg transition-all duration-250 cursor-default',
        'hover:-translate-y-1',
        accentBorder
      )}
    >
      <div className="flex items-start justify-between">
        <div className={clsx('p-3 rounded-xl', iconBg)}>
          <Icon className={clsx('w-6 h-6', iconColor)} />
        </div>
        <div className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold',
          isTrendUp
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        )}>
          {isTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white count-animate">
          {formatValue ? formatValue(typeof value === 'number' ? displayValue : value) : (typeof value === 'number' ? displayValue : value)}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {isTrendUp ? '↑' : '↓'} {trendLabel}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
    </motion.div>
  );
};
