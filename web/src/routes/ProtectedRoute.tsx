/**
 * Protected route component for authentication guard
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import { usePageTracking } from '@/hooks/usePageTracking';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Track page views for protected routes
  usePageTracking();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
