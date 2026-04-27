import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CalendarCheck, 
  Wallet, 
  Calendar,
  Settings,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';
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
  const [memberName, setMemberName] = React.useState(localStorage.getItem('member_name') || 'Anggota');

  React.useEffect(() => {
    const handleStorageChange = () => {
      setMemberName(localStorage.getItem('member_name') || 'Anggota');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <aside className={clsx(
      "fixed top-0 left-0 h-full z-50 w-64 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none border-r border-gray-100",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <img src={logo} alt="SIMANTAB Logo" className="w-8 h-8 object-contain" />
        <div className="block">
          <h1 className="text-xl font-bold text-red-700 leading-tight">SIMANTAB</h1>
          <p className="text-[9px] font-medium text-gray-500 leading-tight">Sistem Manajemen Informasi<br/>Anggota MB Chondro</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center justify-start gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-sm active:scale-[0.98]',
                      isActive 
                        ? 'bg-red-600 text-white font-medium shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="inline leading-none text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-start gap-3 px-3 py-2.5 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
          <div className="w-8 h-8 shrink-0 rounded-md bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs">
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate leading-none">{memberName}</p>
            <p className="text-[10px] text-gray-400 truncate mt-1 leading-none">Member</p>
          </div>
          <button 
            onClick={logout}
            className="hidden md:block p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
