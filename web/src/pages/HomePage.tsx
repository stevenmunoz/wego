/**
 * Home page component
 */

import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';

export const HomePage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="home-page">
      <h1>Welcome to Enterprise App</h1>
      <p>A production-ready, enterprise-grade application template.</p>
      <div className="actions">
        {isAuthenticated ? (
          <Link to="/dashboard">Go to Dashboard</Link>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
};
