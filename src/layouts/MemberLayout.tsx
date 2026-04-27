import React, { useState } from 'react';
import { MemberSidebar } from '../components/layout/MemberSidebar';
import { Header } from '../components/layout/Header';
import { Outlet } from 'react-router-dom';

export const MemberLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="w-full min-h-screen flex bg-gray-50 font-sans">
      <MemberSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 md:p-6 space-y-4 md:max-w-7xl md:mx-auto w-full flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
