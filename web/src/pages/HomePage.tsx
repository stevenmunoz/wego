/**
 * Home page component - WeGo landing page
 */

import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';

// SVG Icons as components
const CarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const PawIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="4" cy="8" r="2" />
    <path d="M9 16c-3 0-6 2-6 5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-3-3-5-6-5z" />
    <circle cx="9" cy="12" r="2" />
  </svg>
);

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const HomePage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <img
          src="/assets/logo-horizontal.png"
          alt="WeGo"
          className="home-header-logo"
        />
        <nav className="home-header-nav">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">
              Ir al Panel
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn btn-primary">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-text">
            <div className="home-hero-badge">
              <HeartIcon />
              <span>Plataforma de Gestión Interna</span>
            </div>
            <h1 className="home-hero-title">
              Seguro para ti,<br />
              cómodo para tu mascota
            </h1>
            <p className="home-hero-description">
              Gestiona viajes, conductores, comisiones y reportes desde una sola plataforma.
              Control total sobre el negocio de transporte especializado.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="home-hero-features">
            <div className="home-hero-feature">
              <div className="home-hero-feature-icon">
                <CarIcon />
              </div>
              <h3 className="home-hero-feature-title">Control de Viajes</h3>
              <p className="home-hero-feature-description">
                Seguimiento en tiempo real de todos los viajes
              </p>
            </div>
            <div className="home-hero-feature">
              <div className="home-hero-feature-icon">
                <PawIcon />
              </div>
              <h3 className="home-hero-feature-title">Servicio de Mascotas</h3>
              <p className="home-hero-feature-description">
                Transporte especializado para mascotas
              </p>
            </div>
            <div className="home-hero-feature">
              <div className="home-hero-feature-icon">
                <UsersIcon />
              </div>
              <h3 className="home-hero-feature-title">Gestión de Conductores</h3>
              <p className="home-hero-feature-description">
                Administra tu flota de manera eficiente
              </p>
            </div>
            <div className="home-hero-feature">
              <div className="home-hero-feature-icon">
                <ShieldIcon />
              </div>
              <h3 className="home-hero-feature-title">Seguridad Garantizada</h3>
              <p className="home-hero-feature-description">
                Conductores verificados y seguros
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
