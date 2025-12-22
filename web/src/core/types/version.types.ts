/**
 * Version tracking types for app update detection
 */

export interface VersionInfo {
  version: string;
  buildTime: string;
  commitHash?: string;
}

export interface VersionState {
  currentVersion: string | null;
  latestVersion: string | null;
  hasUpdate: boolean;
  isDismissed: boolean;
  lastChecked: Date | null;
  isChecking: boolean;
  error: string | null;
}
