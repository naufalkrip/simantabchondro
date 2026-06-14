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
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-30 bg-gradient-to-r from-[#B91C1C] via-[#991B1B] to-[#7F1D1D] shadow-[0_4px_20px_rgba(185,28,28,0.15)] border-b border-white/10"
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-[72px]">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-white/15 rounded-lg transition-all duration-300 text-white/80 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wide">S</span>
            </div>
            <span className="text-base font-bold font-poppins text-white tracking-wide">
              SIMANTAB
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-6" ref={searchRef}>
          <div className="relative w-full">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:border-white/30 transition-all duration-300"
            >
              <Search size={16} className="text-white/60" />
              <span className="flex-1 text-left">Cari menu...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md text-[10px] font-medium text-white/50 border border-white/10">
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
        <div className="flex items-center gap-1">
          <button
            className="md:hidden p-2 hover:bg-white/15 rounded-lg transition-all duration-300 text-white/80 hover:text-white"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-white/15 rounded-lg transition-all duration-300 text-white/80 hover:text-white"
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

          <button className="relative p-2 hover:bg-white/15 rounded-lg transition-all duration-300 text-white/80 hover:text-white">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FCA5A5] rounded-full ring-2 ring-[#B91C1C]" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 ml-1.5 p-1.5 pr-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
                <p className="text-[10px] text-white/60 leading-tight capitalize">{role}</p>
              </div>
              <ChevronDown size={12} className="text-white/50 hidden sm:block" />
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
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-3 space-y-2" ref={searchRef}>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Search size={15} className="text-white/60" />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredSearch.map((item) => (
                  <button
                    key={item.path}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
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
    </motion.header>
  );
};
