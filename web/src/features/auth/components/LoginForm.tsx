/**
 * Login form component with WeGo design system
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/use-login';

// Alert icon for error messages
const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="auth-card">
      {/* Mobile Logo */}
      <div className="auth-card-logo">
        <img
          src="/assets/logo-vertical.png"
          alt="WeGo"
        />
      </div>

      {/* Header */}
      <div className="auth-card-header">
        <h1 className="auth-card-title">Bienvenido de nuevo</h1>
        <p className="auth-card-subtitle">
          Ingresa tus credenciales para acceder al panel
        </p>
      </div>

      {/* Form */}
      <div className="auth-card-form">
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">
                <AlertIcon />
              </span>
              <span className="alert-content">
                {error instanceof Error ? error.message : 'Error al iniciar sesión. Verifica tus credenciales.'}
              </span>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="input"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
              autoComplete="current-password"
            />
          </div>

          {/* Options Row */}
          <div className="auth-form-options">
            <label className="auth-form-remember">
              <input type="checkbox" className="checkbox" />
              <span className="auth-form-remember-label">Recordarme</span>
            </label>
            <Link to="/forgot-password" className="auth-form-forgot">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn btn-primary auth-form-submit ${isPending ? 'btn-loading' : ''}`}
            disabled={isPending}
          >
            {isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="auth-card-footer">
        <p className="auth-card-footer-text">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="auth-card-footer-link">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
