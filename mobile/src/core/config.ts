/**
 * Mobile app configuration
 */

import Constants from 'expo-constants';

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1',
  appName: Constants.expoConfig?.name || 'Enterprise App',
} as const;
