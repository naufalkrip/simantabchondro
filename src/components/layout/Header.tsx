import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { logout, role } = useAuth();


  return (
    <header className="w-full bg-gradient-to-r from-red-700 to-red-900 text-white px-4 md:px-5 py-3 flex justify-between items-center shadow-sm border-b border-white/10 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col justify-center">
          <h1 className="text-white text-lg font-semibold leading-tight">
            {role === 'admin' ? 'Dashboard Admin' : 'Dashboard Anggota'}
          </h1>
          <p className="text-white/80 text-xs font-medium mt-0.5">
            Selamat datang di SIMANTAB
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          className="bg-white hover:bg-gray-100 text-red-700 text-sm px-4 py-1.5 rounded-md font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
          onClick={logout}
        >
          <LogOut size={14} className="md:w-4 md:h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
