/**
 * Application configuration
 */

// Only use localhost fallback in development mode
const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production without API URL, return empty to prevent localhost calls
  if (import.meta.env.PROD) {
    console.warn('[Config] VITE_API_URL not set - backend features will not work');
    return '';
  }
  // Local development fallback
  return 'http://localhost:8000/api/v1';
};

export const config = {
  apiUrl: getApiUrl(),
  appName: import.meta.env.VITE_APP_NAME || 'WeGo',
  hasBackend: !!import.meta.env.VITE_API_URL,
} as const;
