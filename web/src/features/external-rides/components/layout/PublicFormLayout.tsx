/**
 * PublicFormLayout Component
 *
 * Public page layout wrapper with WeGo branding for the external ride form
 */

import { type FC, type ReactNode } from 'react';
import type { Driver } from '../../types';
import './PublicFormLayout.css';

interface PublicFormLayoutProps {
  driver: Driver | null;
  children: ReactNode;
}

export const PublicFormLayout: FC<PublicFormLayoutProps> = ({ driver, children }) => {
  return (
    <div className="public-form-layout">
      {/* Header with branding */}
      <header className="public-form-header">
        <div className="public-form-logo">
          <span className="public-form-logo-text">WeGo</span>
        </div>
        {driver && (
          <div className="public-form-driver-info">
            <span className="public-form-driver-label">Conductor</span>
            <span className="public-form-driver-name">{driver.name}</span>
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="public-form-content">{children}</main>

      {/* Footer */}
      <footer className="public-form-footer">
        <span className="public-form-footer-text">
          Seguro para ti, comodo para tu mascota
        </span>
      </footer>
    </div>
  );
};
