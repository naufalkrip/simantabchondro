import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, CalendarCheck, Wallet, Calendar, Settings, LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/member/dashboard', icon: Home, label: 'Beranda' },
  { path: '/member/absensi', icon: CalendarCheck, label: 'Absensi' },
  { path: '/member/savings', icon: Wallet, label: 'Rekap Tabungan' },
  { path: '/member/jadwal', icon: Calendar, label: 'Jadwal Kegiatan' },
  { path: '/member/pengaturan', icon: Settings, label: 'Pengaturan' },
];

interface MemberSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const [memberName, setMemberName] = React.useState(sessionStorage.getItem('member_name') || 'Anggota');

  React.useEffect(() => {
    const handleStorageChange = () => {
      setMemberName(sessionStorage.getItem('member_name') || 'Anggota');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          "fixed top-0 left-0 h-full z-50 w-64 bg-white dark:bg-slate-900 flex flex-col",
          "transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] md:sticky md:top-0 md:h-screen md:translate-x-0",
          "border-r border-slate-200 dark:border-slate-700/50 shadow-xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="SIMANTAB Logo" className="w-9 h-9 object-contain" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">SIMANTAB</h1>
              <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 leading-tight mt-0.5">Portal Anggota MB Chondro</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 pb-2">
            Menu Anggota
          </p>
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive: navActive }) =>
                      clsx(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
                        navActive
                          ? 'bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white font-semibold shadow-sm shadow-red-900/20'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                      )
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate leading-tight">Anggota</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{memberName}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
