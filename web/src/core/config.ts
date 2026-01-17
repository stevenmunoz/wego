/**
 * Application configuration
 *
 * Note: WeGo primarily uses a serverless architecture with Firebase Cloud Functions.
 * The apiUrl is kept for legacy compatibility but most features use Cloud Functions.
 */

// Get API URL - returns empty string when not configured (serverless mode)
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
  // Serverless mode - no backend API
  return '';
};

export const config = {
  apiUrl: getApiUrl(),
  appName: import.meta.env.VITE_APP_NAME || 'WeGo',
} as const;
