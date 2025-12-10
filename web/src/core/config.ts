/**
 * Application configuration
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'Enterprise App',
} as const;
