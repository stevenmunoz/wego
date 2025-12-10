/**
 * Protected route component for authentication guard
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
