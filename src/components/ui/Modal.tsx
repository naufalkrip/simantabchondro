import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdrop, modalContent } from '../../lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, children, maxWidth = 'xl'
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
            style={{ background: 'rgba(15,23,42,0.45)' }}
            onClick={onClose}
          />

          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative z-[1010] bg-white rounded-[20px] border border-[#F1F5F9] overflow-hidden w-[95vw] sm:w-full ${maxWidthClasses[maxWidth]}`}
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              opacity: 1,
              visibility: 'visible',
              filter: 'none',
              backdropFilter: 'none',
            }}
          >
            <div className="flex items-start justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-0">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] leading-tight tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[13px] sm:text-[14px] text-[#475569] mt-1 leading-snug">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="relative group p-2 rounded-full hover:bg-[#F8FAFC] transition-all duration-200 hover:rotate-90 shrink-0 -mr-1 -mt-1"
              >
                <X size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
              </button>
            </div>

            <div className="mx-5 sm:mx-6 mt-4 border-t border-slate-100" />

            <div className="px-5 sm:px-6 py-5 sm:py-6 max-h-[75vh] overflow-y-auto bg-white">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalElement, document.body);
};
