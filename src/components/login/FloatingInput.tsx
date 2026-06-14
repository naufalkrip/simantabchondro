import React, { useId } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  label: string;
  rightElement?: React.ReactNode;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  icon: Icon,
  label,
  rightElement,
  className,
  id,
  ...inputProps
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="relative">
      <Icon
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none z-10"
        size={20}
      />
      <input
        id={inputId}
        className={clsx(
          'peer w-full h-14 pl-12 pr-4 pt-6 pb-2',
          'bg-white border border-gray-200 rounded-xl',
          'text-gray-800 text-sm',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'outline-none transition-all duration-300',
          'hover:border-gray-300',
          rightElement && 'pr-12',
          className,
        )}
        {...inputProps}
        placeholder=" "
      />
      <label
        htmlFor={inputId}
        className={clsx(
          'absolute left-12 top-2 text-xs text-gray-400 pointer-events-none select-none',
          'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm',
          'peer-focus:text-primary',
          'transition-all duration-300',
        )}
      >
        {label}
      </label>
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};
