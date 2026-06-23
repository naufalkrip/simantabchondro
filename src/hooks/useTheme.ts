import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContextTypes';
import type { ThemeContextType } from '../context/ThemeContextTypes';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
