import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, CalendarCheck, Wallet, Banknote, MonitorPlay, Calendar, Users, Settings,
  ChevronDown, PlusCircle, ArrowDownRight, History, FileText
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';
import { useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/admin/dashboard', icon: Home, label: 'Beranda' },
  { path: '/admin/members', icon: Users, label: 'Anggota' },
  {
    path: '/admin/absensi', icon: CalendarCheck, label: 'Absensi',
    subItems: [
      { path: '/admin/absensi', label: 'Input Absensi', icon: CalendarCheck },
      { path: '/admin/absensi-riwayat', label: 'Riwayat Absensi', icon: History },
      { path: '/admin/absensi-rekap', label: 'Rekap Absensi', icon: FileText },
    ]
  },
  {
    path: '/admin/savings', icon: Wallet, label: 'Tabungan',
    subItems: [
      { path: '/admin/savings', label: 'Ringkasan', icon: Wallet },
      { path: '/admin/setoran', label: 'Setoran', icon: PlusCircle },
      { path: '/admin/penarikan', label: 'Penarikan', icon: ArrowDownRight },
    ]
  },
  { path: '/admin/keuangan-chondro', icon: Banknote, label: 'Keuangan Chondro' },
  { path: '/admin/manajemen-media', icon: MonitorPlay, label: 'Media' },
  { path: '/admin/jadwal', icon: Calendar, label: 'Jadwal' },
  { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [adminUsername, setAdminUsername] = React.useState(sessionStorage.getItem('admin_username') || 'admin');
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['/admin/savings']);
  const location = useLocation();

  React.useEffect(() => {
    const handleStorageChange = () => {
      setAdminUsername(sessionStorage.getItem('admin_username') || 'admin');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const isActiveOrChild = (path: string, subItems?: { path: string }[]) => {
    if (location.pathname === path) return true;
    if (subItems) return subItems.some(s => location.pathname === s.path);
    return false;
  };

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
              <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 leading-tight mt-0.5">Sistem Manajemen Informasi Anggota MB Chondro</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 pb-2">
            Menu Utama
          </p>
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItems.includes(item.path);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isActive = isActiveOrChild(item.path, item.subItems);

              return (
                <li key={item.path}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.path)}
                        className={clsx(
                          'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
                          isActive
                            ? 'bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white font-semibold shadow-sm shadow-red-900/20'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={14} className="opacity-50" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden mt-0.5 space-y-0.5 pl-4"
                          >
                            {item.subItems!.map((sub) => {
                              const isSubActive = location.pathname === sub.path;
                              const SubIcon = sub.icon;
                              return (
                                <li key={sub.path}>
                                  <NavLink
                                    to={sub.path}
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                      'group flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                                      isSubActive
                                        ? 'bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white font-medium shadow-sm'
                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    )}
                                  >
                                    <SubIcon size={14} className="shrink-0" />
                                    <span className="text-sm">{sub.label}</span>
                                  </NavLink>
                                </li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
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
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {adminUsername.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate leading-tight">Admin</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{adminUsername}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
