/**
 * Maintenance Mode Component
 * Displays a full-screen overlay when the app is in maintenance mode
 * Controlled by Firebase Remote Config
 */

import { type FC } from 'react';
import './MaintenanceMode.css';

interface MaintenanceModeProps {
  title: string;
  message: string;
}

export const MaintenanceMode: FC<MaintenanceModeProps> = ({ title, message }) => {
  return (
    <div className="maintenance-mode">
      <div className="maintenance-mode-content">
        {/* WeGo Logo */}
        <div className="maintenance-mode-logo">
          <img src="/assets/logo-vertical.png" alt="WeGo" />
        </div>

        {/* Title */}
        <h1 className="maintenance-mode-title">{title}</h1>

        {/* Message */}
        <p className="maintenance-mode-message">{message}</p>

        {/* Maintenance Icon */}
        <div className="maintenance-mode-icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Footer */}
        <p className="maintenance-mode-footer">
          Gracias por tu paciencia
        </p>
      </div>
    </div>
  );
};
