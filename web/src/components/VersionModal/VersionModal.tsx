/**
 * Version Modal Component
 * Displays detailed version and debug information with copy-to-clipboard
 */

import { type FC, useState, useEffect } from 'react';
import './VersionModal.css';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  webVersion: string;
  apiVersion: string | null;
}

interface DebugInfo {
  webVersion: string;
  apiVersion: string;
  environment: string;
  firebaseProject: string;
  userAgent: string;
  screenResolution: string;
  currentUrl: string;
  timestamp: string;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
  onlineStatus: boolean;
}

export const VersionModal: FC<VersionModalProps> = ({
  isOpen,
  onClose,
  webVersion,
  apiVersion,
}) => {
  const [copied, setCopied] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Gather debug info when modal opens
      const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');

      setDebugInfo({
        webVersion,
        apiVersion: apiVersion || 'No disponible',
        environment: isDev ? 'DEV' : 'PROD',
        firebaseProject: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'N/A',
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height} (viewport: ${window.innerWidth}x${window.innerHeight})`,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
      });

      // Reset copied state
      setCopied(false);
    }
  }, [isOpen, webVersion, apiVersion]);

  const handleCopyToClipboard = async () => {
    if (!debugInfo) return;

    const text = `
=== WeGo Debug Info ===
Timestamp: ${debugInfo.timestamp}

📦 Versions
Web: ${debugInfo.webVersion}
API: ${debugInfo.apiVersion}

🌐 Environment
Environment: ${debugInfo.environment}
Firebase Project: ${debugInfo.firebaseProject}

💻 Browser
User Agent: ${debugInfo.userAgent}
Platform: ${debugInfo.platform}
Language: ${debugInfo.language}
Timezone: ${debugInfo.timezone}

📱 Display
Screen: ${debugInfo.screenResolution}

🔗 Context
URL: ${debugInfo.currentUrl}
Cookies: ${debugInfo.cookiesEnabled ? 'Enabled' : 'Disabled'}
Online: ${debugInfo.onlineStatus ? 'Yes' : 'No'}
`.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen || !debugInfo) return null;

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-modal-header">
          <h2 className="version-modal-title">Información del Sistema</h2>
          <button
            type="button"
            className="version-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="version-modal-body">
          {/* Versions Section */}
          <section className="version-modal-section">
            <h3 className="version-modal-section-title">Versiones</h3>
            <div className="version-modal-grid">
              <div className="version-modal-item">
                <span className="version-modal-label">Web</span>
                <span className="version-modal-value version-modal-mono">{debugInfo.webVersion}</span>
              </div>
              <div className="version-modal-item">
                <span className="version-modal-label">API</span>
                <span className="version-modal-value version-modal-mono">{debugInfo.apiVersion}</span>
              </div>
            </div>
          </section>

          {/* Environment Section */}
          <section className="version-modal-section">
            <h3 className="version-modal-section-title">Entorno</h3>
            <div className="version-modal-grid">
              <div className="version-modal-item">
                <span className="version-modal-label">Ambiente</span>
                <span className={`version-modal-badge version-modal-badge-${debugInfo.environment.toLowerCase()}`}>
                  {debugInfo.environment}
                </span>
              </div>
              <div className="version-modal-item">
                <span className="version-modal-label">Firebase</span>
                <span className="version-modal-value version-modal-mono">{debugInfo.firebaseProject}</span>
              </div>
            </div>
          </section>

          {/* Browser Section */}
          <section className="version-modal-section">
            <h3 className="version-modal-section-title">Navegador</h3>
            <div className="version-modal-stack">
              <div className="version-modal-item">
                <span className="version-modal-label">User Agent</span>
                <span className="version-modal-value version-modal-mono version-modal-wrap">
                  {debugInfo.userAgent}
                </span>
              </div>
              <div className="version-modal-item">
                <span className="version-modal-label">Plataforma</span>
                <span className="version-modal-value">{debugInfo.platform}</span>
              </div>
              <div className="version-modal-item">
                <span className="version-modal-label">Idioma</span>
                <span className="version-modal-value">{debugInfo.language}</span>
              </div>
              <div className="version-modal-item">
                <span className="version-modal-label">Zona Horaria</span>
                <span className="version-modal-value">{debugInfo.timezone}</span>
              </div>
            </div>
          </section>

          {/* Display Section */}
          <section className="version-modal-section">
            <h3 className="version-modal-section-title">Pantalla</h3>
            <div className="version-modal-item">
              <span className="version-modal-label">Resolución</span>
              <span className="version-modal-value version-modal-mono">{debugInfo.screenResolution}</span>
            </div>
          </section>

          {/* Context Section */}
          <section className="version-modal-section">
            <h3 className="version-modal-section-title">Contexto</h3>
            <div className="version-modal-stack">
              <div className="version-modal-item">
                <span className="version-modal-label">URL</span>
                <span className="version-modal-value version-modal-mono version-modal-wrap">
                  {debugInfo.currentUrl}
                </span>
              </div>
              <div className="version-modal-item">
                <span className="version-modal-label">Timestamp</span>
                <span className="version-modal-value version-modal-mono">{debugInfo.timestamp}</span>
              </div>
              <div className="version-modal-grid">
                <div className="version-modal-item">
                  <span className="version-modal-label">Cookies</span>
                  <span className="version-modal-value">
                    {debugInfo.cookiesEnabled ? '✓ Habilitadas' : '✗ Deshabilitadas'}
                  </span>
                </div>
                <div className="version-modal-item">
                  <span className="version-modal-label">Conexión</span>
                  <span className="version-modal-value">
                    {debugInfo.onlineStatus ? '✓ En línea' : '✗ Sin conexión'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="version-modal-footer">
          <button
            type="button"
            className="version-modal-btn version-modal-btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className={`version-modal-btn version-modal-btn-primary ${copied ? 'version-modal-btn-copied' : ''}`}
            onClick={handleCopyToClipboard}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copiar al portapapeles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
