import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { logout, role } = useAuth();


  return (
    <header className="bg-gradient-to-r from-red-700 to-red-900 text-white px-4 md:px-6 py-2.5 md:py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="min-h-[40px] md:min-h-[48px] flex flex-col justify-center">
          <h2 className="text-base md:text-xl font-bold leading-tight tracking-tight">
            {role === 'admin' ? 'Dashboard Admin' : 'Dashboard Anggota'}
          </h2>
          {role === 'admin' && (
            <p className="text-red-50 text-[10px] md:text-sm font-medium mt-0.5">
              Selamat datang di SIMANTAB
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="secondary" 
          size="sm"
          className="bg-white text-red-700 hover:bg-gray-50 gap-1.5 border-none text-[12px] md:text-sm font-bold shadow-sm active:scale-95 transition-all px-3 md:px-4 h-8 md:h-9"
          onClick={logout}
        >
          <LogOut size={14} className="md:size-4" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
};
