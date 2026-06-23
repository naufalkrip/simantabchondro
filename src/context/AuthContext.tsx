import React, { useState } from 'react';
import { AuthContext } from './AuthContextTypes';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [role, setRole] = useState<'admin' | 'member' | null>(() => {
    const savedRole = sessionStorage.getItem('role');
    if (savedRole === 'admin' || savedRole === 'member') {
      return savedRole;
    }
    return null;
  });

  const login = (newToken: string, newRole: 'admin' | 'member') => {
    setToken(newToken);
    setRole(newRole);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('role', newRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};