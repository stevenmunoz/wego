/**
 * Login page component with WeGo branding
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth';
import { useAuthStore } from '@/core/store/auth-store';

// SVG Icons
const CarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const ChartIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show nothing while checking auth state
  if (isLoading) {
    return null;
  }

  return (
    <div className="auth-layout">
      {/* Brand Side - visible on desktop */}
      <div className="auth-layout-brand">
        <div className="auth-layout-brand-content">
          <img src="/assets/logo-horizontal.png" alt="WeGo" className="auth-layout-brand-logo" />
          <h1 className="auth-layout-brand-tagline">
            Seguro para ti,
            <br />
            cómodo para tu mascota
          </h1>
          <p className="auth-layout-brand-description">
            Plataforma de gestión interna para el control total de viajes, conductores y
            operaciones.
          </p>
          <div className="auth-layout-brand-features">
            <div className="auth-layout-brand-feature">
              <div className="auth-layout-brand-feature-icon">
                <CarIcon />
              </div>
              <span>Gestión de viajes en tiempo real</span>
            </div>
            <div className="auth-layout-brand-feature">
              <div className="auth-layout-brand-feature-icon">
                <ChartIcon />
              </div>
              <span>Reportes y métricas del negocio</span>
            </div>
            <div className="auth-layout-brand-feature">
              <div className="auth-layout-brand-feature-icon">
                <UsersIcon />
              </div>
              <span>Administración de conductores</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="auth-layout-content">
        <LoginForm />
      </div>
    </div>
  );
};
