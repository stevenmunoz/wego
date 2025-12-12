/**
 * Application configuration
 */

// Only use localhost fallback in development mode
const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    // Remove trailing slash if any
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    // Only append /api/v1 if it's not already in the URL
    if (baseUrl.endsWith('/api/v1')) {
      return baseUrl;
    }
    return `${baseUrl}/api/v1`;
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
