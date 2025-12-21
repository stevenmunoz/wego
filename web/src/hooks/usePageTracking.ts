/**
 * Hook for tracking page views in GA4
 *
 * Automatically tracks page views when the route changes
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageViewed } from '@/core/analytics';

type PageName =
  | 'home'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'vehicles'
  | 'indriver_import'
  | 'chat'
  | 'conversations'
  | 'users'
  | 'finances'
  | 'external_ride';

const pathToPageName: Record<string, PageName> = {
  '/': 'home',
  '/login': 'login',
  '/register': 'register',
  '/dashboard': 'dashboard',
  '/vehicles': 'vehicles',
  '/indriver-import': 'indriver_import',
  '/chat': 'chat',
  '/conversations': 'conversations',
  '/users': 'users',
  '/finances': 'finances',
};

export const usePageTracking = (): void => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Direct match
    let pageName = pathToPageName[path];

    // Dynamic route matching
    if (!pageName) {
      if (path.startsWith('/chat/')) {
        pageName = 'chat';
      } else if (path.startsWith('/registrar-viaje/')) {
        pageName = 'external_ride';
      }
    }

    if (pageName) {
      trackPageViewed(pageName);
    }
  }, [location.pathname]);
};
