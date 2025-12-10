/**
 * Registration page component with WeGo branding
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '@/features/auth';
import { useAuthStore } from '@/core/store/auth-store';

// SVG Icons
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export const RegisterPage = () => {
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
          <img
            src="/assets/logo-horizontal.png"
            alt="WeGo"
            className="auth-layout-brand-logo"
          />
          <h1 className="auth-layout-brand-tagline">
            Únete al equipo<br />
            de gestión WeGo
          </h1>
          <p className="auth-layout-brand-description">
            Crea tu cuenta de administrador y comienza a gestionar la plataforma
            de transporte más confiable.
          </p>
          <div className="auth-layout-brand-features">
            <div className="auth-layout-brand-feature">
              <div className="auth-layout-brand-feature-icon">
                <ShieldIcon />
              </div>
              <span>Acceso seguro a la plataforma</span>
            </div>
            <div className="auth-layout-brand-feature">
              <div className="auth-layout-brand-feature-icon">
                <HeartIcon />
              </div>
              <span>Enfoque en mascotas y personas</span>
            </div>
            <div className="auth-layout-brand-feature">
              <div className="auth-layout-brand-feature-icon">
                <SparklesIcon />
              </div>
              <span>Herramientas modernas de gestión</span>
            </div>
          </div>
        </div>
      </div>

      {/* Register Form Side */}
      <div className="auth-layout-content">
        <RegisterForm />
      </div>
    </div>
  );
};
