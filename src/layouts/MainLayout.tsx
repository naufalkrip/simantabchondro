import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNavigation } from '../components/layout/TopNavigation';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../lib/animations';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="w-full min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNavigation toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 overflow-y-auto relative p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                {children || <Outlet />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};
