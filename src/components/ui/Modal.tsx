import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'xl' }) => {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  }[maxWidth];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Card className={`relative w-full ${maxWidthClass} shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden p-0 rounded-md`}>
        <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </Card>
    </div>
  );
};
