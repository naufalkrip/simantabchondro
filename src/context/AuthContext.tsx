import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  token: string | null;
  login: (token: string, role: 'admin' | 'member') => void;
  logout: () => void;
  role: 'admin' | 'member' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
