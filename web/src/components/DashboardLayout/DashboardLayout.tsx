/**
 * Dashboard Layout with sidebar navigation
 */

import { type FC, type ReactNode, useMemo, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import { trackLogout } from '@/core/analytics';
import { Header } from '../Header';
import { VersionModal } from '../VersionModal';
import './DashboardLayout.css';

// Get web version from build-time env (production) or will be fetched from version.json (dev)
const buildVersion = import.meta.env.VITE_APP_VERSION;

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Mis Viajes', icon: '🚗' },
  { path: '/vehicles', label: 'Mis Vehículos', icon: '🚙' },
  { path: '/finances', label: 'Finanzas', icon: '💰' },
  { path: '/indriver-import', label: 'Importar Viajes', icon: '📸' },
  { path: '/users', label: 'Usuarios', icon: '👥', adminOnly: true },
];

// Environment indicator
const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');
const envLabel = isDev ? 'DEV' : 'PROD';

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [webVersion, setWebVersion] = useState<string>(buildVersion || 'loading...');
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const isAdmin = userRole === 'admin';

  // Filter nav items based on user role
  const navItems = useMemo(
    () => allNavItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  // Fetch versions from endpoints
  useEffect(() => {
    // Fetch backend version from health endpoint
    const fetchBackendVersion = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          const data = await response.json();
          setBackendVersion(data.version);
        }
      } catch {
        // Silently fail - backend might not be available
        setBackendVersion(null);
      }
    };

    // Fetch web version from version.json (useful in dev mode)
    const fetchWebVersion = async () => {
      // In production, use the build-time injected version
      if (buildVersion) {
        setWebVersion(buildVersion);
        return;
      }

      // In dev mode, fetch from version.json
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setWebVersion(data.version);
        }
      } catch {
        setWebVersion('dev');
      }
    };

    fetchBackendVersion();
    fetchWebVersion();
  }, []);

  const handleLogout = async () => {
    trackLogout();
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

          {/* Version Info - Clickable */}
          <button
            type="button"
            className="version-info version-info-clickable"
            onClick={() => setIsVersionModalOpen(true)}
            title="Ver información del sistema"
          >
            <div className="version-row">
              <span className="version-label">Web</span>
              <span className="version-value" title={webVersion}>
                {webVersion.length > 12 ? `${webVersion.slice(0, 12)}...` : webVersion}
              </span>
            </div>
            <div className="version-row">
              <span className="version-label">API</span>
              <span className="version-value">
                {backendVersion || '—'}
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Version Modal */}
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        webVersion={webVersion}
        apiVersion={backendVersion}
      />

      {/* Main Content Area */}
      <div className="main-area">
        {/* Header with notifications (admin only) */}
        {isAdmin && <Header />}

        {/* Main Content */}
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};
