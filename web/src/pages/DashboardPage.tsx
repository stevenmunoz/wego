/**
 * Dashboard page component
 */

import { useAuthStore } from '@/core/store/auth-store';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      {user && (
        <div className="user-info">
          <p>Welcome, {user.full_name}!</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};
