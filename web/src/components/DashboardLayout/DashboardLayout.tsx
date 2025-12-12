/**
 * Dashboard Layout with sidebar navigation
 */

import { type FC, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Mis Viajes', icon: '🚗' },
  { path: '/vehicles', label: 'Mis Vehículos', icon: '🚙' },
  { path: '/indriver-import', label: 'Importar Viajes', icon: '📸' },
];

// Environment indicator
const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');
const envLabel = isDev ? 'DEV' : 'PROD';

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">WeGo</h1>
          <span className={`env-badge env-badge-${isDev ? 'dev' : 'prod'}`}>{envLabel}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-section">
              <div className="user-avatar">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="sidebar-user-details">
                <span className="user-name">{user.full_name || 'Usuario'}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">{children}</main>
    </div>
  );
};
