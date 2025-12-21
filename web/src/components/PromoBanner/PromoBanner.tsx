/**
 * Promotional Banner Component - Full Screen Overlay
 * Displays a full-screen promotional overlay with glassmorphism design
 * Controlled by Firebase Remote Config
 *
 * Features:
 * - Full screen overlay with gradient background
 * - Glass morphism card design
 * - Persists dismissed state in sessionStorage (shows once per session)
 * - Smooth entrance/exit animations
 * - CTA button with hover effects
 * - Fully responsive
 */

import { type FC, useState, useCallback, useEffect } from 'react';
import './PromoBanner.css';

const STORAGE_KEY = 'wego_promo_banner_dismissed';

interface PromoBannerProps {
  text: string;
}

export const PromoBanner: FC<PromoBannerProps> = ({ text }) => {
  // Check if already dismissed in this session
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isDismissing, setIsDismissing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Small delay to prevent flash on initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    // Persist to sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    // Wait for animation to complete before fully hiding
    setTimeout(() => {
      setIsDismissed(true);
    }, 300);
  }, []);

  // Don't render if dismissed, no text, or not ready
  if (isDismissed || !text || !isReady) {
    return null;
  }

  return (
    <div
      className={`promo-overlay ${isDismissing ? 'promo-dismissing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
    >
      <div className="promo-card">
        {/* Close button */}
        <button
          type="button"
          className="promo-close"
          onClick={handleDismiss}
          aria-label="Cerrar"
          disabled={isDismissing}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="promo-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <path d="M20 3v4" />
            <path d="M22 5h-4" />
            <path d="M4 17v2" />
            <path d="M5 18H3" />
          </svg>
        </div>

        {/* Text content */}
        <div className="promo-text-content">
          <span className="promo-label">
            <span className="promo-label-dot" />
            Nuevo
          </span>
          <h2 id="promo-title" className="promo-title">
            {text}
          </h2>
          <p className="promo-message">
            Descubre todas las novedades que tenemos para ti
          </p>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          className="promo-cta"
          onClick={handleDismiss}
        >
          Continuar
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
