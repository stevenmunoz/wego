/**
 * Version state management using Zustand
 * Tracks app version for update notifications
 */

import { create } from 'zustand';

interface VersionState {
  currentVersion: string | null;
  latestVersion: string | null;
  hasUpdate: boolean;
  isDismissed: boolean;
  lastChecked: Date | null;
  isChecking: boolean;
  error: string | null;

  setCurrentVersion: (version: string) => void;
  setLatestVersion: (version: string) => void;
  dismissUpdate: () => void;
  resetDismiss: () => void;
  setChecking: (isChecking: boolean) => void;
  setError: (error: string | null) => void;
}

// Debug helper for testing in browser console (dev mode only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as Window & { simulateVersionUpdate?: () => void }).simulateVersionUpdate = () => {
    useVersionStore.setState({
      hasUpdate: true,
      isDismissed: false,
      latestVersion: 'simulated-new-version',
    });
    console.log('[version-store] Simulated version update. Notification should appear.');
  };
}

export const useVersionStore = create<VersionState>((set, get) => ({
  currentVersion: null,
  latestVersion: null,
  hasUpdate: false,
  isDismissed: false,
  lastChecked: null,
  isChecking: false,
  error: null,

  setCurrentVersion: (version) => set({ currentVersion: version }),

  setLatestVersion: (version) => {
    const { currentVersion, isDismissed } = get();
    const hasUpdate = currentVersion !== null && version !== currentVersion;
    set({
      latestVersion: version,
      hasUpdate,
      lastChecked: new Date(),
      // Reset dismiss if a newer version is detected
      isDismissed: hasUpdate ? isDismissed : false,
    });
  },

  dismissUpdate: () => set({ isDismissed: true }),

  resetDismiss: () => set({ isDismissed: false }),

  setChecking: (isChecking) => set({ isChecking }),

  setError: (error) => set({ error }),
}));
