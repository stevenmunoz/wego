/**
 * Application configuration
 *
 * WeGo uses a serverless architecture with Firebase Cloud Functions.
 */

export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'WeGo',
} as const;
