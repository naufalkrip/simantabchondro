import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  token: string | null;
  login: (token: string, role: 'admin' | 'member') => void;
  logout: () => void;
  role: 'admin' | 'member' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRole] = useState<'admin' | 'member' | null>(() => {
    const savedRole = localStorage.getItem('role');
    if (savedRole === 'admin' || savedRole === 'member') {
      return savedRole;
    }
    return null;
  });

  const login = (newToken: string, newRole: 'admin' | 'member') => {
    setToken(newToken);
    setRole(newRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
