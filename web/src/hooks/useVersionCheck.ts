/**
 * Hook for checking app version updates with smart polling
 * Polls version.json and notifies when a new version is available
 */

import { useEffect, useCallback, useRef } from 'react';
import { useVersionStore } from '@/core/store/version-store';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const VERSION_URL = '/version.json';

export const useVersionCheck = () => {
  const intervalRef = useRef<number | null>(null);
  const {
    currentVersion,
    hasUpdate,
    isDismissed,
    setCurrentVersion,
    setLatestVersion,
    setChecking,
    setError,
    dismissUpdate,
  } = useVersionStore();

  // Fetch the latest version from version.json
  const checkVersion = useCallback(async () => {
    setChecking(true);
    setError(null);

    try {
      // Add cache-busting query param
      const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.status}`);
      }

      const data = await response.json();
      const fetchedVersion = data.version;

      // If no current version is set yet (first load), use fetched version as baseline
      const store = useVersionStore.getState();
      if (!store.currentVersion) {
        setCurrentVersion(fetchedVersion);
      } else {
        setLatestVersion(fetchedVersion);
      }
    } catch (err) {
      console.error('[useVersionCheck] Error fetching version:', err);
      setError(err instanceof Error ? err.message : 'Error checking version');
    } finally {
      setChecking(false);
    }
  }, [setLatestVersion, setChecking, setError, setCurrentVersion]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = window.setInterval(checkVersion, POLL_INTERVAL);
  }, [checkVersion]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle visibility change - pause when hidden, resume when visible
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      stopPolling();
    } else {
      // Check immediately when tab becomes visible
      checkVersion();
      startPolling();
    }
  }, [checkVersion, startPolling, stopPolling]);

  // Hard reload with cache clear
  const reloadApp = useCallback(() => {
    // Clear caches if available
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    // Force reload from server
    window.location.reload();
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Set current version from env (injected at build time)
    const buildVersion = import.meta.env.VITE_APP_VERSION;
    if (buildVersion) {
      setCurrentVersion(buildVersion);
    }

    // Initial check
    checkVersion();

    // Start polling
    startPolling();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion, startPolling, stopPolling, handleVisibilityChange, setCurrentVersion]);

  return {
    hasUpdate,
    isDismissed,
    currentVersion,
    dismissUpdate,
    reloadApp,
    checkNow: checkVersion,
  };
};
