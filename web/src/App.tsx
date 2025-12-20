/**
 * Main App component with Firebase integration
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/core/store/auth-store';
import { useNotificationStore } from '@/core/store/notification-store';
import { initAnalytics } from '@/core/firebase';
import { VersionNotification } from '@/components/VersionNotification';
import { router } from './routes';
import './App.css';

// Sentry test button - only shows in DEV environment
const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');

function SentryTestButton() {
  if (!isDev) return null;

  return (
    <button
      onClick={() => {
        throw new Error('This is your first Sentry error!');
      }}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        padding: '10px 16px',
        backgroundColor: '#EF4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: 9999,
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      Test Sentry Error
    </button>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);

  const setCurrentUserId = useNotificationStore((state) => state.setCurrentUserId);
  const initNotificationListener = useNotificationStore((state) => state.initNotificationListener);
  const requestPermission = useNotificationStore((state) => state.requestPermission);
  const hasRequestedPermission = useNotificationStore((state) => state.hasRequestedPermission);

  useEffect(() => {
    // Initialize Firebase Auth listener
    const unsubscribe = initAuth();

    // Initialize Firebase Analytics
    initAnalytics();

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [initAuth]);

  // Initialize notifications when admin user is authenticated
  useEffect(() => {
    if (user?.id && userRole === 'admin') {
      // Set current user ID for notification tracking
      setCurrentUserId(user.id);

      // Initialize notification listener
      const unsubscribe = initNotificationListener();

      // Request browser notification permission (only once)
      if (!hasRequestedPermission) {
        requestPermission();
      }

      return () => {
        unsubscribe?.();
      };
    } else {
      // Clear notifications when user is not admin
      setCurrentUserId(null);
    }
  }, [user?.id, userRole, setCurrentUserId, initNotificationListener, requestPermission, hasRequestedPermission]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <VersionNotification />
      <SentryTestButton />
    </QueryClientProvider>
  );
}

export default App;
