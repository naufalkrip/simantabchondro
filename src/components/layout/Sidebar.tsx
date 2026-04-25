import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CalendarCheck, 
  Wallet, 
  Banknote, 
  MonitorPlay, 
  Calendar, 
  Users, 
  Settings,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  ArrowDownRight,
  History,
  FileText
} from 'lucide-react';
import clsx from 'clsx';
import logo from '../../assets/logo.png';
import { useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/admin/dashboard', icon: Home, label: 'Beranda' },
  { 
    path: '/admin/absensi', 
    icon: CalendarCheck, 
    label: 'Absensi',
    subItems: [
      { path: '/admin/absensi', label: 'Input Absensi', icon: CalendarCheck },
      { path: '/admin/absensi-riwayat', label: 'Riwayat Absensi', icon: History },
      { path: '/admin/absensi-rekap', label: 'Rekap Absensi', icon: FileText },
    ]
  },
  { 
    path: '/admin/savings', 
    icon: Wallet, 
    label: 'Tabungan',
    subItems: [
      { path: '/admin/savings', label: 'Ringkasan', icon: Wallet },
      { path: '/admin/setoran', label: 'Setoran', icon: PlusCircle },
      { path: '/admin/penarikan', label: 'Penarikan', icon: ArrowDownRight },
    ]
  },
  { path: '/admin/keuangan-pengurus', icon: Banknote, label: 'Keuangan Pengurus' },
  { path: '/admin/keuangan-media', icon: MonitorPlay, label: 'Keuangan Media' },
  { path: '/admin/jadwal', icon: Calendar, label: 'Jadwal' },
  { path: '/admin/members', icon: Users, label: 'Manajemen Anggota' },
  { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [adminUsername, setAdminUsername] = React.useState(localStorage.getItem('admin_username') || 'admin');
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['/admin/savings']);
  const location = useLocation();

  React.useEffect(() => {
    const handleStorageChange = () => {
      setAdminUsername(localStorage.getItem('admin_username') || 'admin');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 z-50 w-20 md:w-64 bg-white shadow-md flex flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <img src={logo} alt="SIMANTAB Logo" className="w-8 h-8 object-contain" />
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-red-700 leading-tight">SIMANTAB</h1>
          <p className="text-[9px] font-medium text-gray-500 leading-tight">Sistem Manajemen Informasi<br/>Anggota MB Chondro</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.path);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <li key={item.path} className="space-y-1">
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.path)}
                      className={clsx(
                        'w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-sm',
                        isActive 
                          ? 'bg-red-50 text-red-700 font-bold' 
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
                      <span className="hidden md:inline flex-1 text-left leading-none text-sm font-medium">{item.label}</span>
                      <div className="hidden md:block">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 space-y-1 md:pl-8">
                        {item.subItems!.map((sub) => {
                          const isSubActive = location.pathname === sub.path;
                          const SubIcon = sub.icon;
                          return (
                            <li key={sub.path}>
                              <NavLink
                                to={sub.path}
                                onClick={() => setIsOpen(false)}
                                className={clsx(
                                  'flex items-center gap-3 px-3 py-2 rounded-md transition-all text-[13px]',
                                  isSubActive 
                                    ? 'bg-red-600 text-white font-bold shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                )}
                              >
                                <SubIcon size={14} className="shrink-0" />
                                <span className="hidden md:inline">{sub.label}</span>
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-sm active:scale-[0.98]',
                        isActive 
                          ? 'bg-red-600 text-white font-medium shadow-sm' 
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      )
                    }
                  >
                    <Icon className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
                    <span className="hidden md:inline leading-none text-sm font-medium">{item.label}</span>
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
          <div className="w-8 h-8 shrink-0 rounded-md bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs">
            {adminUsername.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-none">Admin</p>
            <p className="text-xs text-gray-400 truncate mt-1 leading-none">{adminUsername}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
