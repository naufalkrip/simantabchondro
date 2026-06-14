import React from 'react';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';
import '../../styles/login.css';

interface LoginLayoutProps {
  children: React.ReactNode;
  formTitle?: string;
  onBack?: () => void;
  backLabel?: string;
}

export const LoginLayout: React.FC<LoginLayoutProps> = ({
  children,
  formTitle,
  onBack,
  backLabel,
}) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#FFFFFF]">
      {/* Floating blur shapes */}
      <div className="animate-blob absolute -top-48 -right-48 w-[600px] h-[600px] bg-gradient-to-br from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="animate-blob-2 absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-gradient-to-tr from-primary-dark/6 via-primary/3 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="animate-blob-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-primary/[0.02] via-transparent to-primary-dark/[0.02] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative min-h-screen flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-[450px] bg-white/80 backdrop-blur-xl rounded-[24px] shadow-card border border-white/50 p-7 sm:p-9">
          {/* Logo & Brand */}
          <div className={`text-center ${!formTitle ? 'mb-9' : 'mb-7'}`}>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              src={logo}
              alt="SIMANTAB Logo"
              className="w-20 h-auto object-contain mx-auto mb-6"
            />
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="font-poppins text-[28px] font-bold text-gray-800 tracking-wide"
            >
              SIMANTAB
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-[13px] text-gray-400 mt-2 font-medium tracking-wide"
            >
              Sistem Manajemen Informasi Anggota MB Chondro
            </motion.p>
            {formTitle && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mt-7"
              >
                {onBack ? (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onBack}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-primary transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      {backLabel || 'Kembali'}
                    </button>
                    <span className="w-px h-3.5 bg-gray-200" />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                      {formTitle}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                    {formTitle}
                  </span>
                )}
              </motion.div>
            )}
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
};
