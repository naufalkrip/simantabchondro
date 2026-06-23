import { createContext } from 'react';

export interface AuthContextType {
  token: string | null;
  login: (token: string, role: 'admin' | 'member') => void;
  logout: () => void;
  role: 'admin' | 'member' | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);