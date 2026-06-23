import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarCheck, Wallet, Calendar, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const basePath = role === 'admin' ? '/admin' : '/member';

  const navItems = [
    { path: `${basePath}/dashboard`, icon: Home, label: 'Beranda' },
    { path: `${basePath}/absensi`, icon: CalendarCheck, label: 'Absensi' },
    { path: `${basePath}/savings`, icon: Wallet, label: 'Tabungan' },
    { path: `${basePath}/jadwal`, icon: Calendar, label: 'Jadwal' },
    { path: `${basePath}/pengaturan`, icon: MoreHorizontal, label: 'Lainnya' },
  ];

  const isActive = (path: string) => {
    if (role === 'admin') {
      if (path === '/admin/pengaturan') return ['/admin/pengaturan', '/admin/members', '/admin/keuangan-chondro', '/admin/manajemen-media'].includes(location.pathname);
    } else {
      if (path === '/member/pengaturan') return location.pathname === '/member/pengaturan';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1',
                active
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              )}
            >
              <div className={clsx(
                'p-1.5 rounded-lg transition-colors duration-200',
                active ? 'bg-red-50 dark:bg-red-900/20' : ''
              )}>
                <Icon size={20} />
              </div>
              <span className={clsx(
                'text-[10px] font-semibold leading-none',
                active ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
