/**
 * Version update notification banner
 * Displays when a new version is available
 */

import { type FC } from 'react';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import './VersionNotification.css';

export const VersionNotification: FC = () => {
  const { hasUpdate, isDismissed, dismissUpdate, reloadApp } = useVersionCheck();

  // Don't render if no update or dismissed
  if (!hasUpdate || isDismissed) {
    return null;
  }

  return (
    <div className="version-notification" role="alert" aria-live="polite">
      <div className="version-notification-content">
        <span className="version-notification-icon" aria-hidden="true">
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
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </span>
        <span className="version-notification-message">
          Nueva versión disponible
        </span>
      </div>
      <div className="version-notification-actions">
        <button
          type="button"
          className="version-notification-btn version-notification-dismiss"
          onClick={dismissUpdate}
          aria-label="Descartar notificación"
        >
          Después
        </button>
        <button
          type="button"
          className="version-notification-btn version-notification-update"
          onClick={reloadApp}
        >
          Actualizar
        </button>
      </div>
    </div>
  );
};
