/**
 * Hook for accessing Firebase Remote Config values
 * Provides reactive access to remote configuration
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initRemoteConfig,
  isMaintenanceMode,
  getMaintenanceTitle,
  getMaintenanceMessage,
  isPromoBannerEnabled,
  getPromoBannerText,
} from '@/core/firebase';

interface RemoteConfigState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  // Maintenance mode
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  // Dynamic content
  promoBannerEnabled: boolean;
  promoBannerText: string;
}

const initialState: RemoteConfigState = {
  isLoading: true,
  isInitialized: false,
  error: null,
  maintenanceMode: false,
  maintenanceTitle: 'Estamos en mantenimiento',
  maintenanceMessage: 'Estamos realizando mejoras en la plataforma. Por favor, intenta de nuevo más tarde.',
  promoBannerEnabled: false,
  promoBannerText: '',
};

export const useRemoteConfig = () => {
  const [state, setState] = useState<RemoteConfigState>(initialState);

  const loadConfig = useCallback(() => {
    setState((prev) => ({
      ...prev,
      maintenanceMode: isMaintenanceMode(),
      maintenanceTitle: getMaintenanceTitle(),
      maintenanceMessage: getMaintenanceMessage(),
      promoBannerEnabled: isPromoBannerEnabled(),
      promoBannerText: getPromoBannerText(),
    }));
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await initRemoteConfig();
        loadConfig();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
        }));
      } catch (err) {
        console.error('[useRemoteConfig] Initialization error:', err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load remote config',
        }));
      }
    };

    init();
  }, [loadConfig]);

  return {
    ...state,
    refresh: loadConfig,
  };
};
