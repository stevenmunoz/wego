/**
 * Firebase Remote Config module
 * Provides runtime configuration without app updates
 */

import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  type RemoteConfig,
} from 'firebase/remote-config';
import { firebaseApp } from './config';

let remoteConfig: RemoteConfig | null = null;

// Default values (used if fetch fails or on first load)
const DEFAULT_CONFIG = {
  // Emergency kill switch
  maintenance_mode: false,
  maintenance_title: 'Estamos en mantenimiento',
  maintenance_message: 'Estamos realizando mejoras en la plataforma. Por favor, intenta de nuevo más tarde.',

  // Dynamic content
  promo_banner_enabled: false,
  promo_banner_text: '',
};

/**
 * Initialize Remote Config with defaults and fetch latest values
 */
export async function initRemoteConfig(): Promise<void> {
  try {
    remoteConfig = getRemoteConfig(firebaseApp);

    // Set minimum fetch interval (1 hour in production, 1 minute in dev)
    const isDev = import.meta.env.DEV;
    remoteConfig.settings.minimumFetchIntervalMillis = isDev ? 60000 : 3600000;

    // Set default values
    remoteConfig.defaultConfig = DEFAULT_CONFIG;

    // Fetch and activate remote values
    await fetchAndActivate(remoteConfig);
    console.log('[RemoteConfig] Initialized and fetched successfully');
  } catch (error) {
    console.error('[RemoteConfig] Failed to initialize:', error);
    // App will use default values if fetch fails
  }
}

/**
 * Get the Remote Config instance (for advanced usage)
 */
export function getRemoteConfigInstance(): RemoteConfig | null {
  return remoteConfig;
}

// ============================================================
// EMERGENCY KILL SWITCH
// ============================================================

export function isMaintenanceMode(): boolean {
  if (!remoteConfig) return DEFAULT_CONFIG.maintenance_mode;
  return getValue(remoteConfig, 'maintenance_mode').asBoolean();
}

export function getMaintenanceTitle(): string {
  if (!remoteConfig) return DEFAULT_CONFIG.maintenance_title;
  return getValue(remoteConfig, 'maintenance_title').asString() || DEFAULT_CONFIG.maintenance_title;
}

export function getMaintenanceMessage(): string {
  if (!remoteConfig) return DEFAULT_CONFIG.maintenance_message;
  return getValue(remoteConfig, 'maintenance_message').asString() || DEFAULT_CONFIG.maintenance_message;
}

// ============================================================
// DYNAMIC CONTENT
// ============================================================

export function isPromoBannerEnabled(): boolean {
  if (!remoteConfig) return DEFAULT_CONFIG.promo_banner_enabled;
  return getValue(remoteConfig, 'promo_banner_enabled').asBoolean();
}

export function getPromoBannerText(): string {
  if (!remoteConfig) return DEFAULT_CONFIG.promo_banner_text;
  return getValue(remoteConfig, 'promo_banner_text').asString();
}
