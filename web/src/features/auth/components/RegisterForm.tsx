/**
 * Registration form component with WeGo design system
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/use-register';

// Alert icon for error messages
const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { mutate: register, isPending, error } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    register({ email, password, full_name: fullName });
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === '';

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
        <h1 className="auth-card-title">Crear cuenta</h1>
        <p className="auth-card-subtitle">
          Completa tus datos para registrarte en la plataforma
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
                {error instanceof Error ? error.message : 'Error al crear la cuenta. Intenta de nuevo.'}
              </span>
            </div>
          )}

          {/* Full Name Field */}
          <div className="form-group">
            <label htmlFor="fullName" className="label">
              Nombre completo
            </label>
            <input
              type="text"
              id="fullName"
              className="input"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isPending}
              autoComplete="name"
            />
          </div>

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
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isPending}
              autoComplete="new-password"
            />
            <span className="helper-text">
              La contraseña debe tener al menos 8 caracteres
            </span>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              className={`input ${!passwordsMatch ? 'input-error' : ''}`}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isPending}
              autoComplete="new-password"
            />
            {!passwordsMatch && (
              <span className="helper-text helper-text-error">
                Las contraseñas no coinciden
              </span>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                className="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Acepto los{' '}
                <a href="/terms" className="auth-card-footer-link">
                  términos y condiciones
                </a>
                {' '}y la{' '}
                <a href="/privacy" className="auth-card-footer-link">
                  política de privacidad
                </a>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn btn-primary auth-form-submit ${isPending ? 'btn-loading' : ''}`}
            disabled={isPending || !passwordsMatch || !acceptTerms}
          >
            {isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="auth-card-footer">
        <p className="auth-card-footer-text">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="auth-card-footer-link">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
