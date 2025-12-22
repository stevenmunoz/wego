/**
 * Firebase configuration and initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Firebase config loaded from environment variables
// NEVER hardcode API keys - they will be exposed and disabled by Google
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that required Firebase config is present
if (!firebaseConfig.apiKey) {
  console.error('Firebase API key is missing. Please set VITE_FIREBASE_API_KEY in your .env file.');
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const firebaseAuth = getAuth(firebaseApp);

// Set persistence to local (persists even after browser close)
// Falls back gracefully if persistence fails (e.g., private browsing mode)
setPersistence(firebaseAuth, browserLocalPersistence).catch((error: Error) => {
  // Common in private/incognito mode where IndexedDB is restricted
  const isQuotaError = error.message?.includes('QuotaExceeded') || error.name === 'QuotaExceededError';
  const isPrivateBrowsing = error.message?.includes('access') || error.message?.includes('denied');

  if (isQuotaError || isPrivateBrowsing) {
    console.warn('[Firebase] Auth persistence unavailable (private browsing mode). Session will not persist.');
  } else {
    console.error('[Firebase] Error setting auth persistence:', error.message);
  }
});

// Initialize Analytics (only in browser and if supported)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(firebaseApp);
  }
  return null;
};

// Initialize Firebase Storage
export const firebaseStorage = getStorage(firebaseApp);
