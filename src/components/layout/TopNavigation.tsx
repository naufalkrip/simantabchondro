import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dropdownVariants } from '../../lib/animations';
import { useNavigate } from 'react-router-dom';

interface TopNavigationProps {
  toggleSidebar: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ toggleSidebar }) => {
  const { logout, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === 'admin';
  const basePath = isAdmin ? '/admin' : '/member';
  const displayName = isAdmin
    ? sessionStorage.getItem('admin_username') || 'Admin'
    : sessionStorage.getItem('member_name') || 'Anggota';

  const searchItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Manajemen Anggota', path: '/admin/members' },
        { label: 'Input Absensi', path: '/admin/absensi' },
        { label: 'Riwayat Absensi', path: '/admin/absensi-riwayat' },
        { label: 'Rekap Absensi', path: '/admin/absensi-rekap' },
        { label: 'Tabungan', path: '/admin/savings' },
        { label: 'Setoran', path: '/admin/setoran' },
        { label: 'Penarikan', path: '/admin/penarikan' },
        { label: 'Keuangan Chondro', path: '/admin/keuangan-chondro' },
        { label: 'Manajemen Media', path: '/admin/manajemen-media' },
        { label: 'Jadwal', path: '/admin/jadwal' },
        { label: 'Pengaturan', path: '/admin/pengaturan' },
      ]
    : [
        { label: 'Dashboard', path: '/member/dashboard' },
        { label: 'Absensi', path: '/member/absensi' },
        { label: 'Rekap Tabungan', path: '/member/savings' },
        { label: 'Jadwal Kegiatan', path: '/member/jadwal' },
        { label: 'Pengaturan', path: '/member/pengaturan' },
      ];

  const filteredSearch = searchQuery
    ? searchItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">S</span>
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              SIMANTAB
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4" ref={searchRef}>
          <div className="relative w-full">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-full flex items-center gap-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <Search size={15} />
              <span className="flex-1 text-left">Cari menu...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600">
                ⌘K
              </kbd>
            </button>

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 px-2">
                      <Search size={15} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari menu..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 py-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredSearch.map((item) => (
                      <button
                        key={item.path}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() => {
                          navigate(item.path);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                    {filteredSearch.length === 0 && (
                      <p className="px-3 py-4 text-sm text-slate-400 text-center">Menu tidak ditemukan</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </motion.div>
          </button>

          <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 ml-1.5 p-1.5 pr-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{displayName}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight capitalize">{role}</p>
              </div>
              <ChevronDown size={12} className="text-slate-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{displayName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{role}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { navigate(`${basePath}/pengaturan`); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <User size={15} />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate(`${basePath}/pengaturan`); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Settings size={15} />
                      Pengaturan
                    </button>
                  </div>
                  <div className="p-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={15} />
                      Keluar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-slate-100 dark:border-slate-700"
          >
            <div className="px-4 py-3 space-y-2" ref={searchRef}>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Search size={15} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredSearch.map((item) => (
                  <button
                    key={item.path}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => {
                      navigate(item.path);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
