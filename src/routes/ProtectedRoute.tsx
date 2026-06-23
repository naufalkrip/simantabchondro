import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'member';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole = 'admin' }) => {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to={`/${allowedRole}/login`} replace />;
  }

  // If we want role-based access control, we can add it here.
  // For now, if allowedRole is admin, only admin can access.
  if (role !== allowedRole) {
    return <Navigate to={`/${role}/login`} replace />;
  }

  return <>{children}</>;
};
