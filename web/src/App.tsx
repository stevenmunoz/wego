/**
 * Main App component with Firebase integration
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/core/store/auth-store';
import { initAnalytics } from '@/core/firebase';
import { router } from './routes';
import './App.css';

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

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
